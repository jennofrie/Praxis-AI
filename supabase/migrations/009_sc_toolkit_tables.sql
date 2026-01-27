-- ============================================================================
-- Migration: 009_sc_toolkit_tables.sql
-- Description: SC Toolkit database tables for Report Synthesizer, CoC Cover
--              Letter, Budget Forecaster, Plan Management Expert, Activity Logs
-- Created: 2026-01-28
-- Project: Praxis-AI (nwwesogezwemoevhfvgi)
-- ============================================================================

-- ============================================================================
-- SYNTHESIZED REPORTS TABLE (Report Synthesizer)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.synthesized_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source_text TEXT,
  coordinator_notes TEXT,
  synthesized_content TEXT NOT NULL,
  template_data JSONB,
  model_used TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.synthesized_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own synthesized reports"
  ON public.synthesized_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own synthesized reports"
  ON public.synthesized_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own synthesized reports"
  ON public.synthesized_reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own synthesized reports"
  ON public.synthesized_reports FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_synthesized_reports_user_created
  ON public.synthesized_reports(user_id, created_at DESC);

-- ============================================================================
-- COC COVER LETTER HISTORY TABLE (CoC Cover Letter Generator)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.coc_cover_letter_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_name TEXT,
  ndis_number TEXT,
  sc_level INTEGER DEFAULT 2,
  cover_letter_data JSONB NOT NULL,
  source_document_hash TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.coc_cover_letter_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coc cover letters"
  ON public.coc_cover_letter_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coc cover letters"
  ON public.coc_cover_letter_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own coc cover letters"
  ON public.coc_cover_letter_history FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_coc_cover_letter_history_user
  ON public.coc_cover_letter_history(user_id, created_at DESC);

-- ============================================================================
-- BUDGETS TABLE (Budget Forecaster)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_name TEXT,
  ndis_number TEXT,
  total_budget DECIMAL(12,2) NOT NULL DEFAULT 0,
  spent_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  plan_start_date DATE NOT NULL,
  plan_end_date DATE NOT NULL,
  plan_duration_days INTEGER GENERATED ALWAYS AS (plan_end_date - plan_start_date) STORED,
  core_budget DECIMAL(12,2) DEFAULT 0,
  core_spent DECIMAL(12,2) DEFAULT 0,
  capacity_budget DECIMAL(12,2) DEFAULT 0,
  capacity_spent DECIMAL(12,2) DEFAULT 0,
  capital_budget DECIMAL(12,2) DEFAULT 0,
  capital_spent DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT budgets_total_budget_positive CHECK (total_budget >= 0),
  CONSTRAINT budgets_spent_amount_positive CHECK (spent_amount >= 0),
  CONSTRAINT budgets_dates_valid CHECK (plan_end_date > plan_start_date)
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budgets"
  ON public.budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets"
  ON public.budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
  ON public.budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
  ON public.budgets FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_budgets_user_id
  ON public.budgets(user_id);

CREATE INDEX IF NOT EXISTS idx_budgets_plan_end_date
  ON public.budgets(plan_end_date);

-- ============================================================================
-- BUDGET SNAPSHOTS TABLE (Budget Forecaster)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.budget_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_id UUID REFERENCES public.budgets(id) ON DELETE SET NULL,
  snapshot_name TEXT,
  total_budget DECIMAL(12,2) NOT NULL DEFAULT 0,
  spent_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  plan_start_date DATE NOT NULL,
  plan_end_date DATE NOT NULL,
  plan_duration_days INTEGER NOT NULL DEFAULT 0,
  core_budget DECIMAL(12,2) DEFAULT 0,
  core_spent DECIMAL(12,2) DEFAULT 0,
  capacity_budget DECIMAL(12,2) DEFAULT 0,
  capacity_spent DECIMAL(12,2) DEFAULT 0,
  capital_budget DECIMAL(12,2) DEFAULT 0,
  capital_spent DECIMAL(12,2) DEFAULT 0,
  forecast_data JSONB NOT NULL,
  participant_name TEXT,
  ndis_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.budget_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own snapshots"
  ON public.budget_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own snapshots"
  ON public.budget_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own snapshots"
  ON public.budget_snapshots FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_budget_snapshots_user_created
  ON public.budget_snapshots(user_id, created_at DESC);

-- ============================================================================
-- PLAN MANAGEMENT QUERIES TABLE (Plan Management Expert)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.plan_management_queries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query_text TEXT,
  document_name TEXT,
  query_type TEXT,
  response_data JSONB NOT NULL,
  model_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.plan_management_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own queries"
  ON public.plan_management_queries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own queries"
  ON public.plan_management_queries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own queries"
  ON public.plan_management_queries FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_plan_management_queries_user_created
  ON public.plan_management_queries(user_id, created_at DESC);

-- ============================================================================
-- ACTIVITY LOGS TABLE (Weekly Summary)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email VARCHAR(255),
  action TEXT NOT NULL,
  details JSONB,
  participant_id UUID,
  hours_spent DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity logs"
  ON public.activity_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created
  ON public.activity_logs(user_id, created_at DESC);

-- ============================================================================
-- CASE NOTES HISTORY TABLE (Visual Case Notes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.case_notes_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input_type TEXT NOT NULL CHECK (input_type IN ('text', 'image')),
  input_content TEXT,
  custom_instructions TEXT,
  generated_note TEXT NOT NULL,
  model_used TEXT,
  participant_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.case_notes_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own case notes"
  ON public.case_notes_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own case notes"
  ON public.case_notes_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own case notes"
  ON public.case_notes_history FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_case_notes_history_user_created
  ON public.case_notes_history(user_id, created_at DESC);

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('justification-attachments', 'justification-attachments', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('spectra-reports', 'spectra-reports', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies (with IF NOT EXISTS via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload own attachments' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can upload own attachments"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'justification-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own attachments' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can view own attachments"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'justification-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload own reports' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can upload own reports"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'spectra-reports' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own reports' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can view own reports"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'spectra-reports' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_synthesized_reports_updated_at ON synthesized_reports;
CREATE TRIGGER update_synthesized_reports_updated_at
  BEFORE UPDATE ON synthesized_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PERFORMANCE INDEXES (Additional)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier
  ON public.profiles(subscription_tier);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.synthesized_reports IS 'Stores synthesized allied health reports from Report Synthesizer';
COMMENT ON TABLE public.coc_cover_letter_history IS 'Stores generated CoC cover letters with participant and plan data';
COMMENT ON TABLE public.budgets IS 'NDIS budget tracking with category breakdowns (Core, Capacity, Capital)';
COMMENT ON TABLE public.budget_snapshots IS 'Point-in-time budget forecast snapshots for comparison';
COMMENT ON TABLE public.plan_management_queries IS 'Plan Management Expert query and response history';
COMMENT ON TABLE public.activity_logs IS 'User activity logs for weekly summary generation';
COMMENT ON TABLE public.case_notes_history IS 'Visual Case Notes generation history';
