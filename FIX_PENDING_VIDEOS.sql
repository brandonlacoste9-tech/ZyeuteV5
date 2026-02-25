-- =====================================================
-- 🎬 VIDEO DOCTOR - Fix All Pending Videos
-- Run this in Supabase Dashboard SQL Editor
-- URL: https://app.supabase.com/project/vuanulvyqkfefmjcikfk/sql
-- =====================================================

-- Step 1: Check current status
SELECT 
    processing_status,
    COUNT(*) as count
FROM publications 
WHERE type = 'video'
GROUP BY processing_status
ORDER BY processing_status;

-- Step 2: Preview what will be fixed
SELECT 
    id,
    caption,
    processing_status,
    media_url,
    created_at
FROM publications 
WHERE type = 'video' 
  AND processing_status = 'pending'
ORDER BY created_at DESC
LIMIT 10;

-- Step 3: FIX - Mark all pending videos as completed
UPDATE publications 
SET processing_status = 'completed' 
WHERE type = 'video' 
  AND processing_status = 'pending';

-- Step 4: Verify the fix
SELECT 
    processing_status,
    COUNT(*) as count
FROM publications 
WHERE type = 'video'
GROUP BY processing_status
ORDER BY processing_status;

-- Step 5: Check for videos without thumbnails
SELECT 
    id,
    caption,
    media_url,
    thumbnail_url
FROM publications 
WHERE type = 'video' 
  AND (thumbnail_url IS NULL OR thumbnail_url = '') 
  AND processing_status = 'completed'
ORDER BY created_at DESC
LIMIT 10;
