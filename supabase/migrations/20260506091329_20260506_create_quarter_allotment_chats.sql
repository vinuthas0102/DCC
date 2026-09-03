/*
  # Create quarter_allotment_chats table

  ## Purpose
  Stores chat messages on a quarter allotment, enabling a conversation thread
  between the employee and the Estate Officer (EO) during the allotment
  accept/decline process.

  ## New Tables
  - `quarter_allotment_chats`
    - `id`            — UUID primary key
    - `allotment_id`  — FK → quarter_allotments.id (cascade delete)
    - `author_id`     — auth UID of the sender
    - `author_role`   — 'employee' | 'eo' | 'system'
    - `message`       — text content
    - `document_urls` — array of attached file URLs
    - `created_at`    — timestamp

  ## Security
  - RLS enabled
  - Employees can see/insert chats for their own allotments
  - Managers/admins can see/insert all
*/

CREATE TABLE IF NOT EXISTS quarter_allotment_chats (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  allotment_id  uuid        NOT NULL REFERENCES quarter_allotments(id) ON DELETE CASCADE,
  author_id     uuid        NOT NULL,
  author_role   text        NOT NULL CHECK (author_role IN ('employee', 'eo', 'system')),
  message       text        NOT NULL DEFAULT '',
  document_urls text[]      NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_allotment_chats_allotment ON quarter_allotment_chats(allotment_id);
CREATE INDEX IF NOT EXISTS idx_allotment_chats_author    ON quarter_allotment_chats(author_id);

ALTER TABLE quarter_allotment_chats ENABLE ROW LEVEL SECURITY;

-- Employees see chats for their own allotments; managers/admins see all
CREATE POLICY "Allotment chats select policy"
  ON quarter_allotment_chats FOR SELECT
  TO authenticated
  USING (
    auth.uid() = author_id
    OR
    EXISTS (
      SELECT 1 FROM quarter_allotments qa
      JOIN quarter_requests qr ON qr.id = qa.request_id
      WHERE qa.id = quarter_allotment_chats.allotment_id
        AND qr.employee_id = auth.uid()
    )
    OR
    (SELECT extensions.get_user_role()) IN ('admin', 'manager')
  );

-- Employees can insert their own messages; managers/admins can also insert
CREATE POLICY "Allotment chats insert policy"
  ON quarter_allotment_chats FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM quarter_allotments qa
        JOIN quarter_requests qr ON qr.id = qa.request_id
        WHERE qa.id = allotment_id
          AND qr.employee_id = auth.uid()
      )
      OR
      (SELECT extensions.get_user_role()) IN ('admin', 'manager')
    )
  );
