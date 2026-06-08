-- PostgREST RPC signature fix (startup runner copy — mirrors migrations/0023)

DROP FUNCTION IF EXISTS public.grid_rush_create_bot_match(UUID, INT);

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
  v_balance INT;
  v_ends_at TIMESTAMPTZ;
BEGIN
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

  SELECT uw.token_balance
  INTO v_balance
  FROM public.user_wallets AS uw
  WHERE uw.user_id = p_user_id
  FOR UPDATE;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Portefeuille introuvable'
      USING ERRCODE = 'no_data_found';
  END IF;

  IF v_balance < p_stake THEN
    RAISE EXCEPTION 'Pas assez de jetons! Tu repartiras avec 1000 jetons gratuits.'
      USING ERRCODE = 'check_violation';
  END IF;

  UPDATE public.user_wallets
  SET token_balance = v_balance - p_stake,
      updated_at = NOW()
  WHERE user_id = p_user_id;

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
