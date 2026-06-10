-- Zyeuté Quiz — daily attempts (idempotent)

BEGIN;

CREATE TABLE IF NOT EXISTS quiz_daily_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_date DATE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  correct_count INTEGER NOT NULL CHECK (correct_count >= 0),
  total_questions INTEGER NOT NULL DEFAULT 5 CHECK (total_questions > 0),
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT quiz_daily_attempts_user_date_uniq UNIQUE (user_id, quiz_date)
);

CREATE INDEX IF NOT EXISTS idx_quiz_daily_date_score
  ON quiz_daily_attempts (quiz_date, score DESC, correct_count DESC);

ALTER TABLE quiz_daily_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quiz_attempts_public_read" ON quiz_daily_attempts;
CREATE POLICY "quiz_attempts_public_read" ON quiz_daily_attempts
  FOR SELECT TO anon, authenticated
  USING (true);

REVOKE INSERT, UPDATE, DELETE ON quiz_daily_attempts FROM anon, authenticated;
GRANT SELECT ON quiz_daily_attempts TO anon, authenticated;

COMMIT;
