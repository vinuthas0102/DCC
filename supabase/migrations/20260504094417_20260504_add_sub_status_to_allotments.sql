/*
  # Add sub_status to quarter_allotments

  ## Changes
  - Adds a `sub_status` column to `quarter_allotments` to record granular decline states:
    - 'DECLINED'                 — employee declined but request stays submitted
    - 'DECLINED_AND_CANCELLED'   — employee declined and also cancelled the request
  - Column is nullable (no sub-status for normal flow)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quarter_allotments' AND column_name = 'sub_status'
  ) THEN
    ALTER TABLE quarter_allotments ADD COLUMN sub_status text;
  END IF;
END $$;
