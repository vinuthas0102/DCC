/*
  # Seed Manager-Owned Submitted Demo Bookings

  ## Purpose
  The manager user (e0000001) previously had only one booking (CHECKED_IN walk-in).
  This migration adds two bookings owned by the manager that appear in the "Submitted"
  dashboard filter (PROVISIONED + AWAITING_PAYMENT statuses).

  These records demonstrate the provisioning/approval workflow visible to the estate
  manager role:
    - BK2026052000041: PROVISIONED — room earmarked, pending payment confirmation.
      Actions: Modify Booking, Pay Online, Record Manual Payment, service requests.
    - BK2026052000042: AWAITING_PAYMENT — payment link sent, awaiting confirmation.
      Actions: Pay Online, Record Manual Payment.

  ## Notes
  - Both records use user_id = 'e0000001-e000-0000-0000-000000000001' (estate manager)
  - balance_amount > 0 so the Pay actions are visible
  - payment_scenario must be one of: 'immediate', 'post_approval', 'pre_acceptance'
  - Idempotent via ON CONFLICT DO NOTHING
*/

INSERT INTO bookings (
  id, booking_number, user_id, property_id, room_type_id, quantity,
  check_in_date, check_out_date, guest_details, special_requirements,
  status, total_amount, paid_amount, balance_amount, payment_status,
  notes, is_guest_booking, payment_scenario, created_at, updated_at
) VALUES
(
  'b0000041-b000-4000-8000-000000000041',
  'BK2026052000041',
  'e0000001-e000-0000-0000-000000000001',
  '26c89830-109e-48a9-b98e-aaf2ce699adb',
  'deccd249-2c5a-41be-9c9a-139794277acb',
  1,
  '2026-06-18', '2026-06-20',
  '{"fullName":"Ramesh Tiwari","email":"ramesh.tiwari@gov.in","phone":"9811223344","designation":"Deputy Secretary","department":"Ministry of Finance"}',
  'Official delegation visit. Require quiet room on upper floor.',
  'PROVISIONED',
  3000, 0, 3000, 'PENDING',
  'PROVISIONING_DEMO: Request submitted via official portal. Estate Manager reviewed and earmarked Room 301 (Deluxe). Status advanced to PROVISIONED. Payment link to be sent next. Actions available: Modify Booking, Pay Online, Record Manual Payment.',
  false, 'post_approval',
  now() - interval '5 hours', now() - interval '4 hours'
),
(
  'b0000042-b000-4000-8000-000000000042',
  'BK2026052000042',
  'e0000001-e000-0000-0000-000000000001',
  'baafbf57-3288-4a56-a4ee-219174895518',
  '7fc1c91a-4beb-4760-b149-3001a2310764',
  2,
  '2026-06-22', '2026-06-25',
  '{"fullName":"Priya Sharma","email":"priya.sharma@dopt.gov.in","phone":"9822334455","designation":"Section Officer","department":"Dept of Personnel & Training"}',
  'Two standard rooms required. Advance payment expected.',
  'AWAITING_PAYMENT',
  5400, 0, 5400, 'PENDING',
  'PROVISIONING_DEMO: Room earmarked by Estate Manager. Payment link sent to guest. Booking holds 2 Standard rooms at Heritage Guest House. Awaiting payment to confirm allocation. Actions available: Pay Online, Record Manual Payment.',
  false, 'post_approval',
  now() - interval '3 hours', now() - interval '2 hours'
)
ON CONFLICT (id) DO NOTHING;
