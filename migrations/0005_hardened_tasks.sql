-- Migration: Add hardened task tracking columns to colony_tasks
-- These columns support the Triad Architecture's improved state management

-- Add started_at for tracking when a task began processing
ALTER TABLE colony_tasks 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;

-- Add worker_id to track which worker is processing the task
ALTER TABLE colony_tasks 
ADD COLUMN IF NOT EXISTS worker_id TEXT;

-- Add fal_request_id for async FAL video generation tasks
ALTER TABLE colony_tasks 
ADD COLUMN IF NOT EXISTS fal_request_id TEXT;

-- Update the status enum to include 'async_waiting' if it doesn't exist
-- Note: Enums in Postgres can't easily add values, so we use text field for status

-- Optional: Add index for faster polling
CREATE INDEX IF NOT EXISTS idx_colony_tasks_status ON colony_tasks(status);
CREATE INDEX IF NOT EXISTS idx_colony_tasks_async ON colony_tasks(status) WHERE status = 'async_waiting';
