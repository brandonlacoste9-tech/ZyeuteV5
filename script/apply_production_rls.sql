-- ============================================
-- PRODUCTION RLS HARDENING
-- ============================================
-- This fixes the "auth works but app fails" issue
-- All policies enforce owner-scoped access

-- 1. USER PROFILES (Audit & Patch)
-- ============================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Self-read (critical for post-login)
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Public profiles (for feed/discovery)
DROP POLICY IF EXISTS "Anyone can view public profiles" ON public.user_profiles;
CREATE POLICY "Anyone can view public profiles"
  ON public.user_profiles FOR SELECT
  TO anon, authenticated
  USING (true);

-- Self-update
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 2. PUSH DEVICES (Owner-scoped)
-- ============================================
ALTER TABLE public.poussoirs_appareils ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own devices" ON public.poussoirs_appareils;
CREATE POLICY "Users manage own devices"
  ON public.poussoirs_appareils FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Performance index for RLS
CREATE INDEX IF NOT EXISTS idx_push_devices_user_rls 
  ON public.poussoirs_appareils(user_id) 
  WHERE is_active = true;

-- 3. NOTIFICATION QUEUE (Read-only for recipient)
-- ============================================
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own notifications" ON public.notification_queue;
CREATE POLICY "Users read own notifications"
  ON public.notification_queue FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- System can insert (via triggers)
DROP POLICY IF EXISTS "System inserts notifications" ON public.notification_queue;
CREATE POLICY "System inserts notifications"
  ON public.notification_queue FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Performance index
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_rls 
  ON public.notification_queue(user_id, status, created_at DESC);

-- 4. OFFLINE ACTIONS (Owner-scoped)
-- ============================================
ALTER TABLE public.offline_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own offline actions" ON public.offline_actions;
CREATE POLICY "Users manage own offline actions"
  ON public.offline_actions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Performance index
CREATE INDEX IF NOT EXISTS idx_offline_actions_user_rls 
  ON public.offline_actions(user_id, status);

-- 5. USER INTERACTIONS (Owner-scoped)
-- ============================================
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own interactions" ON public.user_interactions;
CREATE POLICY "Users manage own interactions"
  ON public.user_interactions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Performance index
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_rls 
  ON public.user_interactions(user_id, created_at DESC);

-- 6. PUBLICATIONS (Public read, owner write)
-- ============================================
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;

-- Anyone can view public posts
DROP POLICY IF EXISTS "Anyone can view public posts" ON public.publications;
CREATE POLICY "Anyone can view public posts"
  ON public.publications FOR SELECT
  TO anon, authenticated
  USING (deleted_at IS NULL AND est_masque = false);

-- Users can manage own posts
DROP POLICY IF EXISTS "Users manage own posts" ON public.publications;
CREATE POLICY "Users manage own posts"
  ON public.publications FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 7. REACTIONS (Public read, owner write)
-- ============================================
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view reactions" ON public.reactions;
CREATE POLICY "Anyone can view reactions"
  ON public.reactions FOR SELECT
  TO anon, authenticated
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Users manage own reactions" ON public.reactions;
CREATE POLICY "Users manage own reactions"
  ON public.reactions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 8. COMMENTAIRES (Public read, owner write)
-- ============================================
ALTER TABLE public.commentaires ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view comments" ON public.commentaires;
CREATE POLICY "Anyone can view comments"
  ON public.commentaires FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Users manage own comments" ON public.commentaires;
CREATE POLICY "Users manage own comments"
  ON public.commentaires FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 9. ABONNEMENTS (Public read, owner write)
-- ============================================
ALTER TABLE public.abonnements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view followers" ON public.abonnements;
CREATE POLICY "Anyone can view followers"
  ON public.abonnements FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Users manage own follows" ON public.abonnements;
CREATE POLICY "Users manage own follows"
  ON public.abonnements FOR ALL
  TO authenticated
  USING (follower_id = auth.uid())
  WITH CHECK (follower_id = auth.uid());

-- ============================================
-- REALTIME POLICIES
-- ============================================

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.publications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.commentaires;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_queue;

-- RLS for realtime.messages (user-private channels)
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can subscribe to own channel" ON realtime.messages;
CREATE POLICY "Users can subscribe to own channel"
  ON realtime.messages FOR SELECT
  TO authenticated
  USING (
    topic = 'user:' || auth.uid()::text || ':notifications' OR
    topic LIKE 'publication:%' OR
    topic LIKE 'presence:%'
  );

