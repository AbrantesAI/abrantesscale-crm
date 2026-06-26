-- ============================================================
-- Migração 005 — Campo MRR nos contactos + Salário nos goals
-- ============================================================

-- Adicionar mrr aos contactos (mensalidade recorrente do cliente Scalit)
alter table contacts
  add column if not exists mrr numeric default 0;

-- Garantir que goals tem constraint correta para salary
-- (a tabela goals já existe com owner_id, metric, period_start)
