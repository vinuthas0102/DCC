-- Step 1: Create extensions schema and get_user_role function
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;

CREATE OR REPLACE FUNCTION extensions.get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE
  user_role TEXT;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN 'public';
  END IF;
  BEGIN
    user_role := current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role';
  EXCEPTION WHEN OTHERS THEN
    user_role := NULL;
  END;
  IF user_role IS NULL THEN
    BEGIN
      user_role := current_setting('request.jwt.claims', true)::json->>'role';
    EXCEPTION WHEN OTHERS THEN
      user_role := NULL;
    END;
  END IF;
  IF user_role IS NULL THEN
    SELECT role INTO user_role FROM public.users WHERE id = current_user_id;
  END IF;
  RETURN COALESCE(user_role, 'public');
END;
$$;

REVOKE ALL ON FUNCTION extensions.get_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION extensions.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION extensions.get_user_role() TO service_role;

-- Step 2: Drop all policies that depend on public.get_user_role()
DROP POLICY IF EXISTS "Admins can delete regions" ON regions;
DROP POLICY IF EXISTS "Admins can insert regions" ON regions;
DROP POLICY IF EXISTS "Admins can update regions" ON regions;
DROP POLICY IF EXISTS "Admins and managers can insert estates" ON estates;
DROP POLICY IF EXISTS "Admins and managers can update estates" ON estates;
DROP POLICY IF EXISTS "Admins can delete estates" ON estates;
DROP POLICY IF EXISTS "Admins and managers can insert asset types" ON asset_types;
DROP POLICY IF EXISTS "Admins and managers can update asset types" ON asset_types;
DROP POLICY IF EXISTS "Admins can delete asset types" ON asset_types;
DROP POLICY IF EXISTS "Admins and managers can insert properties" ON properties;
DROP POLICY IF EXISTS "Admins and managers can update properties" ON properties;
DROP POLICY IF EXISTS "Admins can delete properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can view all properties based on role" ON properties;
DROP POLICY IF EXISTS "Admins and managers can delete blocks" ON blocks;
DROP POLICY IF EXISTS "Admins and managers can insert blocks" ON blocks;
DROP POLICY IF EXISTS "Admins and managers can update blocks" ON blocks;
DROP POLICY IF EXISTS "Admins and managers can delete floors" ON floors;
DROP POLICY IF EXISTS "Admins and managers can insert floors" ON floors;
DROP POLICY IF EXISTS "Admins and managers can update floors" ON floors;
DROP POLICY IF EXISTS "Admins can delete room types" ON room_types;
DROP POLICY IF EXISTS "Admins can insert room types" ON room_types;
DROP POLICY IF EXISTS "Admins can update room types" ON room_types;
DROP POLICY IF EXISTS "Admins and managers can delete rooms" ON rooms;
DROP POLICY IF EXISTS "Admins and managers can insert rooms" ON rooms;
DROP POLICY IF EXISTS "Admins and managers can update rooms" ON rooms;
DROP POLICY IF EXISTS "Managers can view all rooms" ON rooms;
DROP POLICY IF EXISTS "Admins can delete amenities" ON amenities;
DROP POLICY IF EXISTS "Admins can insert amenities" ON amenities;
DROP POLICY IF EXISTS "Admins can update amenities" ON amenities;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Managers can update bookings" ON bookings;
DROP POLICY IF EXISTS "Managers can view bookings for their properties" ON bookings;
DROP POLICY IF EXISTS "Managers can create allocations" ON booking_allocations;
DROP POLICY IF EXISTS "Managers can update allocations" ON booking_allocations;
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Managers can create ad-hoc links" ON ad_hoc_links;
DROP POLICY IF EXISTS "Admin users can delete designations" ON designation_master;
DROP POLICY IF EXISTS "Admin users can insert designations" ON designation_master;
DROP POLICY IF EXISTS "Admin users can update designations" ON designation_master;
DROP POLICY IF EXISTS "Admins and managers can delete date blocks" ON date_blocks;
DROP POLICY IF EXISTS "Admins and managers can insert date blocks" ON date_blocks;
DROP POLICY IF EXISTS "Admins and managers can update date blocks" ON date_blocks;
DROP POLICY IF EXISTS "Admins and managers can delete date block ranges" ON date_block_ranges;
DROP POLICY IF EXISTS "Admins and managers can insert date block ranges" ON date_block_ranges;
DROP POLICY IF EXISTS "Admins and managers can update date block ranges" ON date_block_ranges;
DROP POLICY IF EXISTS "Admins and managers can delete date block rules" ON date_block_rules;
DROP POLICY IF EXISTS "Admins and managers can insert date block rules" ON date_block_rules;
DROP POLICY IF EXISTS "Admins and managers can update date block rules" ON date_block_rules;
DROP POLICY IF EXISTS "Admins and managers can delete property date overrides" ON property_date_overrides;
DROP POLICY IF EXISTS "Admins and managers can insert property date overrides" ON property_date_overrides;
DROP POLICY IF EXISTS "Admins and managers can update property date overrides" ON property_date_overrides;
DROP POLICY IF EXISTS "Admin users can delete modules" ON modules;
DROP POLICY IF EXISTS "Admin users can insert modules" ON modules;
DROP POLICY IF EXISTS "Admin users can update modules" ON modules;
DROP POLICY IF EXISTS "Admin users can delete property types" ON property_types;
DROP POLICY IF EXISTS "Admin users can insert property types" ON property_types;
DROP POLICY IF EXISTS "Admin users can update property types" ON property_types;

