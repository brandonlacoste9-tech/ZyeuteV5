-- Add a test TikTok video to your publications table
-- Run this in Supabase SQL Editor to test TikTok embed

-- First, let's see if you have any users
-- SELECT id, username FROM users LIMIT 5;

-- Add a test TikTok video (replace the user_id with a real one from your database)
INSERT INTO publications (
  user_id,
  type,
  media_url,
  tiktok_url,
  video_source,
  caption,
  fire_count,
  comment_count,
  is_ephemeral,
  view_count,
  max_views,
  processing_status
) VALUES (
  (SELECT id FROM users LIMIT 1), -- Uses first user in your database
  'video',
  'https://www.tiktok.com/@zachking/video/7331395896989019434', -- Placeholder for media_url
  'https://www.tiktok.com/@zachking/video/7331395896989019434', -- Real TikTok URL
  'tiktok',
  'Test TikTok video embed! 🎵 Magic trick by @zachking',
  0,
  0,
  false,
  0,
  0,
  'completed'
);

-- Verify it was added
SELECT id, type, tiktok_url, video_source, caption, created_at 
FROM publications 
WHERE tiktok_url IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 1;
