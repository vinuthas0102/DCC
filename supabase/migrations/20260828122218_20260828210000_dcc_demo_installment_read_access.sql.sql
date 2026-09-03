-- Demo mode uses a local fake login, so browser requests use the anon role.
-- DCC demands already have an anon read policy; expose only the related demo
-- installment records for read-only display. No anon write policy is added.

CREATE POLICY "dcc_installment_plans_select_anon_demo"
  ON dcc_installment_plans
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "dcc_installment_rows_select_anon_demo"
  ON dcc_installment_rows
  FOR SELECT
  TO anon
  USING (true);
