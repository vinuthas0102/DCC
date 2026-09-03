/*
  # Create Modules and Property Types Master Tables

  This migration creates the module system to differentiate between Government Facilities and Other Facilities,
  along with property types master table for categorizing facilities.

  ## 1. New Tables

  ### `modules`
  - `id` (uuid, primary key) - Unique identifier for module
  - `name` (text, unique) - Module name (e.g., "Govt Facilities")
  - `code` (text, unique) - Module code for system reference
  - `description` (text) - Detailed description of module
  - `is_active` (boolean) - Whether module is active
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `property_types`
  - `id` (uuid, primary key) - Unique identifier for property type
  - `module_id` (uuid, foreign key) - Link to parent module
  - `name` (text) - Property type name (e.g., "Community Hall")
  - `code` (text) - Property type code for system reference
  - `description` (text) - Description of property type
  - `is_active` (boolean) - Whether property type is active
  - `sort_order` (integer) - Display order
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Security

  - Enable RLS on both tables
  - Allow public read access (authenticated and anon users can view)
  - Restrict write operations to admin users only

  ## 3. Indexes

  - Unique index on modules.code
  - Unique index on modules.name
  - Index on property_types.module_id for efficient lookups
  - Unique index on property_types (module_id, code) combination
  - Index on property_types.is_active for filtering
*/

-- Create modules table
CREATE TABLE IF NOT EXISTS modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  code text UNIQUE NOT NULL,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create property_types table
CREATE TABLE IF NOT EXISTS property_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE RESTRICT,
  name text NOT NULL,
  code text NOT NULL,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_property_type_per_module UNIQUE (module_id, code)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_property_types_module_id ON property_types(module_id);
CREATE INDEX IF NOT EXISTS idx_property_types_is_active ON property_types(is_active);
CREATE INDEX IF NOT EXISTS idx_modules_is_active ON modules(is_active);

-- Enable RLS
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies for modules table
-- Allow all authenticated and anonymous users to read modules
CREATE POLICY "Anyone can view active modules"
  ON modules FOR SELECT
  USING (is_active = true);

-- Only admin users can insert modules
CREATE POLICY "Admin users can insert modules"
  ON modules FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Only admin users can update modules
CREATE POLICY "Admin users can update modules"
  ON modules FOR UPDATE
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

-- Only admin users can delete modules
CREATE POLICY "Admin users can delete modules"
  ON modules FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for property_types table
-- Allow all authenticated and anonymous users to read property types
CREATE POLICY "Anyone can view active property types"
  ON property_types FOR SELECT
  USING (is_active = true);

-- Only admin users can insert property types
CREATE POLICY "Admin users can insert property types"
  ON property_types FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Only admin users can update property types
CREATE POLICY "Admin users can update property types"
  ON property_types FOR UPDATE
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

-- Only admin users can delete property types
CREATE POLICY "Admin users can delete property types"
  ON property_types FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );