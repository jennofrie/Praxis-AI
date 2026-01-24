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
