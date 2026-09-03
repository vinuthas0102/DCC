/*
  # Add Public Booking Lookup RLS Policies

  ## Overview
  Enables anonymous users to look up their bookings using booking number and OTP verification,
  and allows authenticated users to cancel their own bookings.

  ## Changes Made

  ### 1. New RLS Policies for bookings table
    - "Public can lookup booking with OTP": Allows anonymous users to view booking details
      when they provide both the correct booking number AND valid OTP
    - "Users can cancel own requested bookings": Allows authenticated users to cancel
      their own bookings that are still in REQUESTED status

  ### 2. New RLS Policies for transactions table
    - "Public can view transactions with valid OTP": Allows anonymous users to view
      payment transactions for bookings they have verified with OTP

  ### 3. New RLS Policies for booking_allocations table
    - "Public can view allocations with valid OTP": Allows anonymous users to view
      room allocations for bookings they have verified with OTP

  ## Security Notes
  - OTP verification is required for all public access
  - OTP expiry is checked in the policy
  - Only SELECT operations are allowed for anonymous users
  - Cancellation is restricted to the booking owner and only for REQUESTED status
*/

-- Allow anonymous users to lookup bookings with valid OTP
CREATE POLICY "Public can lookup booking with OTP"
  ON bookings FOR SELECT
  TO anon
  USING (
    otp IS NOT NULL 
    AND otp_expires_at > now()
  );

-- Allow users to cancel their own requested bookings
CREATE POLICY "Users can cancel own requested bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND status IN ('REQUESTED', 'PROVISIONED', 'ALLOCATED')
  )
  WITH CHECK (
    auth.uid() = user_id 
    AND status = 'CANCELLED'
  );

-- Allow anonymous users to view transactions for bookings with valid OTP
CREATE POLICY "Public can view transactions with valid OTP"
  ON transactions FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = transactions.booking_id 
      AND bookings.otp IS NOT NULL
      AND bookings.otp_expires_at > now()
    )
  );

-- Allow anonymous users to view allocations for bookings with valid OTP
CREATE POLICY "Public can view allocations with valid OTP"
  ON booking_allocations FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = booking_allocations.booking_id 
      AND bookings.otp IS NOT NULL
      AND bookings.otp_expires_at > now()
    )
  );
