-- Migration: Add complete TikTok-style features to publications table
-- Date: 2026-02-06
-- Missing columns: original_post_id, remix_count, sound_id, sound_start_time

-- Add original_post_id column for tracking remixes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'publications'
        AND column_name = 'original_post_id'
    ) THEN
        ALTER TABLE publications
        ADD COLUMN original_post_id UUID REFERENCES publications(id) ON DELETE SET NULL;

        RAISE NOTICE 'Added original_post_id column to publications table';
    ELSE
        RAISE NOTICE 'original_post_id column already exists, skipping';
    END IF;
END $$;

-- Add remix_count column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'publications'
        AND column_name = 'remix_count'
    ) THEN
        ALTER TABLE publications
        ADD COLUMN remix_count INTEGER DEFAULT 0 NOT NULL;

        RAISE NOTICE 'Added remix_count column to publications table';
    ELSE
        RAISE NOTICE 'remix_count column already exists, skipping';
    END IF;
END $$;

-- Add sound_id column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'publications'
        AND column_name = 'sound_id'
    ) THEN
        ALTER TABLE publications
        ADD COLUMN sound_id TEXT;

        RAISE NOTICE 'Added sound_id column to publications table';
    ELSE
        RAISE NOTICE 'sound_id column already exists, skipping';
    END IF;
END $$;

-- Add sound_start_time column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'publications'
        AND column_name = 'sound_start_time'
    ) THEN
        ALTER TABLE publications
        ADD COLUMN sound_start_time DOUBLE PRECISION;

        RAISE NOTICE 'Added sound_start_time column to publications table';
    ELSE
        RAISE NOTICE 'sound_start_time column already exists, skipping';
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_publications_original_post_id
ON publications(original_post_id)
WHERE original_post_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_publications_sound_id
ON publications(sound_id)
WHERE sound_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN publications.original_post_id IS 'Reference to original post for remixes (duet/stitch)';
COMMENT ON COLUMN publications.remix_count IS 'Number of times this post has been remixed';
COMMENT ON COLUMN publications.sound_id IS 'ID of the audio track used in this video';
COMMENT ON COLUMN publications.sound_start_time IS 'Start time (in seconds) for the audio track';
