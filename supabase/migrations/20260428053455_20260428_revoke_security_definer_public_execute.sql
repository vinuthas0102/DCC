/*
  # Revoke public EXECUTE on SECURITY DEFINER functions

  ## Problem
  Five SECURITY DEFINER functions in the public schema are callable by
  the `anon` and `authenticated` roles via PostgREST (`/rest/v1/rpc/...`).
  This is a security risk because:
  - Trigger functions (handle_user_role_change, set_user_jwt_claims) should
    only be invoked by PostgreSQL triggers, never by client code.
  - Internal helpers (generate_booking_number, generate_otp, get_user_role)
    run with elevated privileges and must not be exposed as public RPC endpoints.

  ## Changes
  1. Revoke EXECUTE on all five functions from `anon` and `authenticated`.
  2. Grant EXECUTE on the non-trigger helpers to `service_role` only,
     so server-side/edge-function calls still work if needed.
  3. Trigger functions receive no grants at all — they are invoked by the
     trigger mechanism, not by any database role directly.

  ## Functions affected
  - public.generate_booking_number() — internal booking-number helper
  - public.generate_otp()            — internal OTP helper
  - public.get_user_role()           — reads JWT / users table
  - public.handle_user_role_change() — trigger function only
  - public.set_user_jwt_claims()     — trigger function only
*/

-- ── 1. Revoke from anon ───────────────────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.generate_booking_number() FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_otp()            FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role()           FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_user_role_change() FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_user_jwt_claims()     FROM anon;

-- ── 2. Revoke from authenticated ─────────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.generate_booking_number() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_otp()            FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_role()           FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_user_role_change() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.set_user_jwt_claims()     FROM authenticated;

-- ── 3. Also revoke PUBLIC grant (covers any role not explicitly listed) ───────

REVOKE EXECUTE ON FUNCTION public.generate_booking_number() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_otp()            FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_role()           FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_user_role_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_user_jwt_claims()     FROM PUBLIC;

-- ── 4. Grant non-trigger helpers to service_role for server-side use ─────────

GRANT EXECUTE ON FUNCTION public.generate_booking_number() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_otp()            TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_role()           TO service_role;
