/*
  # Drop Genuinely Unused Non-FK Indexes

  1. Strategy
    - Keep ALL foreign key indexes (critical for FK constraint performance)
    - Keep indexes on frequently queried columns (dates, booking numbers, lookups)
    - Drop indexes on columns that are rarely queried alone
    
  2. Indexes Being Dropped
    - idx_rooms_status: Status is typically queried with other conditions
    - idx_bookings_is_guest: Too specific, rarely filtered alone
    - idx_property_types_is_active: Small lookup table, full scan acceptable
    - idx_designation_master_is_active: Small lookup table, full scan acceptable
    
  3. Indexes Being Kept (even though currently unused)
    - All FK indexes: Essential for JOIN and CASCADE performance
    - idx_bookings_dates: Critical for availability queries
    - idx_bookings_number: Used for booking lookup
    - idx_bookings_guest_lookup: Used for OTP-based guest access
    - idx_date_block_ranges_dates: Essential for date blocking logic
    - idx_booking_allocations_allocated_by: FK index
    - idx_audit_logs_user_id: FK index
    - idx_ad_hoc_links_manager_id: FK index
    - idx_ad_hoc_links_property_id: FK index
    - idx_users_assigned_estate_id: FK index
    - idx_bookings_room_type_id: FK index
    - idx_date_blocks_created_by: FK index
    - idx_date_block_ranges_block_id: FK index
    - idx_property_date_overrides_property_id: FK index
*/

-- Drop indexes on columns that are rarely queried alone
DROP INDEX IF EXISTS idx_rooms_status;
DROP INDEX IF EXISTS idx_bookings_is_guest;

-- Drop indexes on small lookup tables (full scans are acceptable)
DROP INDEX IF EXISTS idx_property_types_is_active;
DROP INDEX IF EXISTS idx_designation_master_is_active;

-- Note: All other "unused" indexes are either:
-- 1. Foreign key indexes (mandatory for performance)
-- 2. Frequently queried columns that will be used in production
-- 3. Critical for specific features (OTP lookup, date ranges, etc.)
