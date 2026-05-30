-- MIGRATION: 20260321_indexed_search.sql
-- OBJECTIVE: Optimize search performance for users, publications, and sounds using GIN indexes.

-- Enable pg_trgm extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Optimize User Search
-- Add GIN index for username and display_name
CREATE INDEX IF NOT EXISTS idx_user_profiles_username_trgm ON user_profiles USING GIN (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name_trgm ON user_profiles USING GIN (display_name gin_trgm_ops);

-- 2. Optimize Publication (Post) Search
-- Add GIN index for caption and content
CREATE INDEX IF NOT EXISTS idx_publications_caption_trgm ON publications USING GIN (caption gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_publications_content_trgm ON publications USING GIN (content gin_trgm_ops);

-- 3. Optimize Sound Search
-- Add GIN index for title and artist
CREATE INDEX IF NOT EXISTS idx_sounds_title_trgm ON sounds USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_sounds_artist_trgm ON sounds USING GIN (artist gin_trgm_ops);

-- 4. Verification Query (Run this to check index usage)
-- EXPLAIN ANALYZE SELECT * FROM user_profiles WHERE username ILIKE '%test%';
