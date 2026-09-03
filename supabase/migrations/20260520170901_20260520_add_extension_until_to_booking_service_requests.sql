/*
  # Add extension_until to booking_service_requests

  ## Summary
  Adds an optional date field to record the requested end date for extension requests.

  ## Changes
  - `booking_service_requests`
    - New column `extension_until` (date, nullable) — stores the date until which
      the guest is requesting to extend their stay. Only relevant when
      service_type = 'EXTENSION'. NULL for all other service types.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'booking_service_requests'
      AND column_name = 'extension_until'
  ) THEN
    ALTER TABLE booking_service_requests ADD COLUMN extension_until date;
  END IF;
END $$;
