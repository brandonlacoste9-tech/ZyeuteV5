-- Grid Rush RPC: PERFORM lock + one ACTIVE match per player_1
-- (startup runner copy — mirrors 0026)

DROP FUNCTION IF EXISTS public.grid_rush_create_bot_match(UUID, INT);
DROP FUNCTION IF EXISTS public.grid_rush_create_bot_match(INT, UUID);

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

  PERFORM 1
  FROM public.user_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

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

  BEGIN
    INSERT INTO public.grid_rush_matches (
      player_1_id, stake_tokens, status, is_bot, started_at, ends_at
    )
    VALUES (p_user_id, p_stake, 'ACTIVE', true, NOW(), v_ends_at)
    RETURNING * INTO v_match;
  EXCEPTION
    WHEN unique_violation THEN
      UPDATE public.user_wallets
      SET token_balance = token_balance + p_stake,
          updated_at = NOW()
      WHERE user_id = p_user_id;
      RAISE EXCEPTION
        'Tu as déjà une manche ACTIVE. Attends la fin avant de relancer.'
        USING ERRCODE = 'unique_violation';
  END;

  RETURN v_match;
END;
$$;

REVOKE ALL ON FUNCTION public.grid_rush_create_bot_match(INT, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.grid_rush_create_bot_match(INT, UUID) FROM anon, authenticated;
-- Do not OWNER TO service_role: pooler/postgres role often cannot reassign ownership
-- (permission denied for schema public). GRANT is enough for backend service_role.
GRANT EXECUTE ON FUNCTION public.grid_rush_create_bot_match(INT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.grid_rush_create_bot_match(INT, UUID) TO postgres;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT SELECT, INSERT, UPDATE ON public.user_wallets TO service_role;
    GRANT SELECT, INSERT, UPDATE ON public.grid_rush_matches TO service_role;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS grid_rush_active_player_uniq
  ON public.grid_rush_matches (player_1_id)
  WHERE status = 'ACTIVE';
