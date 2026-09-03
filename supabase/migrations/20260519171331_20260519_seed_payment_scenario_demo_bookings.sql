/*
  # Seed Payment Scenario Demo Bookings

  ## Purpose
  Adds representative demo bookings for each of the 3 payment scenarios so that
  the "Awaiting Payment" DP panel shows a non-zero count and the action menu
  payment items are visible in the demo.

  ## Scenarios Seeded
  1. IMMEDIATE (on_request)     — booking AWAITING_PAYMENT right after request
  2. POST_APPROVAL              — booking provisioned then hit payment gate
  3. PRE_ACCEPTANCE             — booking allocated but payment due before check-in
  4. PARTIAL_PAID               — PROVISIONED booking with partial payment, balance due
  5. MANUAL_PAYMENT_RECORDED    — CHECKED_OUT booking with a manual NEFT transaction

  ## Payment Policies Seeded
  - Heritage Guest House:    allotment_date + 15 days, allow_manual = true
  - Guest House BNG North:   acceptance_date − 7 days, allow_manual = true
  - Marine Drive Community:  on_request + 0 days, allow_manual = false
*/

DO $$
DECLARE
  v_user uuid := '5f865f74-aeab-4885-a898-80ba3da33ae0';
  v_rt   uuid := '7fc1c91a-4beb-4760-b149-3001a2310764';

  v_heritage    uuid := 'baafbf57-3288-4a56-a4ee-219174895518';
  v_bng_north   uuid := '280cc387-eab2-40c1-b21b-2f41847615d3';
  v_marine_hall uuid := 'f56ff001-b309-47b4-b511-8455af7bd07a';

  -- Use proper UUID v4 format
  v_b1 uuid := 'a1000001-b000-4000-8000-000000000001';
  v_b2 uuid := 'a1000002-b000-4000-8000-000000000002';
  v_b3 uuid := 'a1000003-b000-4000-8000-000000000003';
  v_b4 uuid := 'a1000004-b000-4000-8000-000000000004';
  v_b5 uuid := 'a1000005-b000-4000-8000-000000000005';
  v_t1 uuid := 'c1000001-d000-4000-8000-000000000001';
