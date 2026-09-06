/*
  # Prevent users from changing their own role

  1. Column privileges
     - Revoke UPDATE on public.users from anon/authenticated, then re-grant UPDATE
       on every column EXCEPT `role`, so the own-row UPDATE policy can no longer be
       used to grant oneself admin.
  2. New function
     - public.set_user_role(p_user_id uuid, p_role text): SECURITY DEFINER, callable
       only by an admin, so administrators keep the ability to change roles.
*/

REVOKE UPDATE ON public.users FROM anon, authenticated;

GRANT UPDATE (
  email, full_name, phone, govt_department, govt_employee_id,
  assigned_estate_id, metadata, created_at, updated_at, designation_id
) ON public.users TO authenticated;

CREATE OR REPLACE FUNCTION public.set_user_role(p_user_id uuid, p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  IF extensions.get_user_role() <> 'admin' THEN
    RAISE EXCEPTION 'Only administrators can change user roles';
  END IF;

  IF p_role NOT IN ('admin', 'manager', 'govt_official', 'dept_user', 'public') THEN
    RAISE EXCEPTION 'Unknown role';
  END IF;

  UPDATE public.users SET role = p_role, updated_at = now() WHERE id = p_user_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.set_user_role(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, text) TO authenticated;
