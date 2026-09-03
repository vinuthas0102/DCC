/*
  # Add Geo Location and Images to Estates

  1. Changes
    - Add `latitude` column to estates table (numeric, nullable)
    - Add `longitude` column to estates table (numeric, nullable)
    - Add `images` column to estates table (JSONB array, nullable, default empty array)
    - Add index on latitude and longitude for efficient geo queries

  2. Purpose
    - Enable precise location tracking for estates with coordinates
    - Store multiple images for visual representation of estates
    - Support map-based searches and location filtering
    - Make estates consistent with property geo location features

  3. Notes
    - Latitude range: -90 to 90 (validated at application level)
    - Longitude range: -180 to 180 (validated at application level)
    - Images stored as JSONB array of strings (URLs or base64)
    - Existing estates will have NULL coordinates and empty images array
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'estates' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE estates ADD COLUMN latitude numeric(10, 7);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'estates' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE estates ADD COLUMN longitude numeric(10, 7);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'estates' AND column_name = 'images'
  ) THEN
    ALTER TABLE estates ADD COLUMN images jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_estates_coordinates ON estates(latitude, longitude);

COMMENT ON COLUMN estates.latitude IS 'Latitude coordinate for estate location (-90 to 90)';
COMMENT ON COLUMN estates.longitude IS 'Longitude coordinate for estate location (-180 to 180)';
COMMENT ON COLUMN estates.images IS 'Array of image URLs or base64 strings for estate photos';
