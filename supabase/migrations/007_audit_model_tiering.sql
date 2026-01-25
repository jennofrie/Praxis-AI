-- ============================================================================
-- Migration: 007_audit_model_tiering.sql
-- Description: Tables for tiered AI model usage (Pro vs Flash) and response caching
-- Created: 2026-01-25
-- ============================================================================

-- ============================================================================
-- AUDIT MODEL USAGE TABLE (Track Pro model usage per user per document type)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_model_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

  -- Usage tracking
  pro_usage_count INTEGER DEFAULT 0,
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint per user per document type
  UNIQUE(user_id, document_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_model_usage_user_id ON audit_model_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_model_usage_document_type ON audit_model_usage(document_type);
CREATE INDEX IF NOT EXISTS idx_audit_model_usage_last_reset ON audit_model_usage(last_reset_at);

-- RLS
ALTER TABLE audit_model_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own usage" ON audit_model_usage;
CREATE POLICY "Users can view their own usage"
  ON audit_model_usage FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own usage" ON audit_model_usage;
CREATE POLICY "Users can insert their own usage"
  ON audit_model_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own usage" ON audit_model_usage;
CREATE POLICY "Users can update their own usage"
  ON audit_model_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- AUDIT CACHE TABLE (Cache responses for identical content)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Cache key (content hash)
  content_hash TEXT NOT NULL,
  document_type TEXT NOT NULL,

  -- Cached result
  result JSONB NOT NULL,
  model_used TEXT NOT NULL,

  -- TTL
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,

  -- Unique constraint per hash per document type
  UNIQUE(content_hash, document_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_cache_hash ON audit_cache(content_hash);
CREATE INDEX IF NOT EXISTS idx_audit_cache_document_type ON audit_cache(document_type);
CREATE INDEX IF NOT EXISTS idx_audit_cache_expires ON audit_cache(expires_at);

-- No RLS needed - cache is global (same content = same result regardless of user)
-- But we'll enable it for safety and allow all authenticated users to read
ALTER TABLE audit_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read cache" ON audit_cache;
CREATE POLICY "Authenticated users can read cache"
  ON audit_cache FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert cache" ON audit_cache;
CREATE POLICY "Authenticated users can insert cache"
  ON audit_cache FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- CLEANUP FUNCTION (Remove expired cache entries)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_audit_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM audit_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUTO-RESET FUNCTION (Reset Pro usage count after 24 hours)
-- ============================================================================

CREATE OR REPLACE FUNCTION check_and_reset_pro_usage(
  p_user_id UUID,
  p_document_type TEXT
)
RETURNS TABLE(
  current_count INTEGER,
  was_reset BOOLEAN
) AS $$
DECLARE
  v_usage_record audit_model_usage%ROWTYPE;
  v_was_reset BOOLEAN := FALSE;
BEGIN
  -- Get or create usage record
  SELECT * INTO v_usage_record
  FROM audit_model_usage
  WHERE user_id = p_user_id AND document_type = p_document_type;

  IF NOT FOUND THEN
    -- Create new record
    INSERT INTO audit_model_usage (user_id, document_type, pro_usage_count, last_reset_at)
    VALUES (p_user_id, p_document_type, 0, NOW())
    RETURNING * INTO v_usage_record;
  ELSIF v_usage_record.last_reset_at < NOW() - INTERVAL '24 hours' THEN
    -- Reset if more than 24 hours since last reset
    UPDATE audit_model_usage
    SET pro_usage_count = 0, last_reset_at = NOW(), updated_at = NOW()
    WHERE id = v_usage_record.id
    RETURNING * INTO v_usage_record;
    v_was_reset := TRUE;
  END IF;

  RETURN QUERY SELECT v_usage_record.pro_usage_count, v_was_reset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- INCREMENT PRO USAGE FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_pro_usage(
  p_user_id UUID,
  p_document_type TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_new_count INTEGER;
BEGIN
  -- First ensure record exists and check for reset
  PERFORM check_and_reset_pro_usage(p_user_id, p_document_type);

  -- Increment count
  UPDATE audit_model_usage
  SET pro_usage_count = pro_usage_count + 1, updated_at = NOW()
  WHERE user_id = p_user_id AND document_type = p_document_type
  RETURNING pro_usage_count INTO v_new_count;

  RETURN v_new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_audit_model_usage_updated_at ON audit_model_usage;
CREATE TRIGGER update_audit_model_usage_updated_at
  BEFORE UPDATE ON audit_model_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE audit_model_usage IS 'Tracks Pro model usage per user per document type (resets every 24h)';
COMMENT ON TABLE audit_cache IS 'Caches audit results by content hash (1 hour TTL)';
COMMENT ON FUNCTION check_and_reset_pro_usage IS 'Checks usage count and resets if 24h have passed';
COMMENT ON FUNCTION increment_pro_usage IS 'Increments Pro usage count for a user/document type';
COMMENT ON FUNCTION cleanup_expired_audit_cache IS 'Removes expired cache entries';
