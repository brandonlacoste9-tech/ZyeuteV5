-- EMERGENCY VIDEO REPAIR - RUN THIS NOW
-- Railway Dashboard → PostgreSQL → Query

-- STEP 1: SEE THE DAMAGE
SELECT processing_status, COUNT(*) 
FROM posts WHERE type = 'video' 
GROUP BY processing_status;

-- STEP 2: RESET STUCK VIDEOS (Uncomment and run)
-- UPDATE posts SET processing_status = 'pending' 
-- WHERE type = 'video' 
--   AND processing_status IN ('pending', 'processing')
--   AND created_at < NOW() - INTERVAL '1 hour'
--   AND mux_playback_id IS NULL;

-- STEP 3: Verify webhook is working
-- Check: SELECT COUNT(*) FROM posts WHERE mux_playback_id IS NOT NULL;
