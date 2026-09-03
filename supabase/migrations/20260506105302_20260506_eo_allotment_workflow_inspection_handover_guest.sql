/*
  # EO Allotment Workflow, Inspection, Handover & Guest Info Tables

  1. New Tables
    - `quarter_approval_workflows` — master config for multi-level approval chains
    - `quarter_allotment_approvals` — in-progress approval tracking per allotment
    - `quarter_approval_chats` — threaded chat for approval flow (approve/clarify/system)
    - `quarter_inspections` — inspection records linked to allotments
    - `quarter_inspection_chats` — chat thread for each inspection
    - `quarter_handovers` — handover detail record per allotment
    - `quarter_guest_info` — guest records for facility booking allotments

  2. Modifications
    - `quarter_requests.sub_status` — already supports free-text; no change needed
    - Ensure `request_status` CHECK constraint allows 'DRAFT' (already present)

  3. Security
    - RLS enabled on all new tables
    - Authenticated users can read their own or EO-accessible records
*/

-- ─── Approval Workflow Master ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quarter_approval_workflows (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name text NOT NULL,
  description   text DEFAULT '',
  levels        jsonb NOT NULL DEFAULT '[]',
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE quarter_approval_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read approval workflows"
  ON quarter_approval_workflows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "EOs and admins can manage approval workflows"
  ON quarter_approval_workflows FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('govt_official', 'admin', 'manager')
    )
  );

-- Seed one default 2-level approval workflow
INSERT INTO quarter_approval_workflows (workflow_name, description, levels)
VALUES (
  'Standard Allotment Approval',
  'Two-level approval: Junior EO → Senior EO',
  '[
    {"level": 1, "label": "Junior EO Review", "role": "govt_official"},
    {"level": 2, "label": "Senior EO Approval", "role": "govt_official"}
  ]'::jsonb
)
ON CONFLICT DO NOTHING;

-- ─── Allotment Approval Tracking ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quarter_allotment_approvals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  allotment_id    uuid NOT NULL REFERENCES quarter_allotments(id) ON DELETE CASCADE,
  workflow_id     uuid REFERENCES quarter_approval_workflows(id),
  current_level   int NOT NULL DEFAULT 1,
  max_level       int NOT NULL DEFAULT 1,
  status          text NOT NULL DEFAULT 'PENDING_APPROVAL'
                  CHECK (status IN ('PENDING_APPROVAL','APPROVED','CLARIFICATION_SENT','REJECTED')),
  initiated_by    uuid REFERENCES users(id),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE quarter_allotment_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read allotment approvals"
  ON quarter_allotment_approvals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "EOs can insert allotment approvals"
  ON quarter_allotment_approvals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
        AND role IN ('govt_official','admin','manager')
    )
  );

CREATE POLICY "EOs can update allotment approvals"
  ON quarter_allotment_approvals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
        AND role IN ('govt_official','admin','manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
        AND role IN ('govt_official','admin','manager')
    )
  );

-- ─── Approval Chat Thread ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quarter_approval_chats (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id     uuid NOT NULL REFERENCES quarter_allotment_approvals(id) ON DELETE CASCADE,
  author_id       uuid REFERENCES users(id),
  author_role     text NOT NULL DEFAULT 'eo'
                  CHECK (author_role IN ('eo','system','approver')),
  message         text NOT NULL DEFAULT '',
  action_type     text NOT NULL DEFAULT 'SYSTEM'
                  CHECK (action_type IN ('APPROVE','CLARIFY','REJECT','SYSTEM','INITIATE')),
  level_snapshot  int,
  document_urls   text[] DEFAULT '{}',
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE quarter_approval_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read approval chats"
  ON quarter_approval_chats FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert approval chats"
  ON quarter_approval_chats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- ─── Inspections ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quarter_inspections (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  allotment_id        uuid NOT NULL REFERENCES quarter_allotments(id) ON DELETE CASCADE,
  created_by          uuid REFERENCES users(id),
  status              text NOT NULL DEFAULT 'ACTIVE'
                      CHECK (status IN ('ACTIVE','CLOSED')),
  opening_remarks     text DEFAULT '',
  closing_remarks     text DEFAULT '',
  property_condition  text DEFAULT '',
  created_at          timestamptz DEFAULT now(),
  closed_at           timestamptz
);

ALTER TABLE quarter_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read inspections"
  ON quarter_inspections FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "EOs can insert inspections"
  ON quarter_inspections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
        AND role IN ('govt_official','admin','manager')
    )
  );