-- Step 3: Now drop the old public.get_user_role()
REVOKE ALL ON FUNCTION public.get_user_role() FROM PUBLIC, anon, authenticated, service_role;
DROP FUNCTION IF EXISTS public.get_user_role();

-- Step 4: Recreate all policies using extensions.get_user_role()
CREATE POLICY "Admins can delete regions" ON regions FOR DELETE TO authenticated USING ((SELECT extensions.get_user_role()) = 'admin');
CREATE POLICY "Admins can insert regions" ON regions FOR INSERT TO authenticated WITH CHECK ((SELECT extensions.get_user_role()) = 'admin');
CREATE POLICY "Admins can update regions" ON regions FOR UPDATE TO authenticated USING ((SELECT extensions.get_user_role()) = 'admin') WITH CHECK ((SELECT extensions.get_user_role()) = 'admin');
CREATE POLICY "Admins and managers can insert estates" ON estates FOR INSERT TO authenticated WITH CHECK ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Admins and managers can update estates" ON estates FOR UPDATE TO authenticated USING ((SELECT extensions.get_user_role()) IN ('admin', 'manager')) WITH CHECK ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Admins can delete estates" ON estates FOR DELETE TO authenticated USING ((SELECT extensions.get_user_role()) = 'admin');
CREATE POLICY "Admins and managers can insert asset types" ON asset_types FOR INSERT TO authenticated WITH CHECK ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Admins and managers can update asset types" ON asset_types FOR UPDATE TO authenticated USING ((SELECT extensions.get_user_role()) IN ('admin', 'manager')) WITH CHECK ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Admins can delete asset types" ON asset_types FOR DELETE TO authenticated USING ((SELECT extensions.get_user_role()) = 'admin');
CREATE POLICY "Admins and managers can insert properties" ON properties FOR INSERT TO authenticated WITH CHECK ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Admins and managers can update properties" ON properties FOR UPDATE TO authenticated USING ((SELECT extensions.get_user_role()) IN ('admin', 'manager')) WITH CHECK ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Admins can delete properties" ON properties FOR DELETE TO authenticated USING ((SELECT extensions.get_user_role()) = 'admin');
CREATE POLICY "Authenticated users can view all properties based on role" ON properties FOR SELECT TO authenticated USING ((SELECT extensions.get_user_role()) IN ('admin', 'manager', 'govt_official', 'dept_user'));
CREATE POLICY "Admins and managers can delete blocks" ON blocks FOR DELETE TO authenticated USING ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Admins and managers can insert blocks" ON blocks FOR INSERT TO authenticated WITH CHECK ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Admins and managers can update blocks" ON blocks FOR UPDATE TO authenticated USING ((SELECT extensions.get_user_role()) IN ('admin', 'manager')) WITH CHECK ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Admins and managers can delete floors" ON floors FOR DELETE TO authenticated USING ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Admins and managers can insert floors" ON floors FOR INSERT TO authenticated WITH CHECK ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Admins and managers can update floors" ON floors FOR UPDATE TO authenticated USING ((SELECT extensions.get_user_role()) IN ('admin', 'manager')) WITH CHECK ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Admins can delete room types" ON room_types FOR DELETE TO authenticated USING ((SELECT extensions.get_user_role()) = 'admin');
CREATE POLICY "Admins can insert room types" ON room_types FOR INSERT TO authenticated WITH CHECK ((SELECT extensions.get_user_role()) = 'admin');
CREATE POLICY "Admins can update room types" ON room_types FOR UPDATE TO authenticated USING ((SELECT extensions.get_user_role()) = 'admin') WITH CHECK ((SELECT extensions.get_user_role()) = 'admin');
CREATE POLICY "Admins and managers can delete rooms" ON rooms FOR DELETE TO authenticated USING ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Admins and managers can insert rooms" ON rooms FOR INSERT TO authenticated WITH CHECK ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Admins and managers can update rooms" ON rooms FOR UPDATE TO authenticated USING ((SELECT extensions.get_user_role()) IN ('admin', 'manager')) WITH CHECK ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Managers can view all rooms" ON rooms FOR SELECT TO authenticated USING ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Admins can delete amenities" ON amenities FOR DELETE TO authenticated USING ((SELECT extensions.get_user_role()) = 'admin');
CREATE POLICY "Admins can insert amenities" ON amenities FOR INSERT TO authenticated WITH CHECK ((SELECT extensions.get_user_role()) = 'admin');
CREATE POLICY "Admins can update amenities" ON amenities FOR UPDATE TO authenticated USING ((SELECT extensions.get_user_role()) = 'admin') WITH CHECK ((SELECT extensions.get_user_role()) = 'admin');
CREATE POLICY "Admins can delete users" ON users FOR DELETE TO authenticated USING ((SELECT extensions.get_user_role()) = 'admin');
CREATE POLICY "Admins can insert users" ON users FOR INSERT TO authenticated WITH CHECK ((SELECT extensions.get_user_role()) = 'admin');
CREATE POLICY "Admins can update users" ON users FOR UPDATE TO authenticated USING ((SELECT extensions.get_user_role()) = 'admin') WITH CHECK ((SELECT extensions.get_user_role()) = 'admin');
CREATE POLICY "Admins can view all users" ON users FOR SELECT TO authenticated USING ((SELECT extensions.get_user_role()) = 'admin');
CREATE POLICY "Users can update own profile" ON users FOR UPDATE TO authenticated USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY "Users can view own profile" ON users FOR SELECT TO authenticated USING (id = (SELECT auth.uid()));
CREATE POLICY "Managers can update bookings" ON bookings FOR UPDATE TO authenticated USING ((SELECT extensions.get_user_role()) IN ('admin', 'manager')) WITH CHECK ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Managers can view bookings for their properties" ON bookings FOR SELECT TO authenticated USING ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Managers can create allocations" ON booking_allocations FOR INSERT TO authenticated WITH CHECK ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Managers can update allocations" ON booking_allocations FOR UPDATE TO authenticated USING ((SELECT extensions.get_user_role()) IN ('admin', 'manager')) WITH CHECK ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT TO authenticated USING ((SELECT extensions.get_user_role()) = 'admin');
CREATE POLICY "Managers can create ad-hoc links" ON ad_hoc_links FOR INSERT TO authenticated WITH CHECK ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Admin users can delete designations" ON designation_master FOR DELETE TO authenticated USING ((SELECT extensions.get_user_role()) = 'admin');
CREATE POLICY "Admin users can insert designations" ON designation_master FOR INSERT TO authenticated WITH CHECK ((SELECT extensions.get_user_role()) = 'admin');
CREATE POLICY "Admin users can update designations" ON designation_master FOR UPDATE TO authenticated USING ((SELECT extensions.get_user_role()) = 'admin') WITH CHECK ((SELECT extensions.get_user_role()) = 'admin');
CREATE POLICY "Admins and managers can delete date blocks" ON date_blocks FOR DELETE TO authenticated USING ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Admins and managers can insert date blocks" ON date_blocks FOR INSERT TO authenticated WITH CHECK ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Admins and managers can update date blocks" ON date_blocks FOR UPDATE TO authenticated USING ((SELECT extensions.get_user_role()) IN ('admin', 'manager')) WITH CHECK ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Admins and managers can delete date block ranges" ON date_block_ranges FOR DELETE TO authenticated USING ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Admins and managers can insert date block ranges" ON date_block_ranges FOR INSERT TO authenticated WITH CHECK ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Admins and managers can update date block ranges" ON date_block_ranges FOR UPDATE TO authenticated USING ((SELECT extensions.get_user_role()) IN ('admin', 'manager')) WITH CHECK ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Admins and managers can delete date block rules" ON date_block_rules FOR DELETE TO authenticated USING ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Admins and managers can insert date block rules" ON date_block_rules FOR INSERT TO authenticated WITH CHECK ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Admins and managers can update date block rules" ON date_block_rules FOR UPDATE TO authenticated USING ((SELECT extensions.get_user_role()) IN ('admin', 'manager')) WITH CHECK ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Admins and managers can delete property date overrides" ON property_date_overrides FOR DELETE TO authenticated USING ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Admins and managers can insert property date overrides" ON property_date_overrides FOR INSERT TO authenticated WITH CHECK ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Admins and managers can update property date overrides" ON property_date_overrides FOR UPDATE TO authenticated USING ((SELECT extensions.get_user_role()) IN ('admin', 'manager')) WITH CHECK ((SELECT extensions.get_user_role()) IN ('admin', 'manager'));
CREATE POLICY "Admin users can delete modules" ON modules FOR DELETE TO authenticated USING ((SELECT extensions.get_user_role()) = 'admin');
CREATE POLICY "Admin users can insert modules" ON modules FOR INSERT TO authenticated WITH CHECK ((SELECT extensions.get_user_role()) = 'admin');
CREATE POLICY "Admin users can update modules" ON modules FOR UPDATE TO authenticated USING ((SELECT extensions.get_user_role()) = 'admin') WITH CHECK ((SELECT extensions.get_user_role()) = 'admin');
CREATE POLICY "Admin users can delete property types" ON property_types FOR DELETE TO authenticated USING ((SELECT extensions.get_user_role()) = 'admin');
CREATE POLICY "Admin users can insert property types" ON property_types FOR INSERT TO authenticated WITH CHECK ((SELECT extensions.get_user_role()) = 'admin');
CREATE POLICY "Admin users can update property types" ON property_types FOR UPDATE TO authenticated USING ((SELECT extensions.get_user_role()) = 'admin') WITH CHECK ((SELECT extensions.get_user_role()) = 'admin');