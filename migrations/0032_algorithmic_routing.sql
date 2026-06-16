-- Add affinity_tags to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS affinity_tags text[] DEFAULT '{}'::text[];

-- Create algorithmic routing function
CREATE OR REPLACE FUNCTION get_localized_explore_feed(
  p_viewer_id UUID,
  p_region_id TEXT,
  p_affinity_tags TEXT[],
  p_limit INT
) RETURNS SETOF publications AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM publications p
  WHERE p.visibility = 'public' 
    AND p.est_masque = false
    AND p.deleted_at IS NULL
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
    -- Add base viral_score heavily down-weighted to act as a tie-breaker
    (COALESCE(p.viral_score, 0) / 10000.0)
  ) * exp(-0.05 * EXTRACT(EPOCH FROM (now() - p.created_at))/3600.0) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
