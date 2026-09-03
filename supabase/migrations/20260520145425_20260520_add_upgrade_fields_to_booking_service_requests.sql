/*
  # Add Room Upgrade Fields to Booking Service Requests

  ## Summary
  Extends `booking_service_requests` to support UPGRADE service type for guest
  bookings. Government officials (and estate managers on their behalf) can request
  a room upgrade; the manager reviews availability, approves/declines, and on
  approval the guest pays the price difference.

  ## Changes

  ### Modified Tables
  - `booking_service_requests`
    - `upgrade_target_room_type_id` (uuid, nullable FK → room_types): the room type
      the guest wants to upgrade to
    - `upgrade_original_room_type_id` (uuid, nullable FK → room_types): the room type
      at the time the request was raised (for audit)
    - `upgrade_price_difference` (decimal 10,2, default 0): calculated additional
      amount the guest must pay for the upgrade
    - `upgrade_status` (text, nullable): tracks the upgrade decision independently
      of the generic request_status. Values: PENDING_REVIEW | APPROVED | DECLINED

  ## Notes
  - All new columns are nullable; existing rows are unaffected.
  - No new RLS policies needed — existing policies on booking_service_requests cover
    the new columns.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'booking_service_requests' AND column_name = 'upgrade_target_room_type_id'
  ) THEN
    ALTER TABLE booking_service_requests
      ADD COLUMN upgrade_target_room_type_id uuid REFERENCES room_types(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'booking_service_requests' AND column_name = 'upgrade_original_room_type_id'
  ) THEN
    ALTER TABLE booking_service_requests
      ADD COLUMN upgrade_original_room_type_id uuid REFERENCES room_types(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'booking_service_requests' AND column_name = 'upgrade_price_difference'
  ) THEN
    ALTER TABLE booking_service_requests
      ADD COLUMN upgrade_price_difference decimal(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'booking_service_requests' AND column_name = 'upgrade_status'
  ) THEN
    ALTER TABLE booking_service_requests
      ADD COLUMN upgrade_status text;
  END IF;
END $$;
