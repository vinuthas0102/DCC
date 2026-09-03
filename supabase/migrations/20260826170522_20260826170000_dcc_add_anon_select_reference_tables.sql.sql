/*
# Add anon SELECT policies to DCC reference tables

1. Purpose
   The DCC Rule Setup page loads demand types and owners to populate
   dropdowns. These tables only had `authenticated` SELECT policies.
   If the Supabase auth session isn't fully established when the page
   first loads, the anon-key client gets zero rows and the dropdowns
   appear blank. Adding `anon` SELECT policies ensures the reference
   data is always readable.

2. Tables affected
   - dcc_demand_types
   - dcc_object_owners
   - dcc_objects

3. Security
   - These are reference/lookup tables (demand types, owners, objects).
   - SELECT is safe for both anon and authenticated roles.
   - Write policies (INSERT/UPDATE/DELETE) remain admin/manager only.
   - No changes to existing policies; only additive new SELECT policies for anon.
*/

-- dcc_demand_types
DROP POLICY IF EXISTS "dcc_dtypes_select_anon" ON dcc_demand_types;
CREATE POLICY "dcc_dtypes_select_anon"
  ON dcc_demand_types FOR SELECT
  TO anon USING (true);

-- dcc_object_owners
DROP POLICY IF EXISTS "dcc_owners_select_anon" ON dcc_object_owners;
CREATE POLICY "dcc_owners_select_anon"
  ON dcc_object_owners FOR SELECT
  TO anon USING (true);

-- dcc_objects
DROP POLICY IF EXISTS "dcc_objects_select_anon" ON dcc_objects;
CREATE POLICY "dcc_objects_select_anon"
  ON dcc_objects FOR SELECT
  TO anon USING (true);