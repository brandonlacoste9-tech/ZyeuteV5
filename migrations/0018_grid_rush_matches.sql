-- Grid Rush 1v1 speed battle matches
-- Created: 2026-06-08

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'grid_rush_status') THEN
    CREATE TYPE grid_rush_status AS ENUM ('WAITING', 'ACTIVE', 'COMPLETED', 'CANCELLED');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS grid_rush_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status grid_rush_status DEFAULT 'WAITING',
  player_1_id UUID NOT NULL REFERENCES auth.users(id),
  player_2_id UUID REFERENCES auth.users(id),
  player_1_score INT DEFAULT 0 NOT NULL,
  player_2_score INT DEFAULT 0 NOT NULL,
  stake_cennes INT NOT NULL DEFAULT 500,
  winner_id UUID REFERENCES auth.users(id),
  started_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_grid_rush_waiting
  ON grid_rush_matches (status, stake_cennes, created_at)
  WHERE status = 'WAITING' AND player_2_id IS NULL;

-- Realtime publication
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
      AND tablename = 'grid_rush_matches'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE grid_rush_matches;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE grid_rush_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "grid_rush_participants_read" ON grid_rush_matches;
CREATE POLICY "grid_rush_participants_read" ON grid_rush_matches
  FOR SELECT TO authenticated
  USING (auth.uid() IN (player_1_id, player_2_id));

COMMIT;
