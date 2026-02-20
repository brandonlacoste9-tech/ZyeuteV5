-- EMERGENCY FEED POPULATION - Run this in Railway Dashboard
-- Railway Dashboard → PostgreSQL → Query tab

-- Step 1: Check if publications table has data
SELECT COUNT(*) as total_posts FROM publications;

-- Step 2: If 0 posts, run this to create sample posts with videos
-- Make sure you have at least 1 user first:
SELECT id, username FROM user_profiles LIMIT 5;

-- Step 3: Insert sample video posts with working video URLs
-- Using Pexels public domain videos that don't need proxy
INSERT INTO publications (
    id,
    user_id,
    content,
    caption,
    media_url,
    type,
    visibility,
    hive_id,
    region_id,
    city,
    reactions_count,
    comments_count,
    est_masque,
    deleted_at,
    created_at,
    processing_status
) 
SELECT 
    gen_random_uuid(),
    id as user_id,
    '🎬 Vidéo sample - Welcome to Zyeuté!',
    '🎬 Vidéo sample - Welcome to Zyeuté! #Quebec #Video',
    'https://videos.pexels.com/video-files/857251/857251-hd_1920_1080_25fps.mp4',
    'video',
    'public',
    'quebec',
    'montreal',
    'Montréal',
    42,
    5,
    false,
    NULL,
    NOW() - INTERVAL '1 hour',
    'completed'
FROM user_profiles 
ORDER BY created_at 
LIMIT 1
ON CONFLICT DO NOTHING;

-- Step 4: Add a photo post too
INSERT INTO publications (
    id,
    user_id,
    content,
    caption,
    media_url,
    type,
    visibility,
    hive_id,
    region_id,
    city,
    reactions_count,
    comments_count,
    est_masque,
    deleted_at,
    created_at
) 
SELECT 
    gen_random_uuid(),
    id as user_id,
    '📸 Photo de Montréal - Belle ville!',
    '📸 Photo de Montréal - Belle ville! #Montreal #Quebec',
    'https://images.unsplash.com/photo-1519178555425-500997dd1a36?w=800',
    'photo',
    'public',
    'quebec',
    'montreal',
    'Montréal',
    23,
    3,
    false,
    NULL,
    NOW() - INTERVAL '2 hours'
FROM user_profiles 
ORDER BY created_at 
LIMIT 1
ON CONFLICT DO NOTHING;

-- Step 5: Verify posts were created
SELECT 
    id, 
    type, 
    caption, 
    hive_id, 
    visibility, 
    est_masque,
    created_at
FROM publications 
ORDER BY created_at DESC 
LIMIT 10;
