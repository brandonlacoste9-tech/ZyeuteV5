-- Add hls_url column for HLS manifest (adaptive bitrate streaming)
ALTER TABLE publications ADD COLUMN IF NOT EXISTS hls_url text;