BEGIN

  -- ── Payment Policies ───────────────────────────────────────────────────────
  INSERT INTO payment_policies (property_id, reference_date, days_offset, allow_manual_payment, is_active)
  VALUES
    (v_heritage,    'allotment_date',  15, true,  true),
    (v_bng_north,   'acceptance_date', -7, true,  true),
    (v_marine_hall, 'on_request',       0, false, true)
  ON CONFLICT (property_id) DO NOTHING;

  -- ── Scenario 1: IMMEDIATE — on_request payment gate ───────────────────────
  INSERT INTO bookings (
    id, booking_number, user_id, property_id, room_type_id, quantity,
    check_in_date, check_out_date, guest_details,
    status, payment_scenario, payment_expires_at,
    total_amount, paid_amount, balance_amount,
    payment_status, is_guest_booking, created_at, updated_at
  ) VALUES (
    v_b1, 'BK2026051900020',
    v_user, v_marine_hall, v_rt, 1,
    '2026-06-01', '2026-06-02',
    '{"fullName":"Rajan Kumar","email":"demo@fms.gov","phone":"9876543210","numberOfGuests":1,"numberOfAdults":1,"numberOfChildren":0}'::jsonb,
    'AWAITING_PAYMENT', 'immediate', now() + interval '1 day',
    1200.00, 0.00, 1200.00,
    'PENDING', false, now() - interval '1 hour', now() - interval '1 hour'
  ) ON CONFLICT (id) DO NOTHING;

  -- ── Scenario 2: POST_APPROVAL — payment gate after provisioning ───────────
  INSERT INTO bookings (
    id, booking_number, user_id, property_id, room_type_id, quantity,
    check_in_date, check_out_date, guest_details,
    status, payment_scenario, payment_expires_at,
    total_amount, paid_amount, balance_amount,
    payment_status, is_guest_booking, created_at, updated_at
  ) VALUES (
    v_b2, 'BK2026051900021',
    v_user, v_heritage, v_rt, 1,
    '2026-07-10', '2026-07-13',
    '{"fullName":"Rajan Kumar","email":"demo@fms.gov","phone":"9876543210","numberOfGuests":2,"numberOfAdults":2,"numberOfChildren":0}'::jsonb,
    'AWAITING_PAYMENT', 'post_approval', now() + interval '12 days',
    4500.00, 0.00, 4500.00,
    'PENDING', false, now() - interval '3 days', now() - interval '3 days'
  ) ON CONFLICT (id) DO NOTHING;

  -- ── Scenario 3: PRE_ACCEPTANCE — payment gate 7 days before check-in ──────
  INSERT INTO bookings (
    id, booking_number, user_id, property_id, room_type_id, quantity,
    check_in_date, check_out_date, guest_details,
    status, payment_scenario, payment_expires_at,
    total_amount, paid_amount, balance_amount,
    payment_status, is_guest_booking, created_at, updated_at
  ) VALUES (
    v_b3, 'BK2026051900022',
    v_user, v_bng_north, v_rt, 1,
    '2026-06-15', '2026-06-19',
    '{"fullName":"Rajan Kumar","email":"demo@fms.gov","phone":"9876543210","numberOfGuests":1,"numberOfAdults":1,"numberOfChildren":0}'::jsonb,
    'AWAITING_PAYMENT', 'pre_acceptance', '2026-06-08 00:00:00+00',
    6000.00, 0.00, 6000.00,
    'PENDING', false, now() - interval '5 days', now() - interval '5 days'
  ) ON CONFLICT (id) DO NOTHING;

  -- ── Scenario 4: PARTIAL PAYMENT — balance due on PROVISIONED booking ──────
  INSERT INTO bookings (
    id, booking_number, user_id, property_id, room_type_id, quantity,
    check_in_date, check_out_date, guest_details,
    status,
    total_amount, paid_amount, balance_amount,
    payment_status, is_guest_booking, created_at, updated_at
  ) VALUES (
    v_b4, 'BK2026051900023',
    v_user, v_heritage, v_rt, 1,
    '2026-08-01', '2026-08-04',
    '{"fullName":"Rajan Kumar","email":"demo@fms.gov","phone":"9876543210","numberOfGuests":2,"numberOfAdults":2,"numberOfChildren":0}'::jsonb,
    'PROVISIONED',
    4500.00, 2000.00, 2500.00,
    'PARTIAL', false, now() - interval '7 days', now() - interval '7 days'
  ) ON CONFLICT (id) DO NOTHING;

  -- ── Scenario 5: CHECKED_OUT with manual NEFT payment transaction ──────────
  INSERT INTO bookings (
    id, booking_number, user_id, property_id, room_type_id, quantity,
    check_in_date, check_out_date, guest_details,
    status,
    total_amount, paid_amount, balance_amount,
    payment_status, is_guest_booking, created_at, updated_at
  ) VALUES (
    v_b5, 'BK2026051900024',
    v_user, v_bng_north, v_rt, 1,
    '2026-04-10', '2026-04-13',
    '{"fullName":"Rajan Kumar","email":"demo@fms.gov","phone":"9876543210","numberOfGuests":1,"numberOfAdults":1,"numberOfChildren":0}'::jsonb,
    'CHECKED_OUT',
    6000.00, 6000.00, 0.00,
    'COMPLETED', false, now() - interval '40 days', now() - interval '27 days'
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO transactions (
    id, booking_id, transaction_id, amount, payment_method,
    payment_status, payment_gateway_response,
    reference_number, payment_notes, created_at
  ) VALUES (
    v_t1, v_b5,
    'MNL20260411001',
    6000.00,
    'MANUAL_NEFT',
    'SUCCESS',
    '{"gateway":"MANUAL","paymentMode":"NEFT","referenceNumber":"NEFT20260411001","paymentDate":"2026-04-11","recordedAt":"2026-04-11T09:30:00Z"}'::jsonb,
    'NEFT20260411001',
    'Full payment via NEFT. Verified against bank statement.',
    '2026-04-11 09:30:00+00'
  ) ON CONFLICT (id) DO NOTHING;

END $$;
