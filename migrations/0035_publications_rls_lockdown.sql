-- 1) Ensure RLS is enabled
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;

-- 2) Drop ALL SELECT policies on publications (public schema)
DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'publications'
      AND cmd        = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.publications', p.policyname);
  END LOOP;
END $$;

-- 3) Re-create the single strict policy
CREATE POLICY "publications_feed_safe_select"
ON public.publications
FOR SELECT
TO anon, authenticated
USING (
  est_masque = false
  AND deleted_at IS NULL
  AND (
    visibility = 'public'
    OR user_id = auth.uid()
    OR (
      visibility = 'amis'
      AND EXISTS (
        SELECT 1
        FROM public.abonnements a
        WHERE a.follower_id = auth.uid()
          AND a.followee_id = publications.user_id
      )
    )
  )
);
