/*
  # Fix Audit Logs RLS Security

  1. Security Improvements
    - Replace always-true INSERT policy with restrictive conditions
    - Prevent users from creating audit logs on behalf of other users
    
  2. Changes
    - Allow system-generated audit logs (user_id IS NULL)
    - Allow user-generated audit logs only if user_id matches authenticated user
    - This prevents privilege escalation via audit log manipulation
    
  3. Notes
    - Audit logs are typically created by triggers or service role
    - This policy ensures authenticated users can only create audit logs for themselves
*/

-- Drop the always-true policy
DROP POLICY IF EXISTS "System can create audit logs" ON audit_logs;

-- Create a more restrictive policy
-- Only allow INSERT if:
-- 1. user_id is NULL (system-generated), OR
-- 2. user_id matches the authenticated user
CREATE POLICY "Authenticated users can create audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IS NULL OR user_id = (SELECT auth.uid())
  );

-- Note: Service role operations bypass RLS entirely, so service role
-- can still insert any audit logs as needed for system operations
