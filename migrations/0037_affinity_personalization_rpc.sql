-- Stronger personalization in get_localized_explore_feed:
-- affinity on hashtags + detected_themes, region match, viral + recency.

CREATE OR REPLACE FUNCTION get_localized_explore_feed(
  p_viewer_id UUID,
  p_region_id TEXT,
  p_affinity_tags TEXT[],
  p_limit INT,
  p_seed BIGINT,
  p_seen_ids UUID[]
) RETURNS SETOF publications AS $$
DECLARE
  tags TEXT[] := COALESCE(p_affinity_tags, ARRAY[]::text[]);
  region TEXT := lower(COALESCE(p_region_id, 'quebec'));
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
    -- Region / hive
    (CASE
      WHEN lower(c.hive_id::text) = region THEN 55.0
      WHEN lower(COALESCE(c.region_id, '')) = region THEN 45.0
      WHEN lower(COALESCE(c.region, '')) = region THEN 40.0
      WHEN lower(COALESCE(c.city, '')) = region THEN 35.0
      ELSE 0.0
    END) +
    -- Hashtag overlap
    (CASE WHEN c.hashtags IS NOT NULL AND c.hashtags && tags THEN 40.0 ELSE 0.0 END) +
    -- Theme overlap (if column present; null-safe)
    (CASE
      WHEN c.detected_themes IS NOT NULL AND c.detected_themes && tags THEN 35.0
      ELSE 0.0
    END) +
    -- Popularity (down-weighted)
    (COALESCE(c.viral_score, 0) / 8000.0) +
    (COALESCE(c.reactions_count, 0) * 0.08) +
    -- Session seed jitter for variety
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
