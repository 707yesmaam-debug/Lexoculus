-- Feature 5: PDF Report Generator
-- Creates compliance_reports table for storing generated report metadata
-- Reports are stored in Supabase Storage, this table stores metadata

-- Create compliance_reports table
CREATE TABLE IF NOT EXISTS compliance_reports (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    final_risk_assessment_id TEXT UNIQUE NOT NULL REFERENCES final_risk_assessments(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- File metadata (stored in Supabase Storage)
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT,
    file_size INTEGER NOT NULL,
    
    -- Report data
    risk_classification TEXT NOT NULL,
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    
    -- Digital signing
    digital_signature TEXT,
    signed_at TIMESTAMPTZ,
    
    -- Versioning
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Timestamps
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_compliance_reports_user_id ON compliance_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_final_risk_assessment_id ON compliance_reports(final_risk_assessment_id);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_generated_at ON compliance_reports(generated_at);

-- Create unique constraint for user + file_name
CREATE UNIQUE INDEX IF NOT EXISTS idx_compliance_reports_user_file ON compliance_reports(user_id, file_name);

-- Enable Row Level Security
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own reports
CREATE POLICY "Users can view own compliance reports"
ON compliance_reports FOR SELECT
USING (auth.uid()::text = user_id);

-- RLS Policy: Users can only insert their own reports
CREATE POLICY "Users can insert own compliance reports"
ON compliance_reports FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- RLS Policy: Users can only update their own reports
CREATE POLICY "Users can update own compliance reports"
ON compliance_reports FOR UPDATE
USING (auth.uid()::text = user_id);

-- RLS Policy: Users can only delete their own reports
CREATE POLICY "Users can delete own compliance reports"
ON compliance_reports FOR DELETE
USING (auth.uid()::text = user_id);

-- Trigger to update updated_at on changes
CREATE OR REPLACE FUNCTION update_compliance_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_compliance_reports_updated_at
    BEFORE UPDATE ON compliance_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_compliance_reports_updated_at();

-- =====================================================
-- Supabase Storage RLS Policies
-- Run these separately if not already done
-- =====================================================

-- Note: These policies should be run in Supabase SQL Editor
-- They control access to the 'compliance-reports' storage bucket

-- Policy 1: Users can upload their own reports
-- CREATE POLICY "Users can upload own reports"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'compliance-reports' AND
--   (storage.foldername(name))[1] = auth.uid()::text
-- );

-- Policy 2: Users can view/download their own reports
-- CREATE POLICY "Users can view own reports"
-- ON storage.objects FOR SELECT
-- USING (
--   bucket_id = 'compliance-reports' AND
--   (storage.foldername(name))[1] = auth.uid()::text
-- );

-- Policy 3: Users can delete their own reports
-- CREATE POLICY "Users can delete own reports"
-- ON storage.objects FOR DELETE
-- USING (
--   bucket_id = 'compliance-reports' AND
--   (storage.foldername(name))[1] = auth.uid()::text
-- );
