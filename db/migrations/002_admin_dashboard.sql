-- Migration 002: Admin role + helper RPCs for cost dashboard
-- Run AFTER 001_ai_generations.sql

-- 1. Admin flag on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Mark yourself admin manually after running:
--   UPDATE profiles SET is_admin = true WHERE email = 'you@example.com';

-- 2. Allow admins to read all generations (in addition to own-row policy)
DROP POLICY IF EXISTS "Admins read all generations" ON ai_generations;
CREATE POLICY "Admins read all generations" ON ai_generations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  );

-- 3. Aggregate function — overall stats for last N days
CREATE OR REPLACE FUNCTION admin_usage_summary(days INT DEFAULT 30)
RETURNS TABLE (
  total_generations BIGINT,
  total_input_tokens BIGINT,
  total_output_tokens BIGINT,
  total_cost_usd NUMERIC,
  active_users BIGINT
)
LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT
    COUNT(*)::BIGINT,
    COALESCE(SUM(input_tokens), 0)::BIGINT,
    COALESCE(SUM(output_tokens), 0)::BIGINT,
    COALESCE(SUM(cost_usd), 0)::NUMERIC,
    COUNT(DISTINCT user_id)::BIGINT
  FROM ai_generations
  WHERE created_at >= NOW() - (days || ' days')::INTERVAL;
$$;

-- 4. Per-day rollup for charts
CREATE OR REPLACE FUNCTION admin_usage_daily(days INT DEFAULT 30)
RETURNS TABLE (
  day DATE,
  generations BIGINT,
  cost_usd NUMERIC
)
LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT
    DATE(created_at) AS day,
    COUNT(*)::BIGINT,
    COALESCE(SUM(cost_usd), 0)::NUMERIC
  FROM ai_generations
  WHERE created_at >= NOW() - (days || ' days')::INTERVAL
  GROUP BY DATE(created_at)
  ORDER BY day ASC;
$$;

-- 5. Per-user breakdown
CREATE OR REPLACE FUNCTION admin_usage_by_user(days INT DEFAULT 30)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  plan TEXT,
  generations BIGINT,
  cost_usd NUMERIC,
  last_used TIMESTAMPTZ
)
LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT
    g.user_id,
    p.email,
    COALESCE(p.plan, 'free') AS plan,
    COUNT(*)::BIGINT,
    COALESCE(SUM(g.cost_usd), 0)::NUMERIC,
    MAX(g.created_at)
  FROM ai_generations g
  LEFT JOIN profiles p ON p.id = g.user_id
  WHERE g.created_at >= NOW() - (days || ' days')::INTERVAL
  GROUP BY g.user_id, p.email, p.plan
  ORDER BY cost_usd DESC;
$$;

-- Tip: REVOKE EXECUTE from anon and grant only to authenticated admins
-- via a wrapper if you want tighter security.
