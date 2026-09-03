/*
  # Create Date Blocking System Tables

  1. New Tables
    - `date_blocks`
      - `id` (uuid, primary key)
      - `block_name` (text) - Name of the date block (e.g., "Republic Day 2026")
      - `description` (text) - Description of the blocking period
      - `created_by` (uuid) - User who created this block
      - `is_active` (boolean) - Whether this block is currently active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `date_block_ranges`
      - `id` (uuid, primary key)
      - `block_id` (uuid) - Foreign key to date_blocks
      - `start_date` (date) - Start date of the blocking period
      - `end_date` (date) - End date of the blocking period
      - `created_at` (timestamptz)

    - `date_block_rules`
      - `id` (uuid, primary key)
      - `block_id` (uuid) - Foreign key to date_blocks
      - `asset_type_id` (uuid) - Foreign key to asset_types (which properties are affected)
      - `room_type_ids` (jsonb) - Array of room type IDs that are restricted
      - `allowed_designations` (jsonb) - Array of designation IDs that can bypass the block
      - `created_at` (timestamptz)

    - `property_date_overrides`
      - `id` (uuid, primary key)
      - `block_id` (uuid) - Foreign key to date_blocks
      - `property_id` (uuid) - Foreign key to properties
      - `override_type` (text) - Either 'ALLOW' or 'BLOCK'
      - `allowed_designations` (jsonb) - Specific designations allowed for this property
      - `room_type_ids` (jsonb) - Specific room types affected by override
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Authenticated users can view date blocks and rules
    - Only admins and estate officers can create/modify blocks

  3. Notes
    - This system allows blocking specific room types at specific properties during special dates
    - Property overrides allow fine-grained control over individual properties
    - Designations control which users can book during blocked periods
*/

CREATE TABLE IF NOT EXISTS date_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_name text NOT NULL,
  description text DEFAULT '',
  created_by uuid REFERENCES users(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS date_block_ranges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id uuid REFERENCES date_blocks(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS date_block_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id uuid REFERENCES date_blocks(id) ON DELETE CASCADE,
  asset_type_id uuid REFERENCES asset_types(id),
  room_type_ids jsonb DEFAULT '[]'::jsonb,
  allowed_designations jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS property_date_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id uuid REFERENCES date_blocks(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  override_type text NOT NULL CHECK (override_type IN ('ALLOW', 'BLOCK')),
  allowed_designations jsonb DEFAULT '[]'::jsonb,
  room_type_ids jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE date_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE date_block_ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE date_block_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_date_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view date blocks"
  ON date_blocks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and estate officers can insert date blocks"
  ON date_blocks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'estate_officer')
    )
  );

CREATE POLICY "Admin and estate officers can update date blocks"
  ON date_blocks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'estate_officer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'estate_officer')
    )
  );

CREATE POLICY "Admin and estate officers can delete date blocks"
  ON date_blocks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'estate_officer')
    )
  );

CREATE POLICY "Authenticated users can view date block ranges"
  ON date_block_ranges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and estate officers can manage date block ranges"
  ON date_block_ranges FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'estate_officer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'estate_officer')
    )
  );

CREATE POLICY "Authenticated users can view date block rules"
  ON date_block_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and estate officers can manage date block rules"
  ON date_block_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'estate_officer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'estate_officer')
    )
  );

CREATE POLICY "Authenticated users can view property date overrides"
  ON property_date_overrides FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and estate officers can manage property date overrides"
  ON property_date_overrides FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'estate_officer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'estate_officer')
    )
  );

CREATE INDEX IF NOT EXISTS idx_date_block_ranges_dates ON date_block_ranges(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_date_block_rules_block_id ON date_block_rules(block_id);
CREATE INDEX IF NOT EXISTS idx_date_block_rules_asset_type ON date_block_rules(asset_type_id);
CREATE INDEX IF NOT EXISTS idx_property_overrides_block_property ON property_date_overrides(block_id, property_id);