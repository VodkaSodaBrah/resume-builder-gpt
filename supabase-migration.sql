-- Resume Builder GPT - Supabase Migration
-- Run this in your Supabase SQL Editor

-- Create resumes table
CREATE TABLE IF NOT EXISTS resumes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Resume',
  resume_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_resumes_clerk_user_id ON resumes(clerk_user_id);

-- Create index for sorting by updated_at
CREATE INDEX IF NOT EXISTS idx_resumes_updated_at ON resumes(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own resumes
CREATE POLICY "Users can view own resumes" ON resumes
  FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policy: Users can insert their own resumes
CREATE POLICY "Users can create own resumes" ON resumes
  FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policy: Users can update their own resumes
CREATE POLICY "Users can update own resumes" ON resumes
  FOR UPDATE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policy: Users can delete their own resumes
CREATE POLICY "Users can delete own resumes" ON resumes
  FOR DELETE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- For development/testing: Allow all operations with anon key
-- Comment these out in production and use proper JWT auth
CREATE POLICY "Dev: Allow all select" ON resumes FOR SELECT USING (true);
CREATE POLICY "Dev: Allow all insert" ON resumes FOR INSERT WITH CHECK (true);
CREATE POLICY "Dev: Allow all update" ON resumes FOR UPDATE USING (true);
CREATE POLICY "Dev: Allow all delete" ON resumes FOR DELETE USING (true);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_resumes_updated_at ON resumes;
CREATE TRIGGER update_resumes_updated_at
  BEFORE UPDATE ON resumes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
