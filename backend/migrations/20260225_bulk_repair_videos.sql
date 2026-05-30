-- Migration: Bulk repair broken videos in publications table
-- Date: 2026-02-25
-- Fixes:
--   1. Pexels video URLs missing .mp4 extension (status = failed)
--   2. Social embed URLs (TikTok, YouTube, Instagram) marked as hidden
--   3. Stuck pending/processing rows older than 2 hours → completed (so original_url shows)
--   4. Videos with no source at all → hidden
--   5. Mux videos with completed status but no hls_url → rebuild hls_url from mux_playback_id
--   6. Missing thumbnails for Mux videos → rebuild from image.mux.com

-- ============================================================================
-- FIX 1: Repair truncated Pexels video URLs (add .mp4 where missing)
-- ============================================================================
UPDATE publications
SET
  media_url = media_url || '.mp4',
  processing_status = 'completed'
WHERE
  media_url ILIKE '%videos.pexels.com/video-files/%'
  AND media_url NOT ILIKE '%.mp4'
  AND media_url NOT ILIKE '%.webm'
  AND media_url NOT ILIKE '%.m3u8'
  AND deleted_at IS NULL;

-- ============================================================================
-- FIX 2: Hide unplayable social embed URLs (TikTok, Instagram, YouTube pages)
-- These are webpage URLs not direct video streams — <video> can never play them
-- ============================================================================
UPDATE publications
SET
  est_masque = true,
  processing_status = 'failed'
WHERE
  deleted_at IS NULL
  AND est_masque = false
  AND (
    media_url ILIKE '%tiktok.com/%/video/%'
    OR media_url ILIKE '%instagram.com/reel/%'
    OR media_url ILIKE '%instagram.com/p/%'
    OR media_url ILIKE '%youtube.com/watch%'
    OR media_url ILIKE '%youtu.be/%'
  )
  AND mux_playback_id IS NULL
  AND hls_url IS NULL;

-- ============================================================================
-- FIX 3: Unstick permanently stuck processing/pending rows
-- Any video stuck in pending/processing for more than 2 hours has failed —
-- if it has an original_url we mark it completed so it plays, otherwise hide it
-- ============================================================================

-- 3a: Has a playable URL → mark completed
UPDATE publications
SET processing_status = 'completed'
WHERE
  processing_status IN ('pending', 'processing')
  AND created_at < NOW() - INTERVAL '2 hours'
  AND deleted_at IS NULL
  AND (
    media_url IS NOT NULL
    OR original_url IS NOT NULL
    OR mux_playback_id IS NOT NULL
    OR hls_url IS NOT NULL
  );

-- 3b: No URL at all → hide
UPDATE publications
SET
  est_masque = true,
  processing_status = 'failed'
WHERE
  processing_status IN ('pending', 'processing')
  AND created_at < NOW() - INTERVAL '2 hours'
  AND deleted_at IS NULL
  AND media_url IS NULL
  AND original_url IS NULL
  AND mux_playback_id IS NULL
  AND hls_url IS NULL;

-- ============================================================================
-- FIX 4: Rebuild hls_url for Mux videos that have mux_playback_id but no hls_url
-- ============================================================================
UPDATE publications
SET hls_url = 'https://stream.mux.com/' || mux_playback_id || '.m3u8'
WHERE
  mux_playback_id IS NOT NULL
  AND (hls_url IS NULL OR hls_url = '')
  AND deleted_at IS NULL;

-- ============================================================================
-- FIX 5: Rebuild thumbnail_url for Mux videos with missing thumbnail
-- ============================================================================
UPDATE publications
SET thumbnail_url = 'https://image.mux.com/' || mux_playback_id || '/thumbnail.jpg'
WHERE
  mux_playback_id IS NOT NULL
  AND (thumbnail_url IS NULL OR thumbnail_url = '')
  AND deleted_at IS NULL;

-- ============================================================================
-- FIX 6: Rebuild media_url for Mux completed videos that have hls_url but no media_url
-- ============================================================================
UPDATE publications
SET media_url = hls_url
WHERE
  hls_url IS NOT NULL
  AND hls_url ILIKE '%stream.mux.com%'
  AND (media_url IS NULL OR media_url = '')
  AND deleted_at IS NULL;

-- ============================================================================
-- FIX 7: Ensure all visible completed videos have visibility = 'public'
-- (some older rows were inserted without the visibility field)
-- ============================================================================
UPDATE publications
SET visibility = 'public'
WHERE
  visibility IS NULL
  AND est_masque = false
  AND deleted_at IS NULL;

-- ============================================================================
-- FIX 8: For failed Pexels/GCS videos that have an original_url, restore them
-- ============================================================================
UPDATE publications
SET
  media_url = original_url,
  processing_status = 'completed'
WHERE
  processing_status = 'failed'
  AND original_url IS NOT NULL
  AND (media_url IS NULL OR media_url = '')
  AND deleted_at IS NULL;

-- ============================================================================
-- Summary verification query (run manually to check results):
-- SELECT
--   processing_status,
--   est_masque,
--   COUNT(*) as count,
--   COUNT(CASE WHEN media_url IS NOT NULL THEN 1 END) as has_url,
--   COUNT(CASE WHEN mux_playback_id IS NOT NULL THEN 1 END) as has_mux,
--   COUNT(CASE WHEN thumbnail_url IS NOT NULL THEN 1 END) as has_thumb
-- FROM publications
-- WHERE type = 'video' AND deleted_at IS NULL
-- GROUP BY processing_status, est_masque
-- ORDER BY processing_status, est_masque;
-- ============================================================================