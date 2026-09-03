/*
  # Add Booking Occupants Table

  ## Purpose
  During check-in, the Estate Manager must capture the identity details of all
  occupants (not just the primary guest). This migration creates a dedicated
  `booking_occupants` table to store per-occupant identity information including
  uploaded document URLs (Aadhaar, PAN, photo).

  ## New Tables
  - `booking_occupants`
    - `id` (uuid, PK)
    - `booking_id` (uuid, FK → bookings.id, cascade delete)
    - `full_name` (text, required)
    - `relation` (text) – e.g. primary, spouse, child, other
    - `id_proof_type` (text) – aadhaar / pan / passport / driving_licence / voter_id
    - `id_proof_number` (text)
    - `aadhaar_url` (text) – Supabase Storage path for Aadhaar scan
    - `pan_url` (text) – Supabase Storage path for PAN scan
    - `photo_url` (text) – Supabase Storage path for occupant photo
    - `created_at` (timestamptz)

  ## Security
  - RLS enabled
  - Managers can insert/select/update/delete occupants for any booking
  - Authenticated users can select occupants for their own bookings
*/

CREATE TABLE IF NOT EXISTS booking_occupants (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id       uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  full_name        text NOT NULL DEFAULT '',
  relation         text NOT NULL DEFAULT 'primary',
  id_proof_type    text NOT NULL DEFAULT '',
  id_proof_number  text NOT NULL DEFAULT '',
  aadhaar_url      text NOT NULL DEFAULT '',
  pan_url          text NOT NULL DEFAULT '',
  photo_url        text NOT NULL DEFAULT '',
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_occupants_booking_id ON booking_occupants(booking_id);

ALTER TABLE booking_occupants ENABLE ROW LEVEL SECURITY;

-- Managers can fully manage occupants
CREATE POLICY "Managers can insert occupants"
  ON booking_occupants FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT extensions.get_user_role()) = 'manager'
  );

CREATE POLICY "Managers can select occupants"
  ON booking_occupants FOR SELECT
  TO authenticated
  USING (
    (SELECT extensions.get_user_role()) = 'manager'
  );

CREATE POLICY "Managers can update occupants"
  ON booking_occupants FOR UPDATE
  TO authenticated
  USING (
    (SELECT extensions.get_user_role()) = 'manager'
  )
  WITH CHECK (
    (SELECT extensions.get_user_role()) = 'manager'
  );

CREATE POLICY "Managers can delete occupants"
  ON booking_occupants FOR DELETE
  TO authenticated
  USING (
    (SELECT extensions.get_user_role()) = 'manager'
  );

-- Authenticated users can view occupants on their own bookings
CREATE POLICY "Users can view occupants for own bookings"
  ON booking_occupants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_occupants.booking_id
        AND bookings.user_id = auth.uid()
    )
  );
