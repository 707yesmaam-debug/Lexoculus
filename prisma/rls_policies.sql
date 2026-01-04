-- ComplianceAI - Supabase RLS Policies
-- Run this in your Supabase SQL Editor after running Prisma migrations

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE repo_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_github_repos ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can only view and update their own record
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (id = auth.uid()::text);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (id = auth.uid()::text);

-- GitHub Connections policies
-- Users can only access their own connections
CREATE POLICY "Users can view own connections" ON github_connections
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own connections" ON github_connections
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own connections" ON github_connections
  FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own connections" ON github_connections
  FOR DELETE USING (user_id = auth.uid()::text);

-- Repo Scans policies
-- Users can only access their own scans
CREATE POLICY "Users can view own scans" ON repo_scans
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own scans" ON repo_scans
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own scans" ON repo_scans
  FOR DELETE USING (user_id = auth.uid()::text);

-- User GitHub Repos policies
-- Users can only access their own cached repos
CREATE POLICY "Users can manage own repos" ON user_github_repos
  FOR ALL USING (user_id = auth.uid()::text);

-- Grant access to service role (for backend operations)
-- Note: Service role bypasses RLS by default in Supabase
