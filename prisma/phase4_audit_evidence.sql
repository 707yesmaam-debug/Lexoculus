-- Phase 4: Evidence & Audit Trail
-- Run this in Supabase SQL Editor

-- =============================================================================
-- Phase 4.1: Audit Logs with hash chain
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ai_system_id TEXT REFERENCES ai_systems(id) ON DELETE CASCADE,
    
    -- Action details
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    
    -- Description
    description TEXT NOT NULL,
    metadata JSONB,
    
    -- Tamper-proof hash chain
    previous_hash TEXT,
    hash TEXT NOT NULL,
    
    -- IP tracking
    ip_address TEXT,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ai_system_id ON audit_logs(ai_system_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- =============================================================================
-- Phase 4.2: Compliance Evidence
-- =============================================================================

CREATE TABLE IF NOT EXISTS compliance_evidence (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ai_system_id TEXT NOT NULL REFERENCES ai_systems(id) ON DELETE CASCADE,
    
    -- Evidence details
    evidence_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    
    -- File storage
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    
    -- Source reference
    source_type TEXT,
    source_id TEXT,
    
    -- Chain of custody
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    collected_by TEXT NOT NULL,
    hash TEXT NOT NULL,
    
    -- Verification
    verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for compliance_evidence
CREATE INDEX IF NOT EXISTS idx_compliance_evidence_user_id ON compliance_evidence(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_evidence_ai_system_id ON compliance_evidence(ai_system_id);
CREATE INDEX IF NOT EXISTS idx_compliance_evidence_type ON compliance_evidence(evidence_type);
CREATE INDEX IF NOT EXISTS idx_compliance_evidence_collected_at ON compliance_evidence(collected_at);

-- Verify tables created
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('audit_logs', 'compliance_evidence');
