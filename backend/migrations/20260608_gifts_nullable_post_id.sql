-- Allow gifts without a post (e.g. live stream gifts).
-- Create table first if missing (older DBs never ran full gifts DDL).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gift_type') THEN
    CREATE TYPE public.gift_type AS ENUM (
      'comete', 'feuille_erable', 'fleur_de_lys', 'feu', 'coeur_or'
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

ALTER TABLE public.gifts ALTER COLUMN post_id DROP NOT NULL;
