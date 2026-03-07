# Apply TikTok Migration via Supabase Dashboard

Since you don't have a local DATABASE_URL configured, the easiest way is to run the migration directly in Supabase:

## Steps:

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/vuanulvyqkfefmjcikfk
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"
4. Copy and paste the SQL below
5. Click "Run" or press Ctrl+Enter

## SQL to run:

```sql
-- Add TikTok URL support to publications table
-- Migration: 20260307_add_tiktok_support

-- Add tiktok_url column to store TikTok video URLs
ALTER TABLE publications
ADD COLUMN IF NOT EXISTS tiktok_url TEXT;

-- Add youtube_url column for future YouTube support
ALTER TABLE publications
ADD COLUMN IF NOT EXISTS youtube_url TEXT;

-- Add video_source column to track where the video comes from
ALTER TABLE publications
ADD COLUMN IF NOT EXISTS video_source TEXT CHECK (video_source IN ('mux', 'tiktok', 'youtube', 'pexels', 'direct', 'hls'));

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_publications_tiktok_url ON publications(tiktok_url) WHERE tiktok_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_publications_youtube_url ON publications(youtube_url) WHERE youtube_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_publications_video_source ON publications(video_source);

-- Add comment
COMMENT ON COLUMN publications.tiktok_url IS 'TikTok video URL for embedded playback';
COMMENT ON COLUMN publications.youtube_url IS 'YouTube video URL for embedded playback';
COMMENT ON COLUMN publications.video_source IS 'Source of the video: mux, tiktok, youtube, pexels, direct, hls';
```

## Verify it worked:

After running the migration, run this query to verify the columns were added:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'publications'
AND column_name IN ('tiktok_url', 'youtube_url', 'video_source')
ORDER BY column_name;
```

You should see 3 rows returned showing the new columns.

## Next: Add a test TikTok video

After the migration succeeds, you can add a test TikTok video with this SQL:

```sql
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
  max_views
) VALUES (
  (SELECT id FROM users LIMIT 1), -- Uses first user in your database
  'video',
  'https://www.tiktok.com/@username/video/1234567890', -- Placeholder
  'https://www.tiktok.com/@username/video/1234567890', -- Replace with real TikTok URL
  'tiktok',
  'Test TikTok video embed! 🎵',
  0,
  0,
  false,
  0,
  0
);
```

Replace the TikTok URL with a real one like:

- https://www.tiktok.com/@zachking/video/7331395896989019434
- https://www.tiktok.com/@khaby.lame/video/7137199618989198597

Then refresh your app and you should see the TikTok video embedded!
