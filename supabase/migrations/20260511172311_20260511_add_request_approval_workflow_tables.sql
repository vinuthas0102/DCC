/*
  # Request Approval Workflow Tables

  Mirrors the existing allotment approval workflow for SUBMITTED quarter requests.

  ## New Tables

  ### `quarter_request_approvals`
  - Tracks multi-level approval chains for submitted quarter requests (before allotment)
  - Linked to `quarter_requests` via `request_id`
  - Same structure as `quarter_allotment_approvals` but keyed on `request_id`

  ### `quarter_request_approval_chats`
  - Audit log / messaging thread for each request approval chain
  - Same structure as `quarter_approval_chats` but keyed on `request_approval_id`

  ## Security
  - RLS enabled on both tables
  - Authenticated users can read approvals linked to their own requests (via employee_id)
  - EOs / managers can read, insert, and update all records
*/

-- ─── quarter_request_approvals ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quarter_request_approvals (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id        uuid NOT NULL REFERENCES quarter_requests(id) ON DELETE CASCADE,
  workflow_id       uuid REFERENCES quarter_approval_workflows(id) ON DELETE SET NULL,
  current_level     integer NOT NULL DEFAULT 1,
  max_level         integer NOT NULL DEFAULT 1,
  status            text NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING', 'APPROVED', 'CLARIFICATION_SENT', 'REJECTED')),
  initiated_by      uuid,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qra_request_id ON quarter_request_approvals(request_id);
CREATE INDEX IF NOT EXISTS idx_qra_status ON quarter_request_approvals(status);

ALTER TABLE quarter_request_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can read their own request approvals"
  ON quarter_request_approvals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quarter_requests qr
      WHERE qr.id = quarter_request_approvals.request_id
        AND (
          qr.employee_id = auth.uid()
          OR (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) IN ('estate_officer', 'estate_manager', 'admin')
        )
    )
  );

CREATE POLICY "EOs can insert request approvals"
  ON quarter_request_approvals FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) IN ('estate_officer', 'estate_manager', 'admin')
  );

CREATE POLICY "EOs can update request approvals"
  ON quarter_request_approvals FOR UPDATE
  TO authenticated
  USING (
    (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) IN ('estate_officer', 'estate_manager', 'admin')
  )
  WITH CHECK (
    (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) IN ('estate_officer', 'estate_manager', 'admin')
  );

-- ─── quarter_request_approval_chats ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quarter_request_approval_chats (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_approval_id   uuid NOT NULL REFERENCES quarter_request_approvals(id) ON DELETE CASCADE,
  author_id             uuid,
  author_role           text NOT NULL DEFAULT 'eo'
                        CHECK (author_role IN ('eo', 'approver', 'system')),
  message               text NOT NULL DEFAULT '',
  action_type           text NOT NULL DEFAULT 'SYSTEM'
                        CHECK (action_type IN ('APPROVE', 'CLARIFY', 'REJECT', 'SYSTEM', 'INITIATE')),
  level_snapshot        integer,
  document_urls         text[] DEFAULT '{}',
  created_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qrac_approval_id ON quarter_request_approval_chats(request_approval_id);

ALTER TABLE quarter_request_approval_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can read their own request approval chats"
  ON quarter_request_approval_chats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quarter_request_approvals qra
      JOIN quarter_requests qr ON qr.id = qra.request_id
      WHERE qra.id = quarter_request_approval_chats.request_approval_id
        AND (
          qr.employee_id = auth.uid()
          OR (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) IN ('estate_officer', 'estate_manager', 'admin')
        )
    )
  );

CREATE POLICY "EOs can insert request approval chats"
  ON quarter_request_approval_chats FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) IN ('estate_officer', 'estate_manager', 'admin')
  );
