-- Per-user hidden posts ("not interested") — hide from viewer's Pour toi without global delete.
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS public.user_hidden_posts (
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
  reason text NOT NULL DEFAULT 'not_interested',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS user_hidden_posts_user_id_idx
  ON user_hidden_posts (user_id);

ALTER TABLE public.user_hidden_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_hidden_posts_select_own" ON public.user_hidden_posts;
CREATE POLICY "user_hidden_posts_select_own" ON public.user_hidden_posts
FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_hidden_posts_insert_own" ON public.user_hidden_posts;
CREATE POLICY "user_hidden_posts_insert_own" ON public.user_hidden_posts
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_hidden_posts_update_own" ON public.user_hidden_posts;
CREATE POLICY "user_hidden_posts_update_own" ON public.user_hidden_posts
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_hidden_posts_delete_own" ON public.user_hidden_posts;
CREATE POLICY "user_hidden_posts_delete_own" ON public.user_hidden_posts
FOR DELETE TO authenticated
USING (user_id = auth.uid());