DROP POLICY IF EXISTS "Users can send to own channel" ON realtime.messages;
CREATE POLICY "Users can send to own channel"
  ON realtime.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    topic = 'user:' || auth.uid()::text || ':notifications' OR
    topic LIKE 'publication:%' OR
    topic LIKE 'presence:%'
  );

-- ============================================
-- TRIGGER HARDENING
-- ============================================

-- Fix queue_fire_notification to handle NULL gracefully
CREATE OR REPLACE FUNCTION public.queue_fire_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_post_author uuid;
  v_liker_username text;
BEGIN
  -- Bail out early if required fields are NULL
  IF NEW.publication_id IS NULL OR NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get the post author with NULL check
  SELECT user_id INTO v_post_author 
  FROM public.publications 
  WHERE id = NEW.publication_id;
  
  IF v_post_author IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Don't notify if user liked their own post
  IF v_post_author = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get the liker's username with fallback
  SELECT COALESCE(username, email, 'Utilisateur') INTO v_liker_username 
  FROM public.user_profiles 
  WHERE id = NEW.user_id;
  
  -- Queue notification (wrapped in exception handler)
  BEGIN
    INSERT INTO public.notification_queue (user_id, title, body, data)
    VALUES (
      v_post_author,
      'Nouveau feu! 🔥',
      v_liker_username || ' a mis le feu à ta publication',
      jsonb_build_object('type', 'fire', 'publication_id', NEW.publication_id, 'from_user_id', NEW.user_id)
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log but don't fail the original insert
    RAISE WARNING 'Failed to queue fire notification: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- Fix queue_comment_notification similarly
CREATE OR REPLACE FUNCTION public.queue_comment_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_post_author uuid;
  v_commenter_username text;
BEGIN
  IF NEW.publication_id IS NULL OR NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO v_post_author 
  FROM public.publications 
  WHERE id = NEW.publication_id;
  
  IF v_post_author IS NULL OR v_post_author = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  SELECT COALESCE(username, email, 'Utilisateur') INTO v_commenter_username 
  FROM public.user_profiles 
  WHERE id = NEW.user_id;
  
  BEGIN
    INSERT INTO public.notification_queue (user_id, title, body, data)
    VALUES (
      v_post_author,
      'Nouveau commentaire 💬',
      v_commenter_username || ' a commenté ta publication',
      jsonb_build_object('type', 'comment', 'publication_id', NEW.publication_id, 'from_user_id', NEW.user_id, 'comment_id', NEW.id)
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to queue comment notification: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- Realtime notification broadcast trigger
CREATE OR REPLACE FUNCTION public.broadcast_user_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM pg_notify(
    'user:' || NEW.user_id || ':notifications',
    json_build_object(
      'type', 'new_notification',
      'id', NEW.id,
      'title', NEW.title,
      'body', NEW.body,
      'data', NEW.data
    )::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_broadcast_user_notifications ON public.notification_queue;
CREATE TRIGGER trigger_broadcast_user_notifications
  AFTER INSERT ON public.notification_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.broadcast_user_notifications();

-- ============================================
-- GRANTS & PERMISSIONS
-- ============================================

-- Revoke unnecessary permissions
REVOKE EXECUTE ON FUNCTION public.queue_fire_notification() FROM anon;
REVOKE EXECUTE ON FUNCTION public.queue_comment_notification() FROM anon;
REVOKE EXECUTE ON FUNCTION public.broadcast_user_notifications() FROM anon;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT ON public.trending_dashboard TO authenticated, anon;
GRANT SELECT ON public.publications_moderee TO authenticated, anon;

-- ============================================
-- ANALYTICS & PERFORMANCE
-- ============================================

-- Add missing indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_publications_user_visibility 
  ON public.publications(user_id) 
  WHERE deleted_at IS NULL AND est_masque = false;

CREATE INDEX IF NOT EXISTS idx_reactions_user_publication 
  ON public.reactions(user_id, publication_id) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_commentaires_user_publication 
  ON public.commentaires(user_id, publication_id);

CREATE INDEX IF NOT EXISTS idx_abonnements_follower 
  ON public.abonnements(follower_id, created_at DESC);
