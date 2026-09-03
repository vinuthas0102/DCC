/*
  # Seed Booking Workflow Demo Records

  ## Purpose
  Adds representative demo bookings for all three booking scenarios,
  plus associated service requests, to support estate manager workflow demonstration.

  ## Scenarios Covered

  1. Scenario A — Manager books on behalf of employee
     - BK2026052000031: PROVISIONED (manager-initiated, employee as guest)
     - BK2026052000032: REQUESTED (submitted, awaiting earmark)

  2. Scenario B — User requests via portal, manager earmarks, user pays
     - BK2026052000033: AWAITING_PAYMENT (earmarked, pending payment)
     - BK2026052000034: REQUESTED (fresh portal submission)

  3. Scenario C — B2C self-service: user searches, pays, books
     - BK2026052000035: ALLOCATED (paid and confirmed)
     - BK2026052000036: CHECKED_IN (guest in-house)

  4. Additional demo states
     - BK2026052000037: CHECKED_IN walk-in/ad-hoc
     - BK2026052000038: ALLOCATED, arriving today (check-in demo)

  ## Service Requests
  Attached to CHECKED_IN bookings for sub-card display.

  ## Notes
  - Uses existing user/property/room_type IDs from demo data
  - Idempotent via DO block and WHERE NOT EXISTS checks
*/

DO $$
BEGIN

-- Scenario A1: Manager-provisioned booking for employee
IF NOT EXISTS (SELECT 1 FROM bookings WHERE booking_number = 'BK2026052000031') THEN
  INSERT INTO bookings (
    id, booking_number, user_id, property_id, room_type_id, quantity,
    check_in_date, check_out_date, guest_details, special_requirements,
    status, total_amount, paid_amount, balance_amount, payment_status,
    notes, is_guest_booking, payment_scenario, created_at, updated_at
  ) VALUES (
    'b0000031-b000-4000-8000-000000000031',
    'BK2026052000031',
    '5f865f74-aeab-4885-a898-80ba3da33ae0',
    '26c89830-109e-48a9-b98e-aaf2ce699adb',
    '7fc1c91a-4beb-4760-b149-3001a2310764',
    1, '2026-06-05', '2026-06-08',
    '{"fullName":"Rajesh Kumar Sharma","email":"rajesh.sharma@nic.gov.in","phone":"9876543210","designation":"Deputy Secretary","department":"Ministry of Finance"}',
    'Booked by Estate Manager on behalf of employee',
    'PROVISIONED', 3600, 0, 3600, 'PENDING',
    'SCENARIO_A: Manager-initiated booking for employee. Room provisionally held.',
    false, 'immediate', now() - interval '2 days', now() - interval '2 days'
  );
END IF;

-- Scenario A2: Employee request pending manager earmark
IF NOT EXISTS (SELECT 1 FROM bookings WHERE booking_number = 'BK2026052000032') THEN
  INSERT INTO bookings (
    id, booking_number, user_id, property_id, room_type_id, quantity,
    check_in_date, check_out_date, guest_details, special_requirements,
    status, total_amount, paid_amount, balance_amount, payment_status,
    notes, is_guest_booking, payment_scenario, created_at, updated_at
  ) VALUES (
    'b0000032-b000-4000-8000-000000000032',
    'BK2026052000032',
    '5f865f74-aeab-4885-a898-80ba3da33ae0',
    'baafbf57-3288-4a56-a4ee-219174895518',
    'deccd249-2c5a-41be-9c9a-139794277acb',
    1, '2026-06-20', '2026-06-23',
    '{"fullName":"Priya Nair","email":"priya.nair@gov.in","phone":"9123456789","designation":"Section Officer","department":"Ministry of Home Affairs"}',
    'Official visit for inter-ministry coordination meeting',
    'REQUESTED', 4500, 0, 4500, 'PENDING',
    'SCENARIO_A: Submitted by employee. Awaiting estate manager to earmark room.',
    false, 'post_approval', now() - interval '1 day', now() - interval '1 day'
  );
END IF;

-- Scenario B1: Earmarked, awaiting user payment
IF NOT EXISTS (SELECT 1 FROM bookings WHERE booking_number = 'BK2026052000033') THEN
  INSERT INTO bookings (
    id, booking_number, user_id, property_id, room_type_id, quantity,
    check_in_date, check_out_date, guest_details, special_requirements,
    status, total_amount, paid_amount, balance_amount, payment_status,
    notes, is_guest_booking, payment_scenario, created_at, updated_at
  ) VALUES (
    'b0000033-b000-4000-8000-000000000033',
    'BK2026052000033',
    '5f865f74-aeab-4885-a898-80ba3da33ae0',
    '0ce493e5-4a13-4502-ae8a-fe80d924867b',
    '7fc1c91a-4beb-4760-b149-3001a2310764',
    2, '2026-07-01', '2026-07-04',
    '{"fullName":"Arun Mehta","email":"arun.mehta@railway.gov.in","phone":"9988776655","designation":"Joint Director","department":"Railway Board"}',
    'Require adjacent rooms for official delegation',
    'AWAITING_PAYMENT', 2400, 0, 2400, 'PENDING',
    'SCENARIO_B: Earmarked by Estate Manager. Payment link sent. Rooms held pending confirmation.',
    false, 'pre_acceptance', now() - interval '3 days', now() - interval '1 day'
  );
