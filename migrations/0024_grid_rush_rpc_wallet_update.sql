-- Grid Rush RPC: column-based decrement + clearer wallet-missing errors
-- Created: 2026-06-08

BEGIN;

CREATE OR REPLACE FUNCTION public.grid_rush_create_bot_match(
  p_stake INT,
  p_user_id UUID
)
RETURNS public.grid_rush_matches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_match public.grid_rush_matches;
  v_wallet_user UUID;
  v_ends_at TIMESTAMPTZ;
BEGIN
  -- Callable only via service_role; backend passes p_user_id from verified JWT.
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur invalide'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF p_stake NOT IN (100, 250, 500) THEN
    RAISE EXCEPTION 'Mise invalide. Choix: 100, 250, 500 jetons'
      USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO public.user_wallets (user_id, token_balance)
  VALUES (p_user_id, 1000)
  ON CONFLICT (user_id) DO NOTHING;

  -- Serialize concurrent spends for this user_id.
  SELECT uw.user_id
  INTO v_wallet_user
  FROM public.user_wallets AS uw
  WHERE uw.user_id = p_user_id
  FOR UPDATE;

  IF v_wallet_user IS NULL THEN
    RAISE EXCEPTION 'Portefeuille introuvable — contacte le support.'
      USING ERRCODE = 'no_data_found';
  END IF;

  -- Decrement from the live column value (not a cached variable).
  UPDATE public.user_wallets
  SET token_balance = token_balance - p_stake,
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND token_balance >= p_stake;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pas assez de jetons! Tu repartiras avec 1000 jetons gratuits.'
      USING ERRCODE = 'check_violation';
  END IF;

  v_ends_at := NOW() + INTERVAL '45 seconds';

  INSERT INTO public.grid_rush_matches (
    player_1_id, stake_tokens, status, is_bot, started_at, ends_at
  )
  VALUES (p_user_id, p_stake, 'ACTIVE', true, NOW(), v_ends_at)
  RETURNING * INTO v_match;

  RETURN v_match;
END;
$$;

REVOKE ALL ON FUNCTION public.grid_rush_create_bot_match(INT, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.grid_rush_create_bot_match(INT, UUID) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grid_rush_create_bot_match(INT, UUID) TO service_role;

COMMIT;
