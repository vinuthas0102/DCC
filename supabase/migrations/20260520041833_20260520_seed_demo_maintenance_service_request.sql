/*
  # Seed Demo Maintenance Service Request

  Seeds a hardcoded maintenance service request and two chat messages for the demo
  "Under Maintenance" vacated booking (BK2026040100005, id dffc4358-d2df-4264-9838-d402e0935bb7).

  1. New Rows
    - `booking_service_requests`: one MAINTENANCE request, status OPEN, urgency MEDIUM
    - `booking_service_chats`: two demo chat messages (employee + manager)

  2. Notes
    - Uses ON CONFLICT DO NOTHING so re-running is safe
    - employee_id set to the demo govt official user
*/

INSERT INTO booking_service_requests (
  id,
  booking_id,
  employee_id,
  service_type,
  request_status,
  subject,
  remarks,
  urgency_level,
  eo_notes,
  document_url,
  created_at,
  updated_at
) VALUES (
  'aa000001-0000-4000-8000-000000000001'::uuid,
  'dffc4358-d2df-4264-9838-d402e0935bb7'::uuid,
  '5f865f74-aeab-4885-a898-80ba3da33ae0'::uuid,
  'MAINTENANCE',
  'OPEN',
  'Post-vacate plumbing check required',
  'After guest checkout, a water leakage was reported near the bathroom pipeline. A plumber inspection and repair is required before the room is made available for the next booking.',
  'MEDIUM',
  '',
  '',
  '2026-04-03T06:00:00Z',
  '2026-04-03T06:00:00Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO booking_service_chats (
  id,
  service_request_id,
  author_id,
  author_role,
  message,
  document_urls,
  delivery_mode,
  created_at
) VALUES
(
  'bb000001-0000-4000-8000-000000000001'::uuid,
  'aa000001-0000-4000-8000-000000000001'::uuid,
  '5f865f74-aeab-4885-a898-80ba3da33ae0'::uuid,
  'employee',
  'Reported water leakage near bathroom pipeline after guest checkout. Requesting immediate plumber visit.',
  '{}',
  'IN_APP',
  '2026-04-03T06:05:00Z'
),
(
  'bb000002-0000-4000-8000-000000000002'::uuid,
  'aa000001-0000-4000-8000-000000000001'::uuid,
  'e0000001-e000-0000-0000-000000000001'::uuid,
  'manager',
  'Acknowledged. Plumber scheduled for Apr 4. Room will remain blocked until inspection is complete.',
  '{}',
  'IN_APP',
  '2026-04-03T09:30:00Z'
)
ON CONFLICT (id) DO NOTHING;
