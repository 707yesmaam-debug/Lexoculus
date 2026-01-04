-- Feature 2: LLM Capability Analysis Table
-- Run this in Supabase SQL Editor

-- Create llm_capability_analyses table
CREATE TABLE IF NOT EXISTS llm_capability_analyses (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    repo_scan_id TEXT UNIQUE NOT NULL REFERENCES repo_scans(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Core analysis results
    is_ai_system BOOLEAN NOT NULL,
    capabilities JSONB NOT NULL DEFAULT '[]',
    libraries JSONB NOT NULL DEFAULT '[]',
    ai_frameworks JSONB NOT NULL DEFAULT '[]',
    programming_languages JSONB NOT NULL DEFAULT '[]',
    detected_model_types JSONB NOT NULL DEFAULT '[]',
    
    -- Code structure indicators
    has_ml_pipeline BOOLEAN NOT NULL DEFAULT false,
    has_training_code BOOLEAN NOT NULL DEFAULT false,
    has_inference_code BOOLEAN NOT NULL DEFAULT false,
    has_data_processing BOOLEAN NOT NULL DEFAULT false,
    has_model_serialization BOOLEAN NOT NULL DEFAULT false,
    
    -- Risk indicators (for Feature 3)
    estimated_risk_indicators JSONB NOT NULL DEFAULT '{}',
    
    -- LLM metadata
    llm_model_used TEXT NOT NULL,
    analysis_duration_ms INTEGER NOT NULL,
    confidence_score DOUBLE PRECISION NOT NULL,
    analysis_notes TEXT,
    manual_review_needed BOOLEAN NOT NULL DEFAULT false,
    
    -- Timestamps
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_llm_capability_analyses_repo_scan_id ON llm_capability_analyses(repo_scan_id);
CREATE INDEX IF NOT EXISTS idx_llm_capability_analyses_user_id ON llm_capability_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_capability_analyses_analyzed_at ON llm_capability_analyses(analyzed_at);

-- Enable RLS
ALTER TABLE llm_capability_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own analyses"
    ON llm_capability_analyses
    FOR SELECT
    USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own analyses"
    ON llm_capability_analyses
    FOR INSERT
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own analyses"
    ON llm_capability_analyses
    FOR UPDATE
    USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own analyses"
    ON llm_capability_analyses
    FOR DELETE
    USING (user_id = auth.uid()::text);
