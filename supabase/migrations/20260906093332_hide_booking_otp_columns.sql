/*
  # Stop the one-time codes being readable through the data API

  The anon SELECT policy on bookings matches exactly the rows that hold a live
  one-time code, and the column grant included the code itself. Column-level
  SELECT on otp/otp_hash is revoked from both client roles; every other column
  keeps its existing access.
*/

REVOKE SELECT ON public.bookings FROM anon, authenticated;

GRANT SELECT (
  id, booking_number, user_id, property_id, room_type_id, quantity,
  check_in_date, check_out_date, guest_details, special_requirements, status,
  total_amount, paid_amount, balance_amount, payment_status, otp_expires_at,
  rejection_reason, notes, created_at, updated_at, is_guest_booking
) ON public.bookings TO anon, authenticated;
