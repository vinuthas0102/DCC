/*
  # Add Missing Foreign Key Indexes for Performance

  1. Performance Improvements
    - Add indexes on foreign key columns that lack them
    - Improves JOIN performance and foreign key constraint checking
    
  2. Tables Affected
    - ad_hoc_links: manager_id, property_id
    - audit_logs: user_id
    - booking_allocations: allocated_by
    - bookings: room_type_id
    - date_block_ranges: block_id
    - date_blocks: created_by
    - property_date_overrides: property_id
    - users: assigned_estate_id
    
  3. Security
    - No RLS changes, purely performance optimization
*/

-- Add index for ad_hoc_links.manager_id
CREATE INDEX IF NOT EXISTS idx_ad_hoc_links_manager_id 
ON ad_hoc_links(manager_id);

-- Add index for ad_hoc_links.property_id
CREATE INDEX IF NOT EXISTS idx_ad_hoc_links_property_id 
ON ad_hoc_links(property_id);

-- Add index for audit_logs.user_id
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id 
ON audit_logs(user_id);

-- Add index for booking_allocations.allocated_by
CREATE INDEX IF NOT EXISTS idx_booking_allocations_allocated_by 
ON booking_allocations(allocated_by);

-- Add index for bookings.room_type_id
CREATE INDEX IF NOT EXISTS idx_bookings_room_type_id 
ON bookings(room_type_id);

-- Add index for date_block_ranges.block_id
CREATE INDEX IF NOT EXISTS idx_date_block_ranges_block_id 
ON date_block_ranges(block_id);

-- Add index for date_blocks.created_by
CREATE INDEX IF NOT EXISTS idx_date_blocks_created_by 
ON date_blocks(created_by);

-- Add index for property_date_overrides.property_id
CREATE INDEX IF NOT EXISTS idx_property_date_overrides_property_id 
ON property_date_overrides(property_id);

-- Add index for users.assigned_estate_id
CREATE INDEX IF NOT EXISTS idx_users_assigned_estate_id 
ON users(assigned_estate_id);
