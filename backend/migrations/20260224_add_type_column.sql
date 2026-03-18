-- Migration: Add missing 'type' column to publications table
-- Date: 2026-02-24
-- Purpose: The publications table was missing a 'type' column ('video' | 'photo').
--          Without this, the raw SQL COALESCE(p.type, 'video') throws a PostgreSQL
--          "column does not exist" error, silently killing the explore feed query
--          and causing the frontend to fall back to demo videos.

-- ============================================================================
-- STEP 1: Add type column
-- ============================================================================
ALTER TABLE publications
  ADD COLUMN IF NOT EXISTS type text DEFAULT 'video';

COMMENT ON COLUMN publications.type IS 'Content type: video or photo. Defaults to video for backward compatibility.';

-- ============================================================================
-- STEP 2: Back-fill existing rows
-- Rows that have a media_url ending in a video extension → video
-- Rows that have a mux_playback_id or hls_url → video
-- Everything else defaults to photo
-- ============================================================================
UPDATE publications
SET type = 'video'
WHERE type IS NULL
   OR type = ''
   OR mux_playback_id IS NOT NULL
   OR hls_url IS NOT NULL
   OR media_url ILIKE '%.mp4'
   OR media_url ILIKE '%.mov'
   OR media_url ILIKE '%.webm'
   OR media_url ILIKE '%.m3u8'
   OR media_url ILIKE '%/video/%'
   OR media_url ILIKE '%stream.mux.com%'
   OR media_url ILIKE '%pexels.com/video%';

-- ============================================================================
-- STEP 3: Make sure processing_status has a valid default for old rows
-- (Some rows inserted before the column existed may have NULL)
-- ============================================================================
UPDATE publications
SET processing_status = 'completed'
WHERE processing_status IS NULL
  AND (
    media_url IS NOT NULL
    OR mux_playback_id IS NOT NULL
    OR hls_url IS NOT NULL
  );

-- ============================================================================
-- STEP 4: Index for fast type filtering
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_publications_type
  ON publications(type);

-- ============================================================================
-- Verification query (run manually to check):
-- SELECT type, count(*) FROM publications GROUP BY type;
-- SELECT count(*) FROM publications WHERE processing_status = 'completed';
-- ============================================================================
