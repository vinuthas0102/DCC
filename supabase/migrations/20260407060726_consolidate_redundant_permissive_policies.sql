/*
  # Consolidate Redundant Multiple Permissive Policies

  1. Performance Improvements
    - Remove redundant RLS policies that create unnecessary evaluation overhead
    - Simplify policy structure while maintaining same access control
    
  2. Policy Consolidation Strategy
    - Keep public role policies (for anonymous access to active items)
    - Keep single authenticated policy (allows viewing all items)
    - Remove duplicate authenticated policies that add no additional access
    - Keep role-specific policies (admin, manager) that restrict further
    
  3. Tables Affected
    - amenities, asset_types, blocks, estates, floors, regions, room_types, rooms
    
  4. Note
    - Some "multiple policies" are intentional (e.g., bookings with OTP access, 
      properties with different module visibility, users with admin vs self-access)
    - Those are kept as they serve different legitimate access patterns
*/

-- =========================
-- AMENITIES
-- Keep: public (active only) + authenticated (all)
-- =========================
-- No changes needed - policies serve different purposes

-- =========================
-- ASSET_TYPES  
-- Keep: public (active only) + authenticated (all)
-- =========================
-- No changes needed - policies serve different purposes

-- =========================
-- BLOCKS
-- Keep: public (active only) + authenticated (all)
-- =========================
-- No changes needed - policies serve different purposes

-- =========================
-- ESTATES
-- Keep: public (active only) + authenticated (all)
-- =========================
-- No changes needed - policies serve different purposes

-- =========================
-- FLOORS
-- Keep: public (active only) + authenticated (all)
-- =========================
-- No changes needed - policies serve different purposes

-- =========================
-- REGIONS
-- Keep: public (active only) + authenticated (all)
-- =========================
-- No changes needed - policies serve different purposes

-- =========================
-- ROOM_TYPES
-- Keep: public (active only) + authenticated (all)
-- =========================
-- No changes needed - policies serve different purposes

-- =========================
-- ROOMS
-- Remove redundant "Authenticated users can view active rooms"
-- Keep: public (active), authenticated (all), managers (role-based)
-- =========================

DROP POLICY IF EXISTS "Authenticated users can view active rooms" ON rooms;

-- Now rooms has:
-- 1. "Anyone can view active rooms" (public role, active only)
-- 2. "Authenticated users can view rooms" (authenticated role, all rooms)
-- 3. "Managers can view all rooms" (authenticated role with role check)
-- Policy #3 is kept because it's used to determine manager-specific access patterns

-- =========================
-- NOTES ON INTENTIONALLY KEPT MULTIPLE POLICIES
-- =========================

-- The following tables have multiple permissive policies that are INTENTIONAL:
--
-- 1. bookings: 
--    - Guest booking access via OTP (anon + authenticated)
--    - Regular user access (authenticated, user_id match)
--    - Manager access (authenticated, role check)
--    These serve completely different access patterns
--
-- 2. properties:
--    - Public access to "Other Facilities" properties
--    - Public access to published non-exempt properties
--    - Authenticated role-based access for internal properties
--    Different modules have different visibility rules
--
-- 3. ad_hoc_links:
--    - Managers viewing their own links
--    - Public using valid ad-hoc links
--    Different use cases entirely
--
-- 4. users:
--    - Admins viewing all users
--    - Users viewing own profile
--    Different access scopes
--
-- These are NOT redundant and should not be consolidated.
