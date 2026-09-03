/*
  # Seed: EO demo data — cycle-linked quarter requests

  ## Summary
  Inserts additional quarter_requests tied to the open allotment cycle
  (Allotment Cycle 2025-Q2) so the EO Cycle Requests and Allotment Table
  tabs show populated data. Guards all inserts with ON CONFLICT DO NOTHING
  using explicit UUIDs. Preferences also conflict on (request_id, preference_rank).

  ## What is inserted
  1. REQ-2025-00003 — SUBMITTED + preferences
  2. REQ-2025-00004 — ALLOTTED + matching allotment (PENDING)
  3. REQ-2025-00005 — SUBMITTED + preferences
*/

DO $$
DECLARE
  v_emp    uuid := '5f865f74-aeab-4885-a898-80ba3da33ae0';
  v_cycle  uuid := 'dd12c02a-8343-490a-a676-4aaaae26faea';

  v_req3   uuid := 'a1000001-0000-0000-0000-000000000003';
  v_req4   uuid := 'a1000001-0000-0000-0000-000000000004';
  v_req5   uuid := 'a1000001-0000-0000-0000-000000000005';
  v_allot4 uuid := 'b2000001-0000-0000-0000-000000000004';

  v_q_4bhk1  uuid := '0e1a8b57-8412-442c-a013-f265a4a431f1'; -- QTR-A-1204 4BHK
  v_q_3bhk1  uuid := '1cc71198-0ba0-4e0a-977d-0938c7f31218'; -- QTR-B-3308 3BHK
  v_q_4bhk2  uuid := 'd499495a-363a-4acb-936a-c09935240724'; -- QTR-D-0102 4BHK
  v_q_2bhk1  uuid := '421cdeae-b4f5-4457-9446-7ab0679658c1'; -- QTR-C-4401 2BHK
  v_q_2bhk2  uuid := '3920b31b-6fda-4ee6-8dc8-9b9afcfb04c2'; -- QTR-C-2204 2BHK
BEGIN

  -- ── Request 3: SUBMITTED ─────────────────────────────────────────────────────
  INSERT INTO quarter_requests (
    id, request_number, employee_id, cycle_id, initiation_type,
    request_reason, required_bhk_config, preferred_location,
    move_in_date, family_member_count, request_status, employee_notes, eo_notes
  ) VALUES (
    v_req3, 'REQ-2025-00003', v_emp, v_cycle, 'EMPLOYEE',
    'New joining — senior management', '4 BHK', 'Block-A or Block-D',
    '2025-07-01', 5, 'SUBMITTED', 'Require 4 BHK due to 5 family members.', ''
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO quarter_request_preferences (id, request_id, quarter_id, preference_rank, pref_status)
  VALUES ('d1000001-0000-0000-0000-000000000001', v_req3, v_q_4bhk1, 1, 'PENDING')
  ON CONFLICT (request_id, preference_rank) DO NOTHING;

  INSERT INTO quarter_request_preferences (id, request_id, quarter_id, preference_rank, pref_status)
  VALUES ('d1000001-0000-0000-0000-000000000002', v_req3, v_q_4bhk2, 2, 'PENDING')
  ON CONFLICT (request_id, preference_rank) DO NOTHING;

  -- ── Request 4: ALLOTTED ──────────────────────────────────────────────────────
  INSERT INTO quarter_requests (
    id, request_number, employee_id, cycle_id, initiation_type,
    request_reason, required_bhk_config, preferred_location,
    move_in_date, family_member_count, request_status, employee_notes, eo_notes
  ) VALUES (
    v_req4, 'REQ-2025-00004', v_emp, v_cycle, 'EMPLOYEE',
    'Annual allotment cycle request', '3 BHK', 'Block-B',
    '2025-08-15', 3, 'ALLOTTED', '', 'Allotted as per preference rank 1.'
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO quarter_request_preferences (id, request_id, quarter_id, preference_rank, pref_status)
  VALUES ('d1000001-0000-0000-0000-000000000003', v_req4, v_q_3bhk1, 1, 'SELECTED')
  ON CONFLICT (request_id, preference_rank) DO NOTHING;

  INSERT INTO quarter_request_preferences (id, request_id, quarter_id, preference_rank, pref_status)
  VALUES ('d1000001-0000-0000-0000-000000000004', v_req4, v_q_4bhk1, 2, 'PENDING')
  ON CONFLICT (request_id, preference_rank) DO NOTHING;

  INSERT INTO quarter_allotments (
    id, request_id, quarter_id, allotted_by, allotment_date,
    is_overridden, approval_status, allotment_conditions
  ) VALUES (
    v_allot4, v_req4, v_q_3bhk1, v_emp, '2025-06-20',
    false, 'PENDING', 'Quarter to be accepted within 7 days.'
  ) ON CONFLICT (id) DO NOTHING;

  -- ── Request 5: SUBMITTED ─────────────────────────────────────────────────────
  INSERT INTO quarter_requests (
    id, request_number, employee_id, cycle_id, initiation_type,
    request_reason, required_bhk_config, preferred_location,
    move_in_date, family_member_count, request_status, employee_notes, eo_notes
  ) VALUES (
    v_req5, 'REQ-2025-00005', v_emp, v_cycle, 'EMPLOYEE',
    'Transfer from Bacheli to Kirandul', '2 BHK', 'Block-C',
    '2025-09-01', 2, 'SUBMITTED', 'Small family, prefer 2 BHK in Block-C.', ''
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO quarter_request_preferences (id, request_id, quarter_id, preference_rank, pref_status)
  VALUES ('d1000001-0000-0000-0000-000000000005', v_req5, v_q_2bhk1, 1, 'PENDING')
  ON CONFLICT (request_id, preference_rank) DO NOTHING;

  INSERT INTO quarter_request_preferences (id, request_id, quarter_id, preference_rank, pref_status)
  VALUES ('d1000001-0000-0000-0000-000000000006', v_req5, v_q_2bhk2, 2, 'PENDING')
  ON CONFLICT (request_id, preference_rank) DO NOTHING;

END $$;
