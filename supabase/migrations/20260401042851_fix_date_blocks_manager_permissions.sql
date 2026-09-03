/*
  # Fix Date Blocks Permissions for Managers

  This migration updates the Row Level Security (RLS) policies for the date blocking system
  to allow managers to create and manage date blocks.

  ## Problem
  The existing policies referenced a non-existent 'estate_officer' role, preventing managers
  from creating date blocks despite having access to the admin panel.

  ## Changes
  1. Updated date_blocks table policies
    - Replaced 'estate_officer' with 'manager' role
    - Allows admins and managers to insert, update, and delete date blocks

  2. Updated date_block_ranges table policies
    - Replaced 'estate_officer' with 'manager' role
    - Allows admins and managers to manage date ranges

  3. Updated date_block_rules table policies
    - Replaced 'estate_officer' with 'manager' role
    - Allows admins and managers to manage blocking rules

  4. Updated property_date_overrides table policies
    - Replaced 'estate_officer' with 'manager' role
    - Allows admins and managers to manage property-specific overrides

  ## Security
  - All tables maintain RLS protection
  - Only authenticated admins and managers can modify date blocks
  - All users can view date blocks (needed for booking eligibility checks)
*/

-- Drop existing policies for date_blocks
DROP POLICY IF EXISTS "Admin and estate officers can insert date blocks" ON date_blocks;
DROP POLICY IF EXISTS "Admin and estate officers can update date blocks" ON date_blocks;
DROP POLICY IF EXISTS "Admin and estate officers can delete date blocks" ON date_blocks;

-- Create updated policies for date_blocks
CREATE POLICY "Admins and managers can insert date blocks"
  ON date_blocks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins and managers can update date blocks"
  ON date_blocks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins and managers can delete date blocks"
  ON date_blocks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- Drop existing policies for date_block_ranges
DROP POLICY IF EXISTS "Admin and estate officers can manage date block ranges" ON date_block_ranges;

-- Create updated policies for date_block_ranges (split FOR ALL into separate policies)
CREATE POLICY "Admins and managers can insert date block ranges"
  ON date_block_ranges FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins and managers can update date block ranges"
  ON date_block_ranges FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins and managers can delete date block ranges"
  ON date_block_ranges FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- Drop existing policies for date_block_rules
DROP POLICY IF EXISTS "Admin and estate officers can manage date block rules" ON date_block_rules;

-- Create updated policies for date_block_rules (split FOR ALL into separate policies)
CREATE POLICY "Admins and managers can insert date block rules"
  ON date_block_rules FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins and managers can update date block rules"
  ON date_block_rules FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins and managers can delete date block rules"
  ON date_block_rules FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- Drop existing policies for property_date_overrides
DROP POLICY IF EXISTS "Admin and estate officers can manage property date overrides" ON property_date_overrides;

-- Create updated policies for property_date_overrides (split FOR ALL into separate policies)
CREATE POLICY "Admins and managers can insert property date overrides"
  ON property_date_overrides FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins and managers can update property date overrides"
  ON property_date_overrides FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins and managers can delete property date overrides"
  ON property_date_overrides FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );