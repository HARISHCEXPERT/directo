-- Migration 005: Real submission verification
-- Run AFTER 004_ext_tokens.sql

-- New status values + verification metadata
DO $$
BEGIN
  -- Old constraint dropped if exists
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'submissions' AND column_name = 'status'
  ) THEN
    -- Try to drop any check constraint that limits status values
    BEGIN
      ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_status_check;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;

-- Add columns
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verification_method TEXT, -- success_url | success_text | manual_confirm | none
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS success_url TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Wider status set:
-- 'visited'    — user just opened the directory URL (no proof of submission)
-- 'submitted'  — confirmed submission (auto-detected or user-confirmed)
-- 'in_review'  — directory has it in moderation queue
-- 'approved'   — listing is live
-- 'rejected'   — directory rejected
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_status_check;
ALTER TABLE submissions ADD CONSTRAINT submissions_status_check
  CHECK (status IN ('visited', 'submitted', 'in_review', 'approved', 'rejected'));

-- Backfill any old 'submitted' rows where we have no proof → mark unverified
UPDATE submissions
SET verified = FALSE, verification_method = 'none'
WHERE verified IS NULL;

CREATE INDEX IF NOT EXISTS idx_submissions_verified ON submissions(verified);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
