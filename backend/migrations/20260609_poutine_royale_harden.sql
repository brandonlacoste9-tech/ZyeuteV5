-- Poutine Royale hardening (startup runner copy — mirrors 0027)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'royale_scores_score_nonneg'
  ) THEN
    ALTER TABLE public.royale_scores
      ADD CONSTRAINT royale_scores_score_nonneg CHECK (score >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'royale_scores_layers_nonneg'
  ) THEN
    ALTER TABLE public.royale_scores
      ADD CONSTRAINT royale_scores_layers_nonneg CHECK (layers >= 0);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_royale_scores_tournament_score_desc
  ON public.royale_scores (tournament_id, score DESC, created_at DESC);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.royale_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tournaments_public_read" ON public.tournaments;
CREATE POLICY "tournaments_public_read" ON public.tournaments
  FOR SELECT TO anon, authenticated
  USING (status IN ('active', 'completed'));

DROP POLICY IF EXISTS "royale_scores_public_read" ON public.royale_scores;
CREATE POLICY "royale_scores_public_read" ON public.royale_scores
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.tournaments AS t
      WHERE t.id = royale_scores.tournament_id
        AND t.status IN ('active', 'completed')
    )
  );

REVOKE INSERT, UPDATE, DELETE ON public.tournaments FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.royale_scores FROM anon, authenticated;
GRANT SELECT ON public.tournaments TO anon, authenticated;
GRANT SELECT ON public.royale_scores TO anon, authenticated;
