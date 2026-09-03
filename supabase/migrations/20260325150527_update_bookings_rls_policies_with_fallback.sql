/*
  # Update Bookings-related RLS Policies with Role Fallback

  ## Changes
  Update all booking-related policies to check both JWT claims and users table

  ## Tables Updated
  - users
  - bookings
  - booking_allocations
  - transactions
  - audit_logs
  - ad_hoc_links
*/

-- Update users policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (COALESCE(auth.jwt()->>'role', get_user_role()) = 'admin');

DROP POLICY IF EXISTS "Admins can manage users" ON users;

CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (COALESCE(auth.jwt()->>'role', get_user_role()) = 'admin');

CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (COALESCE(auth.jwt()->>'role', get_user_role()) = 'admin')
  WITH CHECK (COALESCE(auth.jwt()->>'role', get_user_role()) = 'admin');

CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (COALESCE(auth.jwt()->>'role', get_user_role()) = 'admin');

-- Update bookings policies
DROP POLICY IF EXISTS "Managers can view bookings for their properties" ON bookings;
CREATE POLICY "Managers can view bookings for their properties"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    COALESCE(auth.jwt()->>'role', get_user_role()) IN ('manager', 'admin')
    OR auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Managers can update bookings" ON bookings;
CREATE POLICY "Managers can update bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (COALESCE(auth.jwt()->>'role', get_user_role()) IN ('manager', 'admin'))
  WITH CHECK (COALESCE(auth.jwt()->>'role', get_user_role()) IN ('manager', 'admin'));

-- Update booking_allocations policies
DROP POLICY IF EXISTS "Users can view allocations for their bookings" ON booking_allocations;
CREATE POLICY "Users can view allocations for their bookings"
  ON booking_allocations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = booking_allocations.booking_id 
      AND bookings.user_id = auth.uid()
    )
    OR COALESCE(auth.jwt()->>'role', get_user_role()) IN ('manager', 'admin')
  );

DROP POLICY IF EXISTS "Managers can create allocations" ON booking_allocations;
CREATE POLICY "Managers can create allocations"
  ON booking_allocations FOR INSERT
  TO authenticated
  WITH CHECK (COALESCE(auth.jwt()->>'role', get_user_role()) IN ('manager', 'admin'));

DROP POLICY IF EXISTS "Managers can update allocations" ON booking_allocations;
CREATE POLICY "Managers can update allocations"
  ON booking_allocations FOR UPDATE
  TO authenticated
  USING (COALESCE(auth.jwt()->>'role', get_user_role()) IN ('manager', 'admin'))
  WITH CHECK (COALESCE(auth.jwt()->>'role', get_user_role()) IN ('manager', 'admin'));

-- Update transactions policies
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = transactions.booking_id 
      AND bookings.user_id = auth.uid()
    )
    OR COALESCE(auth.jwt()->>'role', get_user_role()) IN ('manager', 'admin')
  );

-- Update audit_logs policies
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (COALESCE(auth.jwt()->>'role', get_user_role()) = 'admin');

-- Update ad_hoc_links policies
DROP POLICY IF EXISTS "Managers can view own ad-hoc links" ON ad_hoc_links;
CREATE POLICY "Managers can view own ad-hoc links"
  ON ad_hoc_links FOR SELECT
  TO authenticated
  USING (
    auth.uid() = manager_id 
    OR COALESCE(auth.jwt()->>'role', get_user_role()) = 'admin'
  );

DROP POLICY IF EXISTS "Managers can create ad-hoc links" ON ad_hoc_links;
CREATE POLICY "Managers can create ad-hoc links"
  ON ad_hoc_links FOR INSERT
  TO authenticated
  WITH CHECK (COALESCE(auth.jwt()->>'role', get_user_role()) IN ('manager', 'admin'));
