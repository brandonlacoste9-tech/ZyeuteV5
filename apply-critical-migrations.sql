-- ============================================
-- Critical Migrations for Railway Production
-- Apply these to fix database schema issues
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
ADD COLUMN IF NOT EXISTS "thumbnail_url" text,
ADD COLUMN IF NOT EXISTS "duration" double precision,
ADD COLUMN IF NOT EXISTS "aspect_ratio" text;

-- Visual Enhancement Columns
ALTER TABLE "publications"
ADD COLUMN IF NOT EXISTS "visual_filter" text,
ADD COLUMN IF NOT EXISTS "enhance_started_at" timestamp with time zone,
ADD COLUMN IF NOT EXISTS "enhance_finished_at" timestamp with time zone,
ADD COLUMN IF NOT EXISTS "visibilite" text DEFAULT 'public';

-- [NEW] Bridge: Sync legacy 'visibility' to 'visibilite' if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='publications' AND column_name='visibility') THEN
        UPDATE "publications" SET "visibilite" = "visibility" WHERE "visibilite" IS NULL;
        RAISE NOTICE '✅ Synced visibility -> visibilite';
    END IF;
END $$;

-- Create indexes for video processing queries
CREATE INDEX IF NOT EXISTS "idx_publications_processing_status"
ON "publications" ("processing_status")
WHERE "processing_status" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_publications_mux_asset_id"
ON "publications" ("mux_asset_id")
WHERE "mux_asset_id" IS NOT NULL;

-- ============================================
-- Migration 0014: Add piasse_balance to user_profiles
-- ============================================

ALTER TABLE "user_profiles"
ADD COLUMN IF NOT EXISTS "piasse_balance" double precision DEFAULT 0.0;

-- Add index for piasse_balance (for leaderboards/queries)
CREATE INDEX IF NOT EXISTS "idx_user_profiles_piasse_balance"
ON "user_profiles" ("piasse_balance" DESC)
WHERE "piasse_balance" > 0;

-- ============================================
-- Verification Queries
-- ============================================

DO $$
BEGIN
    -- Check if publications.original_url exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'publications' AND column_name = 'original_url'
    ) THEN
        RAISE NOTICE '✅ publications.original_url exists';
    END IF;
    
    -- Check if user_profiles.piasse_balance exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'piasse_balance'
    ) THEN
        RAISE NOTICE '✅ user_profiles.piasse_balance exists';
    END IF;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Critical migrations applied successfully!';
    RAISE NOTICE 'publications.original_url - ADDED';
    RAISE NOTICE 'user_profiles.piasse_balance - ADDED';
    RAISE NOTICE '========================================';
END $$;
