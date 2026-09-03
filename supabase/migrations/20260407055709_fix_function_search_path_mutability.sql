/*
  # Fix Function Search Path Mutability

  1. Security Improvements
    - Set explicit search_path for security-sensitive functions
    - Prevents potential SQL injection via search_path manipulation
    
  2. Functions Affected
    - generate_booking_number
    - generate_otp
    - get_user_role
    - set_user_jwt_claims
    
  3. Changes
    - Add SECURITY DEFINER where appropriate
    - Set explicit search_path to prevent role-based modifications
*/

-- Fix generate_booking_number function
CREATE OR REPLACE FUNCTION public.generate_booking_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_number TEXT;
  year_prefix TEXT;
BEGIN
  year_prefix := TO_CHAR(NOW(), 'YY');
  
  SELECT 'BK' || year_prefix || LPAD((COUNT(*) + 1)::TEXT, 6, '0')
  INTO new_number
  FROM bookings
  WHERE booking_number LIKE 'BK' || year_prefix || '%';
  
  RETURN new_number;
END;
$$;

-- Fix generate_otp function
CREATE OR REPLACE FUNCTION public.generate_otp()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$;

-- Fix get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- First try to get role from JWT claims
  user_role := COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role',
    current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role'
  );
  
  -- If not in JWT, try to get from users table
  IF user_role IS NULL THEN
    SELECT role INTO user_role
    FROM users
    WHERE id = auth.uid();
  END IF;
  
  -- Default to 'public' if no role found
  RETURN COALESCE(user_role, 'public');
END;
$$;

-- Fix set_user_jwt_claims function
CREATE OR REPLACE FUNCTION public.set_user_jwt_claims()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Update the user's JWT claims with their role
  IF NEW.role IS NOT NULL THEN
    PERFORM auth.jwt();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.generate_booking_number() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.generate_otp() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.set_user_jwt_claims() TO authenticated;
