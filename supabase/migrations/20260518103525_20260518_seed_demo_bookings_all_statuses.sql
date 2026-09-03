/*
  # Seed Demo Bookings — All DP Statuses

  Adds one representative booking record for each status bucket displayed
  on the My Bookings DP carousel, so every card shows a non-zero count
  for the demo user (demo@fms.com).

  ## New Records
  - `ALLOCATED`   — confirmed upcoming stay at Heritage Guest House (future dates)
  - `CHECKED_IN`  — active in-progress stay at Guest House BNG North (today)
  - `REJECTED`    — rejected request at Marine Drive Community Hall with reason

  ## Existing Statuses Already Present
  - REQUESTED     — BK26000001, BK2026040300003
  - PROVISIONED   — BK2026032600002, BK2026032700003, BK2026040300007/008
  - CHECKED_OUT   — BK2026040100004/005
  - CANCELLED     — BK2026032600001, BK2026040100006

  ## Notes
  - All records use ON CONFLICT (id) DO NOTHING for idempotency
  - Demo user ID: 5f865f74-aeab-4885-a898-80ba3da33ae0
  - Room type ID reused from existing bookings: 7fc1c91a-4beb-4760-b149-3001a2310764
*/

DO $$
DECLARE
  v_user uuid := '5f865f74-aeab-4885-a898-80ba3da33ae0';
  v_rt   uuid := '7fc1c91a-4beb-4760-b149-3001a2310764';

  -- Properties
  v_heritage       uuid := 'baafbf57-3288-4a56-a4ee-219174895518'; -- Heritage Guest House
  v_bng_north      uuid := '280cc387-eab2-40c1-b21b-2f41847615d3'; -- Guest House BNG North
  v_marine_hall    uuid := 'f56ff001-b309-47b4-b511-8455af7bd07a'; -- Marine Drive Community Hall
BEGIN

  -- 1. ALLOCATED — upcoming confirmed booking (future stay)
  INSERT INTO bookings (
    id, booking_number, user_id, property_id, room_type_id, quantity,
    check_in_date, check_out_date,
    guest_details,
    special_requirements,
    status, total_amount, paid_amount, balance_amount,
    payment_status, is_guest_booking,
    created_at, updated_at
  ) VALUES (
    'dd000001-0000-4000-a000-000000000001',
    'BK2026051800010',
    v_user, v_heritage, v_rt, 1,
    '2026-06-10', '2026-06-13',
    '{"fullName": "Rajan Kumar", "email": "demo@fms.gov", "phone": "9876543210", "numberOfGuests": 2, "numberOfAdults": 2, "numberOfChildren": 0}'::jsonb,
    'Ground floor room preferred',
    'ALLOCATED', 4500.00, 4500.00, 0.00,
    'COMPLETED', false,
    now() - interval '3 days', now() - interval '3 days'
  ) ON CONFLICT (id) DO NOTHING;

  -- 2. CHECKED_IN — currently active stay
  INSERT INTO bookings (
    id, booking_number, user_id, property_id, room_type_id, quantity,
    check_in_date, check_out_date,
    guest_details,
    status, total_amount, paid_amount, balance_amount,
    payment_status, is_guest_booking,
    created_at, updated_at
  ) VALUES (
    'dd000002-0000-4000-a000-000000000002',
    'BK2026051800011',
    v_user, v_bng_north, v_rt, 1,
    '2026-05-16', '2026-05-20',
    '{"fullName": "Rajan Kumar", "email": "demo@fms.gov", "phone": "9876543210", "numberOfGuests": 1, "numberOfAdults": 1, "numberOfChildren": 0}'::jsonb,
    'CHECKED_IN', 6000.00, 6000.00, 0.00,
    'COMPLETED', false,
    now() - interval '2 days', now() - interval '2 days'
  ) ON CONFLICT (id) DO NOTHING;

  -- 3. REJECTED — rejected request with reason
  INSERT INTO bookings (
    id, booking_number, user_id, property_id, room_type_id, quantity,
    check_in_date, check_out_date,
    guest_details,
    status, total_amount, paid_amount, balance_amount,
    payment_status, rejection_reason, is_guest_booking,
    created_at, updated_at
  ) VALUES (
    'dd000003-0000-4000-a000-000000000003',
    'BK2026051800012',
    v_user, v_marine_hall, v_rt, 1,
    '2026-05-05', '2026-05-06',
    '{"fullName": "Rajan Kumar", "email": "demo@fms.gov", "phone": "9876543210", "numberOfGuests": 1, "numberOfAdults": 1, "numberOfChildren": 0}'::jsonb,
    'REJECTED', 1200.00, 0.00, 1200.00,
    'PENDING', 'Property unavailable for the requested dates due to prior departmental booking. Please choose alternate dates.', false,
    now() - interval '10 days', now() - interval '9 days'
  ) ON CONFLICT (id) DO NOTHING;

END $$;
