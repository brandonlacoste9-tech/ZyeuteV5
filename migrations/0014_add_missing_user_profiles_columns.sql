-- Migration 0014: Add Missing user_profiles Columns
-- Purpose: Sync user_profiles table with Drizzle schema.ts
-- All ADD COLUMN IF NOT EXISTS = safe to run multiple times

-- Economy columns
ALTER TABLE "user_profiles"
ADD COLUMN IF NOT EXISTS "karma_credits" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "cash_credits" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "total_gifts_sent" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "total_gifts_received" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "legendary_badges" jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS "tax_id" varchar(50),
ADD COLUMN IF NOT EXISTS "bee_alias" varchar(50);

-- Gamification columns
ALTER TABLE "user_profiles"
ADD COLUMN IF NOT EXISTS "nectar_points" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "current_streak" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "max_streak" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "last_daily_bonus" timestamp,
ADD COLUMN IF NOT EXISTS "unlocked_hives" jsonb DEFAULT '["quebec"]';

-- Parental controls
ALTER TABLE "user_profiles"
ADD COLUMN IF NOT EXISTS "parent_id" uuid REFERENCES "user_profiles"("id") ON DELETE SET NULL;

-- Total karma (if missing)
ALTER TABLE "user_profiles"
ADD COLUMN IF NOT EXISTS "total_karma" integer DEFAULT 0;

-- Ti-Guy flag (if missing)
ALTER TABLE "user_profiles"
ADD COLUMN IF NOT EXISTS "ti_guy_comments_enabled" boolean DEFAULT true;

-- Custom permissions (if missing)
ALTER TABLE "user_profiles"
ADD COLUMN IF NOT EXISTS "custom_permissions" jsonb DEFAULT '{}';

-- Hive ID (if missing)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'hive_id') THEN
    CREATE TYPE "hive_id" AS ENUM ('quebec', 'brazil', 'argentina', 'mexico');
  END IF;
END $$;
ALTER TABLE "user_profiles"
ADD COLUMN IF NOT EXISTS "hive_id" "hive_id" DEFAULT 'quebec';

