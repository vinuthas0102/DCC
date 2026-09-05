-- DCC Phase 5: Installment plans and rows
CREATE TABLE IF NOT EXISTS dcc_installment_plans (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id                 UUID NOT NULL UNIQUE REFERENCES dcc_demands(id) ON DELETE CASCADE,
  no_of_installments        INTEGER NOT NULL DEFAULT 1,
  late_fee                  NUMERIC(12,2) NOT NULL DEFAULT 0,
  interest_pct_pa           NUMERIC(6,2) NOT NULL DEFAULT 0,
  discount_full_payment_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
  gst_pct                   NUMERIC(6,2) NOT NULL DEFAULT 0,
  gst_type                  TEXT NOT NULL DEFAULT 'inclusive' CHECK (gst_type IN ('inclusive','exclusive')),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE dcc_installment_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dcc_ip_select" ON dcc_installment_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "dcc_ip_insert" ON dcc_installment_plans FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() IN ('admin','manager'));
CREATE POLICY "dcc_ip_update" ON dcc_installment_plans FOR UPDATE TO authenticated USING (extensions.get_user_role() IN ('admin','manager')) WITH CHECK (extensions.get_user_role() IN ('admin','manager'));
CREATE POLICY "dcc_ip_delete" ON dcc_installment_plans FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

CREATE TABLE IF NOT EXISTS dcc_installment_rows (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id               UUID NOT NULL REFERENCES dcc_installment_plans(id) ON DELETE CASCADE,
  row_number            INTEGER NOT NULL,
  label                 TEXT NOT NULL,
  percentage            NUMERIC(8,4) NOT NULL DEFAULT 0,
  amount                NUMERIC(14,2) NOT NULL DEFAULT 0,
  due_date              DATE,
  paid_date             DATE,
  paid_amt              NUMERIC(14,2) NOT NULL DEFAULT 0,
  remaining_amount      NUMERIC(14,2) GENERATED ALWAYS AS (amount - paid_amt) STORED,
  status                TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PAID','DUE','PENDING','OVERDUE')),
  late_fee              NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_date_with_late_fee DATE,
  gst_amount            NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (plan_id, row_number)
);
ALTER TABLE dcc_installment_rows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dcc_ir_select" ON dcc_installment_rows FOR SELECT TO authenticated USING (true);
CREATE POLICY "dcc_ir_insert" ON dcc_installment_rows FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() IN ('admin','manager'));
CREATE POLICY "dcc_ir_update" ON dcc_installment_rows FOR UPDATE TO authenticated USING (extensions.get_user_role() IN ('admin','manager')) WITH CHECK (extensions.get_user_role() IN ('admin','manager'));
CREATE POLICY "dcc_ir_delete" ON dcc_installment_rows FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

CREATE INDEX IF NOT EXISTS idx_dcc_ip_demand ON dcc_installment_plans(demand_id);
CREATE INDEX IF NOT EXISTS idx_dcc_ir_plan ON dcc_installment_rows(plan_id);