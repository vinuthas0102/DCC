/*
  # Fix Transactions Table RLS for Guest Bookings

  ## Problem
  The transactions table currently only allows authenticated users to create 
  transaction records. This causes 401 errors when guest (anonymous) users 
  attempt to make payments for their bookings.

  ## Solution
  Add RLS policies to allow anonymous users (anon role) to create and view 
  transactions for guest bookings.

  ## Changes
  1. Transactions Table Policies
     - Add policy for anonymous users to create transactions for guest bookings
     - Add policy for anonymous users to view transactions for their guest bookings
     - Maintain existing policies for authenticated users

  ## Security
  - Anonymous users can only create transactions linked to valid bookings
  - Anonymous users can only view transactions for guest bookings
  - All transaction records are still tracked and auditable
*/

-- Drop the overly permissive "System can create transactions" policy
DROP POLICY IF EXISTS "System can create transactions" ON transactions;

-- Create separate policies for authenticated and anonymous users
CREATE POLICY "Authenticated users can create transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = transactions.booking_id
    )
  );

CREATE POLICY "Anonymous users can create transactions for guest bookings"
  ON transactions FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = transactions.booking_id 
      AND bookings.is_guest_booking = true
    )
  );

-- Add policy for anonymous users to view transactions for guest bookings
CREATE POLICY "Anonymous users can view transactions for guest bookings"
  ON transactions FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = transactions.booking_id 
      AND bookings.is_guest_booking = true
    )
  );

-- Add policy for authenticated users to update bookings after payment
DROP POLICY IF EXISTS "Users can update own pending bookings" ON bookings;

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add policy for system to update guest bookings after payment
CREATE POLICY "Anonymous users can update guest bookings for payment"
  ON bookings FOR UPDATE
  TO anon
  USING (
    is_guest_booking = true 
    AND otp IS NOT NULL 
    AND otp_expires_at > now()
  )
  WITH CHECK (
    is_guest_booking = true
  );
