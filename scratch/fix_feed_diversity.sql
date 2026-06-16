-- Fix for the "Top 150 Trap" to increase Feed Diversity
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
          AND (array_length(p_seen_ids, 1) IS NULL OR p.id <> ALL(p_seen_ids))
          AND p.media_url IS NOT NULL
          AND (p.processing_status = 'completed' OR p.processing_status IS NULL OR p.mux_playback_id IS NOT NULL)
          AND p.processing_status IS DISTINCT FROM 'no_audio'
          AND p.caption NOT ILIKE '%DIAGNOSTIC%'
          AND p.content NOT ILIKE '%DIAGNOSTIC%'
          AND p.caption NOT ILIKE '%TEST VIDEO%'
          AND p.content NOT ILIKE '%TEST VIDEO%'
        -- Instead of strictly pulling the 150 most viral videos, we pull the 1000 most recent videos
        -- to ensure fresh Apify scrapes and a massive variety of videos enter the ranking pool.
        ORDER BY p.created_at DESC
        LIMIT 1000
    )
    SELECT c.*
    FROM candidates c
    ORDER BY (
        -- Region Boost
        (CASE WHEN c.hive_id::text = COALESCE(p_region_id, 'quebec') THEN 50.0 ELSE 0.0 END) +
        
        -- Hashtag Affinity Boost (Null-safe)
        (CASE WHEN c.hashtags && COALESCE(p_affinity_tags, ARRAY[]::text[]) THEN 30.0 ELSE 0.0 END) +
        
        -- Base Popularity
        COALESCE(c.viral_score, 0) +
        (COALESCE(c.reactions_count, 0) * 0.5)
    )
    -- Pseudo-random seeded multiplier to shuffle the top 1000 differently per session
    * exp(-abs(hashtext(c.id::text || p_seed::text)) % 1000 / 1000.0) DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
