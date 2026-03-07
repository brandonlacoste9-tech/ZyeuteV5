-- First, check what columns exist in publications table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'publications' 
ORDER BY ordinal_position;

-- Then use this INSERT with the correct column names
-- (Run this after checking the columns above)

INSERT INTO publications (
  user_id,
  type,
  media_url,
  tiktok_url,
  video_source,
  caption,
  reactions_count,
  comments_count,
  processing_status
) VALUES (
  (SELECT id FROM users LIMIT 1),
  'video',
  'https://www.tiktok.com/@zachking/video/7331395896989019434',
  'https://www.tiktok.com/@zachking/video/7331395896989019434',
  'tiktok',
  'Test TikTok video embed! 🎵 Magic trick by @zachking',
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
