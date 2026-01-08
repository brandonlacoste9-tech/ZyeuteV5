# Database Migrations for Windows Automation

## Migration 0015: Windows Automation Bees

Run this SQL in your Supabase SQL Editor:

```sql
-- Create windows_automation_bees table for Colony OS automation bee registry
-- This table tracks Windows-Use automation bee instances that can be orchestrated by Colony OS

CREATE TABLE IF NOT EXISTS windows_automation_bees (
  id TEXT PRIMARY KEY,
  hive_id TEXT NOT NULL DEFAULT 'quebec',
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'error')),
  python_service_url TEXT NOT NULL,
  llm_provider TEXT NOT NULL CHECK (llm_provider IN ('gemini', 'claude', 'ollama', 'openai', 'anthropic')),
  browser TEXT NOT NULL DEFAULT 'edge' CHECK (browser IN ('edge', 'chrome', 'firefox')),
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_windows_automation_bees_hive_id ON windows_automation_bees(hive_id);
CREATE INDEX IF NOT EXISTS idx_windows_automation_bees_status ON windows_automation_bees(status);
CREATE INDEX IF NOT EXISTS idx_windows_automation_bees_last_heartbeat ON windows_automation_bees(last_heartbeat);

-- Enable RLS (Row Level Security)
ALTER TABLE windows_automation_bees ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Service role (backend) can manage all bees
CREATE POLICY "Service role can manage automation bees" ON windows_automation_bees
  FOR ALL
  USING (auth.role() = 'service_role');

-- Authenticated users can view bee status (read-only)
CREATE POLICY "Users can view automation bee status" ON windows_automation_bees
  FOR SELECT
  USING (auth.role() = 'authenticated');
```

---

## Migration 0016: Automation Tasks

Run this SQL in your Supabase SQL Editor (after Migration 0015):

```sql
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
```

---

## Verification

After running both migrations, verify in Supabase:

1. Open Table Editor
2. Check that `windows_automation_bees` table exists
3. Check that `automation_tasks` table exists
4. Verify indexes are created (check table structure)
5. Verify RLS is enabled (check table policies)

---

## Files

- Migration 0015: `zyeute/migrations/0015_create_windows_automation_bees.sql`
- Migration 0016: `zyeute/migrations/0016_create_automation_tasks.sql`
