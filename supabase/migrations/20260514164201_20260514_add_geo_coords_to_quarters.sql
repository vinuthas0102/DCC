/*
  # Add geo-coordinates to quarters table

  1. Changes
    - `quarters` table: add `latitude` numeric(10,7) nullable
    - `quarters` table: add `longitude` numeric(10,7) nullable
    - Index on (latitude, longitude) for geo queries

  2. Notes
    - Nullable so existing rows are unaffected
    - Matches the pattern used for estates (migration 20260401064051)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quarters' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE quarters ADD COLUMN latitude numeric(10, 7);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quarters' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE quarters ADD COLUMN longitude numeric(10, 7);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_quarters_coordinates ON quarters(latitude, longitude);

COMMENT ON COLUMN quarters.latitude IS 'Latitude coordinate for quarter location (-90 to 90)';
COMMENT ON COLUMN quarters.longitude IS 'Longitude coordinate for quarter location (-180 to 180)';
