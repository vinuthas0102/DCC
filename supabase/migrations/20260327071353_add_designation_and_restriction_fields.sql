/*
  # Add Designation and Room Restriction Fields

  1. Changes to `users` table
    - Add `designation_id` (uuid) - Foreign key to designation_master
    - This links users to their official designation for special date access control

  2. Changes to `rooms` table
    - Add `special_date_restricted` (boolean) - Marks rooms eligible for special date blocking
    - Default is false, meaning the room is always available
    - When true, the room is subject to date blocking rules

  3. Indexes
    - Add index on users.designation_id for fast lookups
    - Add index on rooms.special_date_restricted for filtering

  4. Notes
    - Existing users will have NULL designation_id, which should be populated by admins
    - Existing rooms default to not being restricted
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'designation_id'
  ) THEN
    ALTER TABLE users ADD COLUMN designation_id uuid REFERENCES designation_master(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'special_date_restricted'
  ) THEN
    ALTER TABLE rooms ADD COLUMN special_date_restricted boolean DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_designation_id ON users(designation_id);
CREATE INDEX IF NOT EXISTS idx_rooms_special_date_restricted ON rooms(special_date_restricted);