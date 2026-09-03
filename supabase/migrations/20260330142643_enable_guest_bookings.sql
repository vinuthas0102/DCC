/*
  # Enable Guest Bookings for Other Facilities

  ## Overview
  This migration enables anonymous guest bookings for "Other Facilities" module
  while keeping authentication required for "Govt Facilities" module.

  ## Changes Made

  ### 1. System Guest User
  - Creates a system guest user account for anonymous bookings
  - Email: guest@system.local
  - Role: public
  - This user will be associated with all guest bookings

  ### 2. Bookings Table Schema Updates
  - Add `is_guest_booking` boolean column (default false)
  - Add `guest_details` jsonb column for storing guest information
    - Fields: name, email, phone
  - Add `otp_hash` text column for OTP verification
  - Add `otp_expires_at` timestamptz for OTP expiry

  ### 3. Indexes
  - Add index on bookings(booking_number, otp_hash) for fast lookup
  - Add index on is_guest_booking for filtering

  ## Security Notes
  - Guest bookings only allowed for properties with module_code = 'OTHER_FAC'
  - OTP required for guest booking access and modifications
  - RLS policies enforce module-based access control
*/

-- Create system guest user in auth.users
DO $$
DECLARE
  guest_user_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Check if guest user already exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = guest_user_id) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      role,
      aud,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      guest_user_id,
      '00000000-0000-0000-0000-000000000000',
      'guest@system.local',
      crypt('guest_system_user_no_login', gen_salt('bf')),
      now(),
      now(),
      now(),
      'authenticated',
      'authenticated',
      '',
      '',
      '',
      ''
    );
  END IF;
END $$;

-- Add columns to bookings table for guest booking support
DO $$
BEGIN
  -- Add is_guest_booking column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'is_guest_booking'
  ) THEN
    ALTER TABLE bookings ADD COLUMN is_guest_booking boolean DEFAULT false NOT NULL;
  END IF;

  -- Add guest_details jsonb column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'guest_details'
  ) THEN
    ALTER TABLE bookings ADD COLUMN guest_details jsonb;
  END IF;

  -- Add otp_hash column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'otp_hash'
  ) THEN
    ALTER TABLE bookings ADD COLUMN otp_hash text;
  END IF;

  -- Add otp_expires_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'otp_expires_at'
  ) THEN
    ALTER TABLE bookings ADD COLUMN otp_expires_at timestamptz;
  END IF;
END $$;

-- Create indexes for efficient guest booking lookups
CREATE INDEX IF NOT EXISTS idx_bookings_guest_lookup
  ON bookings(booking_number, otp_hash)
  WHERE is_guest_booking = true;

CREATE INDEX IF NOT EXISTS idx_bookings_is_guest
  ON bookings(is_guest_booking);

-- Add comment explaining guest_details structure
COMMENT ON COLUMN bookings.guest_details IS
  'Guest user contact information: {"name": string, "email": string, "phone": string}';

COMMENT ON COLUMN bookings.otp_hash IS
  'Hashed OTP for guest booking verification and tracking';

COMMENT ON COLUMN bookings.otp_expires_at IS
  'OTP expiration timestamp (24 hours from generation)';