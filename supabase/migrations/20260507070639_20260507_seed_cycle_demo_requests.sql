/*
  # Seed 12 demo quarter_requests for Allotment Cycle 2025-Q2

  ## Purpose
  Adds 12 demo entries to the open 2025-Q2 allotment cycle so the Cycle
  Detail popup has a meaningful amount of data for demonstration.

  ## New Rows
  - 12 quarter_requests linked to cycle dd12c02a-8343-490a-a676-4aaaae26faea
  - Statuses spread across: ALLOTTED (5), ACKNOWLEDGED (3), REJECTED (2), VACATED (2)
  - 12 corresponding quarter_allotments rows for the non-rejected requests

  ## Notes
  - employee_id reuses the existing demo user: 5f865f74-aeab-4885-a898-80ba3da33ae0
  - request_for = SELF for all rows
  - allotted_by reuses the same demo user (estate officer role)
*/

DO $$
DECLARE
  emp_id  uuid := '5f865f74-aeab-4885-a898-80ba3da33ae0';
  cyc_id  uuid := 'dd12c02a-8343-490a-a676-4aaaae26faea';

  -- 12 quarters from existing data
  q1  uuid := 'd499495a-363a-4acb-936a-c09935240724'; -- QTR-D-0102
  q2  uuid := '421cdeae-b4f5-4457-9446-7ab0679658c1'; -- QTR-C-4401
  q3  uuid := '3920b31b-6fda-4ee6-8dc8-9b9afcfb04c2'; -- QTR-C-2204
  q4  uuid := '54df5006-c895-49cb-85d7-f94796458edd'; -- QTR-E-0501
  q5  uuid := '93872178-9cdc-46d4-bb52-162244525a68'; -- QTR-E-1203
  q6  uuid := '156de4fd-3cc7-4ff1-98ae-226bc2c0527e'; -- QTR-F-0301
  q7  uuid := '00bf6bb5-5cfc-4527-8a59-1160ccf4ce3a'; -- QTR-F-1104
  q8  uuid := 'aeb777b6-741d-4a89-9a65-e13e2bfb3a7b'; -- QTR-G-2201
  q9  uuid := 'e8f34295-b3bb-4e92-b5ea-d3fb66aa0288'; -- QTR-B-1106
  q10 uuid := '1cc71198-0ba0-4e0a-977d-0938c7f31218'; -- QTR-B-3308
  q11 uuid := '0e1a8b57-8412-442c-a013-f265a4a431f1'; -- QTR-A-1204
  q12 uuid := '68fe0219-d9c9-4fb6-bcc2-838196b98fdf'; -- QTR-A-1801

  -- request IDs
  r1  uuid := gen_random_uuid();
  r2  uuid := gen_random_uuid();
  r3  uuid := gen_random_uuid();
  r4  uuid := gen_random_uuid();
  r5  uuid := gen_random_uuid();
  r6  uuid := gen_random_uuid();
  r7  uuid := gen_random_uuid();
  r8  uuid := gen_random_uuid();
  r9  uuid := gen_random_uuid();
  r10 uuid := gen_random_uuid();
  r11 uuid := gen_random_uuid();
  r12 uuid := gen_random_uuid();
