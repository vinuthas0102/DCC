/*
  # Remove Truly Redundant Permissive Policies

  1. Problem
    - Some tables have multiple authenticated policies where one is a subset of another
    - This causes unnecessary policy evaluation overhead
    
  2. Policies Being Removed
    - rooms: "Managers can view all rooms" (redundant with "Authenticated users can view rooms")
    - properties: "Authenticated users can view all properties based on role" (redundant with "Authenticated users can view properties")
    - bookings: "Users can cancel own requested bookings" (subset of "Users can update own pending bookings")
    
  3. Policies Being Kept
    - users: Admin vs self-access policies serve different purposes
    - bookings: User vs manager access policies serve different purposes
    - ad_hoc_links: Manager vs public policies serve different purposes
    
  4. Note
    - After this migration, authenticated users will still have the same effective access
    - We're just removing redundant policy evaluations that waste CPU cycles
*/

-- Remove redundant manager policy on rooms
-- "Authenticated users can view rooms" already allows ALL authenticated users
DROP POLICY IF EXISTS "Managers can view all rooms" ON rooms;

-- Remove redundant role-based policy on properties
-- "Authenticated users can view properties" already allows ALL authenticated users
DROP POLICY IF EXISTS "Authenticated users can view all properties based on role" ON properties;

-- Remove redundant cancel policy on bookings
-- "Users can update own pending bookings" covers REQUESTED status (which includes cancellation)
DROP POLICY IF EXISTS "Users can cancel own requested bookings" ON bookings;

-- Result:
-- rooms: 1 anon policy + 1 authenticated policy (no redundancy)
-- properties: Public policies for specific modules + 1 broad authenticated policy
-- bookings: Separate policies for users (own bookings) vs managers (all bookings) - intentional
-- users: Separate policies for admins (all users) vs users (own profile) - intentional
