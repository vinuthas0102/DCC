/*
  # Optimize RLS Policies for Auth Function Initialization

  1. Performance Improvements
    - Wrap auth.uid() and get_user_role() in SELECT to prevent re-evaluation per row
    - Significantly improves query performance at scale
    
  2. Tables Affected
    - regions, estates, asset_types, properties
    - blocks, floors, rooms, room_types
    - amenities, users, bookings, booking_allocations
    - transactions, audit_logs, ad_hoc_links
    - designation_master, date_blocks, date_block_ranges, date_block_rules
    - property_date_overrides, modules, property_types
    
  3. Changes
    - Replace auth.uid() with (SELECT auth.uid())
    - Replace get_user_role() with (SELECT get_user_role())
    - Maintains exact same security logic
*/

-- =========================
-- REGIONS TABLE
-- =========================

DROP POLICY IF EXISTS "Admins can delete regions" ON regions;
DROP POLICY IF EXISTS "Admins can insert regions" ON regions;
DROP POLICY IF EXISTS "Admins can update regions" ON regions;

CREATE POLICY "Admins can delete regions"
  ON regions FOR DELETE
  TO authenticated
  USING ((SELECT get_user_role()) = 'admin');

CREATE POLICY "Admins can insert regions"
  ON regions FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT get_user_role()) = 'admin');

CREATE POLICY "Admins can update regions"
  ON regions FOR UPDATE
  TO authenticated
  USING ((SELECT get_user_role()) = 'admin')
  WITH CHECK ((SELECT get_user_role()) = 'admin');

-- =========================
-- ESTATES TABLE
-- =========================

DROP POLICY IF EXISTS "Admins and managers can insert estates" ON estates;
DROP POLICY IF EXISTS "Admins and managers can update estates" ON estates;
DROP POLICY IF EXISTS "Admins can delete estates" ON estates;

