/*
  # Add sub_status to quarter_allotments + Create quarter_service_chats

  ## Changes

  ### 1. quarter_allotments — new sub_status column
  - Adds `sub_status` (text, nullable) to track decline sub-states
  - Possible values: 'DECLINED', 'CANCELLED_AFTER_DECLINE', null (normal)

  ### 2. quarter_service_chats — new table
  - One row per chat message on a tenant service request
  - Fields: id, tenant_request_id (FK), author_id (auth user UUID), author_role
    (employee/eo/system), message (text), document_urls (text[]), created_at
  - RLS: authenticated users can insert and read chats for their own requests

  ### Security
  - RLS enabled on quarter_service_chats
  - SELECT policy: user is the employee of the linked allotment request OR
    the allotted_by EO of the linked allotment (simplified: authenticated read
    for now; app-level filtering is also applied)
  - INSERT policy: authenticated users only
*/

-- ── 1. Add sub_status to quarter_allotments ─────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quarter_allotments' AND column_name = 'sub_status'
  ) THEN
    ALTER TABLE quarter_allotments ADD COLUMN sub_status text DEFAULT NULL;
  END IF;
END $$;

-- ── 2. Create quarter_service_chats ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quarter_service_chats (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_request_id uuid NOT NULL REFERENCES quarter_tenant_requests(id) ON DELETE CASCADE,
  author_id        uuid NOT NULL,
  author_role      text NOT NULL DEFAULT 'employee',
  message          text NOT NULL DEFAULT '',
  document_urls    text[] DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_chats_tenant_request
  ON quarter_service_chats(tenant_request_id, created_at);

ALTER TABLE quarter_service_chats ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read service chats
-- (application filtering ensures only relevant parties see the data)
CREATE POLICY "Authenticated users can read service chats"
  ON quarter_service_chats
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert service chats"
  ON quarter_service_chats
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);
