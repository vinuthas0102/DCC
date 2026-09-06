/*
  # Remove anonymous access to booking transactions

  The anon policies allowed any unauthenticated caller to read every transaction
  attached to a guest booking, and to insert fabricated ones. No application code
  reads or writes this table anonymously.
*/

DROP POLICY IF EXISTS "Anonymous users can create transactions for guest bookings" ON public.transactions;
DROP POLICY IF EXISTS "Anonymous users can view transactions for guest bookings" ON public.transactions;
DROP POLICY IF EXISTS "Public can view transactions with valid OTP" ON public.transactions;

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.transactions FROM anon;
