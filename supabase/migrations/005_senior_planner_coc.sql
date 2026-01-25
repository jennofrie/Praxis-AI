-- ============================================================================
-- Migration: 005_senior_planner_coc.sql
-- Description: Tables for Senior Planner (Section 34 Auditor) and CoC Assessor
-- Created: 2026-01-25
-- ============================================================================

-- ============================================================================
-- REPORT AUDITS TABLE (Section 34 Auditor)
-- ============================================================================

CREATE TABLE IF NOT EXISTS report_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Document Information
  document_type TEXT NOT NULL CHECK (document_type IN (
    'functional_capacity_assessment',
    'progress_report',
    'assistive_technology_assessment',
    'home_modification_report',
    'sil_assessment',
    'therapy_report',
    'plan_review_request',
    'other'
  )),
  document_name TEXT NOT NULL,
  document_content TEXT, -- Original content (may be truncated)

  -- Scores (0-100)
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  status TEXT NOT NULL CHECK (status IN ('excellent', 'good', 'needs_improvement', 'critical', 'security_blocked')),
  compliance_score INTEGER NOT NULL DEFAULT 0 CHECK (compliance_score >= 0 AND compliance_score <= 100),
  nexus_score INTEGER NOT NULL DEFAULT 0 CHECK (nexus_score >= 0 AND nexus_score <= 100),
  vfm_score INTEGER NOT NULL DEFAULT 0 CHECK (vfm_score >= 0 AND vfm_score <= 100),
  evidence_score INTEGER NOT NULL DEFAULT 0 CHECK (evidence_score >= 0 AND evidence_score <= 100),
  significant_change_score INTEGER NOT NULL DEFAULT 0 CHECK (significant_change_score >= 0 AND significant_change_score <= 100),

  -- AI-Generated Results (JSONB for arrays/complex data)
  planner_summary TEXT,
  strengths JSONB DEFAULT '[]'::jsonb,
  improvements JSONB DEFAULT '[]'::jsonb,
  red_flags JSONB DEFAULT '[]'::jsonb,
  language_fixes JSONB DEFAULT '[]'::jsonb,
  planner_questions JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  content_restricted BOOLEAN DEFAULT FALSE,
  model_used TEXT,
  processing_time_ms INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for report_audits
CREATE INDEX IF NOT EXISTS idx_report_audits_user_id ON report_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_report_audits_document_type ON report_audits(document_type);
CREATE INDEX IF NOT EXISTS idx_report_audits_status ON report_audits(status);
CREATE INDEX IF NOT EXISTS idx_report_audits_created_at ON report_audits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_audits_overall_score ON report_audits(overall_score);

-- RLS Policies for report_audits
ALTER TABLE report_audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own audits" ON report_audits;
CREATE POLICY "Users can view their own audits"
  ON report_audits FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own audits" ON report_audits;
CREATE POLICY "Users can insert their own audits"
  ON report_audits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own audits" ON report_audits;
CREATE POLICY "Users can update their own audits"
  ON report_audits FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own audits" ON report_audits;
CREATE POLICY "Users can delete their own audits"
  ON report_audits FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- COC ASSESSMENTS TABLE (Change of Circumstances Assessor)
-- ============================================================================

CREATE TABLE IF NOT EXISTS coc_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Assessment Input
  description TEXT NOT NULL,
  triggers JSONB DEFAULT '[]'::jsonb, -- Array of trigger category IDs
  document_names JSONB DEFAULT '[]'::jsonb, -- Array of uploaded document names

  -- Assessment Results
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  eligibility_verdict TEXT NOT NULL CHECK (eligibility_verdict IN (
    'likely_eligible',
    'possibly_eligible',
    'not_eligible',
    'security_blocked'
  )),
  recommended_pathway TEXT NOT NULL CHECK (recommended_pathway IN (
    'plan_reassessment',
    'plan_variation',
    'light_touch_review',
    'scheduled_review',
    'no_action_required',
    'crisis_response'
  )),

  -- Reports (stored as text)
  sc_report TEXT, -- Support Coordinator focused report
  participant_report TEXT, -- Participant-friendly report

  -- Guidance (JSONB for arrays)
  evidence_suggestions JSONB DEFAULT '[]'::jsonb,
  ndis_references JSONB DEFAULT '[]'::jsonb,
  next_steps JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  content_restricted BOOLEAN DEFAULT FALSE,
  model_used TEXT,
  processing_time_ms INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for coc_assessments
CREATE INDEX IF NOT EXISTS idx_coc_assessments_user_id ON coc_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_coc_assessments_verdict ON coc_assessments(eligibility_verdict);
CREATE INDEX IF NOT EXISTS idx_coc_assessments_pathway ON coc_assessments(recommended_pathway);
CREATE INDEX IF NOT EXISTS idx_coc_assessments_created_at ON coc_assessments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coc_assessments_confidence ON coc_assessments(confidence_score);

-- RLS Policies for coc_assessments
ALTER TABLE coc_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own CoC assessments" ON coc_assessments;
CREATE POLICY "Users can view their own CoC assessments"
  ON coc_assessments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own CoC assessments" ON coc_assessments;
CREATE POLICY "Users can insert their own CoC assessments"
  ON coc_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own CoC assessments" ON coc_assessments;
CREATE POLICY "Users can update their own CoC assessments"
  ON coc_assessments FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own CoC assessments" ON coc_assessments;
CREATE POLICY "Users can delete their own CoC assessments"
  ON coc_assessments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- UPDATED_AT TRIGGERS (uses function from 003_functions_triggers.sql)
-- ============================================================================

DROP TRIGGER IF EXISTS update_report_audits_updated_at ON report_audits;
CREATE TRIGGER update_report_audits_updated_at
  BEFORE UPDATE ON report_audits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_coc_assessments_updated_at ON coc_assessments;
CREATE TRIGGER update_coc_assessments_updated_at
  BEFORE UPDATE ON coc_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE report_audits IS 'Stores Section 34 audit results for NDIS reports';
COMMENT ON TABLE coc_assessments IS 'Stores Change of Circumstances eligibility assessments';

COMMENT ON COLUMN report_audits.compliance_score IS 'NDIS Act & Rules compliance score (0-100)';
COMMENT ON COLUMN report_audits.nexus_score IS 'Link between disability & supports score (0-100)';
COMMENT ON COLUMN report_audits.vfm_score IS 'Value for Money demonstration score (0-100)';
COMMENT ON COLUMN report_audits.evidence_score IS 'Quality of clinical evidence score (0-100)';
COMMENT ON COLUMN report_audits.significant_change_score IS 'Change documentation score (0-100)';

COMMENT ON COLUMN coc_assessments.sc_report IS 'Support Coordinator focused report text';
COMMENT ON COLUMN coc_assessments.participant_report IS 'Participant-friendly report text';
