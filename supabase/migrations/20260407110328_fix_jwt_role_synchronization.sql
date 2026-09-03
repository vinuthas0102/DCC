/*
  # Fix JWT Role Synchronization for RLS Policies

  ## Problem
  - Users table has role field but JWT tokens don't contain role in app_metadata
  - RLS policies rely on get_user_role() which checks JWT claims first
  - This causes "new row violates row-level security policy" errors

  ## Solution
  1. Create trigger to sync user role to auth.users.raw_app_meta_data
  2. Update existing users to have role in app_metadata
  3. Improve get_user_role() function reliability

  ## Changes
  - Add handle_user_role_change trigger function
  - Create trigger on users table to sync roles automatically
  - Update existing users' app_metadata with their current roles
*/

-- Create function to sync user role to auth.users app_metadata
CREATE OR REPLACE FUNCTION public.handle_user_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Update the auth.users raw_app_meta_data with the role
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_user_role_change ON users;

-- Create trigger to automatically sync role changes
CREATE TRIGGER on_user_role_change
  AFTER INSERT OR UPDATE OF role ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_role_change();

-- Sync existing users' roles to auth.users app_metadata
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id, role FROM users LOOP
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', user_record.role)
    WHERE id = user_record.id;
  END LOOP;
END $$;

-- Improve get_user_role function to be more reliable
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE
  user_role TEXT;
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Return 'public' if not authenticated
  IF current_user_id IS NULL THEN
    RETURN 'public';
  END IF;
  
  -- First try to get role from JWT app_metadata
  BEGIN
    user_role := current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role';
  EXCEPTION WHEN OTHERS THEN
    user_role := NULL;
  END;
  
  -- If not in JWT app_metadata, try top-level role claim
  IF user_role IS NULL THEN
    BEGIN
      user_role := current_setting('request.jwt.claims', true)::json->>'role';
    EXCEPTION WHEN OTHERS THEN
      user_role := NULL;
    END;
  END IF;
  
  -- If still not found, get from users table
  IF user_role IS NULL THEN
    SELECT role INTO user_role
    FROM users
    WHERE id = current_user_id;
  END IF;
  
  -- Default to 'public' if no role found
  RETURN COALESCE(user_role, 'public');
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.handle_user_role_change() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated, anon;

-- Add helpful comment
COMMENT ON FUNCTION public.handle_user_role_change() IS 
  'Automatically syncs user role from users table to auth.users app_metadata for JWT claims';
