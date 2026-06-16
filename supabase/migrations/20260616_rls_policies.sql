-- Enable Row Level Security (RLS) on core tables
ALTER TABLE IF EXISTS user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS commentaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reactions ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- User Profiles Policies
-- --------------------------------------------------------
-- 1. Anyone can read profiles
CREATE POLICY "Public profiles are viewable by everyone" 
ON user_profiles FOR SELECT USING (true);

-- 2. Users can only update their own profile
CREATE POLICY "Users can update own profile" 
ON user_profiles FOR UPDATE USING (auth.uid() = id);


-- --------------------------------------------------------
-- Publications (Posts) Policies
-- --------------------------------------------------------
-- 1. Anyone can read public/unhidden posts
CREATE POLICY "Public publications are viewable by everyone" 
ON publications FOR SELECT USING (is_hidden = false OR auth.uid() = user_id);

-- 2. Users can insert their own posts
CREATE POLICY "Users can insert own publications" 
ON publications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own posts
CREATE POLICY "Users can update own publications" 
ON publications FOR UPDATE USING (auth.uid() = user_id);

-- 4. Users can delete their own posts
CREATE POLICY "Users can delete own publications" 
ON publications FOR DELETE USING (auth.uid() = user_id);


-- --------------------------------------------------------
-- Commentaires (Comments) Policies
-- --------------------------------------------------------
-- 1. Anyone can read comments
CREATE POLICY "Comments are viewable by everyone" 
ON commentaires FOR SELECT USING (true);

-- 2. Users can insert their own comments
CREATE POLICY "Users can insert own comments" 
ON commentaires FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own comments
CREATE POLICY "Users can update own comments" 
ON commentaires FOR UPDATE USING (auth.uid() = user_id);

-- 4. Users can delete their own comments
CREATE POLICY "Users can delete own comments" 
ON commentaires FOR DELETE USING (auth.uid() = user_id);


-- --------------------------------------------------------
-- Reactions (Fires) Policies
-- --------------------------------------------------------
-- 1. Anyone can read reactions
CREATE POLICY "Reactions are viewable by everyone" 
ON reactions FOR SELECT USING (true);

-- 2. Users can insert their own reactions
CREATE POLICY "Users can insert own reactions" 
ON reactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Users can delete their own reactions
CREATE POLICY "Users can delete own reactions" 
ON reactions FOR DELETE USING (auth.uid() = user_id);
