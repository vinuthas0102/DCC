/*
  # Seed Provisioning Flow Demo Record

  ## Purpose
  Adds a clearly labelled PROVISIONED booking record visible under the "Submitted"
  dashboard filter for both manager and govt_official roles.

  This record demonstrates the full Scenario B flow:
    REQUESTED (portal submission) → PROVISIONED (estate manager earmarks) → AWAITING_PAYMENT → ALLOCATED

  The booking is in PROVISIONED status so it appears in the "Submitted" card.
  It carries notes that explain the provisioning step that already happened,
  and the applicable actions (Pay Online / Record Manual Payment / Modify / Service requests)
  are all visible in the action menu for this status.

  ## Notes
  - Uses existing user IDs and property IDs from demo data
  - Idempotent via DO block
*/

DO $$
BEGIN

IF NOT EXISTS (SELECT 1 FROM bookings WHERE booking_number = 'BK2026052000039') THEN
  INSERT INTO bookings (
    id, booking_number, user_id, property_id, room_type_id, quantity,
    check_in_date, check_out_date, guest_details, special_requirements,
    status, total_amount, paid_amount, balance_amount, payment_status,
    notes, is_guest_booking, payment_scenario, created_at, updated_at
  ) VALUES (
    'b0000039-b000-4000-8000-000000000039',
    'BK2026052000039',
    '5f865f74-aeab-4885-a898-80ba3da33ae0',
    '26c89830-109e-48a9-b98e-aaf2ce699adb',
    'deccd249-2c5a-41be-9c9a-139794277acb',
    1,
    '2026-06-12', '2026-06-15',
    '{"fullName":"Vikram Singh","email":"vikram.singh@dopt.gov.in","phone":"9800112233","designation":"Under Secretary","department":"Dept of Personnel & Training"}',
    'Submitted via portal for official visit. Inter-departmental coordination meeting.',
    'PROVISIONED',
    4500, 0, 4500, 'PENDING',
    'PROVISIONING_FLOW_DEMO: Step 1 – Request submitted via portal (REQUESTED). Step 2 – Estate Manager reviewed and earmarked Room 302. Status advanced to PROVISIONED. Step 3 – Payment link sent to guest. Awaiting payment to confirm allocation.',
    false, 'post_approval',
    now() - interval '6 hours', now() - interval '3 hours'
  );
END IF;

END $$;
