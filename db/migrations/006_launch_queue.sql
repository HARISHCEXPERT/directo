-- Migration 006: Launch queue / auto-orchestration
-- Run AFTER 005_submission_verification.sql

CREATE TABLE IF NOT EXISTS launch_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','paused','done','cancelled')),
  total INT NOT NULL DEFAULT 0,
  completed INT NOT NULL DEFAULT 0,
  pause_reason TEXT,         -- 'login_required' | 'captcha' | 'user' | null
  pause_directory_slug TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS launch_queue_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES launch_sessions(id) ON DELETE CASCADE,
  directory_id UUID NOT NULL REFERENCES directories(id) ON DELETE CASCADE,
  position INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','submitted','skipped','failed')),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  fail_reason TEXT,
  UNIQUE (session_id, directory_id)
);

CREATE INDEX IF NOT EXISTS idx_launch_sessions_user_status
  ON launch_sessions(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_launch_queue_items_session
  ON launch_queue_items(session_id, position);

ALTER TABLE launch_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE launch_queue_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users access own launch sessions" ON launch_sessions;
CREATE POLICY "Users access own launch sessions" ON launch_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users access own queue items" ON launch_queue_items;
CREATE POLICY "Users access own queue items" ON launch_queue_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM launch_sessions s WHERE s.id = session_id AND s.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM launch_sessions s WHERE s.id = session_id AND s.user_id = auth.uid())
  );
