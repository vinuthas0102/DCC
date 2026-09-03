/*
  # Add bhk_entitlement to users and ensure approval_status supports APPROVED

  1. Changes
    - Adds `bhk_entitlement` column to the `users` table (nullable text)
      Stores the BHK tier the government official is entitled to (e.g. '2 BHK', '3 BHK').
      Used by the EO "Allot Now" flow to pre-filter available quarters by cadre.
    - Ensures the `quarter_allotments.approval_status` CHECK constraint includes 'APPROVED'
      (needed by createAndAllotNow which marks allotments as immediately approved).
    - Seeds a default bhk_entitlement of '3 BHK' on the demo user so the filter works
      in the demo environment.

  2. Security
    - No new RLS policies required; bhk_entitlement inherits the existing users RLS policies.
*/

-- 1. Add bhk_entitlement column to users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'bhk_entitlement'
  ) THEN
    ALTER TABLE users ADD COLUMN bhk_entitlement text;
  END IF;
END $$;

-- 2. Drop existing approval_status CHECK constraint if present, then recreate with full value set
DO $$
DECLARE
  v_constraint text;
BEGIN
  SELECT constraint_name INTO v_constraint
  FROM information_schema.table_constraints
  WHERE table_name = 'quarter_allotments'
    AND constraint_type = 'CHECK'
    AND constraint_name ILIKE '%approval_status%'
  LIMIT 1;

  IF v_constraint IS NOT NULL THEN
    EXECUTE 'ALTER TABLE quarter_allotments DROP CONSTRAINT ' || quote_ident(v_constraint);
  END IF;
END $$;

ALTER TABLE quarter_allotments
  ADD CONSTRAINT quarter_allotments_approval_status_check
  CHECK (approval_status IN ('PENDING','ACKNOWLEDGED','REJECTED','DECLINED','APPROVED'));

-- 3. Seed demo user with a default bhk_entitlement
UPDATE users
SET bhk_entitlement = '3 BHK'
WHERE bhk_entitlement IS NULL AND role = 'govt_official';
