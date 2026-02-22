-- Migration 011: User Presence, AI Rate Limits, Org Details
-- Run: supabase db push

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_details JSONB DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen DESC);

CREATE TABLE IF NOT EXISTS ai_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_rate_limits_user_created ON ai_rate_limits(user_id, created_at DESC);
ALTER TABLE ai_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own" ON ai_rate_limits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users select own" ON ai_rate_limits FOR SELECT USING (auth.uid() = user_id);

-- Allow authenticated users to view all profiles (needed for Active Sessions panel)
DROP POLICY IF EXISTS "Users can view all profiles for presence" ON profiles;
CREATE POLICY "Users can view all profiles for presence" ON profiles FOR SELECT TO authenticated USING (true);
