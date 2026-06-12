-- Migration: 0033_fix_publications_rls_recursion.sql
-- Date: 2026-06-12
--
-- PROBLEM
--   Authenticated PATCH on `publications` via PostgREST fails with Postgres
--   error 42P17: "infinite recursion detected in policy for relation
--   publications". A policy on `publications` (created out-of-band in prod and
--   NOT reflected by 0032_french_tables_rls.sql, which may never have been
--   applied there) evaluates a subquery against `publications` itself — directly
--   or transitively through a join to a table whose own policy joins back to
--   `publications`. Postgres re-enters the same policy while evaluating it and
--   aborts.
--
-- FIX
--   1. Drop EVERY policy currently on `public.publications` (dynamically, so we
--      catch out-of-band names we can't predict), then recreate a clean minimal
--      set that references ONLY auth.uid() and direct columns — no subqueries
--      against publications, so no recursion is possible.
--   2. The one place a privilege check is genuinely needed (admins/moderators
--      updating any row) is handled by a SECURITY DEFINER helper,
--      public.is_platform_admin(). Because it is SECURITY DEFINER and reads
--      user_profiles with RLS bypassed inside the function body, it cannot form
--      a policy cycle.
--
-- IDEMPOTENT: drops are guarded with IF EXISTS / dynamic enumeration, and the
-- function is CREATE OR REPLACE. Safe to run repeatedly.
--
-- Physical column notes (from shared/schema.ts):
--   publications.is_hidden -> column "est_masque"
--   user_profiles role     -> column "role" (text); legacy flag "is_admin" (bool)

-- ─── 1. SECURITY DEFINER admin helper ───────────────────────────────────────
-- Runs with the definer's privileges and bypasses RLS for its own reads, so the
-- lookup against user_profiles can never trigger a publications-policy cycle.
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.id = auth.uid()
      AND (up.role IN ('admin', 'moderator', 'founder') OR up.is_admin = true)
  );
$$;

REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated, anon;

-- ─── 2. Drop ALL existing policies on publications, then recreate clean ones ──
DO $$
DECLARE
  pol record;
BEGIN
  IF to_regclass('public.publications') IS NULL THEN
    RAISE NOTICE 'publications table not found — skipping';
    RETURN;
  END IF;

  ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;

  -- Drop every policy currently attached to publications. This clears the
  -- unknown recursive policy regardless of its name.
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'publications'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.publications;', pol.policyname
    );
  END LOOP;

  -- Public read: anyone may read visible, non-hidden, non-deleted rows.
  -- Direct column comparisons only — no subquery, no recursion.
  CREATE POLICY "publications_public_read" ON public.publications
    FOR SELECT TO authenticated, anon
    USING (visibility = 'public' AND est_masque = false AND deleted_at IS NULL);

  -- Owners can read all of their own rows (drafts, hidden, etc.).
  CREATE POLICY "publications_owner_read" ON public.publications
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

  -- Insert: only as yourself.
  CREATE POLICY "publications_owner_insert" ON public.publications
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

  -- Update: owner OR platform admin (admin/moderator). The admin check goes
  -- through the SECURITY DEFINER helper so it cannot recurse.
  CREATE POLICY "publications_owner_update" ON public.publications
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid() OR public.is_platform_admin())
    WITH CHECK (user_id = auth.uid() OR public.is_platform_admin());

  -- Delete: owner OR platform admin.
  CREATE POLICY "publications_owner_delete" ON public.publications
    FOR DELETE TO authenticated
    USING (user_id = auth.uid() OR public.is_platform_admin());
END $$;

-- ─── 3. Verification (run manually after applying) ──────────────────────────
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'publications'
-- ORDER BY policyname;
