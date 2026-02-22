-- ============================================================================
-- Migration: 010_report_synthesizer_upgrade.sql
-- Description: Add persona, participant, and NDIS number columns to
--              synthesized_reports. Auto-cleanup trigger to keep 10 per user.
-- Created: 2026-02-22
-- Project: Praxis-AI
-- ============================================================================

-- Add missing columns to synthesized_reports
ALTER TABLE public.synthesized_reports
  ADD COLUMN IF NOT EXISTS persona_id TEXT DEFAULT 'sc-level-2',
  ADD COLUMN IF NOT EXISTS participant_name TEXT,
  ADD COLUMN IF NOT EXISTS ndis_number TEXT;

-- Auto-cleanup trigger: Keep only 10 most recent reports per user
CREATE OR REPLACE FUNCTION public.cleanup_old_synthesized_reports()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.synthesized_reports
  WHERE user_id = NEW.user_id
  AND id NOT IN (
    SELECT id FROM public.synthesized_reports
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    LIMIT 10
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_cleanup_synthesized_reports ON public.synthesized_reports;
CREATE TRIGGER trigger_cleanup_synthesized_reports
  AFTER INSERT ON public.synthesized_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_old_synthesized_reports();

-- Add index for persona queries
CREATE INDEX IF NOT EXISTS idx_synthesized_reports_persona
  ON public.synthesized_reports(user_id, persona_id, created_at DESC);
