/*
  # Create quarter_service_chats table

  ## Purpose
  Stores individual chat/remark messages on a quarter tenant service request,
  enabling a full conversation thread between the employee and the Estate Officer (EO).

  ## New Tables
  - `quarter_service_chats`
    - `id`                 — UUID primary key
    - `tenant_request_id`  — FK → quarter_tenant_requests.id (cascade delete)
    - `author_id`          — auth UID of the person who sent the message
    - `author_role`        — 'employee' | 'eo' | 'system'
    - `message`            — text content of the chat entry
    - `document_urls`      — array of document/file URLs attached to this entry
    - `created_at`         — timestamp

  ## Security
  - RLS enabled with restrictive policies
  - Employees see chats only for their own requests; EO/admin/manager see all
*/

CREATE TABLE IF NOT EXISTS quarter_service_chats (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_request_id uuid NOT NULL REFERENCES quarter_tenant_requests(id) ON DELETE CASCADE,
  author_id        uuid NOT NULL,
  author_role      text NOT NULL CHECK (author_role IN ('employee', 'eo', 'system')),
  message          text NOT NULL DEFAULT '',
  document_urls    text[] NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_chats_tenant_request ON quarter_service_chats(tenant_request_id);
CREATE INDEX IF NOT EXISTS idx_service_chats_author ON quarter_service_chats(author_id);

ALTER TABLE quarter_service_chats ENABLE ROW LEVEL SECURITY;

-- Employees can see chats for their own tenant requests; managers/admins see all
CREATE POLICY "Service chats select policy"
  ON quarter_service_chats FOR SELECT
  TO authenticated
  USING (
    auth.uid() = author_id
    OR
    EXISTS (
      SELECT 1 FROM quarter_tenant_requests qtr
      WHERE qtr.id = quarter_service_chats.tenant_request_id
        AND qtr.employee_id = auth.uid()
    )
    OR
    (SELECT extensions.get_user_role()) IN ('admin', 'manager')
  );

-- Users can insert their own messages (either as the employee of the request or as manager/admin)
CREATE POLICY "Service chats insert policy"
  ON quarter_service_chats FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM quarter_tenant_requests qtr
        WHERE qtr.id = tenant_request_id
          AND qtr.employee_id = auth.uid()
      )
      OR
      (SELECT extensions.get_user_role()) IN ('admin', 'manager')
    )
  );
