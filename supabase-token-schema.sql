-- ─────────────────────────────────────────────────────────────
-- SISTEMA A TOKEN PER LA CHAT AI
-- Esegui questo script nel SQL Editor di Supabase una volta.
-- Budget mensili: Free 100K · Starter 1,5M · Pro 3M · Enterprise illimitati.
-- Gli ospiti (no account) hanno un budget giornaliero di 30K token
-- gestito lato server via Redis (nessuna colonna necessaria).
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS tokens_used_month BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tokens_period_start TIMESTAMPTZ;
