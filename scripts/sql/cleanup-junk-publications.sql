-- One-shot cleanup in Supabase SQL Editor (review before running).
-- Removes the same junk categories as scripts/cleanup-junk-publications.ts

-- 1) Stuck / failed processing
DELETE FROM publications
WHERE processing_status IN ('pending', 'failed');

-- 2) Diagnostic / inject strings
DELETE FROM publications
WHERE caption ILIKE '%DIAGNOSTIC%'
   OR content ILIKE '%DIAGNOSTIC%';

-- 3) Video rows with no usable URL (adjust if your column names differ)
DELETE FROM publications
WHERE type = 'video'
  AND (mux_playback_id IS NULL OR btrim(mux_playback_id) = '')
  AND (hls_url IS NULL OR btrim(hls_url) = '' OR hls_url !~* '^https?://')
  AND (media_url IS NULL OR btrim(media_url) = '' OR media_url !~* '^https?://');
