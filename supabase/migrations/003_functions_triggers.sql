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
