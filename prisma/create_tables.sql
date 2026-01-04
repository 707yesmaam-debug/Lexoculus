-- ComplianceAI - Database Schema
-- Run this in Supabase SQL Editor (supabase.com/dashboard → SQL Editor → New Query)

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

-- Create github_connections table
CREATE TABLE IF NOT EXISTS github_connections (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    github_username TEXT NOT NULL,
    github_oauth_token TEXT NOT NULL,
    github_token_expires_at TIMESTAMP WITH TIME ZONE,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_refreshed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, github_username)
);

CREATE INDEX IF NOT EXISTS github_connections_user_id_idx ON github_connections(user_id);

-- Create repo_scans table
CREATE TABLE IF NOT EXISTS repo_scans (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    github_repo_url TEXT NOT NULL,
    repo_owner TEXT NOT NULL,
    repo_name TEXT NOT NULL,
    repo_description TEXT,
    readme_content TEXT,
    package_json_content JSONB,
    requirements_txt_content TEXT,
    pyproject_toml_content JSONB,
    file_tree JSONB NOT NULL,
    total_files INTEGER NOT NULL,
    primary_language TEXT,
    license_type TEXT,
    stars_count INTEGER DEFAULT 0,
    forks_count INTEGER DEFAULT 0,
    watchers_count INTEGER DEFAULT 0,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS repo_scans_user_id_idx ON repo_scans(user_id);
CREATE INDEX IF NOT EXISTS repo_scans_github_repo_url_idx ON repo_scans(github_repo_url);
CREATE INDEX IF NOT EXISTS repo_scans_scanned_at_idx ON repo_scans(scanned_at);

-- Create user_github_repos table
CREATE TABLE IF NOT EXISTS user_github_repos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    github_repo_url TEXT NOT NULL,
    repo_name TEXT NOT NULL,
    repo_visibility TEXT NOT NULL,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, github_repo_url)
);

CREATE INDEX IF NOT EXISTS user_github_repos_user_id_idx ON user_github_repos(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE repo_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_github_repos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (id = auth.uid()::text);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (id = auth.uid()::text);

CREATE POLICY "Users can insert own data" ON users
    FOR INSERT WITH CHECK (id = auth.uid()::text);

-- RLS Policies for github_connections
CREATE POLICY "Users can view own connections" ON github_connections
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own connections" ON github_connections
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own connections" ON github_connections
    FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own connections" ON github_connections
    FOR DELETE USING (user_id = auth.uid()::text);

-- RLS Policies for repo_scans
CREATE POLICY "Users can view own scans" ON repo_scans
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own scans" ON repo_scans
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own scans" ON repo_scans
    FOR DELETE USING (user_id = auth.uid()::text);

-- RLS Policies for user_github_repos
CREATE POLICY "Users can manage own repos" ON user_github_repos
    FOR ALL USING (user_id = auth.uid()::text);

-- Success!
SELECT 'All tables and RLS policies created successfully!' as status;
