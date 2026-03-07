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
