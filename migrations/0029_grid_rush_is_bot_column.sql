-- Ensure Grid Rush bot column exists (prod was missing is_bot).

ALTER TABLE public.grid_rush_matches
  ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT false NOT NULL;

ALTER TABLE public.grid_rush_matches
  ADD COLUMN IF NOT EXISTS stake_tokens INT DEFAULT 500 NOT NULL;

GRANT SELECT, INSERT, UPDATE ON public.grid_rush_matches TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.user_wallets TO service_role;
