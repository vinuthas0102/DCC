/*
# Add anon SELECT policies to payable_criteria_mt and child tables

1. Purpose
   The app runs in DEMO_MODE — no real Supabase auth session is established,
   so all queries run as the `anon` role. The existing RLS policies on
   payable_criteria_mt and its 8 child tables are scoped to `authenticated`
   only, meaning the demo-mode frontend gets zero rows. This migration adds
   read-only SELECT policies for the `anon` role on all 9 tables so the
   seeded demo rules become visible. Write operations remain restricted to
   authenticated admin/manager roles.

2. Tables affected (SELECT policy added for anon)
   - payable_criteria_mt
   - payable_full_payment_specs
   - payable_advance_specs
   - payable_installment_specs
   - payable_penalty_slabs
   - payable_alert_specs
   - payable_increase_specs
   - payable_instalment_grid
   - payable_collection_exceptions

3. Security
   - Only SELECT policies are added for anon — no INSERT/UPDATE/DELETE.
   - Writes remain restricted to authenticated admin/manager via existing policies.
   - This is consistent with the demo-mode nature of the app (no real auth session).

4. Idempotency
   - Each policy uses DROP IF EXISTS before CREATE, so re-runs are safe.
*/

-- payable_criteria_mt
DROP POLICY IF EXISTS "pcm_select_anon" ON payable_criteria_mt;
CREATE POLICY "pcm_select_anon" ON payable_criteria_mt
  FOR SELECT TO anon USING (true);

-- payable_full_payment_specs
DROP POLICY IF EXISTS "pfp_select_anon" ON payable_full_payment_specs;
CREATE POLICY "pfp_select_anon" ON payable_full_payment_specs
  FOR SELECT TO anon USING (true);

-- payable_advance_specs
DROP POLICY IF EXISTS "pas_select_anon" ON payable_advance_specs;
CREATE POLICY "pas_select_anon" ON payable_advance_specs
  FOR SELECT TO anon USING (true);

-- payable_installment_specs
DROP POLICY IF EXISTS "pis_select_anon" ON payable_installment_specs;
CREATE POLICY "pis_select_anon" ON payable_installment_specs
  FOR SELECT TO anon USING (true);

-- payable_penalty_slabs
DROP POLICY IF EXISTS "pps_select_anon" ON payable_penalty_slabs;
CREATE POLICY "pps_select_anon" ON payable_penalty_slabs
  FOR SELECT TO anon USING (true);

-- payable_alert_specs
DROP POLICY IF EXISTS "pas2_select_anon" ON payable_alert_specs;
CREATE POLICY "pas2_select_anon" ON payable_alert_specs
  FOR SELECT TO anon USING (true);

-- payable_increase_specs
DROP POLICY IF EXISTS "pis_inc_select_anon" ON payable_increase_specs;
CREATE POLICY "pis_inc_select_anon" ON payable_increase_specs
  FOR SELECT TO anon USING (true);

-- payable_instalment_grid
DROP POLICY IF EXISTS "pig_select_anon" ON payable_instalment_grid;
CREATE POLICY "pig_select_anon" ON payable_instalment_grid
  FOR SELECT TO anon USING (true);

-- payable_collection_exceptions
DROP POLICY IF EXISTS "pce_select_anon" ON payable_collection_exceptions;
CREATE POLICY "pce_select_anon" ON payable_collection_exceptions
  FOR SELECT TO anon USING (true);