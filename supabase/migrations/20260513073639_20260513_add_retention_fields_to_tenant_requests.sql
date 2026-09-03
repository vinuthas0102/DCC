/*
  # Add retention fields to quarter_tenant_requests

  ## Summary
  Adds two new columns to support the Extension/Retention request workflow:

  1. New Columns
     - `retention_reason` (text, default '') — dropdown selection from the standard list of retention reasons
       (On retirement, On death of employee, On termination/resignation, On transfer from Bacheli project, Other Extenuating Circumstances)
     - `requested_months` (integer, nullable) — number of months of extension requested by the employee

  ## Notes
  - Both columns use safe IF NOT EXISTS guards
  - No data is dropped or altered
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quarter_tenant_requests' AND column_name = 'retention_reason'
  ) THEN
    ALTER TABLE quarter_tenant_requests ADD COLUMN retention_reason text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quarter_tenant_requests' AND column_name = 'requested_months'
  ) THEN
    ALTER TABLE quarter_tenant_requests ADD COLUMN requested_months integer;
  END IF;
END $$;
