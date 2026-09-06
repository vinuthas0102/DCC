/*
  # Audit entries must name their author

  The INSERT check accepted a NULL user_id, so any signed-in caller could add
  unattributable rows to the admin-only audit trail.
*/

DROP POLICY IF EXISTS "Authenticated users can create audit logs" ON public.audit_logs;

CREATE POLICY "Authenticated users can create audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

REVOKE INSERT, SELECT, UPDATE, DELETE ON public.audit_logs FROM anon;
REVOKE UPDATE, DELETE ON public.audit_logs FROM authenticated;
