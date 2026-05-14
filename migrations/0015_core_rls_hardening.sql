-- Migration: Core RLS Hardening
-- Description: Enables RLS on all core social tables and defines baseline security policies.

-- 1. USER PROFILES
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_public_read" ON public.user_profiles;
CREATE POLICY "profiles_public_read" ON public.user_profiles
FOR SELECT TO authenticated, anon
USING (true);

DROP POLICY IF EXISTS "profiles_self_update" ON public.user_profiles;
CREATE POLICY "profiles_self_update" ON public.user_profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 2. POSTS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_public_read" ON public.posts;
CREATE POLICY "posts_public_read" ON public.posts
FOR SELECT TO authenticated, anon
USING (visibility = 'public' AND is_hidden = false);

DROP POLICY IF EXISTS "posts_self_manage" ON public.posts;
CREATE POLICY "posts_self_manage" ON public.posts
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3. COMMENTS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_read" ON public.comments;
CREATE POLICY "comments_read" ON public.comments
FOR SELECT TO authenticated, anon
USING (true);

DROP POLICY IF EXISTS "comments_self_manage" ON public.comments;
CREATE POLICY "comments_self_manage" ON public.comments
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 4. FOLLOWS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "follows_read" ON public.follows;
CREATE POLICY "follows_read" ON public.follows
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "follows_self_manage" ON public.follows;
CREATE POLICY "follows_self_manage" ON public.follows
FOR ALL TO authenticated
USING (follower_id = auth.uid())
WITH CHECK (follower_id = auth.uid());

-- 5. STORIES
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stories_read" ON public.stories;
CREATE POLICY "stories_read" ON public.stories
FOR SELECT TO authenticated, anon
USING (expires_at > now());

DROP POLICY IF EXISTS "stories_self_manage" ON public.stories;
CREATE POLICY "stories_self_manage" ON public.stories
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 6. NOTIFICATIONS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_self_read" ON public.notifications;
CREATE POLICY "notifications_self_read" ON public.notifications
FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_self_update" ON public.notifications;
CREATE POLICY "notifications_self_update" ON public.notifications
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 7. REACTION TABLES
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_reactions_read" ON public.post_reactions;
CREATE POLICY "post_reactions_read" ON public.post_reactions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "post_reactions_self_manage" ON public.post_reactions;
CREATE POLICY "post_reactions_self_manage" ON public.post_reactions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "comment_reactions_read" ON public.comment_reactions;
CREATE POLICY "comment_reactions_read" ON public.comment_reactions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "comment_reactions_self_manage" ON public.comment_reactions;
CREATE POLICY "comment_reactions_self_manage" ON public.comment_reactions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
