/*
  # Add Missing Foreign Key Indexes

  1. Performance Improvements
    - Add indexes for all foreign key columns to optimize JOIN operations
    - Improves foreign key constraint check performance
    - Essential for CASCADE operations
    
  2. Indexes Being Added
    - asset_types.module_id
    - date_block_rules.asset_type_id
    - properties.asset_type_id
    - properties.estate_id
    - properties.module_id
    - properties.property_type_id
    - users.designation_id
    
  3. Important Note
    - Foreign key columns should ALWAYS have indexes
    - Without indexes, FK constraint checks cause full table scans
    - Critical for query performance when joining tables
*/

-- Asset types foreign key
CREATE INDEX IF NOT EXISTS idx_asset_types_module_id 
  ON asset_types(module_id);

-- Date block rules foreign key
CREATE INDEX IF NOT EXISTS idx_date_block_rules_asset_type_id 
  ON date_block_rules(asset_type_id);

-- Properties foreign keys
CREATE INDEX IF NOT EXISTS idx_properties_asset_type_id 
  ON properties(asset_type_id);

CREATE INDEX IF NOT EXISTS idx_properties_estate_id 
  ON properties(estate_id);

CREATE INDEX IF NOT EXISTS idx_properties_module_id 
  ON properties(module_id);

CREATE INDEX IF NOT EXISTS idx_properties_property_type_id 
  ON properties(property_type_id);

-- Users foreign key
CREATE INDEX IF NOT EXISTS idx_users_designation_id 
  ON users(designation_id);
