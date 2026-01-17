-- ============================================
-- Critical Migrations for Railway Production
-- Apply these to fix database schema issues
-- Run: psql $DATABASE_URL -f migrations/apply-critical-migrations.sql
-- ============================================

-- ============================================
-- Migration 0013: Add Missing Publications Columns
-- ============================================

-- Critical: content column (REQUIRED)
ALTER TABLE "publications"
ADD COLUMN IF NOT EXISTS "content" text NOT NULL DEFAULT '';

-- Mux Video Processing Columns
ALTER TABLE "publications"
ADD COLUMN IF NOT EXISTS "original_url" text,
ADD COLUMN IF NOT EXISTS "enhanced_url" text,
ADD COLUMN IF NOT EXISTS "processing_status" text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS "media_metadata" jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "mux_asset_id" text,
ADD COLUMN IF NOT EXISTS "mux_upload_id" text,
ADD COLUMN IF NOT EXISTS "promo_url" text,
ADD COLUMN IF NOT EXISTS "mux_playback_id" text,
ADD COLUMN IF NOT EXISTS "duration" integer,
ADD COLUMN IF NOT EXISTS "aspect_ratio" text,
ADD COLUMN IF NOT EXISTS "visual_filter" text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS "enhance_started_at" timestamp,
ADD COLUMN IF NOT EXISTS "enhance_finished_at" timestamp;

-- AI/ML Columns
ALTER TABLE "publications"
ADD COLUMN IF NOT EXISTS "embedding" vector(768),
ADD COLUMN IF NOT EXISTS "last_embedded_at" timestamp,
ADD COLUMN IF NOT EXISTS "transcription" text,
ADD COLUMN IF NOT EXISTS "transcribed_at" timestamp,
ADD COLUMN IF NOT EXISTS "ai_description" text,
ADD COLUMN IF NOT EXISTS "ai_labels" jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS "content_fr" text,
ADD COLUMN IF NOT EXISTS "content_en" text,
ADD COLUMN IF NOT EXISTS "detected_themes" text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "detected_items" text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "ai_generated" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "viral_score" integer DEFAULT 0;

-- Moderation Columns
ALTER TABLE "publications"
ADD COLUMN IF NOT EXISTS "safety_flags" jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "is_moderated" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "moderation_approved" boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS "moderation_score" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "moderated_at" timestamp;

-- Ephemeral/Burn Protocol Columns
ALTER TABLE "publications"
ADD COLUMN IF NOT EXISTS "is_ephemeral" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "max_views" integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS "expires_at" timestamp,
ADD COLUMN IF NOT EXISTS "burned_at" timestamp,
ADD COLUMN IF NOT EXISTS "deleted_at" timestamp,
ADD COLUMN IF NOT EXISTS "is_vaulted" boolean DEFAULT false;

-- Location/Geography Columns
ALTER TABLE "publications"
ADD COLUMN IF NOT EXISTS "location" geography(Point, 4326),
ADD COLUMN IF NOT EXISTS "city" text,
ADD COLUMN IF NOT EXISTS "region_id" text;

-- Hive ID Column
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'hive_id') THEN
    CREATE TYPE "hive_id" AS ENUM ('quebec', 'brazil', 'argentina', 'mexico');
  END IF;
END $$;

ALTER TABLE "publications"
ADD COLUMN IF NOT EXISTS "hive_id" "hive_id" DEFAULT 'quebec';

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS "idx_publications_hive_id" ON "publications" ("hive_id");
CREATE INDEX IF NOT EXISTS "idx_publications_location_gist" ON "publications" USING GIST ("location") WHERE "location" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_publications_region_created_at" ON "publications" ("region_id", "created_at") WHERE "region_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_publications_processing_status" ON "publications" ("processing_status") WHERE "processing_status" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_publications_ephemeral_expires" ON "publications" ("is_ephemeral", "expires_at") WHERE "is_ephemeral" = true;
CREATE INDEX IF NOT EXISTS "idx_publications_is_vaulted" ON "publications" ("is_vaulted") WHERE "is_vaulted" = true;

-- ============================================
-- Migration 0014: Add piasse_balance to user_profiles
-- ============================================

ALTER TABLE "user_profiles"
ADD COLUMN IF NOT EXISTS "piasse_balance" double precision DEFAULT 0.0;

CREATE INDEX IF NOT EXISTS "idx_user_profiles_piasse_balance"
ON "user_profiles" ("piasse_balance" DESC)
WHERE "piasse_balance" > 0;

-- ============================================
-- Verification
-- ============================================

-- Verify publications.original_url exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'publications' AND column_name = 'original_url'
  ) THEN
    RAISE NOTICE '✅ publications.original_url exists';
  ELSE
    RAISE EXCEPTION '❌ publications.original_url still missing!';
  END IF;
END $$;

-- Verify user_profiles.piasse_balance exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'piasse_balance'
  ) THEN
    RAISE NOTICE '✅ user_profiles.piasse_balance exists';
  ELSE
    RAISE EXCEPTION '❌ user_profiles.piasse_balance still missing!';
  END IF;
END $$;

-- ============================================
-- Success Message
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Critical migrations applied successfully!';
  RAISE NOTICE 'publications.original_url - ADDED';
  RAISE NOTICE 'user_profiles.piasse_balance - ADDED';
  RAISE NOTICE '========================================';
END $$;
