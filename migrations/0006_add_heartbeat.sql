-- Migration: Add heartbeat column to colony_tasks for stuck task recovery
-- This allows the poller to track activity and recover tasks that get stuck

ALTER TABLE colony_tasks 
ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMP WITH TIME ZONE;

-- Update existing processing tasks to have a heartbeat timestamp
UPDATE colony_tasks 
SET last_heartbeat = started_at 
WHERE status = 'processing' AND last_heartbeat IS NULL;

-- Create index for efficient stuck task queries
CREATE INDEX IF NOT EXISTS idx_colony_tasks_stuck 
ON colony_tasks (status, last_heartbeat) 
WHERE status = 'processing';

-- Comment on column for documentation
COMMENT ON COLUMN colony_tasks.last_heartbeat IS 
'Last activity timestamp for stuck task detection. Updated periodically during processing.';
