-- Create automation_tasks table for tracking automation task execution and performance
-- This table stores task queue and execution history with performance metrics

CREATE TABLE IF NOT EXISTS automation_tasks (
  id TEXT PRIMARY KEY,
  bee_id TEXT NOT NULL REFERENCES windows_automation_bees(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL CHECK (task_type IN ('test', 'debug', 'automation', 'monitoring')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  result JSONB,
  performance_metrics JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_automation_tasks_bee_id ON automation_tasks(bee_id);
CREATE INDEX IF NOT EXISTS idx_automation_tasks_status ON automation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_automation_tasks_task_type ON automation_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_automation_tasks_created_at ON automation_tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_automation_tasks_bee_status ON automation_tasks(bee_id, status);

-- Enable RLS
ALTER TABLE automation_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Service role (backend) can manage all tasks
CREATE POLICY "Service role can manage automation tasks" ON automation_tasks
  FOR ALL
  USING (auth.role() = 'service_role');

-- Authenticated users can view task status (read-only)
CREATE POLICY "Users can view automation tasks" ON automation_tasks
  FOR SELECT
  USING (auth.role() = 'authenticated');
