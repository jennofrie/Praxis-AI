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
