-- Grid Rush: virtual token wallets (Play Store compliant "GG gift" model)
-- Created: 2026-06-08
-- Replaces real-money cenne stakes with non-fiat in-app tokens (étoiles).

BEGIN;

-- Per-user virtual token balance. New users seed with 1000 tokens for testing.
CREATE TABLE IF NOT EXISTS user_wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  token_balance INT DEFAULT 1000 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Switch matches to token stakes (keep stake_cennes column for backward safety).
ALTER TABLE grid_rush_matches
  ADD COLUMN IF NOT EXISTS stake_tokens INT DEFAULT 500 NOT NULL;

-- Backfill any pre-existing rows from the old cenne stake.
UPDATE grid_rush_matches
  SET stake_tokens = COALESCE(stake_cennes, 500)
  WHERE stake_tokens IS NULL OR stake_tokens = 500;

-- Realtime + RLS for wallets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'user_wallets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_wallets;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wallets_self_read" ON user_wallets;
CREATE POLICY "wallets_self_read" ON user_wallets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

COMMIT;
