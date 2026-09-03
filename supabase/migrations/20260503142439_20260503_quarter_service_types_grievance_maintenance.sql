/*
  # Quarter Tenant Requests: Add GRIEVANCE and MAINTENANCE Service Types

  ## Summary
  Extends the `quarter_tenant_requests` table to support two additional service
  request types raised by government employees against their occupied quarters:

  - **GRIEVANCE** – employee can raise a general grievance/complaint about their quarter
  - **MAINTENANCE** – employee can raise a maintenance request describing an issue

  ## Changes

  ### 1. quarter_tenant_requests — relax service_type constraint
  The original table was created without a CHECK constraint on `service_type` (just a
  comment), so we simply add a new CHECK constraint that covers all five valid values.
  If a constraint already exists it is dropped first to avoid conflicts.

  ### 2. New columns for GRIEVANCE and MAINTENANCE
  - `grievance_subject` (text, default '') — short subject line for GRIEVANCE requests
  - `urgency_level` (text, default 'NORMAL') — urgency for MAINTENANCE: LOW | NORMAL | HIGH

  ## Security
  No new policies needed — existing policies (employees own rows, managers all rows)
  already cover the new service types.
*/

-- Drop old constraint if it exists (it was named during table creation, may not exist)
ALTER TABLE quarter_tenant_requests
  DROP CONSTRAINT IF EXISTS quarter_tenant_requests_service_type_check;

-- Add updated constraint covering all five service types
ALTER TABLE quarter_tenant_requests
  ADD CONSTRAINT quarter_tenant_requests_service_type_check
  CHECK (service_type IN ('EXTEND', 'UPGRADE', 'VACATE', 'GRIEVANCE', 'MAINTENANCE'));

-- Add grievance_subject column if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quarter_tenant_requests' AND column_name = 'grievance_subject'
  ) THEN
    ALTER TABLE quarter_tenant_requests ADD COLUMN grievance_subject text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Add urgency_level column if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quarter_tenant_requests' AND column_name = 'urgency_level'
  ) THEN
    ALTER TABLE quarter_tenant_requests ADD COLUMN urgency_level text NOT NULL DEFAULT 'NORMAL';
  END IF;
END $$;
