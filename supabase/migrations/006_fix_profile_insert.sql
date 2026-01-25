-- ============================================================================
-- Migration: 006_fix_profile_insert.sql
-- Description: Add INSERT policy for profiles to fix signup 500 error
-- Issue: handle_new_user() trigger was failing because profiles table
--        had no INSERT policy, causing user signup to fail
-- Created: 2026-01-25
-- ============================================================================

-- Allow service role to insert profiles (for the handle_new_user trigger)
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Also allow users to insert their own profile (backup in case trigger fails)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- COMMENT
-- ============================================================================
COMMENT ON POLICY "Service role can insert profiles" ON profiles IS
  'Allows the handle_new_user() trigger to create profiles during signup';

COMMENT ON POLICY "Users can insert own profile" ON profiles IS
  'Backup policy allowing users to create their own profile if trigger fails';
