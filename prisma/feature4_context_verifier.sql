-- Feature 4: Final Risk Assessment Table (Context Verified)
-- Run this in Supabase SQL Editor

-- Create final_risk_assessments table
CREATE TABLE IF NOT EXISTS final_risk_assessments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    risk_assessment_id TEXT UNIQUE NOT NULL REFERENCES risk_assessments(id) ON DELETE CASCADE,
    repo_scan_id TEXT UNIQUE NOT NULL REFERENCES repo_scans(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Final Classification
    final_risk_classification TEXT NOT NULL, -- UNACCEPTABLE, HIGH_RISK, LIMITED_RISK, MINIMAL_RISK
    final_risk_score INTEGER NOT NULL CHECK (final_risk_score >= 0 AND final_risk_score <= 100),
    final_narrative TEXT,
    
    -- Context Verification
    context_verified BOOLEAN NOT NULL DEFAULT false,
    context_summary JSONB NOT NULL DEFAULT '{}',
    context_answers JSONB NOT NULL DEFAULT '{}',
    
    -- Evidence Items
    evidence_items JSONB NOT NULL DEFAULT '[]',
    
    -- Final Matched Articles
    final_matched_articles JSONB NOT NULL DEFAULT '[]',
    
    -- Unresolved Issues
    unresolved_risk_indicators JSONB NOT NULL DEFAULT '[]',
    escalation_reason TEXT,
    
    -- Compliance Readiness
    compliance_readiness JSONB NOT NULL DEFAULT '{}',
    
    -- Approval Status
    approved_for_report BOOLEAN NOT NULL DEFAULT false,
    requires_manual_review BOOLEAN NOT NULL DEFAULT false,
    manual_review_notes TEXT,
    reviewer_id TEXT,
    
    -- Metadata
    verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    verification_version INTEGER NOT NULL DEFAULT 1
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_final_risk_assessments_risk_assessment_id ON final_risk_assessments(risk_assessment_id);
CREATE INDEX IF NOT EXISTS idx_final_risk_assessments_repo_scan_id ON final_risk_assessments(repo_scan_id);
CREATE INDEX IF NOT EXISTS idx_final_risk_assessments_user_id ON final_risk_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_final_risk_assessments_classification ON final_risk_assessments(final_risk_classification);
CREATE INDEX IF NOT EXISTS idx_final_risk_assessments_verified_at ON final_risk_assessments(verified_at);
CREATE INDEX IF NOT EXISTS idx_final_risk_assessments_approved ON final_risk_assessments(approved_for_report);

-- Enable RLS
ALTER TABLE final_risk_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own final assessments"
    ON final_risk_assessments
    FOR SELECT
    USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own final assessments"
    ON final_risk_assessments
    FOR INSERT
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own final assessments"
    ON final_risk_assessments
    FOR UPDATE
    USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own final assessments"
    ON final_risk_assessments
    FOR DELETE
    USING (user_id = auth.uid()::text);
