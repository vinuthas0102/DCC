/*
  # Add Module and Property Type References

  This migration extends the existing asset_types and properties tables to link them to the new module system.

  ## 1. Schema Changes

  ### Modified Tables: `asset_types`
  - Add `module_id` (uuid, nullable initially, foreign key to modules)
  - Will be populated with data migration, then can be made required

  ### Modified Tables: `properties`
  - Add `module_id` (uuid, nullable initially, foreign key to modules)
  - Add `property_type_id` (uuid, nullable initially, foreign key to property_types)
  - These will be populated based on existing data, then can be made required

  ## 2. Indexes
  - Index on asset_types.module_id for efficient filtering
  - Index on properties.module_id for efficient filtering
  - Index on properties.property_type_id for efficient filtering

  ## 3. Notes
  - Columns are nullable initially to allow data migration
  - Foreign keys use ON DELETE RESTRICT to prevent accidental deletion
  - After data migration, columns can be made NOT NULL if desired
*/

-- Add module_id to asset_types table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'asset_types' AND column_name = 'module_id'
  ) THEN
    ALTER TABLE asset_types ADD COLUMN module_id uuid REFERENCES modules(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- Add module_id and property_type_id to properties table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'module_id'
  ) THEN
    ALTER TABLE properties ADD COLUMN module_id uuid REFERENCES modules(id) ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'property_type_id'
  ) THEN
    ALTER TABLE properties ADD COLUMN property_type_id uuid REFERENCES property_types(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_asset_types_module_id ON asset_types(module_id);
CREATE INDEX IF NOT EXISTS idx_properties_module_id ON properties(module_id);
CREATE INDEX IF NOT EXISTS idx_properties_property_type_id ON properties(property_type_id);