-- Migration: Add GIN indexes for AI-powered discovery queries
-- Purpose: Optimize JSONB queries on ai_labels and media_metadata for tag/vibe filtering
-- Date: 2025-01-XX

-- GIN index for AI labels JSONB array queries (?| operator)
-- This index enables fast lookups when checking if any tags in an array match
CREATE INDEX IF NOT EXISTS idx_posts_ai_labels_gin 
ON posts USING GIN (ai_labels);

-- GIN index for media_metadata JSONB queries (vibe_category extraction)
-- This index enables fast extraction and filtering of nested JSONB fields
CREATE INDEX IF NOT EXISTS idx_posts_media_metadata_gin 
ON posts USING GIN (media_metadata);

-- Composite partial index for common discovery query pattern
-- Filters: processing_status='completed' AND hive_id AND ai_labels IS NOT NULL
-- This index is optimized for the most common discovery query pattern
CREATE INDEX IF NOT EXISTS idx_posts_discovery_composite 
ON posts (processing_status, hive_id) 
WHERE processing_status = 'completed' AND ai_labels IS NOT NULL;

-- Expression index for vibe category queries (extracted from JSONB)
-- This allows fast filtering by vibe_category without full JSONB scan
CREATE INDEX IF NOT EXISTS idx_posts_vibe_category 
ON posts ((media_metadata->>'vibe_category')) 
WHERE media_metadata->>'vibe_category' IS NOT NULL;

-- Index for processing_status filtering (if not already exists)
-- Helps with filtering completed videos in discovery queries
CREATE INDEX IF NOT EXISTS idx_posts_processing_status 
ON posts (processing_status) 
WHERE processing_status IN ('completed', 'processing', 'pending');

-- Comments for documentation
COMMENT ON INDEX idx_posts_ai_labels_gin IS 'GIN index for AI-generated tags array queries (?| operator)';
COMMENT ON INDEX idx_posts_media_metadata_gin IS 'GIN index for media metadata JSONB queries (vibe, objects, etc.)';
COMMENT ON INDEX idx_posts_discovery_composite IS 'Composite partial index for discovery feed queries (completed videos with AI tags)';
COMMENT ON INDEX idx_posts_vibe_category IS 'Expression index for vibe category filtering from media_metadata JSONB';
