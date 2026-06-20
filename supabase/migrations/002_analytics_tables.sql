-- ============================================================
-- Migração 002 — Tabelas de análise (Catálogo v1)
-- Corre no SQL Editor do Supabase depois da 001
-- ============================================================

-- ── A1. Histórico de transições de etapa ──────────────────
create table if not exists stage_transitions (
  id           uuid primary key default uuid_generate_v4(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  contact_id   uuid not null references contacts(id) on delete cascade,
  from_stage   uuid references pipeline_stages(id),
  to_stage     uuid references pipeline_stages(id),
  track        text,
  changed_at   timestamptz default now(),
  days_in_prev numeric
);
create index if not exists idx_stage_transitions_contact on stage_transitions(contact_id);
create index if not exists idx_stage_transitions_owner  on stage_transitions(owner_id, changed_at);

-- RLS
alter table stage_transitions enable row level security;
create policy "own_rows" on stage_transitions
  using (auth.uid() = owner_id);

-- Trigger: regista automaticamente cada vez que stage_id muda em contacts
create or replace function record_stage_transition()
returns trigger language plpgsql security definer as $$
begin
  if (old.stage_id is distinct from new.stage_id) then
    insert into stage_transitions (
      owner_id, contact_id, from_stage, to_stage, track,
      days_in_prev, changed_at
    )
    select
      new.owner_id,
      new.id,
      old.stage_id,
      new.stage_id,
      coalesce(ps.track, 'sales'),
      case
        when old.stage_changed_at is not null
        then extract(epoch from (now() - old.stage_changed_at)) / 86400
        else null
      end,
      now()
    from pipeline_stages ps
    where ps.id = new.stage_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_stage_transition on contacts;
create trigger trg_stage_transition
  after update of stage_id on contacts
  for each row execute function record_stage_transition();

-- ── A9. Snapshots diários ─────────────────────────────────
create table if not exists daily_snapshots (
  id             uuid primary key default uuid_generate_v4(),
  owner_id       uuid not null references auth.users(id) on delete cascade,
  snapshot_date  date default current_date,
  total_leads    int default 0,
  active_leads   int default 0,
  pipeline_value numeric default 0,
  mrr            numeric default 0,
  ztl_members    int default 0,
  flc_members    int default 0,
  unique (owner_id, snapshot_date)
);
alter table daily_snapshots enable row level security;
create policy "own_rows" on daily_snapshots
  using (auth.uid() = owner_id);

-- ── A10. Metas ────────────────────────────────────────────
create table if not exists goals (
  id           uuid primary key default uuid_generate_v4(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  metric       text not null,   -- 'mrr' | 'new_leads' | 'flc_members' | 'revenue' | 'pipeline_value'
  label        text,            -- nome legível, ex: 'MRR mensal'
  target       numeric not null,
  current_val  numeric default 0,
  period       text,            -- 'monthly' | 'quarterly' | 'yearly'
  period_start date,
  period_end   date,
  created_at   timestamptz default now()
);
alter table goals enable row level security;
create policy "own_rows" on goals
  using (auth.uid() = owner_id);

-- ── A11. Motivos de perda ─────────────────────────────────
create table if not exists lost_reasons (
  id        uuid primary key default uuid_generate_v4(),
  owner_id  uuid not null references auth.users(id) on delete cascade,
  label     text not null
);
alter table lost_reasons enable row level security;
create policy "own_rows" on lost_reasons
  using (auth.uid() = owner_id);

-- Seed dos motivos mais comuns
-- (substitui <USER_ID> pelo teu UUID da tabela auth.users, ou insere manualmente no Supabase)

-- ── Vista B1 — Funil de conversão ────────────────────────
create or replace view v_funnel_conversion as
select
  ps.owner_id,
  ps.track,
  ps.name as stage,
  ps.position,
  ps.is_won,
  count(c.id) as contacts_in_stage,
  count(c.id) filter (where c.created_at > now() - interval '90 days') as last_90d
from pipeline_stages ps
left join contacts c on c.stage_id = ps.id and c.status = 'active'
group by ps.owner_id, ps.track, ps.name, ps.position, ps.is_won
order by ps.track, ps.position;

-- ── Vista B2 — Velocidade por etapa ──────────────────────
create or replace view v_stage_velocity as
select
  st.owner_id,
  ps.name as stage,
  ps.track,
  round(avg(st.days_in_prev), 1) as avg_days,
  count(*) as transitions
from stage_transitions st
join pipeline_stages ps on ps.id = st.from_stage
group by st.owner_id, ps.name, ps.track;
