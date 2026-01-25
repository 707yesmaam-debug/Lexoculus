-- Phase 3.3: Monitoring Alerts System
-- Run this in Supabase SQL Editor

-- Create the monitoring_alerts table
CREATE TABLE IF NOT EXISTS monitoring_alerts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ai_system_id TEXT REFERENCES ai_systems(id) ON DELETE CASCADE,
    
    -- Alert Type
    category TEXT NOT NULL,  -- risk_change, drift_detected, compliance_gap, document_missing
    severity TEXT DEFAULT 'info',  -- critical, warning, info
    
    -- Content
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Status
    status TEXT DEFAULT 'unread',  -- unread, read, resolved, dismissed
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by TEXT,
    
    -- Metadata
    metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_user_id ON monitoring_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_ai_system_id ON monitoring_alerts(ai_system_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_status ON monitoring_alerts(status);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_category ON monitoring_alerts(category);

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'monitoring_alerts';