END IF;

-- Scenario B2: Fresh portal submission
IF NOT EXISTS (SELECT 1 FROM bookings WHERE booking_number = 'BK2026052000034') THEN
  INSERT INTO bookings (
    id, booking_number, user_id, property_id, room_type_id, quantity,
    check_in_date, check_out_date, guest_details, special_requirements,
    status, total_amount, paid_amount, balance_amount, payment_status,
    notes, is_guest_booking, payment_scenario, created_at, updated_at
  ) VALUES (
    'b0000034-b000-4000-8000-000000000034',
    'BK2026052000034',
    '5f865f74-aeab-4885-a898-80ba3da33ae0',
    '280cc387-eab2-40c1-b21b-2f41847615d3',
    'deccd249-2c5a-41be-9c9a-139794277acb',
    1, '2026-08-10', '2026-08-15',
    '{"fullName":"Meena Pillai","email":"meena.pillai@ias.gov.in","phone":"9811223344","designation":"Director","department":"Dept of Personnel"}',
    'Conference accommodation for 5 nights',
    'REQUESTED', 7500, 0, 7500, 'PENDING',
    'SCENARIO_B: Submitted via portal. Estate manager to review and earmark room.',
    false, 'post_approval', now() - interval '4 hours', now() - interval '4 hours'
  );
END IF;

-- Scenario C1: B2C — paid and allocated
IF NOT EXISTS (SELECT 1 FROM bookings WHERE booking_number = 'BK2026052000035') THEN
  INSERT INTO bookings (
    id, booking_number, user_id, property_id, room_type_id, quantity,
    check_in_date, check_out_date, guest_details, special_requirements,
    status, total_amount, paid_amount, balance_amount, payment_status,
    notes, is_guest_booking, payment_scenario, created_at, updated_at
  ) VALUES (
    'b0000035-b000-4000-8000-000000000035',
    'BK2026052000035',
    '5f865f74-aeab-4885-a898-80ba3da33ae0',
    '26c89830-109e-48a9-b98e-aaf2ce699adb',
    'deccd249-2c5a-41be-9c9a-139794277acb',
    1, '2026-07-15', '2026-07-18',
    '{"fullName":"Suresh Iyer","email":"suresh.iyer@tata.com","phone":"9090909090","designation":"GM - Projects","department":"Tata Consultancy Services"}',
    'B2C booking via portal',
    'ALLOCATED', 5400, 5400, 0, 'COMPLETED',
    'SCENARIO_C: Self-service B2C. Guest searched, selected, and paid online. No manager intervention.',
    true, 'immediate', now() - interval '5 days', now() - interval '5 days'
  );
END IF;

-- Scenario C2: B2C — guest checked in
IF NOT EXISTS (SELECT 1 FROM bookings WHERE booking_number = 'BK2026052000036') THEN
  INSERT INTO bookings (
    id, booking_number, user_id, property_id, room_type_id, quantity,
    check_in_date, check_out_date, guest_details, special_requirements,
    status, total_amount, paid_amount, balance_amount, payment_status,
    notes, is_guest_booking, payment_scenario, created_at, updated_at
  ) VALUES (
    'b0000036-b000-4000-8000-000000000036',
    'BK2026052000036',
    '5f865f74-aeab-4885-a898-80ba3da33ae0',
    '280cc387-eab2-40c1-b21b-2f41847615d3',
    '5fcb45e8-2857-419d-a7f6-d4a4741d30d1',
    1, '2026-05-19', '2026-05-23',
    '{"fullName":"Kavya Reddy","email":"kavya.reddy@infosys.com","phone":"9977554433","designation":"Senior Consultant","department":"Infosys Limited"}',
    'Suite booking for client visit. Early check-in.',
    'CHECKED_IN', 12000, 12000, 0, 'COMPLETED',
    'SCENARIO_C: B2C guest. Checked in 19-May-2026.',
    true, 'immediate', now() - interval '6 days', now() - interval '1 day'
  );
END IF;

