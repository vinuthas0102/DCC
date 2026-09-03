/*
# Add anon SELECT policies to DCC data tables

## Purpose
The app runs in demo mode where the browser uses the anon key without a real
Supabase auth session. The DCC reference tables (dcc_demand_types,
dcc_object_owners, dcc_objects) already have anon SELECT policies from an
earlier migration, so their dropdowns populate. However the three data tables
— dcc_demands, dcc_payments, dcc_demand_run_log — only have SELECT policies
for the `authenticated` role. The anon client therefore receives zero rows
and the dashboard appears empty despite data existing in the database.

## Changes
1. dcc_demands — add `anon` SELECT policy (read-only, all rows)
2. dcc_payments — add `anon` SELECT policy (read-only, all rows)
3. dcc_demand_run_log — add `anon` SELECT policy (read-only, all rows)

## Security
These are read-only SELECT policies for the anon role. Write operations
(INSERT/UPDATE/DELETE) remain restricted to authenticated admin/manager roles
via existing policies. This matches the pattern already applied to the
reference tables and is appropriate for a demo-mode app where the browser
operates without a real auth session.
*/

-- ── dcc_demands: anon SELECT ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "dcc_demands_select_anon" ON dcc_demands;
CREATE POLICY "dcc_demands_select_anon"
  ON dcc_demands FOR SELECT
  TO anon USING (true);

-- ── dcc_payments: anon SELECT ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "dcc_payments_select_anon" ON dcc_payments;
CREATE POLICY "dcc_payments_select_anon"
  ON dcc_payments FOR SELECT
  TO anon USING (true);

-- ── dcc_demand_run_log: anon SELECT ────────────────────────────────────────────
DROP POLICY IF EXISTS "dcc_runlog_select_anon" ON dcc_demand_run_log;
CREATE POLICY "dcc_runlog_select_anon"
  ON dcc_demand_run_log FOR SELECT
  TO anon USING (true);