-- Spectra Praxis Database Schema
-- NDIS Clinical Documentation Platform
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/nwwesogezwemoevhfvgi/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE TABLES
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'clinician' CHECK (role IN ('clinician', 'planner', 'admin')),
  organization TEXT,
  preferences JSONB DEFAULT '{"theme": "system", "aiModel": "gemini-pro"}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participants (NDIS participants/clients)
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ndis_number TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  primary_diagnosis TEXT,
  secondary_diagnoses TEXT[],
  contact_email TEXT,
  contact_phone TEXT,
  address JSONB,
  support_coordinator TEXT,
  plan_manager TEXT,
  notes TEXT,
  ai_consent BOOLEAN DEFAULT false,
  ai_consent_date TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NDIS Plans
CREATE TABLE IF NOT EXISTS ndis_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  plan_number TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  plan_type TEXT CHECK (plan_type IN ('agency', 'plan-managed', 'self-managed', 'combination')),
  total_budget DECIMAL(10, 2),
  core_budget DECIMAL(10, 2),
  capacity_building_budget DECIMAL(10, 2),
  capital_budget DECIMAL(10, 2),
  goals JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'under-review')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CLINICAL DOCUMENTATION TABLES
-- ============================================

-- Goals (NDIS plan goals)
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  ndis_plan_id UUID REFERENCES ndis_plans(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  domain TEXT NOT NULL CHECK (domain IN (
    'Self-Care', 'Mobility', 'Communication', 
    'Social Interaction', 'Learning', 'Self-Management', 
    'Domestic Activities', 'Employment', 'Community Participation'
  )),
  target_date DATE,
  status TEXT DEFAULT 'not_started' CHECK (status IN (
    'not_started', 'in_progress', 'achieved', 'on_hold', 'discontinued'
  )),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  baseline_measure TEXT,
  target_measure TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions (clinical sessions/appointments)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  clinician_id UUID REFERENCES profiles(id),
  session_date DATE NOT NULL,
  session_type TEXT CHECK (session_type IN (
    'assessment', 'intervention', 'review', 'home-visit', 'telehealth', 'report-writing'
  )),
  duration_minutes INTEGER,
  raw_notes TEXT,
  structured_observations JSONB DEFAULT '{}',
  goals_addressed UUID[] DEFAULT '{}',
  location TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no-show')),
  billable BOOLEAN DEFAULT true,
  ai_processed BOOLEAN DEFAULT false,
  ai_processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session Progress Notes (linked to goals)
CREATE TABLE IF NOT EXISTS session_goal_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  progress_indicator TEXT CHECK (progress_indicator IN ('positive', 'neutral', 'regression')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports (FCAs, AT justifications, progress reports)
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  report_type TEXT NOT NULL CHECK (report_type IN (
    'fca', 'at-justification', 'progress-report', 'discharge-summary', 'review'
  )),
  title TEXT NOT NULL,
  content TEXT,
  domain_evidence JSONB DEFAULT '{}',
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
  quality_issues JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'final', 'submitted')),
  ai_generated BOOLEAN DEFAULT false,
  ai_model_used TEXT,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drafts (auto-saved work with 7-day retention)
CREATE TABLE IF NOT EXISTS drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  draft_type TEXT NOT NULL CHECK (draft_type IN (
    'fca-pipeline', 'evidence-matrix', 'at-justification', 'goal-progress', 'report'
  )),
  content JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assistive Technology Records
CREATE TABLE IF NOT EXISTS assistive_technology (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  category TEXT CHECK (category IN (
    'mobility', 'communication', 'personal-care', 'home-modification', 
    'vehicle-modification', 'cognitive-aid', 'sensory-aid', 'other'
  )),
  cost DECIMAL(10, 2),
  funding_source TEXT CHECK (funding_source IN ('ndis', 'private', 'both')),
  maintenance_cost_annual DECIMAL(10, 2),
  trial_completed BOOLEAN DEFAULT false,
  trial_outcome TEXT,
  effectiveness_score INTEGER CHECK (effectiveness_score >= 1 AND effectiveness_score <= 10),
  participant_preference INTEGER CHECK (participant_preference >= 1 AND participant_preference <= 10),
  justification TEXT,
  status TEXT DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'ordered', 'delivered', 'in-use', 'discontinued')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT & COMPLIANCE TABLES
-- ============================================

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL CHECK (action IN (
    'create', 'read', 'update', 'delete', 'export', 'login', 'logout', 'ai_request'
  )),
  resource_type TEXT NOT NULL,
  resource_id UUID,
  resource_name TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Usage Tracking (for consent compliance)
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  participant_id UUID REFERENCES participants(id),
  feature TEXT NOT NULL CHECK (feature IN (
    'evidence-matrix', 'fca-pipeline', 'quality-checker', 
    'goal-progress', 'at-justification', 'domain-mapping'
  )),
  model_used TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_participants_user ON participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_ndis ON participants(ndis_number);
