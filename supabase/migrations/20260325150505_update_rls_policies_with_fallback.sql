/*
  # Update RLS Policies with Role Fallback

  ## Problem
  Existing sessions don't have role in JWT, causing API failures

  ## Solution
  Update RLS policies to check both JWT claims and users table as fallback

  ## Changes
  - Update all policies that check auth.jwt()->>'role'
  - Add fallback to get_user_role() helper function
  - Ensures backward compatibility with existing sessions

  ## Security
  - Maintains all existing security constraints
  - Uses helper function with SECURITY DEFINER for safe access
*/

-- Update regions policies
DROP POLICY IF EXISTS "Admins can insert regions" ON regions;
CREATE POLICY "Admins can insert regions"
  ON regions FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(auth.jwt()->>'role', get_user_role()) = 'admin'
  );

DROP POLICY IF EXISTS "Admins can update regions" ON regions;
CREATE POLICY "Admins can update regions"
  ON regions FOR UPDATE
  TO authenticated
  USING (COALESCE(auth.jwt()->>'role', get_user_role()) = 'admin')
  WITH CHECK (COALESCE(auth.jwt()->>'role', get_user_role()) = 'admin');

DROP POLICY IF EXISTS "Admins can delete regions" ON regions;
CREATE POLICY "Admins can delete regions"
  ON regions FOR DELETE
  TO authenticated
  USING (COALESCE(auth.jwt()->>'role', get_user_role()) = 'admin');

-- Update estates policies
DROP POLICY IF EXISTS "Admins and managers can insert estates" ON estates;
CREATE POLICY "Admins and managers can insert estates"
  ON estates FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(auth.jwt()->>'role', get_user_role()) IN ('admin', 'manager')
  );

DROP POLICY IF EXISTS "Admins and managers can update estates" ON estates;
CREATE POLICY "Admins and managers can update estates"
  ON estates FOR UPDATE
  TO authenticated
  USING (COALESCE(auth.jwt()->>'role', get_user_role()) IN ('admin', 'manager'))
  WITH CHECK (COALESCE(auth.jwt()->>'role', get_user_role()) IN ('admin', 'manager'));

DROP POLICY IF EXISTS "Admins can delete estates" ON estates;
CREATE POLICY "Admins can delete estates"
  ON estates FOR DELETE
  TO authenticated
  USING (COALESCE(auth.jwt()->>'role', get_user_role()) = 'admin');

-- Update asset_types policies
DROP POLICY IF EXISTS "Admins can manage asset types" ON asset_types;

CREATE POLICY "Admins can insert asset types"
  ON asset_types FOR INSERT
  TO authenticated
  WITH CHECK (COALESCE(auth.jwt()->>'role', get_user_role()) = 'admin');

CREATE POLICY "Admins can update asset types"
  ON asset_types FOR UPDATE
  TO authenticated
  USING (COALESCE(auth.jwt()->>'role', get_user_role()) = 'admin')
  WITH CHECK (COALESCE(auth.jwt()->>'role', get_user_role()) = 'admin');

CREATE POLICY "Admins can delete asset types"
  ON asset_types FOR DELETE
  TO authenticated
  USING (COALESCE(auth.jwt()->>'role', get_user_role()) = 'admin');

-- Update properties policies
DROP POLICY IF EXISTS "Authenticated users can view all properties based on role" ON properties;
CREATE POLICY "Authenticated users can view all properties based on role"
  ON properties FOR SELECT
  TO authenticated
  USING (
    CASE 
      WHEN COALESCE(auth.jwt()->>'role', get_user_role()) IN ('admin', 'manager') THEN true
      WHEN COALESCE(auth.jwt()->>'role', get_user_role()) = 'govt_official' THEN true
      ELSE status = 'PUBLISHED' AND is_exempt = false
    END
  );

DROP POLICY IF EXISTS "Admins and managers can insert properties" ON properties;
CREATE POLICY "Admins and managers can insert properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (COALESCE(auth.jwt()->>'role', get_user_role()) IN ('admin', 'manager'));

DROP POLICY IF EXISTS "Admins and managers can update properties" ON properties;
CREATE POLICY "Admins and managers can update properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (COALESCE(auth.jwt()->>'role', get_user_role()) IN ('admin', 'manager'))
  WITH CHECK (COALESCE(auth.jwt()->>'role', get_user_role()) IN ('admin', 'manager'));

