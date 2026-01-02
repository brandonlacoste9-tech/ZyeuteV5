-- Migration: Add QA Firewall audit columns to colony_tasks
-- Created: 2025-01-02
-- Purpose: Support Quality Assurance Firewall auditing of AI outputs

-- Add audit-related columns
ALTER TABLE colony_tasks
ADD COLUMN IF NOT EXISTS requires_audit BOOLEAN DEFAULT false;

ALTER TABLE colony_tasks
ADD COLUMN IF NOT EXISTS audited_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE colony_tasks
ADD COLUMN IF NOT EXISTS audit_result JSONB;

ALTER TABLE colony_tasks
ADD COLUMN IF NOT EXISTS audit_confidence DECIMAL(3,2);

ALTER TABLE colony_tasks
ADD COLUMN IF NOT EXISTS audit_violations TEXT[];

ALTER TABLE colony_tasks
ADD COLUMN IF NOT EXISTS audit_error TEXT;

-- Update status enum to include audit statuses
-- Note: Using text field for flexibility

-- Create audit_log table for comprehensive audit trail
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES colony_tasks(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL,
    audit_result JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    authorization TEXT DEFAULT 'unique-spirit-482300-s4',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for audit log
CREATE INDEX IF NOT EXISTS audit_log_task_id_idx ON audit_log(task_id);
CREATE INDEX IF NOT EXISTS audit_log_timestamp_idx ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS audit_log_agent_id_idx ON audit_log(agent_id);

-- RLS for audit log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert audit logs"
    ON audit_log FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anyone can view audit logs"
    ON audit_log FOR SELECT
    USING (true);

-- Service role has full access
GRANT ALL ON audit_log TO service_role;
GRANT ALL ON audit_log TO postgres;

-- Update existing tasks that should require audit based on command type
UPDATE colony_tasks
SET requires_audit = true
WHERE command IN ('content_advice', 'moderation', 'scan_moderation', 'generate_video', 'visual_analysis')
AND status = 'completed'
AND audited_at IS NULL;