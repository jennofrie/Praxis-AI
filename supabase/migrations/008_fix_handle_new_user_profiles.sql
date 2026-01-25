-- =========================================================================
-- Migration: 008_fix_handle_new_user_profiles.sql
-- Description: Hardening for profile creation on signup
-- Created: 2026-01-25
--
-- Goals:
-- - Ensure profiles has role_title + phone fields
-- - Ensure INSERT policies exist for signup trigger
-- - Recreate handle_new_user() with explicit search_path and defaults
-- =========================================================================

-- Ensure columns exist (idempotent)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role_title TEXT DEFAULT 'Agent User',
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Backfill role_title where missing
UPDATE profiles
SET role_title = 'Agent User'
WHERE role_title IS NULL;

-- Ensure INSERT policies exist (idempotent)
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Recreate the signup trigger function with explicit search_path and defaults
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, phone, role_title)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'role_title', 'Agent User')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    role_title = COALESCE(EXCLUDED.role_title, profiles.role_title);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
