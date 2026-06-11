-- Migration: RLS hardening on the ACTUAL French production tables
-- Description: 0015_core_rls_hardening targeted English table names (posts/comments/
--   follows/post_reactions) that were created by the base migration but are NOT the
--   tables the live app queries. The app uses the French physical names defined in
--   shared/schema.ts: publications, commentaires, reactions, abonnements, gifts.
--   Those were created out-of-band (drizzle-kit push / manual SQL) and had RLS
--   disabled (Postgres default = anon key can read/write every row).
--
--   This migration enables RLS + owner-scoped policies on the French tables.
--   Every statement is guarded so it is safe to run regardless of which tables
--   exist in a given environment, and re-runnable (DROP POLICY IF EXISTS first).
--
-- Physical column notes (from shared/schema.ts):
--   publications.is_hidden  -> column "est_masque"
--   abonnements.following_id -> column "followee_id"

-- ─── 1. PUBLICATIONS (posts) ────────────────────────────────────────────────
DO $$
BEGIN
  IF to_regclass('public.publications') IS NOT NULL THEN
    ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "publications_public_read" ON public.publications;
    CREATE POLICY "publications_public_read" ON public.publications
      FOR SELECT TO authenticated, anon
      USING (visibility = 'public' AND est_masque = false AND deleted_at IS NULL);

    DROP POLICY IF EXISTS "publications_owner_insert" ON public.publications;
    CREATE POLICY "publications_owner_insert" ON public.publications
      FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "publications_owner_update" ON public.publications;
    CREATE POLICY "publications_owner_update" ON public.publications
      FOR UPDATE TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "publications_owner_delete" ON public.publications;
    CREATE POLICY "publications_owner_delete" ON public.publications
      FOR DELETE TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ─── 2. COMMENTAIRES (comments) ─────────────────────────────────────────────
DO $$
BEGIN
  IF to_regclass('public.commentaires') IS NOT NULL THEN
    ALTER TABLE public.commentaires ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "commentaires_read" ON public.commentaires;
    CREATE POLICY "commentaires_read" ON public.commentaires
      FOR SELECT TO authenticated
      USING (true);

    DROP POLICY IF EXISTS "commentaires_owner_insert" ON public.commentaires;
    CREATE POLICY "commentaires_owner_insert" ON public.commentaires
      FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "commentaires_owner_update" ON public.commentaires;
    CREATE POLICY "commentaires_owner_update" ON public.commentaires
      FOR UPDATE TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "commentaires_owner_delete" ON public.commentaires;
    CREATE POLICY "commentaires_owner_delete" ON public.commentaires
      FOR DELETE TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ─── 3. REACTIONS (postReactions) ───────────────────────────────────────────
DO $$
BEGIN
  IF to_regclass('public.reactions') IS NOT NULL THEN
    ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "reactions_read" ON public.reactions;
    CREATE POLICY "reactions_read" ON public.reactions
      FOR SELECT TO authenticated
      USING (true);

    DROP POLICY IF EXISTS "reactions_owner_insert" ON public.reactions;
    CREATE POLICY "reactions_owner_insert" ON public.reactions
      FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "reactions_owner_update" ON public.reactions;
    CREATE POLICY "reactions_owner_update" ON public.reactions
      FOR UPDATE TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "reactions_owner_delete" ON public.reactions;
    CREATE POLICY "reactions_owner_delete" ON public.reactions
      FOR DELETE TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ─── 4. ABONNEMENTS (follows) ───────────────────────────────────────────────
-- Owner is the follower (follower_id). Physical "following" column is "followee_id".
DO $$
BEGIN
  IF to_regclass('public.abonnements') IS NOT NULL THEN
    -- Dedupe any existing duplicate edges before adding the unique index.
    DELETE FROM public.abonnements a
    USING public.abonnements b
    WHERE a.ctid < b.ctid
      AND a.follower_id = b.follower_id
      AND a.followee_id = b.followee_id;

    CREATE UNIQUE INDEX IF NOT EXISTS abonnements_follower_followee_uniq
      ON public.abonnements (follower_id, followee_id);

    ALTER TABLE public.abonnements ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "abonnements_read" ON public.abonnements;
    CREATE POLICY "abonnements_read" ON public.abonnements
      FOR SELECT TO authenticated
      USING (true);

    DROP POLICY IF EXISTS "abonnements_owner_insert" ON public.abonnements;
    CREATE POLICY "abonnements_owner_insert" ON public.abonnements
      FOR INSERT TO authenticated
      WITH CHECK (follower_id = auth.uid());

    DROP POLICY IF EXISTS "abonnements_owner_update" ON public.abonnements;
    CREATE POLICY "abonnements_owner_update" ON public.abonnements
      FOR UPDATE TO authenticated
      USING (follower_id = auth.uid())
      WITH CHECK (follower_id = auth.uid());

    DROP POLICY IF EXISTS "abonnements_owner_delete" ON public.abonnements;
    CREATE POLICY "abonnements_owner_delete" ON public.abonnements
      FOR DELETE TO authenticated
      USING (follower_id = auth.uid());
  END IF;
END $$;

-- ─── 5. GIFTS (monetized ledger) ────────────────────────────────────────────
-- SELECT only for the two parties to a gift. No client write access at all —
-- gifts are written exclusively by the backend (service_role bypasses RLS).
DO $$
BEGIN
  IF to_regclass('public.gifts') IS NOT NULL THEN
    ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "gifts_party_read" ON public.gifts;
    CREATE POLICY "gifts_party_read" ON public.gifts
      FOR SELECT TO authenticated
      USING (sender_id = auth.uid() OR recipient_id = auth.uid());

    -- Explicitly remove any client write policies. With RLS enabled and no
    -- INSERT/UPDATE/DELETE policy, anon/authenticated cannot write — only
    -- service_role (which bypasses RLS) can.
    DROP POLICY IF EXISTS "gifts_owner_insert" ON public.gifts;
    DROP POLICY IF EXISTS "gifts_owner_update" ON public.gifts;
    DROP POLICY IF EXISTS "gifts_owner_delete" ON public.gifts;
    DROP POLICY IF EXISTS "gifts_self_manage" ON public.gifts;
  END IF;
END $$;
