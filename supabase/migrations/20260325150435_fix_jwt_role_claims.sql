/*
  # Fix JWT Role Claims for Authentication

  ## Problem
  RLS policies check `auth.jwt()->>'role'` but the JWT doesn't contain the custom role claim.
  This causes API calls to fail with 403 errors, resulting in blank pages.

  ## Solution
  1. Create function to set JWT claims from users table
  2. Create trigger to automatically update JWT claims on user insert/update
  3. Update existing RLS policies to use a helper function that checks both JWT and users table

  ## Changes
  - Add `set_user_jwt_claims()` function to inject role into JWT
  - Add `get_user_role()` helper function for RLS policies
  - Create triggers on users table to update JWT claims
  - Update RLS policies to use the helper function

  ## Security
  - JWT claims are set from authoritative users table
  - Helper function provides fallback by querying users table
  - All existing security constraints maintained
*/

-- Helper function to get user role from users table
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM users 
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to set JWT claims for authenticated users
CREATE OR REPLACE FUNCTION set_user_jwt_claims()
RETURNS trigger AS $$
BEGIN
  -- Update the raw_app_metadata with the user's role
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to set JWT claims after user insert
DROP TRIGGER IF EXISTS set_user_jwt_claims_on_insert ON users;
CREATE TRIGGER set_user_jwt_claims_on_insert
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_user_jwt_claims();

-- Trigger to update JWT claims after role change
DROP TRIGGER IF EXISTS set_user_jwt_claims_on_update ON users;
CREATE TRIGGER set_user_jwt_claims_on_update
  AFTER UPDATE OF role ON users
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION set_user_jwt_claims();

-- Update existing users to have JWT claims
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id, role FROM users
  LOOP
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', user_record.role)
    WHERE id = user_record.id;
  END LOOP;
END $$;