DROP POLICY IF EXISTS "Admins can delete properties" ON properties;
CREATE POLICY "Admins can delete properties"
  ON properties FOR DELETE
  TO authenticated
  USING (COALESCE(auth.jwt()->>'role', get_user_role()) = 'admin');

-- Update blocks policies
DROP POLICY IF EXISTS "Admins and managers can manage blocks" ON blocks;

CREATE POLICY "Admins and managers can insert blocks"
  ON blocks FOR INSERT
  TO authenticated
  WITH CHECK (COALESCE(auth.jwt()->>'role', get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can update blocks"
  ON blocks FOR UPDATE
  TO authenticated
  USING (COALESCE(auth.jwt()->>'role', get_user_role()) IN ('admin', 'manager'))
  WITH CHECK (COALESCE(auth.jwt()->>'role', get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can delete blocks"
  ON blocks FOR DELETE
  TO authenticated
  USING (COALESCE(auth.jwt()->>'role', get_user_role()) IN ('admin', 'manager'));

-- Update floors policies
DROP POLICY IF EXISTS "Admins and managers can manage floors" ON floors;

CREATE POLICY "Admins and managers can insert floors"
  ON floors FOR INSERT
  TO authenticated
  WITH CHECK (COALESCE(auth.jwt()->>'role', get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can update floors"
  ON floors FOR UPDATE
  TO authenticated
  USING (COALESCE(auth.jwt()->>'role', get_user_role()) IN ('admin', 'manager'))
  WITH CHECK (COALESCE(auth.jwt()->>'role', get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can delete floors"
  ON floors FOR DELETE
  TO authenticated
  USING (COALESCE(auth.jwt()->>'role', get_user_role()) IN ('admin', 'manager'));

-- Update room_types policies
DROP POLICY IF EXISTS "Admins can manage room types" ON room_types;

CREATE POLICY "Admins can insert room types"
  ON room_types FOR INSERT
  TO authenticated
  WITH CHECK (COALESCE(auth.jwt()->>'role', get_user_role()) = 'admin');

CREATE POLICY "Admins can update room types"
  ON room_types FOR UPDATE
  TO authenticated
  USING (COALESCE(auth.jwt()->>'role', get_user_role()) = 'admin')
  WITH CHECK (COALESCE(auth.jwt()->>'role', get_user_role()) = 'admin');

CREATE POLICY "Admins can delete room types"
  ON room_types FOR DELETE
  TO authenticated
  USING (COALESCE(auth.jwt()->>'role', get_user_role()) = 'admin');

-- Update rooms policies
DROP POLICY IF EXISTS "Admins and managers can manage rooms" ON rooms;

CREATE POLICY "Admins and managers can insert rooms"
  ON rooms FOR INSERT
  TO authenticated
  WITH CHECK (COALESCE(auth.jwt()->>'role', get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can update rooms"
  ON rooms FOR UPDATE
  TO authenticated
  USING (COALESCE(auth.jwt()->>'role', get_user_role()) IN ('admin', 'manager'))
  WITH CHECK (COALESCE(auth.jwt()->>'role', get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can delete rooms"
  ON rooms FOR DELETE
  TO authenticated
  USING (COALESCE(auth.jwt()->>'role', get_user_role()) IN ('admin', 'manager'));

-- Update amenities policies
DROP POLICY IF EXISTS "Admins can manage amenities" ON amenities;

CREATE POLICY "Admins can insert amenities"
  ON amenities FOR INSERT
  TO authenticated
  WITH CHECK (COALESCE(auth.jwt()->>'role', get_user_role()) = 'admin');

CREATE POLICY "Admins can update amenities"
  ON amenities FOR UPDATE
  TO authenticated
  USING (COALESCE(auth.jwt()->>'role', get_user_role()) = 'admin')
  WITH CHECK (COALESCE(auth.jwt()->>'role', get_user_role()) = 'admin');

CREATE POLICY "Admins can delete amenities"
  ON amenities FOR DELETE
  TO authenticated
  USING (COALESCE(auth.jwt()->>'role', get_user_role()) = 'admin');