CREATE POLICY "Admins and managers can insert estates"
  ON estates FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can update estates"
  ON estates FOR UPDATE
  TO authenticated
  USING ((SELECT get_user_role()) IN ('admin', 'manager'))
  WITH CHECK ((SELECT get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Admins can delete estates"
  ON estates FOR DELETE
  TO authenticated
  USING ((SELECT get_user_role()) = 'admin');

-- =========================
-- ASSET_TYPES TABLE
-- =========================

DROP POLICY IF EXISTS "Admins and managers can insert asset types" ON asset_types;
DROP POLICY IF EXISTS "Admins and managers can update asset types" ON asset_types;
DROP POLICY IF EXISTS "Admins can delete asset types" ON asset_types;

CREATE POLICY "Admins and managers can insert asset types"
  ON asset_types FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can update asset types"
  ON asset_types FOR UPDATE
  TO authenticated
  USING ((SELECT get_user_role()) IN ('admin', 'manager'))
  WITH CHECK ((SELECT get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Admins can delete asset types"
  ON asset_types FOR DELETE
  TO authenticated
  USING ((SELECT get_user_role()) = 'admin');

-- =========================
-- PROPERTIES TABLE
-- =========================

DROP POLICY IF EXISTS "Admins and managers can insert properties" ON properties;
DROP POLICY IF EXISTS "Admins and managers can update properties" ON properties;
DROP POLICY IF EXISTS "Admins can delete properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can view all properties based on role" ON properties;

CREATE POLICY "Admins and managers can insert properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can update properties"
  ON properties FOR UPDATE
  TO authenticated
  USING ((SELECT get_user_role()) IN ('admin', 'manager'))
  WITH CHECK ((SELECT get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Admins can delete properties"
  ON properties FOR DELETE
  TO authenticated
  USING ((SELECT get_user_role()) = 'admin');

CREATE POLICY "Authenticated users can view all properties based on role"
  ON properties FOR SELECT
  TO authenticated
  USING ((SELECT get_user_role()) IN ('admin', 'manager', 'govt_official', 'dept_user'));

-- =========================
-- BLOCKS TABLE
-- =========================

DROP POLICY IF EXISTS "Admins and managers can delete blocks" ON blocks;
DROP POLICY IF EXISTS "Admins and managers can insert blocks" ON blocks;
DROP POLICY IF EXISTS "Admins and managers can update blocks" ON blocks;

CREATE POLICY "Admins and managers can delete blocks"
  ON blocks FOR DELETE
  TO authenticated
  USING ((SELECT get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can insert blocks"
  ON blocks FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can update blocks"
  ON blocks FOR UPDATE
  TO authenticated
  USING ((SELECT get_user_role()) IN ('admin', 'manager'))
  WITH CHECK ((SELECT get_user_role()) IN ('admin', 'manager'));

-- =========================
-- FLOORS TABLE
-- =========================

DROP POLICY IF EXISTS "Admins and managers can delete floors" ON floors;
DROP POLICY IF EXISTS "Admins and managers can insert floors" ON floors;
DROP POLICY IF EXISTS "Admins and managers can update floors" ON floors;

CREATE POLICY "Admins and managers can delete floors"
  ON floors FOR DELETE
  TO authenticated
  USING ((SELECT get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can insert floors"
  ON floors FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can update floors"
  ON floors FOR UPDATE
  TO authenticated
  USING ((SELECT get_user_role()) IN ('admin', 'manager'))
  WITH CHECK ((SELECT get_user_role()) IN ('admin', 'manager'));

-- =========================
-- ROOM_TYPES TABLE
-- =========================

DROP POLICY IF EXISTS "Admins can delete room types" ON room_types;
DROP POLICY IF EXISTS "Admins can insert room types" ON room_types;
DROP POLICY IF EXISTS "Admins can update room types" ON room_types;

CREATE POLICY "Admins can delete room types"
  ON room_types FOR DELETE
  TO authenticated
  USING ((SELECT get_user_role()) = 'admin');

CREATE POLICY "Admins can insert room types"
  ON room_types FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT get_user_role()) = 'admin');

CREATE POLICY "Admins can update room types"
  ON room_types FOR UPDATE
  TO authenticated
  USING ((SELECT get_user_role()) = 'admin')
  WITH CHECK ((SELECT get_user_role()) = 'admin');

-- =========================
-- ROOMS TABLE
-- =========================

DROP POLICY IF EXISTS "Admins and managers can delete rooms" ON rooms;
DROP POLICY IF EXISTS "Admins and managers can insert rooms" ON rooms;
DROP POLICY IF EXISTS "Admins and managers can update rooms" ON rooms;
DROP POLICY IF EXISTS "Managers can view all rooms" ON rooms;

CREATE POLICY "Admins and managers can delete rooms"
  ON rooms FOR DELETE
  TO authenticated
  USING ((SELECT get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can insert rooms"
  ON rooms FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can update rooms"
  ON rooms FOR UPDATE
  TO authenticated
  USING ((SELECT get_user_role()) IN ('admin', 'manager'))
  WITH CHECK ((SELECT get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Managers can view all rooms"
  ON rooms FOR SELECT
  TO authenticated
  USING ((SELECT get_user_role()) IN ('admin', 'manager'));

-- =========================
-- AMENITIES TABLE
-- =========================

DROP POLICY IF EXISTS "Admins can delete amenities" ON amenities;
DROP POLICY IF EXISTS "Admins can insert amenities" ON amenities;
DROP POLICY IF EXISTS "Admins can update amenities" ON amenities;

CREATE POLICY "Admins can delete amenities"
  ON amenities FOR DELETE
  TO authenticated
  USING ((SELECT get_user_role()) = 'admin');

CREATE POLICY "Admins can insert amenities"
  ON amenities FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT get_user_role()) = 'admin');

CREATE POLICY "Admins can update amenities"
  ON amenities FOR UPDATE
  TO authenticated
  USING ((SELECT get_user_role()) = 'admin')
  WITH CHECK ((SELECT get_user_role()) = 'admin');

-- =========================
-- USERS TABLE
-- =========================

DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;

CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  TO authenticated
  USING ((SELECT get_user_role()) = 'admin');

CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT get_user_role()) = 'admin');

CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  TO authenticated
  USING ((SELECT get_user_role()) = 'admin')
  WITH CHECK ((SELECT get_user_role()) = 'admin');

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING ((SELECT get_user_role()) = 'admin');

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

-- =========================
-- BOOKINGS TABLE
-- =========================

DROP POLICY IF EXISTS "Authenticated users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Managers can update bookings" ON bookings;
DROP POLICY IF EXISTS "Managers can view bookings for their properties" ON bookings;
DROP POLICY IF EXISTS "Users can cancel own requested bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update own pending bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;

CREATE POLICY "Authenticated users can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Managers can update bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING ((SELECT get_user_role()) IN ('admin', 'manager'))
  WITH CHECK ((SELECT get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Managers can view bookings for their properties"
  ON bookings FOR SELECT
  TO authenticated
  USING ((SELECT get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Users can cancel own requested bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()) AND status = 'REQUESTED')
  WITH CHECK (user_id = (SELECT auth.uid()) AND status IN ('CANCELLED'));

CREATE POLICY "Users can update own pending bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()) AND status IN ('REQUESTED', 'PROVISIONED'))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- =========================
-- BOOKING_ALLOCATIONS TABLE
-- =========================

DROP POLICY IF EXISTS "Managers can create allocations" ON booking_allocations;
DROP POLICY IF EXISTS "Managers can update allocations" ON booking_allocations;
DROP POLICY IF EXISTS "Users can view allocations for their bookings" ON booking_allocations;

CREATE POLICY "Managers can create allocations"
  ON booking_allocations FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Managers can update allocations"
  ON booking_allocations FOR UPDATE
  TO authenticated
  USING ((SELECT get_user_role()) IN ('admin', 'manager'))
  WITH CHECK ((SELECT get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Users can view allocations for their bookings"
  ON booking_allocations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = booking_allocations.booking_id 
      AND bookings.user_id = (SELECT auth.uid())
    )
  );

-- =========================
-- TRANSACTIONS TABLE
-- =========================

DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = transactions.booking_id 
      AND bookings.user_id = (SELECT auth.uid())
    )
  );

-- =========================
-- AUDIT_LOGS TABLE
-- =========================

DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;

CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING ((SELECT get_user_role()) = 'admin');

-- =========================
-- AD_HOC_LINKS TABLE
-- =========================

DROP POLICY IF EXISTS "Managers can create ad-hoc links" ON ad_hoc_links;
DROP POLICY IF EXISTS "Managers can view own ad-hoc links" ON ad_hoc_links;

CREATE POLICY "Managers can create ad-hoc links"
  ON ad_hoc_links FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Managers can view own ad-hoc links"
  ON ad_hoc_links FOR SELECT
  TO authenticated
  USING (manager_id = (SELECT auth.uid()));

-- =========================
-- DESIGNATION_MASTER TABLE
-- =========================

DROP POLICY IF EXISTS "Admin users can delete designations" ON designation_master;
DROP POLICY IF EXISTS "Admin users can insert designations" ON designation_master;
DROP POLICY IF EXISTS "Admin users can update designations" ON designation_master;

CREATE POLICY "Admin users can delete designations"
  ON designation_master FOR DELETE
  TO authenticated
  USING ((SELECT get_user_role()) = 'admin');

CREATE POLICY "Admin users can insert designations"
  ON designation_master FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT get_user_role()) = 'admin');

CREATE POLICY "Admin users can update designations"
  ON designation_master FOR UPDATE
  TO authenticated
  USING ((SELECT get_user_role()) = 'admin')
  WITH CHECK ((SELECT get_user_role()) = 'admin');

-- =========================
-- DATE_BLOCKS TABLE
-- =========================

DROP POLICY IF EXISTS "Admins and managers can delete date blocks" ON date_blocks;
DROP POLICY IF EXISTS "Admins and managers can insert date blocks" ON date_blocks;
DROP POLICY IF EXISTS "Admins and managers can update date blocks" ON date_blocks;

CREATE POLICY "Admins and managers can delete date blocks"
  ON date_blocks FOR DELETE
  TO authenticated
  USING ((SELECT get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can insert date blocks"
  ON date_blocks FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can update date blocks"
  ON date_blocks FOR UPDATE
  TO authenticated
  USING ((SELECT get_user_role()) IN ('admin', 'manager'))
  WITH CHECK ((SELECT get_user_role()) IN ('admin', 'manager'));

-- =========================
-- DATE_BLOCK_RANGES TABLE
-- =========================

DROP POLICY IF EXISTS "Admins and managers can delete date block ranges" ON date_block_ranges;
DROP POLICY IF EXISTS "Admins and managers can insert date block ranges" ON date_block_ranges;
DROP POLICY IF EXISTS "Admins and managers can update date block ranges" ON date_block_ranges;

CREATE POLICY "Admins and managers can delete date block ranges"
  ON date_block_ranges FOR DELETE
  TO authenticated
  USING ((SELECT get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can insert date block ranges"
  ON date_block_ranges FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can update date block ranges"
  ON date_block_ranges FOR UPDATE
  TO authenticated
  USING ((SELECT get_user_role()) IN ('admin', 'manager'))
  WITH CHECK ((SELECT get_user_role()) IN ('admin', 'manager'));

-- =========================
-- DATE_BLOCK_RULES TABLE
-- =========================

DROP POLICY IF EXISTS "Admins and managers can delete date block rules" ON date_block_rules;
DROP POLICY IF EXISTS "Admins and managers can insert date block rules" ON date_block_rules;
DROP POLICY IF EXISTS "Admins and managers can update date block rules" ON date_block_rules;

CREATE POLICY "Admins and managers can delete date block rules"
  ON date_block_rules FOR DELETE
  TO authenticated
  USING ((SELECT get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can insert date block rules"
  ON date_block_rules FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can update date block rules"
  ON date_block_rules FOR UPDATE
  TO authenticated
  USING ((SELECT get_user_role()) IN ('admin', 'manager'))
  WITH CHECK ((SELECT get_user_role()) IN ('admin', 'manager'));

-- =========================
-- PROPERTY_DATE_OVERRIDES TABLE
-- =========================

DROP POLICY IF EXISTS "Admins and managers can delete property date overrides" ON property_date_overrides;
DROP POLICY IF EXISTS "Admins and managers can insert property date overrides" ON property_date_overrides;
DROP POLICY IF EXISTS "Admins and managers can update property date overrides" ON property_date_overrides;

CREATE POLICY "Admins and managers can delete property date overrides"
  ON property_date_overrides FOR DELETE
  TO authenticated
  USING ((SELECT get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can insert property date overrides"
  ON property_date_overrides FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can update property date overrides"
  ON property_date_overrides FOR UPDATE
  TO authenticated
  USING ((SELECT get_user_role()) IN ('admin', 'manager'))
  WITH CHECK ((SELECT get_user_role()) IN ('admin', 'manager'));

-- =========================
-- MODULES TABLE
-- =========================

DROP POLICY IF EXISTS "Admin users can delete modules" ON modules;
DROP POLICY IF EXISTS "Admin users can insert modules" ON modules;
DROP POLICY IF EXISTS "Admin users can update modules" ON modules;

CREATE POLICY "Admin users can delete modules"
  ON modules FOR DELETE
  TO authenticated
  USING ((SELECT get_user_role()) = 'admin');

CREATE POLICY "Admin users can insert modules"
  ON modules FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT get_user_role()) = 'admin');

CREATE POLICY "Admin users can update modules"
  ON modules FOR UPDATE
  TO authenticated
  USING ((SELECT get_user_role()) = 'admin')
  WITH CHECK ((SELECT get_user_role()) = 'admin');

-- =========================
-- PROPERTY_TYPES TABLE
-- =========================

DROP POLICY IF EXISTS "Admin users can delete property types" ON property_types;
DROP POLICY IF EXISTS "Admin users can insert property types" ON property_types;
DROP POLICY IF EXISTS "Admin users can update property types" ON property_types;

CREATE POLICY "Admin users can delete property types"
  ON property_types FOR DELETE
  TO authenticated
  USING ((SELECT get_user_role()) = 'admin');

CREATE POLICY "Admin users can insert property types"
  ON property_types FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT get_user_role()) = 'admin');

CREATE POLICY "Admin users can update property types"
  ON property_types FOR UPDATE
  TO authenticated
  USING ((SELECT get_user_role()) = 'admin')
  WITH CHECK ((SELECT get_user_role()) = 'admin');
