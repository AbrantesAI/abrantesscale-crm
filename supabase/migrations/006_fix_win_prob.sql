-- ============================================================
-- Migração 006 — Corrigir win_prob guardado como percentagem inteira
-- As etapas tinham win_prob como 5, 15, 100 (em vez de 0.05, 0.15, 1.0),
-- o que mostrava "500% prob." no funil e inflacionava 100x o valor
-- ponderado do pipeline no Dashboard.
-- Só ajusta valores claramente fora do intervalo 0–1 (idempotente).
-- ============================================================

update pipeline_stages
set win_prob = win_prob / 100
where win_prob > 1;
