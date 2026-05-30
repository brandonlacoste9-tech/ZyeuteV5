-- Migration: Complete Video Playback Schema with All Required Fields and Indexes
-- Date: 2026-02-21
-- Purpose: Ensure publications table has all video playback fields and proper indexing
-- Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.12, 1.13, 1.14

-- ============================================================================
-- STEP 1: Add Missing Video URL Fields
-- ============================================================================

-- media_url: Original processed version (Requirement 1.2)
ALTER TABLE publications ADD COLUMN IF NOT EXISTS media_url text;
COMMENT ON COLUMN publications.media_url IS 'Original processed video URL - populated when video is uploaded';

-- original_url: Original upload location (Requirement 1.2)
ALTER TABLE publications ADD COLUMN IF NOT EXISTS original_url text;
COMMENT ON COLUMN publications.original_url IS 'Original upload location - backup of initial upload';

-- enhanced_url: Upscaled/enhanced version (Requirement 1.5)
ALTER TABLE publications ADD COLUMN IF NOT EXISTS enhanced_url text;
COMMENT ON COLUMN publications.enhanced_url IS 'URL of upscaled/enhanced version - populated after enhancement processing';

-- hls_url: HLS manifest for adaptive streaming (Requirement 1.4)
-- Note: This was added in 20260202_add_hls_url.sql, but we verify it here
ALTER TABLE publications ADD COLUMN IF NOT EXISTS hls_url text;
COMMENT ON COLUMN publications.hls_url IS 'Mux HLS manifest URL for adaptive bitrate streaming - populated when processing completes';

-- mux_playback_id: Mux playback ID for direct streaming (Requirement 1.3)
ALTER TABLE publications ADD COLUMN IF NOT EXISTS mux_playback_id text;
COMMENT ON COLUMN publications.mux_playback_id IS 'Mux playback ID for direct streaming - used for HLS delivery';

-- ============================================================================
-- STEP 2: Add Missing Video Metadata Fields
-- ============================================================================

-- processing_status: Video processing state (Requirements 1.9, 1.10, 1.11)
-- Note: This enum was created in schema.ts, we ensure the column exists
ALTER TABLE publications ADD COLUMN IF NOT EXISTS processing_status text DEFAULT 'pending';
COMMENT ON COLUMN publications.processing_status IS 'Video processing state: pending, processing, completed, or failed';

-- thumbnail_url: Representative frame for preview (Requirement 1.6)
ALTER TABLE publications ADD COLUMN IF NOT EXISTS thumbnail_url text;
COMMENT ON COLUMN publications.thumbnail_url IS 'URL of representative frame for feed preview - populated after processing';

-- duration: Video duration in seconds (Requirement 1.7)
ALTER TABLE publications ADD COLUMN IF NOT EXISTS duration integer;
COMMENT ON COLUMN publications.duration IS 'Video duration in seconds - populated after processing';

-- aspect_ratio: Video aspect ratio (Requirement 1.8)
ALTER TABLE publications ADD COLUMN IF NOT EXISTS aspect_ratio text;
COMMENT ON COLUMN publications.aspect_ratio IS 'Video aspect ratio in format W:H (e.g., 9:16) - populated after processing';

-- ============================================================================
-- STEP 3: Create Indexes for Efficient Queries
-- ============================================================================

-- Index 1: (user_id, created_at) for feed queries (Requirement 1.12)
-- Note: This index was already created in schema.ts, but we verify it
CREATE INDEX IF NOT EXISTS idx_publications_user_created_at
ON publications(user_id, created_at DESC);
COMMENT ON INDEX idx_publications_user_created_at IS 'Composite index for efficient feed queries by user and creation time';

-- Index 2: (hive_id, created_at) for regional feed queries (Requirement 1.13)
-- Note: This index was already created in schema.ts, but we verify it
CREATE INDEX IF NOT EXISTS idx_publications_hive_created_at
ON publications(hive_id, created_at DESC);
COMMENT ON INDEX idx_publications_hive_created_at IS 'Composite index for efficient regional feed queries by hive and creation time';

-- Index 3: processing_status for finding videos needing processing (Requirement 1.14)
CREATE INDEX IF NOT EXISTS idx_publications_processing_status
ON publications(processing_status)
WHERE processing_status IN ('pending', 'processing', 'failed');
COMMENT ON INDEX idx_publications_processing_status IS 'Index for finding videos in processing pipeline - filtered to active states';

-- ============================================================================
-- STEP 4: Verify Column Types and Constraints
-- ============================================================================

-- Verify all URL fields are text type (can store up to 2GB)
-- Verify all metadata fields have appropriate types:
-- - processing_status: text (enum values)
-- - duration: integer (seconds)
-- - aspect_ratio: text (format "W:H")
-- - thumbnail_url: text (URL)

-- ============================================================================
-- STEP 5: Add Processing Error Field for Failed Videos
-- ============================================================================

-- processing_error: Error details if processing failed (Requirement 1.11)
ALTER TABLE publications ADD COLUMN IF NOT EXISTS processing_error text;
COMMENT ON COLUMN publications.processing_error IS 'Error details if processing_status is failed - for debugging and user feedback';

-- ============================================================================
-- STEP 6: Verify Existing Fields from Previous Migrations
-- ============================================================================

-- These fields should already exist from previous migrations:
-- - media_url (added in 20260120_repair_schema_full.sql or earlier)
-- - hls_url (added in 20260202_add_hls_url.sql)
-- - original_post_id (added in 20260206_add_tiktok_features.sql)
-- - remix_type (added in 20260206_add_remix_type_column.sql)

-- ============================================================================
-- STEP 7: Summary of Video Playback Schema
-- ============================================================================

-- Video URL Fields (for fallback strategy):
-- 1. hls_url - Preferred for completed videos (adaptive bitrate)
-- 2. enhanced_url - Fallback if hls_url unavailable
-- 3. media_url - Fallback if enhanced_url unavailable
-- 4. original_url - Final fallback if media_url unavailable

-- Video Metadata Fields:
-- 1. mux_playback_id - For Mux direct streaming
-- 2. processing_status - Pipeline state (pending/processing/completed/failed)
-- 3. thumbnail_url - For feed preview rendering
-- 4. duration - For progress bar and seek functionality
-- 5. aspect_ratio - For proper video container sizing
-- 6. processing_error - For error handling and debugging

-- Indexes for Performance:
-- 1. (user_id, created_at) - Feed queries
-- 2. (hive_id, created_at) - Regional feed queries
-- 3. (processing_status) - Pipeline monitoring

-- ============================================================================
-- STEP 8: Validation Queries (for manual verification)
-- ============================================================================

-- To verify all required columns exist, run:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'publications'
-- AND column_name IN ('media_url', 'hls_url', 'enhanced_url', 'original_url',
--                     'mux_playback_id', 'processing_status', 'thumbnail_url',
--                     'duration', 'aspect_ratio', 'processing_error')
-- ORDER BY column_name;

-- To verify all required indexes exist, run:
-- SELECT indexname FROM pg_indexes
-- WHERE tablename = 'publications'
-- AND indexname IN ('idx_publications_user_created_at',
--                   'idx_publications_hive_created_at',
--                   'idx_publications_processing_status')
-- ORDER BY indexname;
