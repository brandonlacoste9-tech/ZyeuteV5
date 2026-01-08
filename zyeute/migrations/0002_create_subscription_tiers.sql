-- Migration: Create subscription_tiers table for Colony OS Finance Bee
-- Created: 2025-12-15
-- Purpose: Track Stripe subscription data for revenue intelligence

CREATE TABLE IF NOT EXISTS subscription_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tier_name TEXT NOT NULL DEFAULT 'premium',
    status TEXT NOT NULL, -- 'active', 'cancelled', 'past_due', etc.
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS subscription_tiers_user_id_idx ON subscription_tiers(user_id);
CREATE INDEX IF NOT EXISTS subscription_tiers_stripe_id_idx ON subscription_tiers(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS subscription_tiers_status_idx ON subscription_tiers(status);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscription_tiers_updated_at 
    BEFORE UPDATE ON subscription_tiers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant access to authenticated users (readonly)
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
    ON subscription_tiers FOR SELECT
    USING (auth.uid() = user_id);

-- Service role has full access (for Finance Bee)
GRANT ALL ON subscription_tiers TO service_role;
GRANT ALL ON subscription_tiers TO postgres;
