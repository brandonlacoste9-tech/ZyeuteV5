-- Poutine Royale — daily score-attack tournament tables
-- Created: 2026-06-08
-- Idempotent: safe to run on every startup (IF NOT EXISTS guards).

BEGIN;

-- Wallet table (also created by grid rush migration; guard here for ordering safety)
CREATE TABLE IF NOT EXISTS user_wallets (
  user_id UUID PRIMARY KEY,
  token_balance INTEGER NOT NULL DEFAULT 1000 CHECK (token_balance >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily tournament container
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  entry_fee INTEGER NOT NULL DEFAULT 0,
  prize_pool INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tournaments_active
  ON tournaments (status, created_at DESC)
  WHERE status = 'active';

-- Per-player best score per tournament
CREATE TABLE IF NOT EXISTS royale_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  layers INTEGER NOT NULL DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_royale_scores_tournament ON royale_scores (tournament_id);
CREATE INDEX IF NOT EXISTS idx_royale_scores_user ON royale_scores (user_id);

-- One row per (player, tournament): keeps only their personal best.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'royale_scores_user_tournament_uniq'
  ) THEN
    BEGIN
      ALTER TABLE royale_scores
        ADD CONSTRAINT royale_scores_user_tournament_uniq UNIQUE (user_id, tournament_id);
    EXCEPTION
      WHEN unique_violation THEN NULL; -- pre-existing dup rows: skip, app upsert still dedups
    END;
  END IF;
END
$$;

COMMIT;
