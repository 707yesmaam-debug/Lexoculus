-- Phase 1.1: Shareable Compliance Status Page
-- Run this in Supabase SQL Editor

-- Add sharing fields to ai_systems table
ALTER TABLE ai_systems
ADD COLUMN IF NOT EXISTS public_share_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS share_enabled BOOLEAN DEFAULT false;

-- Create index for fast lookup by share ID
CREATE INDEX IF NOT EXISTS idx_ai_systems_public_share_id ON ai_systems(public_share_id);

-- Verify
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'ai_systems' 
  AND column_name IN ('public_share_id', 'share_enabled');
