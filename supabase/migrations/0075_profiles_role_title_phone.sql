-- =========================================================================
-- Migration: 007_profiles_role_title_phone.sql
-- Description: Add role_title + phone fields to profiles
-- Created: 2026-01-25
-- =========================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role_title TEXT DEFAULT 'Agent User',
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Backfill role_title where missing
UPDATE profiles
SET role_title = 'Agent User'
WHERE role_title IS NULL;
