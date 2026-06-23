-- ============================================================
-- Migração 004 — Suporte a dois ICPs (sales + community)
-- ============================================================

-- Remover constraint unique(owner_id) para permitir 2 registos por utilizador
alter table icp_definition drop constraint if exists icp_definition_owner_id_key;

-- Adicionar coluna track
alter table icp_definition
  add column if not exists track text not null default 'sales';

-- Nova constraint: único por (owner_id, track)
alter table icp_definition
  drop constraint if exists icp_definition_owner_track_unique;

alter table icp_definition
  add constraint icp_definition_owner_track_unique unique (owner_id, track);

-- Garantir que registos existentes ficam no track correto
update icp_definition set track = 'sales' where track = 'sales' or track is null;
