/*
  # Seed: Occupied demo request with active services and chat for demo@fms.com

  ## Summary
  Creates a fully-populated ACKNOWLEDGED (Occupied) quarter request for the
  demo employee so the Occupied panel shows realistic content immediately:
  active services list, chat messages, and the raise-new-service buttons.

  ## What is inserted
  1. quarter_requests — status ACKNOWLEDGED, QTR-B-3308 (3 BHK, Block-B, Sector 3)
  2. quarter_allotments — approval_status ACKNOWLEDGED
  3. quarter_tenant_requests × 2:
     - MAINTENANCE PENDING  (kitchen tap leaking)
     - GRIEVANCE PENDING    (common area lights non-functional)
  4. quarter_service_chats × 2 for the maintenance request
  5. QTR-B-3308 occupancy_status set to OCCUPIED

  ## Notes
  - All inserts use explicit UUIDs with ON CONFLICT DO NOTHING
  - Employee: demo@fms.com  id: 5f865f74-aeab-4885-a898-80ba3da33ae0
  - Quarter: QTR-B-3308     id: 1cc71198-0ba0-4e0a-977d-0938c7f31218
*/

DO $$
DECLARE
  v_emp   uuid := '5f865f74-aeab-4885-a898-80ba3da33ae0';
  v_q     uuid := '1cc71198-0ba0-4e0a-977d-0938c7f31218';
  v_req   uuid := 'a1000001-0000-0000-0000-000000000010';
  v_allot uuid := 'b2000001-0000-0000-0000-000000000010';
  v_svc1  uuid := 'c3000001-0000-0000-0000-000000000010';
  v_svc2  uuid := 'c3000001-0000-0000-0000-000000000011';
  v_chat1 uuid := 'd4000001-0000-0000-0000-000000000010';
  v_chat2 uuid := 'd4000001-0000-0000-0000-000000000011';
BEGIN

  -- 1. Quarter request (ACKNOWLEDGED = Occupied)
  INSERT INTO quarter_requests (
    id, request_number, employee_id, cycle_id, initiation_type,
    request_reason, required_bhk_config, preferred_location,
    move_in_date, family_member_count, request_status,
    employee_notes, eo_notes, created_at
  ) VALUES (
    v_req, 'REQ-2025-00010', v_emp, NULL, 'EMPLOYEE',
    'Permanent transfer to Bacheli project site', '3 BHK', 'Block-B, Sector 3',
    '2025-03-01', 3, 'ACKNOWLEDGED',
    'Prefer ground/first floor due to elderly parent.',
    'Allotted as per seniority and availability.',
    '2025-02-10 09:00:00+05:30'
  ) ON CONFLICT (id) DO NOTHING;

  -- 2. Allotment (ACKNOWLEDGED)
  INSERT INTO quarter_allotments (
    id, request_id, quarter_id, allotted_by, allotment_date,
    is_overridden, approval_status, allotment_conditions,
    acknowledgement_remarks, acknowledged_at, created_at
  ) VALUES (
    v_allot, v_req, v_q, v_emp, '2025-02-20',
    false, 'ACKNOWLEDGED',
    'Quarter to be returned in original condition on vacation.',
    'Inspected and found satisfactory. Moving in on 1st March.',
    '2025-02-25 11:00:00+05:30',
    '2025-02-20 10:00:00+05:30'
  ) ON CONFLICT (id) DO NOTHING;

  -- 3a. Maintenance service request (active)
  INSERT INTO quarter_tenant_requests (
    id, allotment_id, employee_id, service_type, request_status,
    reason, remarks, document_url, requested_date, required_bhk_config,
    created_at
  ) VALUES (
    v_svc1, v_allot, v_emp, 'MAINTENANCE', 'PENDING',
    'Kitchen tap leaking continuously since last week.',
    'Plumber visit requested at earliest convenience.',
    '', '2026-04-28', '',
    '2026-04-28 08:30:00+05:30'
  ) ON CONFLICT (id) DO NOTHING;

  -- 3b. Grievance service request (active)
  INSERT INTO quarter_tenant_requests (
    id, allotment_id, employee_id, service_type, request_status,
    reason, remarks, document_url, requested_date, required_bhk_config,
    created_at
  ) VALUES (
    v_svc2, v_allot, v_emp, 'GRIEVANCE', 'PENDING',
    'Common area lights on floor 3 non-functional for 10 days.',
    'Repeated verbal requests to society office ignored.',
    '', '2026-05-01', '',
    '2026-05-01 10:15:00+05:30'
  ) ON CONFLICT (id) DO NOTHING;

  -- 4a. Chat: employee message on maintenance request
  INSERT INTO quarter_service_chats (
    id, tenant_request_id, author_role, author_id, message,
    document_urls, created_at
  ) VALUES (
    v_chat1, v_svc1, 'EMPLOYEE', v_emp,
    'Kitchen tap has been leaking since 21st April. Water is pooling under the sink cabinet. Requesting urgent plumber visit.',
    '{}',
    '2026-04-28 08:35:00+05:30'
  ) ON CONFLICT (id) DO NOTHING;

  -- 4b. Chat: EO reply on maintenance request
  INSERT INTO quarter_service_chats (
    id, tenant_request_id, author_role, author_id, message,
    document_urls, created_at
  ) VALUES (
    v_chat2, v_svc1, 'EO', v_emp,
    'Acknowledged. Plumber has been scheduled for 30th April between 10 AM – 12 PM. Please ensure access to the kitchen area.',
    '{}',
    '2026-04-29 14:20:00+05:30'
  ) ON CONFLICT (id) DO NOTHING;

  -- 5. Mark quarter as occupied
  UPDATE quarters SET occupancy_status = 'OCCUPIED' WHERE id = v_q;

END $$;
