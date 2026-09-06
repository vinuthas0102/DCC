/*
  # Remove public EXECUTE on internal trigger and helper routines

  These are SECURITY DEFINER routines meant to run from triggers or from other
  server-side code, not to be reachable at /rest/v1/rpc/. Triggers still fire
  regardless of EXECUTE grants, so nothing in the application changes.
*/

REVOKE ALL ON FUNCTION public.handle_user_role_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_user_jwt_claims() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dcc_sync_installment_counts() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_otp() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_booking_number() FROM PUBLIC, anon, authenticated;
