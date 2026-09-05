-- DCC role-based demand visibility
ALTER TABLE dcc_object_owners ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_dcc_owners_user_id ON dcc_object_owners(user_id);

DROP POLICY IF EXISTS "dcc_demands_select" ON dcc_demands;
CREATE POLICY "dcc_demands_select" ON dcc_demands FOR SELECT TO authenticated USING (
  extensions.get_user_role() IN ('admin', 'manager')
  OR EXISTS (SELECT 1 FROM dcc_object_owners o WHERE o.id = dcc_demands.owner_id AND o.user_id = auth.uid())
);
DROP POLICY IF EXISTS "dcc_payments_select" ON dcc_payments;
CREATE POLICY "dcc_payments_select" ON dcc_payments FOR SELECT TO authenticated USING (
  extensions.get_user_role() IN ('admin', 'manager')
  OR EXISTS (SELECT 1 FROM dcc_demands d JOIN dcc_object_owners o ON o.id = d.owner_id WHERE d.id = dcc_payments.demand_id AND o.user_id = auth.uid())
);
DROP POLICY IF EXISTS "dcc_iplans_select" ON dcc_installment_plans;
CREATE POLICY "dcc_iplans_select" ON dcc_installment_plans FOR SELECT TO authenticated USING (
  extensions.get_user_role() IN ('admin', 'manager')
  OR EXISTS (SELECT 1 FROM dcc_demands d JOIN dcc_object_owners o ON o.id = d.owner_id WHERE d.id = dcc_installment_plans.demand_id AND o.user_id = auth.uid())
);
DROP POLICY IF EXISTS "dcc_irows_select" ON dcc_installment_rows;
CREATE POLICY "dcc_irows_select" ON dcc_installment_rows FOR SELECT TO authenticated USING (
  extensions.get_user_role() IN ('admin', 'manager')
  OR EXISTS (SELECT 1 FROM dcc_installment_plans p JOIN dcc_demands d ON d.id = p.demand_id JOIN dcc_object_owners o ON o.id = d.owner_id WHERE p.id = dcc_installment_rows.plan_id AND o.user_id = auth.uid())
);