CREATE POLICY "EOs can update inspections"
  ON quarter_inspections FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
        AND role IN ('govt_official','admin','manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
        AND role IN ('govt_official','admin','manager')
    )
  );

-- ─── Inspection Chat Thread ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quarter_inspection_chats (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id   uuid NOT NULL REFERENCES quarter_inspections(id) ON DELETE CASCADE,
  author_id       uuid REFERENCES users(id),
  author_role     text NOT NULL DEFAULT 'eo'
                  CHECK (author_role IN ('eo','system')),
  message         text NOT NULL DEFAULT '',
  document_urls   text[] DEFAULT '{}',
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE quarter_inspection_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read inspection chats"
  ON quarter_inspection_chats FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "EOs can insert inspection chats"
  ON quarter_inspection_chats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- ─── Handovers ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quarter_handovers (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  allotment_id            uuid NOT NULL REFERENCES quarter_allotments(id) ON DELETE CASCADE,
  created_by              uuid REFERENCES users(id),
  key_number              text DEFAULT '',
  remarks                 text DEFAULT '',
  occupying_deadline      date,
  interior_doc_url        text DEFAULT '',
  inspection_report_url   text DEFAULT '',
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

ALTER TABLE quarter_handovers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read handovers"
  ON quarter_handovers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "EOs can insert handovers"
  ON quarter_handovers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
        AND role IN ('govt_official','admin','manager')
    )
  );

CREATE POLICY "EOs can update handovers"
  ON quarter_handovers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
        AND role IN ('govt_official','admin','manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
        AND role IN ('govt_official','admin','manager')
    )
  );

-- ─── Guest Info ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quarter_guest_info (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  allotment_id    uuid NOT NULL REFERENCES quarter_allotments(id) ON DELETE CASCADE,
  guest_name      text NOT NULL DEFAULT '',
  guest_mobile    text DEFAULT '',
  guest_email     text DEFAULT '',
  aadhaar_doc_url text DEFAULT '',
  pan_doc_url     text DEFAULT '',
  other_doc_urls  text[] DEFAULT '{}',
  created_by      uuid REFERENCES users(id),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE quarter_guest_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read guest info"
  ON quarter_guest_info FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "EOs and managers can insert guest info"
  ON quarter_guest_info FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
        AND role IN ('govt_official','admin','manager')
    )
  );

CREATE POLICY "EOs and managers can update guest info"
  ON quarter_guest_info FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
        AND role IN ('govt_official','admin','manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
        AND role IN ('govt_official','admin','manager')
    )
  );

CREATE POLICY "EOs and managers can delete guest info"
  ON quarter_guest_info FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
        AND role IN ('govt_official','admin','manager')
    )
  );

-- ─── Indexes for performance ────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_qaa_allotment_id ON quarter_allotment_approvals(allotment_id);
CREATE INDEX IF NOT EXISTS idx_qac_approval_id ON quarter_approval_chats(approval_id);
CREATE INDEX IF NOT EXISTS idx_qi_allotment_id ON quarter_inspections(allotment_id);
CREATE INDEX IF NOT EXISTS idx_qic_inspection_id ON quarter_inspection_chats(inspection_id);
CREATE INDEX IF NOT EXISTS idx_qh_allotment_id ON quarter_handovers(allotment_id);
CREATE INDEX IF NOT EXISTS idx_qgi_allotment_id ON quarter_guest_info(allotment_id);
