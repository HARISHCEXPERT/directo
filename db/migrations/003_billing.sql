-- Migration 003: Billing tables for Razorpay
-- Run AFTER 002_admin_dashboard.sql

-- Orders & payments table
CREATE TABLE IF NOT EXISTS billing_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  razorpay_order_id TEXT UNIQUE NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  plan TEXT NOT NULL,        -- 'pro' | 'scale' | 'lifetime'
  cycle TEXT NOT NULL,       -- 'monthly' | 'yearly' | 'lifetime'
  amount_inr INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created', -- created | paid | failed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_billing_user ON billing_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_status ON billing_payments(status);

ALTER TABLE billing_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own payments" ON billing_payments
  FOR SELECT USING (auth.uid() = user_id);

-- Extend profile with subscription state
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan_cycle TEXT DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS plan_renews_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMPTZ;