CREATE INDEX IF NOT EXISTS idx_sessions_participant ON sessions(participant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_goals_participant ON goals(participant_id);
CREATE INDEX IF NOT EXISTS idx_reports_participant ON reports(participant_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_drafts_user ON drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_drafts_expires ON drafts(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_participant ON ai_usage(participant_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ndis_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_goal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistive_technology ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Participants: Users can manage their own participants
CREATE POLICY "Users can view own participants" ON participants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create participants" ON participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participants" ON participants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own participants" ON participants
  FOR DELETE USING (auth.uid() = user_id);

-- NDIS Plans: Users can manage plans for their participants
CREATE POLICY "Users can manage own ndis_plans" ON ndis_plans
  FOR ALL USING (
    participant_id IN (SELECT id FROM participants WHERE user_id = auth.uid())
  );

-- Goals: Users can manage goals for their participants
CREATE POLICY "Users can manage own goals" ON goals
  FOR ALL USING (
    participant_id IN (SELECT id FROM participants WHERE user_id = auth.uid())
  );

-- Sessions: Users can manage sessions for their participants
CREATE POLICY "Users can manage own sessions" ON sessions
  FOR ALL USING (
    participant_id IN (SELECT id FROM participants WHERE user_id = auth.uid())
  );

-- Session Goal Notes
CREATE POLICY "Users can manage own session_goal_notes" ON session_goal_notes
  FOR ALL USING (
    session_id IN (
      SELECT s.id FROM sessions s 
      JOIN participants p ON s.participant_id = p.id 
      WHERE p.user_id = auth.uid()
    )
  );

-- Reports: Users can manage reports for their participants
CREATE POLICY "Users can manage own reports" ON reports
  FOR ALL USING (
    participant_id IN (SELECT id FROM participants WHERE user_id = auth.uid())
  );

-- Drafts: Users can manage their own drafts
CREATE POLICY "Users can manage own drafts" ON drafts
  FOR ALL USING (auth.uid() = user_id);

-- Assistive Technology
CREATE POLICY "Users can manage own assistive_technology" ON assistive_technology
  FOR ALL USING (
    participant_id IN (SELECT id FROM participants WHERE user_id = auth.uid())
  );

-- Audit Logs: Users can view their own audit logs
CREATE POLICY "Users can view own audit_logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- AI Usage: Users can view their own AI usage
CREATE POLICY "Users can view own ai_usage" ON ai_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert audit logs and AI usage
CREATE POLICY "Service role can insert audit_logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can insert ai_usage" ON ai_usage
  FOR INSERT WITH CHECK (true);
-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all relevant tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_participants_updated_at ON participants;
CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ndis_plans_updated_at ON ndis_plans;
CREATE TRIGGER update_ndis_plans_updated_at BEFORE UPDATE ON ndis_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_goals_updated_at ON goals;
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_drafts_updated_at ON drafts;
CREATE TRIGGER update_drafts_updated_at BEFORE UPDATE ON drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assistive_technology_updated_at ON assistive_technology;
CREATE TRIGGER update_assistive_technology_updated_at BEFORE UPDATE ON assistive_technology
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Clean up expired drafts (run via pg_cron or scheduled function)
CREATE OR REPLACE FUNCTION cleanup_expired_drafts()
RETURNS void AS $$
BEGIN
  DELETE FROM drafts WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS
-- ============================================

-- Dashboard metrics view
CREATE OR REPLACE VIEW dashboard_metrics AS
SELECT 
  p.id as user_id,
  COUNT(DISTINCT part.id) as total_participants,
  COUNT(DISTINCT g.id) as total_goals,
  COUNT(DISTINCT g.id) FILTER (WHERE g.status = 'achieved') as achieved_goals,
  COUNT(DISTINCT s.id) as total_sessions,
  COUNT(DISTINCT s.id) FILTER (WHERE s.session_date >= CURRENT_DATE - INTERVAL '7 days') as sessions_this_week,
  COUNT(DISTINCT r.id) as total_reports,
  COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'draft') as draft_reports
FROM profiles p
LEFT JOIN participants part ON part.user_id = p.id
LEFT JOIN goals g ON g.participant_id = part.id
LEFT JOIN sessions s ON s.participant_id = part.id
LEFT JOIN reports r ON r.participant_id = part.id
GROUP BY p.id;

-- Participant summary view
CREATE OR REPLACE VIEW participant_summary AS
SELECT 
  p.id,
  p.user_id,
  p.first_name,
  p.last_name,
  p.ndis_number,
  p.primary_diagnosis,
  p.status,
  p.ai_consent,
  COUNT(DISTINCT g.id) as goal_count,
  COUNT(DISTINCT g.id) FILTER (WHERE g.status = 'achieved') as achieved_goals,
  COUNT(DISTINCT s.id) as session_count,
  MAX(s.session_date) as last_session_date,
  COUNT(DISTINCT r.id) as report_count
FROM participants p
LEFT JOIN goals g ON g.participant_id = p.id
LEFT JOIN sessions s ON s.participant_id = p.id
LEFT JOIN reports r ON r.participant_id = p.id
GROUP BY p.id;
