-- Phase 2: Compliance Documents
-- Run this in Supabase SQL Editor

-- Create the compliance_documents table
CREATE TABLE IF NOT EXISTS compliance_documents (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    ai_system_id TEXT NOT NULL REFERENCES ai_systems(id) ON DELETE CASCADE,
    
    -- Document type: technical_doc, risk_management, data_governance, 
    --                instructions_for_use, declaration_of_conformity
    document_type TEXT NOT NULL,
    
    -- Content
    title TEXT NOT NULL,
    content JSONB NOT NULL,  -- { markdown: "..." }
    template_version TEXT DEFAULT '1.0',
    
    -- Completion status
    status TEXT DEFAULT 'draft',  -- draft, complete, exported
    completion_percent INTEGER DEFAULT 0,
    missing_fields JSONB,  -- Array of missing field names
    
    -- Version tracking
    version INTEGER DEFAULT 1,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(ai_system_id, document_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_compliance_documents_ai_system_id 
    ON compliance_documents(ai_system_id);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_document_type 
    ON compliance_documents(document_type);

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'compliance_documents';
