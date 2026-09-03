/*
  # Consolidate Redundant Permissive Policies

  1. Problem
    - Tables have policies for role 'public' (applies to everyone including authenticated)
    - Plus separate policies for role 'authenticated'
    - This causes authenticated users to evaluate both policies unnecessarily
    
  2. Solution
    - Replace 'public' role policies with 'anon' role policies
    - Keep 'authenticated' role policies as-is
    - This eliminates redundant policy evaluation for authenticated users
    
  3. Tables Affected
    - amenities, asset_types, blocks, estates, floors, regions, room_types, rooms
    
  4. Tables NOT Changed
    - bookings, properties, ad_hoc_links, users (multiple policies serve different purposes)
*/

-- =========================
-- AMENITIES
-- =========================
DROP POLICY IF EXISTS "Anyone can view active amenities" ON amenities;

CREATE POLICY "Anonymous users can view active amenities"
  ON amenities FOR SELECT
  TO anon
  USING (is_active = true);

-- =========================
-- ASSET_TYPES
-- =========================
DROP POLICY IF EXISTS "Anyone can view active asset types" ON asset_types;

CREATE POLICY "Anonymous users can view active asset types"
  ON asset_types FOR SELECT
  TO anon
  USING (is_active = true);

-- =========================
-- BLOCKS
-- =========================
DROP POLICY IF EXISTS "Anyone can view active blocks" ON blocks;

CREATE POLICY "Anonymous users can view active blocks"
  ON blocks FOR SELECT
  TO anon
  USING (is_active = true);

-- =========================
-- ESTATES
-- =========================
DROP POLICY IF EXISTS "Anyone can view active estates" ON estates;

CREATE POLICY "Anonymous users can view active estates"
  ON estates FOR SELECT
  TO anon
  USING (is_active = true);

-- =========================
-- FLOORS
-- =========================
DROP POLICY IF EXISTS "Anyone can view active floors" ON floors;

CREATE POLICY "Anonymous users can view active floors"
  ON floors FOR SELECT
  TO anon
  USING (is_active = true);

-- =========================
-- REGIONS
-- =========================
DROP POLICY IF EXISTS "Anyone can view active regions" ON regions;

CREATE POLICY "Anonymous users can view active regions"
  ON regions FOR SELECT
  TO anon
  USING (is_active = true);

-- =========================
-- ROOM_TYPES
-- =========================
DROP POLICY IF EXISTS "Anyone can view active room types" ON room_types;

CREATE POLICY "Anonymous users can view active room types"
  ON room_types FOR SELECT
  TO anon
  USING (is_active = true);

-- =========================
-- ROOMS
-- =========================
DROP POLICY IF EXISTS "Anyone can view active rooms" ON rooms;

CREATE POLICY "Anonymous users can view active rooms"
  ON rooms FOR SELECT
  TO anon
  USING (is_active = true);

-- Now each table has:
-- 1. Policy for 'anon' role (unauthenticated users see active items only)
-- 2. Policy for 'authenticated' role (authenticated users see all items)
-- 3. No overlap, no redundant evaluation
