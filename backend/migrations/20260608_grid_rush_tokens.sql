-- Grid Rush token wallets (startup runner copy — mirrors migrations/0019_grid_rush_tokens.sql)

CREATE TABLE IF NOT EXISTS user_wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  token_balance INT DEFAULT 1000 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE grid_rush_matches
  ADD COLUMN IF NOT EXISTS stake_tokens INT DEFAULT 500 NOT NULL;

ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wallets_self_read" ON user_wallets;
CREATE POLICY "wallets_self_read" ON user_wallets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
