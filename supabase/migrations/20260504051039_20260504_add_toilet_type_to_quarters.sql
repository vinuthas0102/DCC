/*
  # Add toilet_type column to quarters table

  1. Changes
    - `quarters` table: add `toilet_type` text column
      - Stores the type of toilet fixture in the quarter
      - Values: 'Indian', 'Western', 'Both'
      - Defaults to 'Western' for existing rows

  2. Notes
    - Safe additive migration using IF NOT EXISTS pattern
    - No data is deleted or modified
    - Existing quarters get default value 'Western'
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quarters' AND column_name = 'toilet_type'
  ) THEN
    ALTER TABLE quarters ADD COLUMN toilet_type text NOT NULL DEFAULT 'Western';
  END IF;
END $$;
