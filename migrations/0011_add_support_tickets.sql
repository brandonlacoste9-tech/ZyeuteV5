-- Migration: Add Support Tickets for Customer Service AI
-- Created: 2025-12-31
-- Purpose: Enable TI-GUY to manage customer support tickets

-- Create ticket status enum
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'waiting_user', 'resolved', 'closed');

-- Create support tickets table
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status ticket_status DEFAULT 'open',
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  category VARCHAR(50), -- 'technical', 'billing', 'content', 'account', 'feature'
  assigned_to UUID REFERENCES user_profiles(id), -- For human escalation
  ai_response_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5)
);

-- Create ticket messages table
CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL, -- 'user', 'ai_assistant', 'human_agent'
  sender_id UUID REFERENCES user_profiles(id), -- NULL for AI
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]', -- File attachments if any
  is_internal BOOLEAN DEFAULT false, -- Internal notes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX support_tickets_user_id_idx ON support_tickets(user_id);
CREATE INDEX support_tickets_status_idx ON support_tickets(status);
CREATE INDEX support_tickets_priority_idx ON support_tickets(priority);
CREATE INDEX support_tickets_created_at_idx ON support_tickets(created_at);
CREATE INDEX ticket_messages_ticket_id_idx ON ticket_messages(ticket_id);

-- RLS Policies
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own tickets
CREATE POLICY tickets_user_access ON support_tickets
  FOR ALL USING (auth.uid() = user_id);

-- Users can view messages for their tickets
CREATE POLICY ticket_messages_user_access ON ticket_messages
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM support_tickets WHERE user_id = auth.uid()
    )
  );

-- AI and agents can insert messages
CREATE POLICY ticket_messages_insert ON ticket_messages
  FOR INSERT WITH CHECK (true);

-- System can update ticket status
CREATE POLICY tickets_system_update ON support_tickets
  FOR UPDATE USING (auth.role() = 'service_role');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER support_tickets_updated_at_trigger
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_tickets_updated_at();