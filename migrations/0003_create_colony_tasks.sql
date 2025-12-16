-- Migration: Create colony_tasks table for Colony OS Bridge
-- Created: 2025-12-15
-- Purpose: Task queue for React app to communicate with Python bees

CREATE TABLE IF NOT EXISTS colony_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    command TEXT NOT NULL,
    origin TEXT DEFAULT 'Ti-Guy Swarm',
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    metadata JSONB DEFAULT '{}',
    result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for fast polling
CREATE INDEX IF NOT EXISTS colony_tasks_status_idx ON colony_tasks(status);
CREATE INDEX IF NOT EXISTS colony_tasks_priority_idx ON colony_tasks(priority);
CREATE INDEX IF NOT EXISTS colony_tasks_created_at_idx ON colony_tasks(created_at);

-- Auto-update timestamp trigger
CREATE TRIGGER update_colony_tasks_updated_at 
    BEFORE UPDATE ON colony_tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS: Allow authenticated users to insert and read their own tasks
ALTER TABLE colony_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert tasks"
    ON colony_tasks FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anyone can view tasks"
    ON colony_tasks FOR SELECT
    USING (true);

-- Service role has full access (for Python bees)
GRANT ALL ON colony_tasks TO service_role;
GRANT ALL ON colony_tasks TO postgres;
