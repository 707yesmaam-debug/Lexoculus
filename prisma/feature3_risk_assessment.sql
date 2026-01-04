-- Feature 3: Risk Assessment Table (Annex III Mapping)
-- Run this in Supabase SQL Editor

-- Create risk_assessments table
CREATE TABLE IF NOT EXISTS risk_assessments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    repo_scan_id TEXT UNIQUE NOT NULL REFERENCES repo_scans(id) ON DELETE CASCADE,
    llm_analysis_id TEXT UNIQUE NOT NULL REFERENCES llm_capability_analyses(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Risk Classification
    risk_classification TEXT NOT NULL, -- UNACCEPTABLE, HIGH_RISK, LIMITED_RISK, MINIMAL_RISK
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_narrative TEXT,
    
    -- Annex III Matching
    matched_annex_iii_articles JSONB NOT NULL DEFAULT '[]',
    unmatched_risk_indicators JSONB NOT NULL DEFAULT '[]',
    
    -- Preliminary Assessment Flags
    is_unacceptable BOOLEAN NOT NULL DEFAULT false,
    is_high_risk BOOLEAN NOT NULL DEFAULT false,
    is_limited_risk BOOLEAN NOT NULL DEFAULT false,
    is_minimal_risk BOOLEAN NOT NULL DEFAULT false,
    
    -- Key Findings
    key_findings JSONB NOT NULL DEFAULT '[]',
    
    -- Metadata
    assessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    assessment_version INTEGER NOT NULL DEFAULT 1,
    manual_review_needed BOOLEAN NOT NULL DEFAULT false,
    manual_review_reason TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_risk_assessments_repo_scan_id ON risk_assessments(repo_scan_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_user_id ON risk_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_classification ON risk_assessments(risk_classification);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_assessed_at ON risk_assessments(assessed_at);

-- Enable RLS
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own assessments"
    ON risk_assessments
    FOR SELECT
    USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own assessments"
    ON risk_assessments
    FOR INSERT
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own assessments"
    ON risk_assessments
    FOR UPDATE
    USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own assessments"
    ON risk_assessments
    FOR DELETE
    USING (user_id = auth.uid()::text);
