-- Grid Rush RPC (startup runner copy — mirrors migrations/0021_grid_rush_rpc.sql)

CREATE OR REPLACE FUNCTION public.grid_rush_create_bot_match(
  p_user_id UUID,
  p_stake INT
)
RETURNS public.grid_rush_matches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match public.grid_rush_matches;
  v_ends_at TIMESTAMPTZ;
BEGIN
  IF p_stake NOT IN (100, 250, 500) THEN
    RAISE EXCEPTION 'Mise invalide. Choix: 100, 250, 500 jetons';
  END IF;

  INSERT INTO user_wallets (user_id, token_balance)
  VALUES (p_user_id, 1000)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE user_wallets
  SET token_balance = token_balance - p_stake, updated_at = NOW()
  WHERE user_id = p_user_id AND token_balance >= p_stake;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pas assez de jetons! Tu repartiras avec 1000 jetons gratuits.';
  END IF;

  v_ends_at := NOW() + INTERVAL '45 seconds';

  INSERT INTO grid_rush_matches (
    player_1_id, stake_tokens, status, is_bot, started_at, ends_at
  )
  VALUES (p_user_id, p_stake, 'ACTIVE', true, NOW(), v_ends_at)
  RETURNING * INTO v_match;

  RETURN v_match;
END;
$$;

GRANT EXECUTE ON FUNCTION public.grid_rush_create_bot_match(UUID, INT) TO service_role;
