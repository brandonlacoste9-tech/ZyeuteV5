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
