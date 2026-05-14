-- Migration: AI generation tracking + user plan column
-- Run this in Supabase SQL Editor.

-- 1. Add plan + onboarding columns to profiles (idempotent)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'scale', 'lifetime')),
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- 2. AI generations log — used for quota enforcement AND cost analytics
CREATE TABLE IF NOT EXISTS ai_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  tone TEXT,
  model TEXT NOT NULL,
  input_tokens INT NOT NULL DEFAULT 0,
  output_tokens INT NOT NULL DEFAULT 0,
  cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_generations_user_created
  ON ai_generations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_generations_user_month
  ON ai_generations(user_id, date_trunc('month', created_at));

-- 3. RLS — users only see their own generations
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own generations" ON ai_generations;
CREATE POLICY "Users read own generations" ON ai_generations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own generations" ON ai_generations;
CREATE POLICY "Users insert own generations" ON ai_generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Convenience view — monthly usage per user (handy for admin dashboard later)
CREATE OR REPLACE VIEW user_ai_usage_monthly AS
SELECT
  user_id,
  date_trunc('month', created_at) AS month,
  COUNT(*) AS generations,
  SUM(input_tokens) AS input_tokens,
  SUM(output_tokens) AS output_tokens,
  SUM(cost_usd) AS cost_usd
FROM ai_generations
GROUP BY user_id, date_trunc('month', created_at);
