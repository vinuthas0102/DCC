/*
  # Generate one-time codes from a cryptographic source

  RANDOM() is a seeded pseudo-random generator and is not suitable for a
  credential. The code is now derived from pgcrypto's gen_random_bytes, keeping
  the same six-digit shape.
*/

CREATE OR REPLACE FUNCTION public.generate_otp()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  RETURN LPAD((('x' || encode(extensions.gen_random_bytes(4), 'hex'))::bit(32)::bigint % 1000000)::text, 6, '0');
END;
$function$;

REVOKE ALL ON FUNCTION public.generate_otp() FROM PUBLIC, anon, authenticated;
