-- Add anon SELECT policies to DCC data tables
CREATE POLICY "dcc_demands_select_anon" ON dcc_demands FOR SELECT TO anon USING (true);
CREATE POLICY "dcc_payments_select_anon" ON dcc_payments FOR SELECT TO anon USING (true);
CREATE POLICY "dcc_runlog_select_anon" ON dcc_demand_run_log FOR SELECT TO anon USING (true);