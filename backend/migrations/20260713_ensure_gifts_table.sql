-- Ensure gifts table exists (idempotent). post_id nullable for live gifts.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gift_type') THEN
    CREATE TYPE public.gift_type AS ENUM (
      'comete',
      'feuille_erable',
      'fleur_de_lys',
      'feu',
      'coeur_or'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  post_id uuid,
  gift_type public.gift_type NOT NULL,
  amount integer NOT NULL,
  stripe_payment_id text UNIQUE,
  created_at timestamp DEFAULT now() NOT NULL
);

-- FKs only when target tables exist (publications vs posts)
DO $$
BEGIN
  IF to_regclass('public.user_profiles') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'gifts_sender_id_user_profiles_id_fk'
    ) THEN
      ALTER TABLE public.gifts
        ADD CONSTRAINT gifts_sender_id_user_profiles_id_fk
        FOREIGN KEY (sender_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'gifts_recipient_id_user_profiles_id_fk'
    ) THEN
      ALTER TABLE public.gifts
        ADD CONSTRAINT gifts_recipient_id_user_profiles_id_fk
        FOREIGN KEY (recipient_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;
    END IF;
  END IF;

  IF to_regclass('public.publications') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'gifts_post_id_publications_id_fk'
    ) THEN
      ALTER TABLE public.gifts
        ADD CONSTRAINT gifts_post_id_publications_id_fk
        FOREIGN KEY (post_id) REFERENCES public.publications(id) ON DELETE CASCADE;
    END IF;
  ELSIF to_regclass('public.posts') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'gifts_post_id_posts_id_fk'
    ) THEN
      ALTER TABLE public.gifts
        ADD CONSTRAINT gifts_post_id_posts_id_fk
        FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

ALTER TABLE public.gifts ALTER COLUMN post_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS gifts_sender_id_idx ON public.gifts (sender_id);
CREATE INDEX IF NOT EXISTS gifts_recipient_id_idx ON public.gifts (recipient_id);
CREATE INDEX IF NOT EXISTS gifts_post_id_idx ON public.gifts (post_id);

ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
