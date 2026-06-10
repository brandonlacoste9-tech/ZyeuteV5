-- Carte Sucrée — daily level completions (mirror of backend migration)

BEGIN;

CREATE TABLE IF NOT EXISTS carte_sucree_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  play_date DATE NOT NULL,
  level_id TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0),
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  reward_amount INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT carte_sucree_user_date_level_uniq UNIQUE (user_id, play_date, level_id)
);

CREATE INDEX IF NOT EXISTS idx_carte_sucree_date_level
  ON carte_sucree_completions (play_date, level_id, score DESC);

ALTER TABLE carte_sucree_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "carte_sucree_public_read" ON carte_sucree_completions;
CREATE POLICY "carte_sucree_public_read" ON carte_sucree_completions
  FOR SELECT TO anon, authenticated
  USING (true);

REVOKE INSERT, UPDATE, DELETE ON carte_sucree_completions FROM anon, authenticated;
GRANT SELECT ON carte_sucree_completions TO anon, authenticated;

COMMIT;
