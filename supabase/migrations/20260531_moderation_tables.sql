-- moderation_logs table (matches existing Moderation.tsx frontend)
CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'message', 'bio')),
  content_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  -- AI analysis fields
  ai_severity TEXT NOT NULL DEFAULT 'safe' CHECK (ai_severity IN ('safe', 'low', 'medium', 'high', 'critical')),
  ai_categories TEXT[] DEFAULT '{}',
  ai_confidence INTEGER DEFAULT 0 CHECK (ai_confidence >= 0 AND ai_confidence <= 100),
  ai_reason TEXT DEFAULT '',
  ai_action TEXT DEFAULT 'none' CHECK (ai_action IN ('none', 'flag', 'auto_remove', 'escalate')),
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'removed', 'escalated')),
  -- Human review
  human_reviewed BOOLEAN DEFAULT FALSE,
  human_reviewer_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  human_decision TEXT CHECK (human_decision IN ('approve', 'remove', 'escalate', NULL)),
  reviewed_at TIMESTAMPTZ,
  -- Metadata
  report_reason TEXT,
  report_count INTEGER DEFAULT 1,
  content_text TEXT, -- snapshot of content at time of flag
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- user_strikes table (used by Moderation.tsx for ban stats)
CREATE TABLE IF NOT EXISTS user_strikes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  strike_count INTEGER DEFAULT 1,
  ban_until TIMESTAMPTZ,
  is_permanent_ban BOOLEAN DEFAULT FALSE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_moderation_logs_status ON moderation_logs(status);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_user_id ON moderation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created_at ON moderation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_ai_severity ON moderation_logs(ai_severity);
CREATE INDEX IF NOT EXISTS idx_user_strikes_user_id ON user_strikes(user_id);

-- RLS
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_strikes ENABLE ROW LEVEL SECURITY;

-- Admins can read/write all moderation logs (is_admin column on user_profiles)
CREATE POLICY "Admins can manage moderation logs"
  ON moderation_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Service role bypasses RLS (for backend writes)
CREATE POLICY "Service role full access moderation_logs"
  ON moderation_logs FOR ALL
  TO service_role
  USING (TRUE);

CREATE POLICY "Admins can manage user strikes"
  ON user_strikes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Service role full access user_strikes"
  ON user_strikes FOR ALL
  TO service_role
  USING (TRUE);
