/*
  # Seed: Occupied and Vacate Request test data for demo employee

  ## Summary
  Creates realistic demo data for the demo@fms.com employee (id: 5f865f74-...)
  so the Occupied and Vacate Request DP filters on the Quarter Requests page
  show populated cards.

  ## What is inserted
  1. quarter_requests row 1 — status ACKNOWLEDGED (Occupied)
     - uses QTR-B-1106 (3 BHK, Block-B)
     - matching quarter_allotments row with approval_status ACKNOWLEDGED

  2. quarter_requests row 2 — status VACATE_REQUESTED
     - uses QTR-A-1801 (3 BHK, Block-A)
     - matching quarter_allotments row with approval_status ACKNOWLEDGED
     - matching quarter_tenant_requests row with service_type VACATE, status PENDING

  ## Notes
  - All inserts are guarded with ON CONFLICT DO NOTHING using explicit UUIDs
  - quarter occupancy_status is updated to OCCUPIED for the two used quarters
  - Demo employee id: 5f865f74-aeab-4885-a898-80ba3da33ae0
*/

DO $$
DECLARE
  v_emp       uuid := '5f865f74-aeab-4885-a898-80ba3da33ae0';
  v_q1        uuid := 'e8f34295-b3bb-4e92-b5ea-d3fb66aa0288'; -- QTR-B-1106 3BHK
  v_q2        uuid := '68fe0219-d9c9-4fb6-bcc2-838196b98fdf'; -- QTR-A-1801 3BHK
  v_req1      uuid := 'a1000001-0000-0000-0000-000000000001';
  v_req2      uuid := 'a1000001-0000-0000-0000-000000000002';
  v_allot1    uuid := 'b2000001-0000-0000-0000-000000000001';
  v_allot2    uuid := 'b2000001-0000-0000-0000-000000000002';
  v_tenant1   uuid := 'c3000001-0000-0000-0000-000000000001';
BEGIN

  -- ── Request 1: Occupied (ACKNOWLEDGED) ─────────────────────────────────────
  INSERT INTO quarter_requests (
    id, request_number, employee_id, cycle_id, initiation_type,
    request_reason, required_bhk_config, preferred_location,
    move_in_date, family_member_count, request_status,
    employee_notes, eo_notes
  ) VALUES (
    v_req1, 'REQ-2025-00001', v_emp, NULL, 'EMPLOYEE',
    'Transfer-in from Bhilai region', '3 BHK', 'Block-B',
    '2025-08-01', 4, 'ACKNOWLEDGED',
    'Need to be close to sector 3 office', ''
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO quarter_allotments (
    id, request_id, quarter_id, allotted_by, allotment_date,
    is_overridden, approval_status, allotment_conditions,
    acknowledgement_remarks, acknowledged_at
  ) VALUES (
    v_allot1, v_req1, v_q1, v_emp, '2025-08-10',
    false, 'ACKNOWLEDGED', 'Quarter to be handed over in clean condition',
    'Acknowledged. Will move in on 1st September.', '2025-08-15 09:30:00+05:30'
  ) ON CONFLICT (id) DO NOTHING;

  UPDATE quarters SET occupancy_status = 'OCCUPIED' WHERE id = v_q1;

  -- ── Request 2: Vacate Requested ─────────────────────────────────────────────
  INSERT INTO quarter_requests (
    id, request_number, employee_id, cycle_id, initiation_type,
    request_reason, required_bhk_config, preferred_location,
    move_in_date, family_member_count, request_status,
    employee_notes, eo_notes
  ) VALUES (
    v_req2, 'REQ-2025-00002', v_emp, NULL, 'EMPLOYEE',
    'Posting transfer to Delhi', '3 BHK', 'Block-A',
    '2025-03-01', 3, 'VACATE_REQUESTED',
    'Transfer order received. Need to vacate by end of month.', ''
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO quarter_allotments (
    id, request_id, quarter_id, allotted_by, allotment_date,
    is_overridden, approval_status, allotment_conditions,
    acknowledgement_remarks, acknowledged_at
  ) VALUES (
    v_allot2, v_req2, v_q2, v_emp, '2024-12-01',
    false, 'ACKNOWLEDGED', '',
    'Acknowledged and occupied.', '2024-12-10 10:00:00+05:30'
  ) ON CONFLICT (id) DO NOTHING;

  UPDATE quarters SET occupancy_status = 'OCCUPIED' WHERE id = v_q2;

  -- ── Tenant request: Vacate ───────────────────────────────────────────────────
  INSERT INTO quarter_tenant_requests (
    id, allotment_id, employee_id, service_type, request_status,
    remarks, reason, document_url, requested_date, required_bhk_config
  ) VALUES (
    v_tenant1, v_allot2, v_emp, 'VACATE', 'PENDING',
    'Posting transfer order attached. Requesting vacation by April 30.',
    'Transfer order to Delhi region received on 2026-04-20.',
    '', '2026-04-30', ''
  ) ON CONFLICT (id) DO NOTHING;

END $$;
