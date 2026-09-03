/*
  # Add Feature Columns to Rooms Table

  ## Summary
  Adds structured feature columns to the rooms table so each room can
  carry its own set of amenity-style boolean flags, a single view type,
  bed count, and bed type. This replaces the fragile string-in-JSONB
  approach for the most commonly filtered/displayed room attributes.

  ## New Columns on `rooms`
  - `features` (jsonb) — boolean flags: hasBalcony, hasAC, hasKitchen,
    hasLivingRoom, hasFridge, isKidsFriendly, isPetFriendly,
    isWheelchairAccessible (isSmokingAllowed kept in existing column)
  - `view_type` (text) — single value: 'garden'|'mountain'|'sea'|
    'city'|'pool'|'courtyard'|'' (empty = no specific view)
  - `bed_count` (integer) — number of beds in the room
  - `bed_type` (text) — 'single'|'double'|'twin'|'queen'|'king'|''
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'features'
  ) THEN
    ALTER TABLE rooms ADD COLUMN features jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'view_type'
  ) THEN
    ALTER TABLE rooms ADD COLUMN view_type text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'bed_count'
  ) THEN
    ALTER TABLE rooms ADD COLUMN bed_count integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'bed_type'
  ) THEN
    ALTER TABLE rooms ADD COLUMN bed_type text DEFAULT '';
  END IF;
END $$;
