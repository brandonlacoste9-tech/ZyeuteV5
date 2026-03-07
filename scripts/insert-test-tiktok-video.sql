-- Insert Test TikTok Video into Publications
-- This script will automatically use an existing user from auth.users

-- First, let's check if we have any users
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Try to get an existing user from auth.users
  SELECT id INTO test_user_id
  FROM auth.users
  LIMIT 1;

  -- If we found a user, insert the test TikTok video
  IF test_user_id IS NOT NULL THEN
    INSERT INTO publications (
      user_id,
      type,
      content,
      media_url,
      tiktok_url,
      video_source,
      caption,
      processing_status,
      reactions_count,
      comments_count
    ) VALUES (
      test_user_id,
      'video',
      'Test TikTok video embed! 🎵 Magic trick by @zachking',
      'https://www.tiktok.com/@zachking/video/7331395896989019434',
      'https://www.tiktok.com/@zachking/video/7331395896989019434',
      'tiktok',
      'Test TikTok video embed! 🎵 Magic trick by @zachking',
      'completed',
      0,
      0
    );
    
    RAISE NOTICE 'Successfully inserted test TikTok video for user: %', test_user_id;
  ELSE
    RAISE EXCEPTION 'No users found in auth.users table. Please create a user first through Authentication.';
  END IF;
END $$;

-- Verify the insert
SELECT 
  id,
  user_id,
  type,
  tiktok_url,
  video_source,
  caption,
  processing_status,
  created_at
FROM publications
WHERE video_source = 'tiktok'
ORDER BY created_at DESC
LIMIT 5;
