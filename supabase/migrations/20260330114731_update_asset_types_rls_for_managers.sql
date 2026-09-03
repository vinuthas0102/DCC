/*
  # Update Asset Types RLS Policies for Manager Role

  ## Overview
  This migration updates the Row Level Security policies for the `asset_types` table to allow
  managers to create and update asset types, aligning with the permissions model used for other
  reference tables like `estates`.

  ## Changes
  1. Drop existing INSERT policy (admin-only)
  2. Create new INSERT policy allowing both admin and manager roles
  3. Drop existing UPDATE policy (admin-only)
  4. Create new UPDATE policy allowing both admin and manager roles
  5. Keep DELETE policy as admin-only for data integrity

  ## Security Model
  - SELECT: All authenticated users (read access)
  - INSERT: Admin and Manager roles (creation rights)
  - UPDATE: Admin and Manager roles (modification rights)
  - DELETE: Admin only (prevent accidental deletion)

  ## Rationale
  Property managers need the ability to configure asset types to properly categorize and manage
  properties. This change provides consistency with other reference tables and reduces the
  administrative burden on admin users.
*/

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Admins can insert asset types" ON asset_types;

-- Create new INSERT policy for admins and managers
CREATE POLICY "Admins and managers can insert asset types"
  ON asset_types
  FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(
      (auth.jwt() -> 'app_metadata' ->> 'role'),
      get_user_role()
    ) = ANY(ARRAY['admin', 'manager'])
  );

-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "Admins can update asset types" ON asset_types;

-- Create new UPDATE policy for admins and managers
CREATE POLICY "Admins and managers can update asset types"
  ON asset_types
  FOR UPDATE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'app_metadata' ->> 'role'),
      get_user_role()
    ) = ANY(ARRAY['admin', 'manager'])
  )
  WITH CHECK (
    COALESCE(
      (auth.jwt() -> 'app_metadata' ->> 'role'),
      get_user_role()
    ) = ANY(ARRAY['admin', 'manager'])
  );

-- Keep DELETE policy as admin-only (no changes needed)
-- Existing policy: "Admins can delete asset types"
