/*
  # Add request_type column to quarter_requests

  1. Changes
    - `quarter_requests` table: add `request_type` column
      - Type: text
      - Default: 'GENERAL'
      - Check constraint: must be one of 'GENERAL', 'MEDICAL', 'REFERENCE'

  2. Notes
    - All existing rows will default to 'GENERAL'
    - Column is NOT NULL with a default so no data loss
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quarter_requests' AND column_name = 'request_type'
  ) THEN
    ALTER TABLE quarter_requests
      ADD COLUMN request_type text NOT NULL DEFAULT 'GENERAL'
      CHECK (request_type IN ('GENERAL', 'MEDICAL', 'REFERENCE'));
  END IF;
END $$;
