-- Migration: Add missing remix_type column to publications table
-- Date: 2026-02-06
-- Issue: Column publications.remix_type does not exist, causing 500 errors

-- Add remix_type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'publications'
        AND column_name = 'remix_type'
    ) THEN
        ALTER TABLE publications
        ADD COLUMN remix_type VARCHAR(20);

        RAISE NOTICE 'Added remix_type column to publications table';
    ELSE
        RAISE NOTICE 'remix_type column already exists, skipping';
    END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_publications_remix_type
ON publications(remix_type)
WHERE remix_type IS NOT NULL;

COMMENT ON COLUMN publications.remix_type IS 'TikTok-style remix type: duet, stitch, react, or null';
