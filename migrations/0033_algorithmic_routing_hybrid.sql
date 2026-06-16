-- Re-create algorithmic routing function with Hybrid Session support
CREATE OR REPLACE FUNCTION get_localized_explore_feed(
  p_viewer_id UUID,
  p_region_id TEXT,
  p_affinity_tags TEXT[],
  p_limit INT,
  p_seed FLOAT,
  p_seen_ids UUID[]
) RETURNS SETOF publications AS $$
BEGIN
  RETURN QUERY
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
  ORDER BY (
    (CASE WHEN p.hive_id = COALESCE(p_region_id, 'quebec') THEN 50.0 ELSE 0.0 END) +
    (
      COALESCE(
        (SELECT count(*) FROM unnest(p.hashtags) tag WHERE tag = ANY(p_affinity_tags))::float / 
        NULLIF(array_length(p.hashtags, 1), 0), 0.0
      ) * 30.0
    ) +
    -- Base viral_score heavily down-weighted to act as a tie-breaker
    (COALESCE(p.viral_score, 0) / 10000.0) +
    -- Hybrid Approach: Pseudo-random variance based on session seed
    -- We hash the ID with the seed to get a deterministic random float [0.0, 1.0] 
    -- then apply a weight multiplier (10.0) to shuffle similarly scored posts.
    (
      ( ('x' || substr(md5(p.id::text || p_seed::text), 1, 8))::bit(32)::bigint::float / 4294967295.0 ) * 10.0
    )
  ) * exp(-0.05 * EXTRACT(EPOCH FROM (now() - p.created_at))/3600.0) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
