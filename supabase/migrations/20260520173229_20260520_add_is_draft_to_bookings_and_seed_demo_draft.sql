/*
  # Add is_draft flag to bookings and seed a demo draft booking

  ## Summary
  Introduces a boolean `is_draft` column on the bookings table so that
  "saved but not yet submitted" bookings (drafts) can be distinguished
  from "submitted, pending manager review" bookings, both of which
  currently share the REQUESTED status.

  ## Changes

  ### Modified Tables
  - `bookings`
    - New column `is_draft` (boolean, default false) — true only for
      bookings the govt official has explicitly saved as a draft without
      submitting. All existing and new normal bookings default to false.

  ## Data Changes
  - All existing REQUESTED bookings remain is_draft = false (they are
    already submitted, not drafts).
  - One new demo draft booking is inserted for the demo govt official user
    so the Draft tab shows at least one record.

  ## Notes
  - Idempotent: column add and INSERT both use IF NOT EXISTS guards.
*/

-- 1. Add is_draft column if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'is_draft'
  ) THEN
    ALTER TABLE bookings ADD COLUMN is_draft boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- 2. Seed one demo draft booking for the govt official demo user
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM bookings WHERE booking_number = 'BK2026052000099') THEN
    INSERT INTO bookings (
      id, booking_number, user_id, property_id, room_type_id, quantity,
      check_in_date, check_out_date, guest_details, special_requirements,
      status, is_draft, total_amount, paid_amount, balance_amount, payment_status,
      notes, is_guest_booking, payment_scenario, created_at, updated_at
    ) VALUES (
      'b0000099-b000-4000-8000-000000000099',
      'BK2026052000099',
      '5f865f74-aeab-4885-a898-80ba3da33ae0',
      '26c89830-109e-48a9-b98e-aaf2ce699adb',
      '7fc1c91a-4beb-4760-b149-3001a2310764',
      1, '2026-07-15', '2026-07-18',
      '{"fullName":"Rajan Kumar","email":"rajan.kumar@demo.fms.gov","phone":"9876500000","designation":"Deputy Director","department":"Ministry of Railways"}',
      'Saved as draft — pending review before submission',
      'REQUESTED', true, 3600, 0, 3600, 'PENDING',
      'DEMO DRAFT: Saved by govt official, not yet submitted.',
      false, 'post_approval',
      now() - interval '30 minutes', now() - interval '30 minutes'
    );
  END IF;
END $$;
