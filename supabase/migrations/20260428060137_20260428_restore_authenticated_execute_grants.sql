/*
  # Restore EXECUTE grants for authenticated role on select SECURITY DEFINER functions

  ## Problem
  The previous migration (20260428_revoke_security_definer_public_execute) over-revoked
  EXECUTE permissions, breaking two critical flows:

  1. LOGIN / all table access — RLS policies across the schema use
     `(SELECT get_user_role())` as their permission check expression.
     When PostgreSQL evaluates these policies for an `authenticated` user,
     it must be able to call get_user_role(). Revoking EXECUTE from
     `authenticated` causes every such policy check to fail with
     "permission denied for function get_user_role".

  2. BOOKING CREATION — bookingService.ts calls
     `supabase.rpc('generate_booking_number')` from the browser as an
     authenticated user. Revoking EXECUTE broke booking number generation.

  ## Changes
  1. Restore EXECUTE on get_user_role() for `authenticated`.
     - Safe: the function only reads the caller's own JWT/session role.
       It cannot read other users' roles and has no side-effects.
  2. Restore EXECUTE on generate_booking_number() for `authenticated`.
     - Required for client-side booking creation flow.

  ## What stays revoked (security maintained)
  - `anon` remains revoked on ALL five functions — anonymous/unauthenticated
    users cannot call any of these.
  - `PUBLIC` remains revoked on ALL five functions.
  - Trigger functions (handle_user_role_change, set_user_jwt_claims) remain
    fully revoked from all roles — they are only invoked by the trigger
    mechanism, never by client code.
  - generate_otp() remains revoked from authenticated (not used by client code).
*/

-- ── 1. get_user_role — needed by RLS policies on every protected table ────────
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

-- ── 2. generate_booking_number — called via supabase.rpc() in bookingService ──
GRANT EXECUTE ON FUNCTION public.generate_booking_number() TO authenticated;
