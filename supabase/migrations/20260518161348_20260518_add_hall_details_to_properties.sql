/*
  # Add hall_details column to properties table

  ## Summary
  Adds a JSONB column `hall_details` to the `properties` table to store structured
  data specific to Community Hall / Marriage Hall property types.

  ## New Column
  - `hall_details` (jsonb, nullable) — stores:
    - `contactDetails` (text): phone/email contact for the hall
    - `capacity`: { mainHallSeating, diningCapacity, guestRooms, twoWheelerParking, fourWheelerParking, kitchenSizeSqft }
    - `billing`: array of { label, amount, unit } charge line items
    - `facilities`: { musicSystem, waterSupply, electricityDG, bathroomFacility, kitchenAccess, centralAC, cctvMonitoring, fireSafetySystem, physicalSecurity, fans } (all booleans)
    - `terms`: { cancellationRules, bookingRules, termsAndConditions } (all text)

  ## Notes
  - Column is nullable; non-hall properties will have NULL here
  - No RLS changes needed (inherits from properties table policies)
*/

ALTER TABLE properties ADD COLUMN IF NOT EXISTS hall_details jsonb DEFAULT NULL;
