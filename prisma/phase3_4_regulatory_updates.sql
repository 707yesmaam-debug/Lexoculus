-- Phase 3.4: Regulatory Update Tracker
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS regulatory_updates (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    
    -- Source and reference
    source TEXT NOT NULL,
    source_url TEXT,
    reference_id TEXT UNIQUE,
    
    -- Content
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    content TEXT,
    
    -- Classification
    update_type TEXT NOT NULL,
    severity TEXT DEFAULT 'info',
    
    -- EU AI Act relevance
    affected_articles TEXT[],
    affected_risks TEXT[],
    
    -- Status
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    effective_date TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_type ON regulatory_updates(update_type);
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_severity ON regulatory_updates(severity);
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_published ON regulatory_updates(published_at);

-- Also need to add 'regulatory_update' as a valid alert category
-- This is just for documentation, no SQL change needed

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'regulatory_updates';
