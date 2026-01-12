-- Migration: Add Missing Columns to publications Table
-- Created: 2026-01-12
-- Purpose: Add all missing columns required by shared/schema.ts
-- Critical: The "content" column is REQUIRED (.notNull()) and will cause 500 errors if missing

-- ============================================
-- CRITICAL: content column (REQUIRED)
-- ============================================
ALTER TABLE "publications" 
ADD COLUMN IF NOT EXISTS "content" text NOT NULL DEFAULT '';

-- Remove default after adding (for future inserts)
-- ALTER TABLE "publications" ALTER COLUMN "content" DROP DEFAULT;

-- ============================================
-- Mux Video Processing Columns
-- ============================================
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

-- ============================================
-- AI/ML Columns (Embeddings, Transcription, Labels)
-- ============================================
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

-- ============================================
-- Moderation Columns
-- ============================================
ALTER TABLE "publications" 
ADD COLUMN IF NOT EXISTS "safety_flags" jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "is_moderated" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "moderation_approved" boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS "moderation_score" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "moderated_at" timestamp;

-- ============================================
-- Ephemeral/Burn Protocol Columns
-- ============================================
ALTER TABLE "publications" 
ADD COLUMN IF NOT EXISTS "is_ephemeral" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "max_views" integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS "expires_at" timestamp,
ADD COLUMN IF NOT EXISTS "burned_at" timestamp,
ADD COLUMN IF NOT EXISTS "deleted_at" timestamp,
ADD COLUMN IF NOT EXISTS "is_vaulted" boolean DEFAULT false;

-- ============================================
-- Location/Geography Columns
-- ============================================
-- Note: Requires PostGIS extension
-- If PostGIS is not enabled, run: CREATE EXTENSION IF NOT EXISTS postgis;
ALTER TABLE "publications" 
ADD COLUMN IF NOT EXISTS "location" geography(Point, 4326),
ADD COLUMN IF NOT EXISTS "city" text,
ADD COLUMN IF NOT EXISTS "region_id" text;

-- ============================================
-- Hive ID Column (Critical for Multi-Hive Support)
-- ============================================
-- First, ensure the enum exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'hive_id') THEN
    CREATE TYPE "hive_id" AS ENUM ('quebec', 'brazil', 'argentina', 'mexico');
  END IF;
END $$;

ALTER TABLE "publications" 
ADD COLUMN IF NOT EXISTS "hive_id" "hive_id" DEFAULT 'quebec';

-- ============================================
-- Indexes for Performance
-- ============================================
-- Index for hive_id (critical for filtering by hive)
CREATE INDEX IF NOT EXISTS "idx_publications_hive_id" ON "publications" ("hive_id");

-- Index for location (if PostGIS is enabled)
CREATE INDEX IF NOT EXISTS "idx_publications_location_gist" ON "publications" USING GIST ("location") WHERE "location" IS NOT NULL;

-- Index for region_id + created_at (for regional feeds)
CREATE INDEX IF NOT EXISTS "idx_publications_region_created_at" ON "publications" ("region_id", "created_at") WHERE "region_id" IS NOT NULL;

-- Index for processing_status (for video processing queue)
CREATE INDEX IF NOT EXISTS "idx_publications_processing_status" ON "publications" ("processing_status") WHERE "processing_status" IS NOT NULL;

-- Index for is_ephemeral + expires_at (for burn protocol)
CREATE INDEX IF NOT EXISTS "idx_publications_ephemeral_expires" ON "publications" ("is_ephemeral", "expires_at") WHERE "is_ephemeral" = true;

-- Index for is_vaulted (for vault feature)
CREATE INDEX IF NOT EXISTS "idx_publications_is_vaulted" ON "publications" ("is_vaulted") WHERE "is_vaulted" = true;

-- Index for embedding (for semantic search - requires pgvector)
-- CREATE INDEX IF NOT EXISTS "idx_publications_embedding_hnsw" ON "publications" USING hnsw ("embedding" vector_cosine_ops) WHERE "embedding" IS NOT NULL;

-- ============================================
-- Column Name Mappings (French → English)
-- ============================================
-- Note: The schema uses English names, but the database might have French names
-- If you see errors about "visibilite" vs "visibility", run these:

-- ALTER TABLE "publications" RENAME COLUMN "visibilite" TO "visibility" IF EXISTS;
-- ALTER TABLE "publications" RENAME COLUMN "reactions_count" TO "fire_count" IF EXISTS;
-- ALTER TABLE "publications" RENAME COLUMN "comments_count" TO "comment_count" IF EXISTS;
-- ALTER TABLE "publications" RENAME COLUMN "est_masque" TO "is_hidden" IF EXISTS;

-- ============================================
-- Verification Query (Run after migration)
-- ============================================
-- Run this to verify all columns were added:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'publications' 
-- AND column_name IN (
--   'content', 'hive_id', 'mux_asset_id', 'embedding', 
--   'transcription', 'is_ephemeral', 'is_vaulted', 'location'
-- )
-- ORDER BY column_name;
