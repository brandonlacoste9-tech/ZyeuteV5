-- ⚡ QUICK FIX: Mark all pending videos as completed
-- This will make all videos playable immediately

UPDATE publications 
SET processing_status = 'completed' 
WHERE type = 'video' 
  AND processing_status = 'pending';
