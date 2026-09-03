/*
  # Add possession_date and bill_preparing_authority to quarter_allotments

  ## Changes
  - Adds `possession_date` (date, nullable) to quarter_allotments — records the date the tenant
    physically took possession of the quarter.
  - Adds `bill_preparing_authority` (text, nullable) — stores the name/designation of the
    authority responsible for preparing the vacation bill.

  ## Why
  These fields are displayed read-only in the redesigned Vacate Request form so that
  the employee can review allocation details before submitting the vacate request.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quarter_allotments' AND column_name = 'possession_date'
  ) THEN
    ALTER TABLE quarter_allotments ADD COLUMN possession_date date;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quarter_allotments' AND column_name = 'bill_preparing_authority'
  ) THEN
    ALTER TABLE quarter_allotments ADD COLUMN bill_preparing_authority text;
  END IF;
END $$;
