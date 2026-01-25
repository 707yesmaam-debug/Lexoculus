-- Phase 1.2: Scan History & Version Tracking
-- Run this in Supabase SQL Editor

-- Create the ai_system_scans table
CREATE TABLE IF NOT EXISTS ai_system_scans (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    ai_system_id TEXT NOT NULL REFERENCES ai_systems(id) ON DELETE CASCADE,
    repo_scan_id TEXT NOT NULL REFERENCES repo_scans(id) ON DELETE CASCADE,
    
    -- Snapshot of risk at time of scan
    risk_classification TEXT,
    risk_score INTEGER,
    
    -- Change tracking
    previous_classification TEXT,
    classification_changed BOOLEAN DEFAULT false,
    
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(ai_system_id, repo_scan_id)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_ai_system_scans_ai_system_id ON ai_system_scans(ai_system_id);
CREATE INDEX IF NOT EXISTS idx_ai_system_scans_scanned_at ON ai_system_scans(scanned_at);

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ai_system_scans';