BEGIN
  -- Insert 12 requests
  INSERT INTO quarter_requests (id, request_number, employee_id, cycle_id, request_for, required_bhk_config, request_reason, preferred_location, family_member_count, request_status, created_at)
  VALUES
    (r1,  'REQ-2025-Q2-001', emp_id, cyc_id, 'SELF', '2BHK', 'Transfer posting', 'Block-D', 3, 'ALLOTTED',      '2025-04-05 09:00:00+00'),
    (r2,  'REQ-2025-Q2-002', emp_id, cyc_id, 'SELF', '3BHK', 'Family relocation', 'Block-C', 4, 'ALLOTTED',     '2025-04-07 10:00:00+00'),
    (r3,  'REQ-2025-Q2-003', emp_id, cyc_id, 'SELF', '2BHK', 'Promotion transfer', 'Block-C', 2, 'ALLOTTED',    '2025-04-10 11:00:00+00'),
    (r4,  'REQ-2025-Q2-004', emp_id, cyc_id, 'SELF', '1BHK', 'New joinee', 'Block-E', 1, 'ALLOTTED',            '2025-04-12 09:30:00+00'),
    (r5,  'REQ-2025-Q2-005', emp_id, cyc_id, 'SELF', '3BHK', 'Hardship case', 'Block-E', 5, 'ALLOTTED',         '2025-04-15 10:30:00+00'),
    (r6,  'REQ-2025-Q2-006', emp_id, cyc_id, 'SELF', '2BHK', 'Medical grounds', 'Block-F', 3, 'ACKNOWLEDGED',   '2025-04-18 09:00:00+00'),
    (r7,  'REQ-2025-Q2-007', emp_id, cyc_id, 'SELF', '2BHK', 'Transfer posting', 'Block-F', 2, 'ACKNOWLEDGED',  '2025-04-20 11:00:00+00'),
    (r8,  'REQ-2025-Q2-008', emp_id, cyc_id, 'SELF', '3BHK', 'Seniority basis', 'Block-G', 4, 'ACKNOWLEDGED',   '2025-04-22 10:00:00+00'),
    (r9,  'REQ-2025-Q2-009', emp_id, cyc_id, 'SELF', '1BHK', 'New joinee', 'Block-B', 1, 'REJECTED',            '2025-04-25 09:00:00+00'),
    (r10, 'REQ-2025-Q2-010', emp_id, cyc_id, 'SELF', '2BHK', 'Transfer request', 'Block-B', 2, 'REJECTED',      '2025-04-26 10:00:00+00'),
    (r11, 'REQ-2025-Q2-011', emp_id, cyc_id, 'SELF', '2BHK', 'Voluntary vacate', 'Block-A', 3, 'VACATED',       '2025-04-28 09:00:00+00'),
    (r12, 'REQ-2025-Q2-012', emp_id, cyc_id, 'SELF', '3BHK', 'Retirement vacate', 'Block-A', 4, 'VACATED',      '2025-04-30 10:00:00+00')
  ON CONFLICT (id) DO NOTHING;

  -- Insert allotments for all except REJECTED ones (r9, r10)
  INSERT INTO quarter_allotments (id, request_id, quarter_id, allotted_by, allotment_date, allotment_letter_url, override_reason_doc, is_overridden, approval_status, allotment_conditions, acknowledgement_remarks, rejection_reason, rejection_doc_url)
  VALUES
    (gen_random_uuid(), r1,  q1,  emp_id, '2025-04-08', '', '', false, 'APPROVED',  '', '', '', ''),
    (gen_random_uuid(), r2,  q2,  emp_id, '2025-04-10', '', '', false, 'APPROVED',  '', '', '', ''),
    (gen_random_uuid(), r3,  q3,  emp_id, '2025-04-13', '', '', false, 'APPROVED',  '', '', '', ''),
    (gen_random_uuid(), r4,  q4,  emp_id, '2025-04-15', '', '', false, 'PENDING',   '', '', '', ''),
    (gen_random_uuid(), r5,  q5,  emp_id, '2025-04-18', '', '', false, 'PENDING',   '', '', '', ''),
    (gen_random_uuid(), r6,  q6,  emp_id, '2025-04-20', '', '', false, 'APPROVED',  '', 'Acknowledged by employee', '', ''),
    (gen_random_uuid(), r7,  q7,  emp_id, '2025-04-23', '', '', false, 'APPROVED',  '', 'Acknowledged by employee', '', ''),
    (gen_random_uuid(), r8,  q8,  emp_id, '2025-04-25', '', '', false, 'APPROVED',  '', 'Acknowledged by employee', '', ''),
    (gen_random_uuid(), r11, q11, emp_id, '2025-05-01', '', '', false, 'APPROVED',  '', '', '', ''),
    (gen_random_uuid(), r12, q12, emp_id, '2025-05-03', '', '', false, 'APPROVED',  '', '', '', '')
  ON CONFLICT (id) DO NOTHING;
END $$;
