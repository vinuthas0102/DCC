-- Add anon SELECT policies to DCC reference tables
CREATE POLICY "dcc_dtypes_select_anon" ON dcc_demand_types FOR SELECT TO anon USING (true);
CREATE POLICY "dcc_owners_select_anon" ON dcc_object_owners FOR SELECT TO anon USING (true);
CREATE POLICY "dcc_objects_select_anon" ON dcc_objects FOR SELECT TO anon USING (true);