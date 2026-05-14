-- Migration 004: Extension tokens + submission tracking via extension
-- Run AFTER 003_billing.sql

CREATE TABLE IF NOT EXISTS ext_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  label TEXT,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ext_tokens_user ON ext_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_ext_tokens_token ON ext_tokens(token);

ALTER TABLE ext_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ext tokens" ON ext_tokens
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add submitted_via column to submissions (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='submissions' AND column_name='submitted_via'
  ) THEN
    ALTER TABLE submissions ADD COLUMN submitted_via TEXT DEFAULT 'manual'
      CHECK (submitted_via IN ('manual', 'extension', 'api'));
  END IF;
END $$;
