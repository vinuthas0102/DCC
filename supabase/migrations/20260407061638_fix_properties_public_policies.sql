/*
  # Fix Properties Public Role Policies

  1. Problem
    - Properties table has multiple 'public' role policies for SELECT
    - Authenticated users evaluate all public policies plus their own
    - Creates unnecessary overhead
    
  2. Solution
    - Change 'public' role to 'anon' role for anonymous access
    - Keep separate policies for different visibility rules (Other Facilities vs general)
    
  3. Changes
    - Change both public SELECT policies to anon role
    - Maintain same access logic, just clarify role separation
*/

-- Drop existing public policies
DROP POLICY IF EXISTS "Allow public to view Other Facilities properties" ON properties;
DROP POLICY IF EXISTS "Public can view published non-exempt properties" ON properties;

-- Recreate as anon policies
CREATE POLICY "Anonymous users can view Other Facilities properties"
  ON properties FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM modules m
      WHERE m.id = properties.module_id 
      AND m.code = 'OTHER_FAC'
    )
    AND status = 'PUBLISHED'
  );

CREATE POLICY "Anonymous users can view published non-exempt properties"
  ON properties FOR SELECT
  TO anon
  USING (status = 'PUBLISHED' AND is_exempt = false);

-- Result:
-- properties now has:
-- 1. Two anon policies (for different anonymous access patterns)
-- 2. One authenticated policy (view all properties)
-- 3. No policy overlap between roles
