-- ─── Stripe Subscription Tiers ────────────────────────────────────────────────
-- Tracks real Stripe subscriptions (VIP plans: bronze/argent/or)
-- Written by webhook handler in backend/routes/subscriptions.ts

CREATE TABLE IF NOT EXISTS subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_name TEXT NOT NULL DEFAULT 'bronze', -- 'bronze' | 'argent' | 'or'
  status TEXT NOT NULL,                      -- 'active' | 'past_due' | 'cancelled'
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS subscription_tiers_user_id_idx  ON subscription_tiers(user_id);
CREATE INDEX IF NOT EXISTS subscription_tiers_stripe_id_idx ON subscription_tiers(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS subscription_tiers_status_idx   ON subscription_tiers(status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_subscription_tiers_updated_at ON subscription_tiers;
CREATE TRIGGER update_subscription_tiers_updated_at
  BEFORE UPDATE ON subscription_tiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subscription_tiers' AND policyname = 'Users can view their own subscriptions'
  ) THEN
    CREATE POLICY "Users can view their own subscriptions"
      ON subscription_tiers FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Service role full access (webhook writes bypass RLS)
GRANT ALL ON subscription_tiers TO service_role;
GRANT ALL ON subscription_tiers TO postgres;

-- ─── Creator-to-Creator Subscriptions (fan → creator) ─────────────────────────
-- Used by subscriptionService.ts (getCreatorSubscribers, getUserSubscriptions)

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  tier_id TEXT,  -- free-form tier identifier
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'canceled' | 'past_due' | 'paused' | 'expired'
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(subscriber_id, creator_id)
);

CREATE INDEX IF NOT EXISTS subscriptions_subscriber_id_idx ON subscriptions(subscriber_id);
CREATE INDEX IF NOT EXISTS subscriptions_creator_id_idx    ON subscriptions(creator_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx        ON subscriptions(status);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Users can view their subscriptions'
  ) THEN
    CREATE POLICY "Users can view their subscriptions"
      ON subscriptions FOR SELECT
      USING (auth.uid() = subscriber_id OR auth.uid() = creator_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Users can manage their subscriptions'
  ) THEN
    CREATE POLICY "Users can manage their subscriptions"
      ON subscriptions FOR ALL
      USING (auth.uid() = subscriber_id);
  END IF;
END $$;

GRANT ALL ON subscriptions TO service_role;
GRANT ALL ON subscriptions TO postgres;
