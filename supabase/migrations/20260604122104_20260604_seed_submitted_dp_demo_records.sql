/*
  # Seed SUBMITTED DP Demo Records

  ## Purpose
  Adds 3 quarter_requests in SUBMITTED status to demonstrate the Estate Manager
  request-type override feature. Two records have request_type = 'MEDICAL' and
  one has request_type = 'GENERAL'.

  ## New Records
  - REQ-2026-MED01 — MEDICAL request, Type-II, Dwarka or nearby
  - REQ-2026-MED02 — MEDICAL request, Type-III, Rohini or nearby
  - REQ-2026-GEN01 — GENERAL request, Type-II, Saket or nearby

  All three belong to the primary demo employee (5f865f74-aeab-4885-a898-80ba3da33ae0).
*/

INSERT INTO quarter_requests (
  id,
  request_number,
  employee_id,
  request_status,
  request_type,
  required_bhk_config,
  preferred_location,
  move_in_date,
  request_reason,
  family_member_count,
  employee_notes,
  eo_notes,
  request_for,
  created_at,
  updated_at
) VALUES
(
  'b2000001-0000-0000-0000-000000000101',
  'REQ-2026-MED01',
  '5f865f74-aeab-4885-a898-80ba3da33ae0',
  'SUBMITTED',
  'MEDICAL',
  'Type-II',
  'Dwarka or nearby',
  '2026-07-01',
  'Post-surgery recovery requires ground floor accommodation with lift access.',
  3,
  'Medical certificate and discharge summary attached.',
  '',
  'SELF',
  now() - interval '3 days',
  now() - interval '3 days'
),
(
  'b2000001-0000-0000-0000-000000000102',
  'REQ-2026-MED02',
  '5f865f74-aeab-4885-a898-80ba3da33ae0',
  'SUBMITTED',
  'MEDICAL',
  'Type-III',
  'Rohini or nearby',
  '2026-07-15',
  'Dependent family member with chronic illness requires proximity to AIIMS.',
  4,
  'Disability certificate enclosed for dependent spouse.',
  '',
  'SELF',
  now() - interval '2 days',
  now() - interval '2 days'
),
(
  'b2000001-0000-0000-0000-000000000103',
  'REQ-2026-GEN01',
  '5f865f74-aeab-4885-a898-80ba3da33ae0',
  'SUBMITTED',
  'GENERAL',
  'Type-II',
  'Saket or nearby',
  '2026-08-01',
  'Transfer from outstation posting, require accommodation near office.',
  2,
  'Transfer order attached.',
  '',
  'SELF',
  now() - interval '1 day',
  now() - interval '1 day'
)
ON CONFLICT (id) DO NOTHING;
