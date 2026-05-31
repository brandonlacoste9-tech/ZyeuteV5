-- Add Stripe Connect account ID to user_profiles for creator payouts
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS stripe_connect_id TEXT DEFAULT NULL;

-- Index for fast lookup during payout processing
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_connect
  ON user_profiles (stripe_connect_id)
  WHERE stripe_connect_id IS NOT NULL;
