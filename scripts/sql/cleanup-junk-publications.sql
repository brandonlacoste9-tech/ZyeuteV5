-- One-shot cleanup in Supabase SQL Editor (review counts with SELECT first).
-- Overlaps scripts/cleanup-junk-publications.ts — prefer the TS script for FAL / “unplayable” parity with the app.

-- 1) Stuck / failed / long-abandoned processing
DELETE FROM publications
WHERE processing_status IN ('pending', 'failed')
   OR (processing_status = 'processing' AND created_at < now() - interval '48 hours');

-- 2) Diagnostic / test / placeholder captions
DELETE FROM publications
WHERE caption ILIKE '%DIAGNOSTIC%'
   OR content ILIKE '%DIAGNOSTIC%'
   OR caption ILIKE '%TEST VIDEO%'
   OR content ILIKE '%TEST VIDEO%'
   OR caption ILIKE '%VIDEO TEST%'
   OR content ILIKE '%VIDEO TEST%'
   OR caption ILIKE '%PLACEHOLDER%'
   OR content ILIKE '%PLACEHOLDER%'
   OR caption ILIKE '%DUMMY VIDEO%'
   OR caption ILIKE '%SEED CONTENT%';

-- 3) Expired FAL CDN URLs (temporary; black players when expired)
DELETE FROM publications
WHERE media_url ILIKE '%fal.media%'
   OR media_url ILIKE '%.fal.run%'
   OR hls_url ILIKE '%fal.media%'
   OR hls_url ILIKE '%.fal.run%';

-- 4) Video rows with no usable URL (no Mux id, no valid https media/hls)
DELETE FROM publications
WHERE type = 'video'
  AND (mux_playback_id IS NULL OR btrim(mux_playback_id) = '')
  AND (
    hls_url IS NULL
    OR btrim(hls_url) = ''
    OR hls_url !~* '^https?://'
    OR hls_url ILIKE '%fal.media%'
    OR hls_url ILIKE '%.fal.run%'
  )
  AND (
    media_url IS NULL
    OR btrim(media_url) = ''
    OR media_url !~* '^https?://'
    OR media_url ILIKE '%fal.media%'
    OR media_url ILIKE '%.fal.run%'
  );
