/*
  # Quarters: Tenant Service Requests & Extended Status Values

  ## Summary
  Extends the quarters module to support the full government employee lifecycle:
  allotment acknowledgement/rejection, and ongoing occupancy service requests
  (extend lease, upgrade quarter, vacate).

  ## Changes

  ### 1. quarter_allotments — acknowledgement/rejection fields
  - `acknowledgement_remarks` (text) — remarks entered when employee acknowledges
  - `rejection_reason` (text) — reason entered when employee rejects
  - `rejection_doc_url` (text) — optional supporting document URL for rejection
  - `acknowledged_at` (timestamptz) — timestamp of acknowledgement
  - `rejected_at` (timestamptz) — timestamp of rejection

  ### 2. New Table: quarter_tenant_requests
  Captures ongoing occupancy service requests raised by the employee after
  they are occupying a quarter. Each row is one Extend / Upgrade / Vacate request.

  Columns:
  - `id` (uuid, PK)
  - `allotment_id` (uuid, FK → quarter_allotments)
  - `employee_id` (uuid, FK → auth.users)
  - `service_type` (text) — EXTEND | UPGRADE | VACATE
  - `request_status` (text, default PENDING) — PENDING | APPROVED | REJECTED | WITHDRAWN
  - `remarks` (text)
  - `reason` (text)
  - `document_url` (text)
  - `requested_date` (date, nullable) — extension/vacate target date
  - `required_bhk_config` (text) — for UPGRADE requests
  - `eo_notes` (text) — officer notes
  - `created_at`, `updated_at` (timestamptz)

  ### 3. Security
  - RLS enabled on quarter_tenant_requests
  - Employees can insert/select/update their own records
  - Managers/admins can select and update all records
*/

-- ─── quarter_allotments: add acknowledgement & rejection columns ──────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quarter_allotments' AND column_name = 'acknowledgement_remarks'
  ) THEN
    ALTER TABLE quarter_allotments ADD COLUMN acknowledgement_remarks text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quarter_allotments' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE quarter_allotments ADD COLUMN rejection_reason text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quarter_allotments' AND column_name = 'rejection_doc_url'
  ) THEN
    ALTER TABLE quarter_allotments ADD COLUMN rejection_doc_url text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quarter_allotments' AND column_name = 'acknowledged_at'
  ) THEN
    ALTER TABLE quarter_allotments ADD COLUMN acknowledged_at timestamptz;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quarter_allotments' AND column_name = 'rejected_at'
  ) THEN
    ALTER TABLE quarter_allotments ADD COLUMN rejected_at timestamptz;
  END IF;
END $$;

-- ─── quarter_tenant_requests table ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quarter_tenant_requests (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  allotment_id       uuid NOT NULL REFERENCES quarter_allotments(id) ON DELETE CASCADE,
  employee_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type       text NOT NULL,         -- EXTEND | UPGRADE | VACATE
  request_status     text NOT NULL DEFAULT 'PENDING', -- PENDING | APPROVED | REJECTED | WITHDRAWN
  remarks            text NOT NULL DEFAULT '',
  reason             text NOT NULL DEFAULT '',
  document_url       text NOT NULL DEFAULT '',
  requested_date     date,                  -- target extension/vacate date
  required_bhk_config text NOT NULL DEFAULT '',  -- for UPGRADE
  eo_notes           text NOT NULL DEFAULT '',
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quarter_tenant_requests ENABLE ROW LEVEL SECURITY;

-- Employees: insert own
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quarter_tenant_requests' AND policyname='Employees can insert own tenant requests') THEN
    CREATE POLICY "Employees can insert own tenant requests"
      ON quarter_tenant_requests FOR INSERT
      TO authenticated
      WITH CHECK (employee_id = auth.uid());
  END IF;
END $$;

-- Employees: view own
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quarter_tenant_requests' AND policyname='Employees can view own tenant requests') THEN
    CREATE POLICY "Employees can view own tenant requests"
      ON quarter_tenant_requests FOR SELECT
      TO authenticated
      USING (employee_id = auth.uid());
  END IF;
END $$;

-- Employees: update own (for withdraw)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quarter_tenant_requests' AND policyname='Employees can update own tenant requests') THEN
    CREATE POLICY "Employees can update own tenant requests"
      ON quarter_tenant_requests FOR UPDATE
      TO authenticated
      USING (employee_id = auth.uid())
      WITH CHECK (employee_id = auth.uid());
  END IF;
END $$;

-- Managers: view all
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quarter_tenant_requests' AND policyname='Managers can view all tenant requests') THEN
    CREATE POLICY "Managers can view all tenant requests"
      ON quarter_tenant_requests FOR SELECT
      TO authenticated
      USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('manager', 'admin'));
  END IF;
END $$;

-- Managers: update all (approve/reject)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quarter_tenant_requests' AND policyname='Managers can update all tenant requests') THEN
    CREATE POLICY "Managers can update all tenant requests"
      ON quarter_tenant_requests FOR UPDATE
      TO authenticated
      USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('manager', 'admin'))
      WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('manager', 'admin'));
  END IF;
END $$;

-- Index for fast employee lookups
CREATE INDEX IF NOT EXISTS idx_quarter_tenant_requests_employee_id
  ON quarter_tenant_requests(employee_id);

CREATE INDEX IF NOT EXISTS idx_quarter_tenant_requests_allotment_id
  ON quarter_tenant_requests(allotment_id);
