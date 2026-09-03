/*
  # Add request_for and on-behalf/TP fields to quarter_requests

  ## Summary
  Extends the quarter_requests table to support three booking modes:
  - SELF: the employee is booking for themselves (default, existing behavior)
  - EMPLOYEE: an EO is booking on behalf of another employee
  - TP: an EO is booking for a Third Party (non-government employee)

  ## New Columns
  - `request_for` (text, default 'SELF') — one of SELF | EMPLOYEE | TP
  - `on_behalf_employee_id` (text, nullable) — employee ID string when request_for = EMPLOYEE
  - `on_behalf_employee_name` (text, nullable) — display name of the on-behalf employee
  - `on_behalf_employee_dept` (text, nullable) — department of the on-behalf employee
  - `tp_name` (text, nullable) — Third Party full name
  - `tp_organization` (text, nullable) — Third Party organization
  - `tp_mobile` (text, nullable) — Third Party mobile number
  - `tp_email` (text, nullable) — Third Party email address
  - `tp_pan` (text, nullable) — Third Party PAN number
  - `tp_notes` (text, nullable) — additional notes for TP

  ## Notes
  - All new columns are nullable (except request_for which has a default) to preserve
    backwards compatibility with existing records
  - No RLS changes needed — existing policies cover the new columns
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quarter_requests' AND column_name = 'request_for'
  ) THEN
    ALTER TABLE quarter_requests ADD COLUMN request_for text NOT NULL DEFAULT 'SELF';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quarter_requests' AND column_name = 'on_behalf_employee_id'
  ) THEN
    ALTER TABLE quarter_requests ADD COLUMN on_behalf_employee_id text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quarter_requests' AND column_name = 'on_behalf_employee_name'
  ) THEN
    ALTER TABLE quarter_requests ADD COLUMN on_behalf_employee_name text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quarter_requests' AND column_name = 'on_behalf_employee_dept'
  ) THEN
    ALTER TABLE quarter_requests ADD COLUMN on_behalf_employee_dept text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quarter_requests' AND column_name = 'tp_name'
  ) THEN
    ALTER TABLE quarter_requests ADD COLUMN tp_name text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quarter_requests' AND column_name = 'tp_organization'
  ) THEN
    ALTER TABLE quarter_requests ADD COLUMN tp_organization text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quarter_requests' AND column_name = 'tp_mobile'
  ) THEN
    ALTER TABLE quarter_requests ADD COLUMN tp_mobile text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quarter_requests' AND column_name = 'tp_email'
  ) THEN
    ALTER TABLE quarter_requests ADD COLUMN tp_email text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quarter_requests' AND column_name = 'tp_pan'
  ) THEN
    ALTER TABLE quarter_requests ADD COLUMN tp_pan text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quarter_requests' AND column_name = 'tp_notes'
  ) THEN
    ALTER TABLE quarter_requests ADD COLUMN tp_notes text;
  END IF;
END $$;
