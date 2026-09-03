/*
  # Remove Unused Indexes to Reduce Write Overhead

  1. Performance Improvements
    - Drop indexes that haven't been used and are unlikely to be needed
    - Reduces overhead on INSERT, UPDATE, and DELETE operations
    - Keeps foreign key indexes and commonly-filtered columns
    
  2. Indexes Being Dropped
    - Highly specific filters that are rarely queried alone
    - Redundant indexes covered by other access patterns
    
  3. Indexes Being Kept
    - All foreign key indexes (critical for FK constraint performance)
    - Status and is_active columns (common filters)
    - Date range columns (common in booking queries)
    - Booking number and lookup columns (essential for user operations)
*/

-- Drop unused indexes that are unlikely to be needed

-- Rooms: special_date_restricted is too specific
DROP INDEX IF EXISTS idx_rooms_special_date_restricted;

-- Asset types: module filtering is rare without other conditions
DROP INDEX IF EXISTS idx_asset_types_module_id;

-- Properties: These are redundant - properties are typically queried 
-- by more specific criteria or full-text search
DROP INDEX IF EXISTS idx_properties_estate;
DROP INDEX IF EXISTS idx_properties_asset_type;
DROP INDEX IF EXISTS idx_properties_module_id;
DROP INDEX IF EXISTS idx_properties_property_type_id;

-- Estates: coordinates index for GIS - if not using spatial queries, drop it
DROP INDEX IF EXISTS idx_estates_coordinates;

-- Audit logs: record-based index is too broad
DROP INDEX IF EXISTS idx_audit_logs_record;

-- Users: role and designation are rarely queried alone
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_users_designation_id;

-- Date block rules: asset_type filtering is typically combined with dates
DROP INDEX IF EXISTS idx_date_block_rules_asset_type;

-- Note: Keeping the following indexes even though currently unused:
-- - All foreign key indexes (prevent FK constraint slowdowns)
-- - idx_rooms_status (common filter for availability)
-- - idx_bookings_dates (essential for date range queries)
-- - idx_bookings_number (used for booking lookup)
-- - idx_bookings_guest_lookup (used for OTP-based guest access)
-- - idx_bookings_is_guest (filters guest vs authenticated bookings)
-- - idx_property_types_is_active (common filter)
-- - idx_designation_master_is_active (common filter)
-- - idx_date_block_ranges_dates (essential for date blocking logic)
