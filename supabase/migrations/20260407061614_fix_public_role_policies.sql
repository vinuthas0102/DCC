/*
  # Fix Public Role Policies to Use Anon

  1. Problem
    - Policies with role 'public' apply to ALL users including authenticated
    - This causes authenticated users to evaluate multiple policies unnecessarily
    - Also creates security concerns where guests/authenticated have overlapping access
    
  2. Solution
    - Change 'public' role to 'anon' role for guest-specific policies
    - Consolidate redundant OTP policies for bookings
    - This ensures clear separation between authenticated and anonymous access
    
  3. Changes
    - bookings: Consolidate OTP lookup policies, use anon for guest operations
    - ad_hoc_links: Change public to anon for link usage
*/

-- =========================
-- AD_HOC_LINKS
-- =========================
DROP POLICY IF EXISTS "Public can use valid ad-hoc links" ON ad_hoc_links;

CREATE POLICY "Anonymous users can use valid ad-hoc links"
  ON ad_hoc_links FOR SELECT
  TO anon
  USING (used = false AND expires_at > now());

-- =========================
-- BOOKINGS SELECT
-- =========================
-- Drop both redundant OTP policies
DROP POLICY IF EXISTS "Allow viewing guest bookings via OTP" ON bookings;
DROP POLICY IF EXISTS "Public can lookup booking with OTP" ON bookings;

-- Create single consolidated policy for OTP-based guest booking lookup
CREATE POLICY "Anonymous users can lookup guest bookings with valid OTP"
  ON bookings FOR SELECT
  TO anon
  USING (
    is_guest_booking = true 
    AND otp IS NOT NULL 
    AND otp_expires_at > now()
  );

-- =========================
-- BOOKINGS INSERT
-- =========================
DROP POLICY IF EXISTS "Allow guest bookings for Other Facilities" ON bookings;

CREATE POLICY "Anonymous users can create guest bookings"
  ON bookings FOR INSERT
  TO anon
  WITH CHECK (is_guest_booking = true);

-- =========================
-- BOOKINGS UPDATE
-- =========================
DROP POLICY IF EXISTS "Allow guest booking updates via OTP" ON bookings;

CREATE POLICY "Anonymous users can update guest bookings with valid OTP"
  ON bookings FOR UPDATE
  TO anon
  USING (
    is_guest_booking = true 
    AND otp IS NOT NULL 
    AND otp_expires_at > now()
  )
  WITH CHECK (
    is_guest_booking = true 
    AND otp IS NOT NULL 
    AND otp_expires_at > now()
  );

-- Result:
-- All guest/anonymous access now uses 'anon' role instead of 'public'
-- No overlap with authenticated user policies
-- Clear separation of concerns
-- Consolidated OTP logic for bookings