-- Walk-in / Ad-hoc
IF NOT EXISTS (SELECT 1 FROM bookings WHERE booking_number = 'BK2026052000037') THEN
  INSERT INTO bookings (
    id, booking_number, user_id, property_id, room_type_id, quantity,
    check_in_date, check_out_date, guest_details, special_requirements,
    status, total_amount, paid_amount, balance_amount, payment_status,
    notes, is_guest_booking, payment_scenario, created_at, updated_at
  ) VALUES (
    'b0000037-b000-4000-8000-000000000037',
    'BK2026052000037',
    'e0000001-e000-0000-0000-000000000001',
    '26c89830-109e-48a9-b98e-aaf2ce699adb',
    '7fc1c91a-4beb-4760-b149-3001a2310764',
    1, '2026-05-20', '2026-05-22',
    '{"fullName":"Ravi Shankar","email":"ravi.shankar@pwd.gov.in","phone":"9812345678","designation":"Executive Engineer","department":"PWD"}',
    'Walk-in. Room 204 assigned at reception.',
    'CHECKED_IN', 2400, 2400, 0, 'COMPLETED',
    'ADHOC_WALKIN: Walk-in guest. Booked ad-hoc by Estate Manager. Cash collected. Room 204.',
    false, 'immediate', now() - interval '2 hours', now() - interval '2 hours'
  );
END IF;

-- Allocated, arriving today — for check-in demo
IF NOT EXISTS (SELECT 1 FROM bookings WHERE booking_number = 'BK2026052000038') THEN
  INSERT INTO bookings (
    id, booking_number, user_id, property_id, room_type_id, quantity,
    check_in_date, check_out_date, guest_details, special_requirements,
    status, total_amount, paid_amount, balance_amount, payment_status,
    notes, is_guest_booking, payment_scenario, created_at, updated_at
  ) VALUES (
    'b0000038-b000-4000-8000-000000000038',
    'BK2026052000038',
    '5f865f74-aeab-4885-a898-80ba3da33ae0',
    'baafbf57-3288-4a56-a4ee-219174895518',
    '7fc1c91a-4beb-4760-b149-3001a2310764',
    1, '2026-05-21', '2026-05-24',
    '{"fullName":"Deepika Joshi","email":"deepika.joshi@cbdt.gov.in","phone":"9765432100","designation":"Assistant Commissioner","department":"CBDT"}',
    'Official training programme accommodation',
    'ALLOCATED', 3600, 3600, 0, 'COMPLETED',
    'SCENARIO_B: Allocated. Guest arriving today. Process check-in.',
    false, 'post_approval', now() - interval '1 day', now() - interval '1 day'
  );
END IF;

END $$;

-- Service requests for CHECKED_IN bookings
INSERT INTO booking_service_requests (
  booking_id, employee_id, service_type, request_status, subject, remarks, urgency_level, created_at, updated_at
)
SELECT
  'b0000036-b000-4000-8000-000000000036',
  '5f865f74-aeab-4885-a898-80ba3da33ae0',
  'MAINTENANCE', 'IN_PROGRESS',
  'AC not cooling adequately in room',
  'Air conditioning in Suite 301 not maintaining temperature. Urgent servicing requested.',
  'HIGH', now() - interval '3 hours', now() - interval '1 hour'
WHERE NOT EXISTS (
  SELECT 1 FROM booking_service_requests
  WHERE booking_id = 'b0000036-b000-4000-8000-000000000036' AND service_type = 'MAINTENANCE'
);

INSERT INTO booking_service_requests (
  booking_id, employee_id, service_type, request_status, subject, remarks, urgency_level, created_at, updated_at
)
SELECT
  'b0000036-b000-4000-8000-000000000036',
  '5f865f74-aeab-4885-a898-80ba3da33ae0',
  'EXTENSION', 'OPEN',
  'Request to extend stay by 2 nights',
  'Client meeting extended. Need to stay until 25th May instead of 23rd. Please confirm availability.',
  'MEDIUM', now() - interval '1 hour', now() - interval '1 hour'
WHERE NOT EXISTS (
  SELECT 1 FROM booking_service_requests
  WHERE booking_id = 'b0000036-b000-4000-8000-000000000036' AND service_type = 'EXTENSION'
);

INSERT INTO booking_service_requests (
  booking_id, employee_id, service_type, request_status, subject, remarks, urgency_level, created_at, updated_at
)
SELECT
  'b0000037-b000-4000-8000-000000000037',
  'e0000001-e000-0000-0000-000000000001',
  'GRIEVANCE', 'OPEN',
  'Water supply disruption reported',
  'Hot water not available in morning. Guest reported at reception at 7am. Plumber dispatched.',
  'HIGH', now() - interval '5 hours', now() - interval '4 hours'
WHERE NOT EXISTS (
  SELECT 1 FROM booking_service_requests
  WHERE booking_id = 'b0000037-b000-4000-8000-000000000037' AND service_type = 'GRIEVANCE'
);
