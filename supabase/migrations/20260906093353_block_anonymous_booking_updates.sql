/*
  # Remove anonymous write access to guest bookings

  Two policies let any unauthenticated caller update every column of any guest
  booking that was inside its one-time-code window, including status and amounts.
  No application code updates bookings anonymously, so both are removed along
  with the UPDATE grant for the anon role.
*/

DROP POLICY IF EXISTS "Anonymous users can update guest bookings for payment" ON public.bookings;
DROP POLICY IF EXISTS "Anonymous users can update guest bookings with valid OTP" ON public.bookings;

REVOKE UPDATE, DELETE ON public.bookings FROM anon;
