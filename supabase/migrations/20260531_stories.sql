CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  caption TEXT,
  duration INTEGER DEFAULT 5, -- seconds to display
  views INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);

-- RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Anyone can view non-expired stories
CREATE POLICY "Anyone can view active stories"
  ON stories FOR SELECT
  USING (expires_at > NOW());

-- Authenticated users can create stories
CREATE POLICY "Authenticated users can create stories"
  ON stories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own stories
CREATE POLICY "Users can delete own stories"
  ON stories FOR DELETE
  USING (auth.uid() = user_id);

-- Service role full access
CREATE POLICY "Service role full access stories"
  ON stories FOR ALL TO service_role USING (true) WITH CHECK (true);

-- story_views table for tracking who viewed what
CREATE TABLE IF NOT EXISTS story_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, viewer_id)
);

ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access story_views" ON story_views FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can insert own views" ON story_views FOR INSERT TO authenticated WITH CHECK (auth.uid() = viewer_id);
CREATE POLICY "Users can read views of own stories" ON story_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM stories s WHERE s.id = story_id AND s.user_id = auth.uid())
  OR auth.uid() = viewer_id
);
