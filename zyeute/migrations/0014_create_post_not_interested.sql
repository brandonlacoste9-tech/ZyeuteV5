-- Create post_not_interested table for feed skip functionality
-- This table tracks posts that users have marked as "not interested"

CREATE TABLE IF NOT EXISTS post_not_interested (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, post_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_post_not_interested_user_id ON post_not_interested(user_id);
CREATE INDEX IF NOT EXISTS idx_post_not_interested_post_id ON post_not_interested(post_id);

-- Enable RLS
ALTER TABLE post_not_interested ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own not-interested records
CREATE POLICY "Users can view their own not interested" ON post_not_interested
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own not-interested records
CREATE POLICY "Users can insert their own not interested" ON post_not_interested
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
