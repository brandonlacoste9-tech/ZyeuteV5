-- Migration: Enable Realtime for colony_tasks
-- Created: 2025-12-15
-- Purpose: Allow frontend and test scripts to subscribe to task updates

BEGIN;

-- Check if publication exists (standard in Supabase)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication 
        WHERE pubname = 'supabase_realtime'
    ) THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END
$$;

-- Add table to publication
ALTER PUBLICATION supabase_realtime ADD TABLE colony_tasks;

COMMIT;
