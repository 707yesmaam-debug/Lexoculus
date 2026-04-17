-- ComplianceAI - Comprehensive Supabase RLS Policies
-- Last Updated: 2026-04-16
-- This script hardens the database for GDPR/DPA compliance.
-- Most application access occurs via Prisma (Postgres connection), which bypasses RLS.
-- This script secures the public API (PostgREST) used by the Supabase Client.

-------------------------------------------------------------------------------
-- 1. CLEANUP (Optional: Remove existing policies to avoid conflicts)
-------------------------------------------------------------------------------
-- DROP POLICY IF EXISTS "Users can view own data" ON users;
-- DROP POLICY IF EXISTS "Users can update own data" ON users;

-------------------------------------------------------------------------------
-- 2. ENABLE RLS ON ALL TABLES
-------------------------------------------------------------------------------
-- User & Auth
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_github_repos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_api_keys ENABLE ROW LEVEL SECURITY;

-- Scans & Analysis
ALTER TABLE repo_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_system_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_capability_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE final_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pr_scans ENABLE ROW LEVEL SECURITY;

-- Compliance & Evidence
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE testing_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE conformity_assessments ENABLE ROW LEVEL SECURITY;

-- Operations & Account
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_action_installs ENABLE ROW LEVEL SECURITY;

-- Public / Backend-Only Tables (Cloak from Public API)
ALTER TABLE demo_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE firm_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE firm_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE firm_client_access ENABLE ROW LEVEL SECURITY;

-------------------------------------------------------------------------------
-- 3. IDENTITY POLICIES (users table)
-------------------------------------------------------------------------------
CREATE POLICY "users_self_access" ON users 
  FOR ALL USING (id = auth.uid()::text);

-------------------------------------------------------------------------------
-- 4. DIRECT USER ISOLATION (Tables with user_id)
-------------------------------------------------------------------------------
-- We use a loop-like structure or individual statements for clarity and safety.

-- AI Systems
CREATE POLICY "ai_systems_iso" ON ai_systems 
  FOR ALL USING (user_id = auth.uid()::text);

-- Repo Scans
CREATE POLICY "repo_scans_iso" ON repo_scans 
  FOR ALL USING (user_id = auth.uid()::text);

-- GitHub Connections
CREATE POLICY "github_connections_iso" ON github_connections 
  FOR ALL USING (user_id = auth.uid()::text);

-- User GitHub Repos
CREATE POLICY "user_github_repos_iso" ON user_github_repos 
  FOR ALL USING (user_id = auth.uid()::text);

-- LLM Analysis
CREATE POLICY "llm_analysis_iso" ON llm_capability_analyses 
  FOR ALL USING (user_id = auth.uid()::text);

-- Risk Assessments
CREATE POLICY "risk_assessments_iso" ON risk_assessments 
  FOR ALL USING (user_id = auth.uid()::text);

-- Final Risk Assessments
CREATE POLICY "final_risk_assessments_iso" ON final_risk_assessments 
  FOR ALL USING (user_id = auth.uid()::text);

-- Compliance Reports
CREATE POLICY "compliance_reports_iso" ON compliance_reports 
  FOR ALL USING (user_id = auth.uid()::text);

-- Compliance Evidence
CREATE POLICY "compliance_evidence_iso" ON compliance_evidence 
  FOR ALL USING (user_id = auth.uid()::text);

-- Testing Evidence
CREATE POLICY "testing_evidence_iso" ON testing_evidence 
  FOR ALL USING (user_id = auth.uid()::text);

-- Conformity Assessments
CREATE POLICY "conformity_assessments_iso" ON conformity_assessments 
  FOR ALL USING (user_id = auth.uid()::text);

-- Audit Logs
CREATE POLICY "audit_logs_iso" ON audit_logs 
  FOR ALL USING (user_id = auth.uid()::text);

-- Monitoring Alerts
CREATE POLICY "monitoring_alerts_iso" ON monitoring_alerts 
  FOR ALL USING (user_id = auth.uid()::text);

-- Feedback
CREATE POLICY "feedback_iso" ON feedback 
  FOR ALL USING (user_id = auth.uid()::text);

-- Subscriptions
CREATE POLICY "subscriptions_iso" ON subscriptions 
  FOR ALL USING (user_id = auth.uid()::text);

-- GitHub Action Installs
CREATE POLICY "github_action_installs_iso" ON github_action_installs 
  FOR ALL USING (user_id = auth.uid()::text);

-- PR Scans
CREATE POLICY "pr_scans_iso" ON pr_scans 
  FOR ALL USING (user_id = auth.uid()::text);

-- MCP API Keys
CREATE POLICY "mcp_api_keys_iso" ON mcp_api_keys 
  FOR ALL USING (user_id = auth.uid()::text);

-------------------------------------------------------------------------------
-- 5. RELATIONAL ISOLATION (Tables without direct user_id but link to parent)
-------------------------------------------------------------------------------

-- AI System Scans (Links to AI System)
CREATE POLICY "ai_system_scans_iso" ON ai_system_scans 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ai_systems 
      WHERE ai_systems.id = ai_system_scans.ai_system_id 
      AND ai_systems.user_id = auth.uid()::text
    )
  );

-- Compliance Documents (Links to AI System)
CREATE POLICY "compliance_documents_iso" ON compliance_documents 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ai_systems 
      WHERE ai_systems.id = compliance_documents.ai_system_id 
      AND ai_systems.user_id = auth.uid()::text
    )
  );

-------------------------------------------------------------------------------
-- 6. SPECIAL ACCESS
-------------------------------------------------------------------------------

-- Firm Members (Individual access to their own membership)
CREATE POLICY "firm_members_iso" ON firm_members 
  FOR ALL USING (user_id = auth.uid()::text);

-- Note: demo_requests, enterprise_inquiries, regulatory_updates, firms, 
-- and firm_clients have RLS enabled but NO public policies. 
-- This means they are only accessible via the Service Role / Admin connection (Prisma).
