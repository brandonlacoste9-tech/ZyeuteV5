-- Migration: Add Missing Indexes for Performance Optimization
-- Created: 2025-12-28
-- Purpose: Add indexes on frequently queried columns (created_at, user_id) for better query performance

-- Add index on comments.created_at for chronological sorting
CREATE INDEX IF NOT EXISTS "comments_created_at_idx" ON "comments" USING btree ("created_at");

-- Add index on notifications.created_at for chronological sorting
CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications" USING btree ("created_at");

-- Add index on notifications.user_id for user-specific notification queries
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications" USING btree ("user_id");

-- Add index on stories.created_at for chronological sorting
CREATE INDEX IF NOT EXISTS "stories_created_at_idx" ON "stories" USING btree ("created_at");

-- Add index on stories.user_id for user-specific story queries
CREATE INDEX IF NOT EXISTS "stories_user_id_idx" ON "stories" USING btree ("user_id");

-- Add index on user_profiles.created_at for user registration analytics
CREATE INDEX IF NOT EXISTS "user_profiles_created_at_idx" ON "user_profiles" USING btree ("created_at");

-- Add composite index on comments for user-specific chronological queries
CREATE INDEX IF NOT EXISTS "comments_user_created_idx" ON "comments" USING btree ("user_id", "created_at");

-- Add composite index on notifications for efficient user notification queries
CREATE INDEX IF NOT EXISTS "notifications_user_created_idx" ON "notifications" USING btree ("user_id", "created_at");

-- TODO: Review RLS policies for comments table
-- Ensure users can only read comments on posts they have access to
-- Consider adding policy: comments_read_policy

-- TODO: Review RLS policies for notifications table
-- Ensure users can only read their own notifications
-- Consider adding policy: notifications_self_read

-- TODO: Review RLS policies for stories table
-- Ensure users can only read public stories or stories from users they follow
-- Consider adding policy: stories_visibility_policy

-- Note: video_id is not present in current schema
-- The posts table uses 'type' field to distinguish between 'photo' and 'video'
-- If a separate videos table is added in the future, similar indexes should be added
