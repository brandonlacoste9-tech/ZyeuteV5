-- Fix: PL/pgSQL variable "region" clashed with publications.region → 42702 ambiguous.
-- Rename locals to v_* and re-grant.

CREATE OR REPLACE FUNCTION get_localized_explore_feed(
  p_viewer_id UUID,
  p_region_id TEXT,
  p_affinity_tags TEXT[],
  p_limit INT,
  p_seed BIGINT,
  p_seen_ids UUID[]
) RETURNS SETOF publications AS $$
DECLARE
  v_tags TEXT[] := COALESCE(p_affinity_tags, ARRAY[]::text[]);
  v_region TEXT := lower(COALESCE(p_region_id, 'quebec'));
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT p.*
    FROM publications p
    WHERE p.visibility = 'public'
      AND p.est_masque = false
      AND p.deleted_at IS NULL
      AND (array_length(p_seen_ids, 1) IS NULL OR p.id <> ALL(p_seen_ids))
      AND p.media_url IS NOT NULL
      AND (p.processing_status = 'completed' OR p.processing_status IS NULL OR p.mux_playback_id IS NOT NULL)
      AND p.processing_status IS DISTINCT FROM 'no_audio'
      AND p.caption NOT ILIKE '%DIAGNOSTIC%'
      AND p.content NOT ILIKE '%DIAGNOSTIC%'
      AND p.caption NOT ILIKE '%TEST VIDEO%'
      AND p.content NOT ILIKE '%TEST VIDEO%'
    ORDER BY p.created_at DESC
    LIMIT LEAST(GREATEST(p_limit * 8, 400), 1200)
  )
  SELECT c.*
  FROM candidates c
  ORDER BY (
    (CASE
      WHEN lower(c.hive_id::text) = v_region THEN 55.0
      WHEN lower(COALESCE(c.region_id, '')) = v_region THEN 45.0
      WHEN lower(COALESCE(c.region, '')) = v_region THEN 40.0
      WHEN lower(COALESCE(c.city, '')) = v_region THEN 35.0
      ELSE 0.0
    END) +
    (CASE WHEN c.hashtags IS NOT NULL AND c.hashtags && v_tags THEN 40.0 ELSE 0.0 END) +
    (CASE
      WHEN c.detected_themes IS NOT NULL AND c.detected_themes && v_tags THEN 35.0
      ELSE 0.0
    END) +
    (COALESCE(c.viral_score, 0) / 8000.0) +
    (COALESCE(c.reactions_count, 0) * 0.08) +
    (
      (
        (('x' || substr(md5(c.id::text || p_seed::text), 1, 16))::bit(64)::bigint
         & 9223372036854775807)
        / 9223372036854775807.0
      ) * 12.0
    )
  ) * exp(-0.04 * EXTRACT(EPOCH FROM (now() - c.created_at))/3600.0) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.get_localized_explore_feed(
  UUID, TEXT, TEXT[], INT, BIGINT, UUID[]
) TO anon, authenticated, service_role;
