-- Phase 3.1: Code Drift Detection
-- Run this in Supabase SQL Editor

-- Add drift tracking columns to ai_systems
ALTER TABLE ai_systems
ADD COLUMN IF NOT EXISTS last_commit_sha TEXT,
ADD COLUMN IF NOT EXISTS files_changed_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS drift_detected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS drift_checked_at TIMESTAMP WITH TIME ZONE;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ai_systems' 
AND column_name IN ('last_commit_sha', 'files_changed_count', 'drift_detected', 'drift_checked_at');
