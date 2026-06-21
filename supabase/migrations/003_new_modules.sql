-- ============================================================
-- Migração 003 — Módulos Outreach, Conteúdo e ICP
-- Correr no SQL Editor do Supabase depois da 002
-- ============================================================

-- ── 1. Campo outreach_status em contacts ─────────────────────
-- Valores: 'a_contactar' | 'ligado' | 'reuniao_marcada' | 'qualificado' | 'sem_interesse'
alter table contacts
  add column if not exists outreach_status text;

-- ── 2. Tabela de conteúdo publicado ──────────────────────────
create table if not exists content_pieces (
  id           uuid primary key default uuid_generate_v4(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  platform     text,            -- 'instagram' | 'skool' | 'newsletter' | 'linkedin'
  format       text,            -- 'reel' | 'story' | 'post' | 'carrossel' | 'email'
  pillar       text,            -- 'ai_aplicada' | 'tudo_e_vendas' | 'builds_in_public' | 'mindset' | 'other'
  title        text not null,
  hook         text,
  result_base  text,            -- baseado em que resultado/cliente
  url          text,
  status       text default 'ideia', -- 'ideia' | 'rascunho' | 'publicado'
  published_at date,
  created_at   timestamptz default now()
);
create index if not exists idx_content_pieces_owner on content_pieces(owner_id, created_at);

alter table content_pieces enable row level security;
create policy "own_rows" on content_pieces
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ── 3. Tabela de ICP (cliente ideal) ─────────────────────────
create table if not exists icp_definition (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  sector      text,            -- setor ideal
  main_pain   text,            -- dor principal
  ticket      text,            -- ticket médio esperado
  qual_signals text,           -- sinais de qualificação
  red_flags   text,            -- red flags
  approach    text,            -- gancho de abordagem
  updated_at  timestamptz default now(),
  unique (owner_id)            -- 1 registo por utilizador
);

alter table icp_definition enable row level security;
create policy "own_rows" on icp_definition
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
