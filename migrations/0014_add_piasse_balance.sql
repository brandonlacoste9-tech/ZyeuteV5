-- Migration: Add piasse_balance to user_profiles
-- Created: 2026-01-17
-- Purpose: Add missing piasse_balance column for Piasse currency system

-- ============================================
-- Add piasse_balance column to user_profiles
-- ============================================
ALTER TABLE "user_profiles"
ADD COLUMN IF NOT EXISTS "piasse_balance" double precision DEFAULT 0.0;

-- ============================================
-- Add index for piasse_balance (for leaderboards/queries)
-- ============================================
CREATE INDEX IF NOT EXISTS "idx_user_profiles_piasse_balance"
ON "user_profiles" ("piasse_balance" DESC)
WHERE "piasse_balance" > 0;

-- ============================================
-- Verification Query (Run after migration)
-- ============================================
-- Run this to verify the column was added:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'user_profiles'
-- AND column_name = 'piasse_balance';
