/*
  # Create Designation Master Table

  1. New Tables
    - `designation_master`
      - `id` (uuid, primary key)
      - `designation_name` (text, unique) - Name of the designation (e.g., CEO, General Manager)
      - `designation_code` (text, unique) - Short code for the designation
      - `level` (integer) - Hierarchy level (1 = highest, increasing numbers = lower levels)
      - `description` (text) - Description of the designation
      - `is_active` (boolean) - Whether this designation is currently active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `designation_master` table
    - Add policy for authenticated users to read designations
    - Add policy for admin users to manage designations

  3. Notes
    - Lower level numbers indicate higher seniority (CEO = 1, Officer = 5, etc.)
    - This will be used for controlling access to special date blocked rooms
*/

CREATE TABLE IF NOT EXISTS designation_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  designation_name text UNIQUE NOT NULL,
  designation_code text UNIQUE NOT NULL,
  level integer NOT NULL DEFAULT 999,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE designation_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view designations"
  ON designation_master FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can insert designations"
  ON designation_master FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin users can update designations"
  ON designation_master FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin users can delete designations"
  ON designation_master FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_designation_master_level ON designation_master(level);
CREATE INDEX IF NOT EXISTS idx_designation_master_is_active ON designation_master(is_active);