-- ============================================================
-- AbrantesScale CRM — Schema Inicial (v1)
-- Correr no Supabase SQL Editor após criar o projeto
-- ============================================================

-- ============ EXTENSÕES ============
create extension if not exists "uuid-ossp";

-- ============ PIPELINE STAGES ============
create table pipeline_stages (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  position    int  not null,
  track       text default 'sales',     -- 'sales' (PME/Scalit) | 'community' (criadores)
  win_prob    numeric default 0,        -- probabilidade (0-1) para valor ponderado
  is_won      boolean default false,
  is_lost     boolean default false,
  created_at  timestamptz default now()
);

-- ============ CONTACTS ============
create table contacts (
  id                uuid primary key default uuid_generate_v4(),
  owner_id          uuid not null references auth.users(id) on delete cascade,
  full_name         text not null,
  instagram         text,                    -- @handle
  email             text,
  phone             text,
  company           text,
  website           text,
  source            text,                    -- 'reels' | 'stories' | 'dm' | 'comment' | 'bio_link' | 'referral' | 'other'
  stage_id          uuid references pipeline_stages(id) on delete set null,
  deal_value        numeric default 0,
  status            text default 'active',   -- 'active' | 'archived'
  notes             text,
  -- Campos de IA (Fase 2)
  ai_score          int,
  ai_summary        text,
  -- Campos de funil / marca pessoal
  lead_type         text default 'unknown',  -- 'pme' | 'creator' | 'unknown'
  funnel_destination text,                   -- 'scalit' | 'zero_to_leverage' | 'full_leverage_circle' | 'mentoria_1a1'
  community_status  text default 'none',     -- 'none' | 'zero_to_leverage' | 'full_leverage_circle'
  content_pillar    text,                    -- 'ai_aplicada' | 'tudo_e_vendas' | 'builds_in_public' | 'mindset' | 'other'
  -- Timestamps
  stage_changed_at  timestamptz default now(),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ============ TAGS (many-to-many) ============
create table tags (
  id        uuid primary key default uuid_generate_v4(),
  owner_id  uuid not null references auth.users(id) on delete cascade,
  name      text not null,
  color     text default '#6366f1'
);

create table contact_tags (
  contact_id uuid references contacts(id) on delete cascade,
  tag_id     uuid references tags(id) on delete cascade,
  primary key (contact_id, tag_id)
);

-- ============ ACTIVITIES (timeline) ============
create table activities (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  contact_id  uuid not null references contacts(id) on delete cascade,
  type        text not null,   -- 'note' | 'dm' | 'call' | 'email' | 'follow_up' | 'stage_change'
  content     text,
  metadata    jsonb,           -- ex.: { from_stage, to_stage }
  created_at  timestamptz default now()
);

-- ============ TASKS (follow-ups) ============
create table tasks (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  contact_id  uuid references contacts(id) on delete set null,
  title       text not null,
  due_date    timestamptz,
  is_done     boolean default false,
  created_at  timestamptz default now()
);

-- ============ DISCOVERY NOTES ============
create table discovery_notes (
  id              uuid primary key default uuid_generate_v4(),
  owner_id        uuid not null references auth.users(id) on delete cascade,
  contact_id      uuid not null references contacts(id) on delete cascade,
  business_desc   text,
  pain_points     text,
  ai_opportunity  text,
  budget          text,
  raw_notes       text,
  created_at      timestamptz default now()
);

-- ============ ÍNDICES ============
create index on contacts(owner_id);
create index on contacts(stage_id);
create index on contacts(lead_type);
create index on contacts(community_status);
create index on activities(contact_id);
create index on tasks(owner_id, due_date);
create index on pipeline_stages(owner_id, track);

-- ============ ROW LEVEL SECURITY ============
alter table pipeline_stages  enable row level security;
alter table contacts         enable row level security;
alter table tags             enable row level security;
alter table contact_tags     enable row level security;
alter table activities       enable row level security;
alter table tasks            enable row level security;
alter table discovery_notes  enable row level security;

create policy "own_rows" on pipeline_stages
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "own_rows" on contacts
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "own_rows" on tags
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "own_rows" on activities
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "own_rows" on tasks
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "own_rows" on discovery_notes
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "own_contact_tags" on contact_tags
  for all using (
    exists (select 1 from contacts c where c.id = contact_id and c.owner_id = auth.uid())
  );

-- ============ SEED: PIPELINE STAGES ============
-- Executar separadamente após o primeiro login, substituindo <user-id> pelo UUID do utilizador.
-- Ou usar a Server Action de seed que corre automaticamente no 1.º acesso.

-- Track "sales" — Leads PME / Scalit
-- insert into pipeline_stages (owner_id, name, position, track, win_prob, is_won, is_lost) values
--   ('<user-id>', 'Lead',                       1, 'sales', 0.05, false, false),
--   ('<user-id>', 'Qualificado',                2, 'sales', 0.15, false, false),
--   ('<user-id>', 'Discovery Call agendada',    3, 'sales', 0.35, false, false),
--   ('<user-id>', 'Discovery Call realizada',   4, 'sales', 0.50, false, false),
--   ('<user-id>', 'Proposta/Estrutura enviada', 5, 'sales', 0.70, false, false),
--   ('<user-id>', 'Negociação',                 6, 'sales', 0.85, false, false),
--   ('<user-id>', 'Ganho',                      7, 'sales', 1.00, true,  false),
--   ('<user-id>', 'Perdido',                    8, 'sales', 0.00, false, true );

-- Track "community" — Creators / Marca Pessoal
-- insert into pipeline_stages (owner_id, name, position, track, win_prob, is_won, is_lost) values
--   ('<user-id>', 'Lead',             1, 'community', 0.05, false, false),
--   ('<user-id>', 'Qualificado',      2, 'community', 0.20, false, false),
--   ('<user-id>', 'Convidado ZTL',    3, 'community', 0.40, false, false),
--   ('<user-id>', 'Membro ZTL',       4, 'community', 0.60, false, false),
--   ('<user-id>', 'Convidado FLC',    5, 'community', 0.75, false, false),
--   ('<user-id>', 'Membro FLC',       6, 'community', 0.90, false, false),
--   ('<user-id>', 'Ganho (Mentoria)', 7, 'community', 1.00, true,  false),
--   ('<user-id>', 'Perdido',          8, 'community', 0.00, false, true );
