/*
  # Add Exchange Quarter Service Type

  1. Summary
     Adds support for the "Exchange" service request — two tenants (A & B) mutually
     swap their occupied quarters.

  2. Changes
     - Widens service_type check on quarter_tenant_requests to include EXCHANGE
     - Widens request_status check on quarter_requests to include EXCHANGE_REQUESTED
       and all statuses already present in data (CANCELLED)
     - Creates quarter_exchange_pairs table linking the two parties
     - RLS enabled with policies for employees (own records) and estate managers (all)

  3. New Table: quarter_exchange_pairs
     - id, primary_tenant_request_id, partner_quarter_number
     - partner_allotment_id (nullable — resolved by EO)
     - partner_request_id (nullable)
     - status: PENDING | CONFIRMED | REJECTED | WITHDRAWN
     - justification_doc_url, workflow_id, eo_notes, timestamps
*/

-- ── 1. Extend service_type constraint ──────────────────────────────────────
ALTER TABLE quarter_tenant_requests
  DROP CONSTRAINT IF EXISTS quarter_tenant_requests_service_type_check;

ALTER TABLE quarter_tenant_requests
  ADD CONSTRAINT quarter_tenant_requests_service_type_check
  CHECK (service_type IN ('EXTEND','UPGRADE','VACATE','GRIEVANCE','MAINTENANCE','EXCHANGE'));

-- ── 2. Extend request_status constraint (include CANCELLED from live data) ─
ALTER TABLE quarter_requests
  DROP CONSTRAINT IF EXISTS quarter_requests_request_status_check;

ALTER TABLE quarter_requests
  ADD CONSTRAINT quarter_requests_request_status_check
  CHECK (request_status IN (
    'DRAFT','SUBMITTED','ALLOTTED','ACKNOWLEDGED','REJECTED','WITHDRAWN',
    'EXTEND_REQUESTED','UPGRADE_REQUESTED','VACATE_REQUESTED','EXCHANGE_REQUESTED',
    'VACATED','ON_HOLD','CANCELLED'
  ));

-- ── 3. Create quarter_exchange_pairs ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS quarter_exchange_pairs (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_tenant_request_id uuid NOT NULL REFERENCES quarter_tenant_requests(id) ON DELETE CASCADE,
  partner_quarter_number    text NOT NULL DEFAULT '',
  partner_allotment_id      uuid REFERENCES quarter_allotments(id) ON DELETE SET NULL,
  partner_request_id        uuid REFERENCES quarter_requests(id) ON DELETE SET NULL,
  status                    text NOT NULL DEFAULT 'PENDING'
                              CHECK (status IN ('PENDING','CONFIRMED','REJECTED','WITHDRAWN')),
  justification_doc_url     text NOT NULL DEFAULT '',
  workflow_id               uuid REFERENCES quarter_approval_workflows(id) ON DELETE SET NULL,
  eo_notes                  text NOT NULL DEFAULT '',
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quarter_exchange_pairs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_qep_primary_tenant_request
  ON quarter_exchange_pairs(primary_tenant_request_id);

CREATE INDEX IF NOT EXISTS idx_qep_partner_allotment
  ON quarter_exchange_pairs(partner_allotment_id);

-- Employees: see own pairs
CREATE POLICY "Employees can view their own exchange pairs"
  ON quarter_exchange_pairs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quarter_tenant_requests qtr
      WHERE qtr.id = quarter_exchange_pairs.primary_tenant_request_id
        AND qtr.employee_id = auth.uid()
    )
  );

-- Estate managers: see all
CREATE POLICY "Estate managers can view all exchange pairs"
  ON quarter_exchange_pairs FOR SELECT
  TO authenticated
  USING (
    (SELECT extensions.get_user_role()) IN ('estate_manager','admin')
  );

-- Employees: insert own pairs
CREATE POLICY "Employees can insert their own exchange pairs"
  ON quarter_exchange_pairs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quarter_tenant_requests qtr
      WHERE qtr.id = quarter_exchange_pairs.primary_tenant_request_id
        AND qtr.employee_id = auth.uid()
    )
  );

-- Estate managers: insert
CREATE POLICY "Estate managers can insert exchange pairs"
  ON quarter_exchange_pairs FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT extensions.get_user_role()) IN ('estate_manager','admin')
  );

-- Estate managers: update (approve/reject)
CREATE POLICY "Estate managers can update exchange pairs"
  ON quarter_exchange_pairs FOR UPDATE
  TO authenticated
  USING (
    (SELECT extensions.get_user_role()) IN ('estate_manager','admin')
  )
  WITH CHECK (
    (SELECT extensions.get_user_role()) IN ('estate_manager','admin')
  );
