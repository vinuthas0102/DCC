/*
  # Create Booking Service Requests and Chats Tables

  ## Summary
  Adds a service request system for facility bookings, analogous to the quarter
  tenant requests system. Users can raise Grievance, Maintenance, Extension,
  Cancellation Request, or General service requests against their bookings, and
  communicate with the estate manager via an inline chat thread on each request.

  ## New Tables

  ### booking_service_requests
  - `id` — UUID primary key
  - `booking_id` — FK to bookings, cascade delete
  - `employee_id` — auth UID of the requester (FK to auth.users)
  - `service_type` — GRIEVANCE | MAINTENANCE | EXTENSION | CANCELLATION_REQUEST | GENERAL
  - `request_status` — OPEN | IN_PROGRESS | RESOLVED | CLOSED
  - `subject` — short title of the request
  - `remarks` — detailed description from the user
  - `urgency_level` — LOW | MEDIUM | HIGH (for grievance/maintenance)
  - `eo_notes` — notes added by the estate officer/manager
  - `document_url` — optional attached document URL
  - `created_at`, `updated_at`

  ### booking_service_chats
  - `id` — UUID primary key
  - `service_request_id` — FK to booking_service_requests, cascade delete
  - `author_id` — auth UID of the message author
  - `author_role` — 'employee' | 'manager' | 'system'
  - `message` — text content
  - `document_urls` — array of attached document URLs
  - `created_at`

  ## Security
  - RLS enabled on both tables
  - Users can only SELECT/INSERT their own booking service requests
  - Users can only SELECT/INSERT chats on their own service requests
  - Managers can SELECT/INSERT on all records
*/

-- ── booking_service_requests ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS booking_service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type text NOT NULL CHECK (service_type IN ('GRIEVANCE', 'MAINTENANCE', 'EXTENSION', 'CANCELLATION_REQUEST', 'GENERAL')),
  request_status text NOT NULL DEFAULT 'OPEN' CHECK (request_status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
  subject text NOT NULL DEFAULT '',
  remarks text NOT NULL DEFAULT '',
  urgency_level text NOT NULL DEFAULT 'MEDIUM' CHECK (urgency_level IN ('LOW', 'MEDIUM', 'HIGH')),
  eo_notes text NOT NULL DEFAULT '',
  document_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE booking_service_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_bsr_booking_id ON booking_service_requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_bsr_employee_id ON booking_service_requests(employee_id);

-- Users can view their own service requests
CREATE POLICY "Users can view own booking service requests"
  ON booking_service_requests FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

-- Users can create service requests for their own bookings
CREATE POLICY "Users can create own booking service requests"
  ON booking_service_requests FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

-- Users can update (close/modify) their own requests
CREATE POLICY "Users can update own booking service requests"
  ON booking_service_requests FOR UPDATE
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

-- Managers can view all booking service requests
CREATE POLICY "Managers can view all booking service requests"
  ON booking_service_requests FOR SELECT
  TO authenticated
  USING (
    (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) IN ('MANAGER', 'ADMIN', 'SUPER_ADMIN')
  );

-- Managers can update all booking service requests (add eo_notes, change status)
CREATE POLICY "Managers can update all booking service requests"
  ON booking_service_requests FOR UPDATE
  TO authenticated
  USING (
    (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) IN ('MANAGER', 'ADMIN', 'SUPER_ADMIN')
  )
  WITH CHECK (
    (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) IN ('MANAGER', 'ADMIN', 'SUPER_ADMIN')
  );

-- ── booking_service_chats ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS booking_service_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id uuid NOT NULL REFERENCES booking_service_requests(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_role text NOT NULL CHECK (author_role IN ('employee', 'manager', 'system')),
  message text NOT NULL DEFAULT '',
  document_urls text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE booking_service_chats ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_bsc_service_request_id ON booking_service_chats(service_request_id);

-- Users can view chats on their own service requests
CREATE POLICY "Users can view chats on own service requests"
  ON booking_service_chats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM booking_service_requests bsr
      WHERE bsr.id = booking_service_chats.service_request_id
        AND bsr.employee_id = auth.uid()
    )
  );

-- Users can send messages on their own service requests
CREATE POLICY "Users can send chats on own service requests"
  ON booking_service_chats FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM booking_service_requests bsr
      WHERE bsr.id = booking_service_chats.service_request_id
        AND bsr.employee_id = auth.uid()
    )
  );

-- Managers can view all chats
CREATE POLICY "Managers can view all booking service chats"
  ON booking_service_chats FOR SELECT
  TO authenticated
  USING (
    (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) IN ('MANAGER', 'ADMIN', 'SUPER_ADMIN')
  );

-- Managers can send messages on any service request
CREATE POLICY "Managers can send chats on any service request"
  ON booking_service_chats FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) IN ('MANAGER', 'ADMIN', 'SUPER_ADMIN')
  );
