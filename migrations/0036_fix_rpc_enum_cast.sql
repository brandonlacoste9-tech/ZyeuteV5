-- Fix: Cast hive_id enum to text to prevent 'operator does not exist: hive_id = text' errors
-- when called by PostgREST anon role
CREATE OR REPLACE FUNCTION get_localized_explore_feed(
  p_viewer_id UUID,
  p_region_id TEXT,
  p_affinity_tags TEXT[],
  p_limit INT,
  p_seed BIGINT,
  p_seen_ids UUID[]
) RETURNS SETOF publications AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT p.*
    FROM publications p
    WHERE p.visibility = 'public' 
      AND p.est_masque = false
      AND p.deleted_at IS NULL
      -- Hybrid Approach: Exclude previously seen/watched posts locally
      AND (array_length(p_seen_ids, 1) IS NULL OR p.id <> ALL(p_seen_ids))
      -- Only show items that are playable
      AND p.media_url IS NOT NULL
      AND (p.processing_status = 'completed' OR p.processing_status IS NULL OR p.mux_playback_id IS NOT NULL)
      AND p.processing_status IS DISTINCT FROM 'no_audio'
      AND p.caption NOT ILIKE '%DIAGNOSTIC%'
      AND p.content NOT ILIKE '%DIAGNOSTIC%'
      AND p.caption NOT ILIKE '%TEST VIDEO%'
      AND p.content NOT ILIKE '%TEST VIDEO%'
    -- Pre-filter sort using the partial B-Tree index structure
    ORDER BY p.viral_score DESC, p.reactions_count DESC, p.created_at DESC
    LIMIT p_limit * 5
  )
  SELECT c.*
  FROM candidates c
  ORDER BY (
    (CASE WHEN c.hive_id::text = COALESCE(p_region_id, 'quebec') THEN 50.0 ELSE 0.0 END) +
    -- Performance Optimization: Swapped unnest() subquery for && array overlap operator
    (CASE WHEN c.hashtags && p_affinity_tags THEN 30.0 ELSE 0.0 END) +
    -- Base viral_score heavily down-weighted to act as a tie-breaker
    (COALESCE(c.viral_score, 0) / 10000.0) +
    -- Hybrid Approach: Pseudo-random variance based on session seed
    -- Using 64-bit casting and bitmask to ensure it's strictly a non-negative boost without overflow risk
    (
      (
        (('x' || substr(md5(c.id::text || p_seed::text), 1, 16))::bit(64)::bigint
         & 9223372036854775807)
        / 9223372036854775807.0
      ) * 10.0
    )
  ) * exp(-0.05 * EXTRACT(EPOCH FROM (now() - c.created_at))/3600.0) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
