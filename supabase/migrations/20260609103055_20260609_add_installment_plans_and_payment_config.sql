-- payment_config: key/value master settings (e.g. penalty_max_discount_pct)
CREATE TABLE IF NOT EXISTS payment_config (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  description TEXT
);

ALTER TABLE payment_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_config_select_authenticated" ON payment_config
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "payment_config_insert_admin" ON payment_config
  FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() = 'admin');

CREATE POLICY "payment_config_update_admin" ON payment_config
  FOR UPDATE TO authenticated USING (extensions.get_user_role() = 'admin') WITH CHECK (extensions.get_user_role() = 'admin');

CREATE POLICY "payment_config_delete_admin" ON payment_config
  FOR DELETE TO authenticated USING (extensions.get_user_role() = 'admin');

INSERT INTO payment_config (key, value, description)
VALUES ('penalty_max_discount_pct', '25', 'Maximum % an Estate Manager can discount the penalty amount')
ON CONFLICT (key) DO NOTHING;

-- quarter_installment_plans: one plan per allotment+month
CREATE TABLE IF NOT EXISTS quarter_installment_plans (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  allotment_id              UUID NOT NULL,
  month                     TEXT NOT NULL,
  installment_start_date    DATE,
  late_fee                  NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_days_with_late_fee    INTEGER NOT NULL DEFAULT 0,
  interest_pct_pa           NUMERIC(6,2) NOT NULL DEFAULT 0,
  discount_full_payment_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
  gst_pct                   NUMERIC(6,2) NOT NULL DEFAULT 0,
  gst_type                  TEXT NOT NULL DEFAULT 'inclusive' CHECK (gst_type IN ('inclusive','exclusive')),
  balance_payment           NUMERIC(14,2) NOT NULL DEFAULT 0,
  emd                       NUMERIC(12,2) NOT NULL DEFAULT 0,
  no_of_installments        INTEGER NOT NULL DEFAULT 1,
  created_by                UUID REFERENCES auth.users(id),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (allotment_id, month)
);

ALTER TABLE quarter_installment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qip_select_authenticated" ON quarter_installment_plans
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "qip_insert_eo" ON quarter_installment_plans
  FOR INSERT TO authenticated WITH CHECK (
    extensions.get_user_role() IN ('admin','manager')
  );

CREATE POLICY "qip_update_eo" ON quarter_installment_plans
  FOR UPDATE TO authenticated
  USING (extensions.get_user_role() IN ('admin','manager'))
  WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

CREATE POLICY "qip_delete_eo" ON quarter_installment_plans
  FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

-- quarter_installment_rows: individual rows within a plan
CREATE TABLE IF NOT EXISTS quarter_installment_rows (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id           UUID NOT NULL REFERENCES quarter_installment_plans(id) ON DELETE CASCADE,
  row_number        INTEGER NOT NULL,  -- 0 = Full Payment, 1+ = nth installment
  label             TEXT NOT NULL,
  percentage        NUMERIC(8,4) NOT NULL DEFAULT 0,
  amount            NUMERIC(14,2) NOT NULL DEFAULT 0,
  due_date          DATE,
  paid_date         DATE,
  paid_amt          NUMERIC(14,2) NOT NULL DEFAULT 0,
  remaining_amount  NUMERIC(14,2) GENERATED ALWAYS AS (amount - paid_amt) STORED,
  status            TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PAID','DUE','PENDING','OVERDUE')),
  late_fee          NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_date_with_late_fee DATE,
  gst_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  UNIQUE (plan_id, row_number)
);

ALTER TABLE quarter_installment_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qir_select_authenticated" ON quarter_installment_rows
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "qir_insert_eo" ON quarter_installment_rows
  FOR INSERT TO authenticated WITH CHECK (
    extensions.get_user_role() IN ('admin','manager')
  );

CREATE POLICY "qir_update_eo" ON quarter_installment_rows
  FOR UPDATE TO authenticated
  USING (extensions.get_user_role() IN ('admin','manager'))
  WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

CREATE POLICY "qir_delete_eo" ON quarter_installment_rows
  FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

CREATE INDEX idx_qir_plan_id ON quarter_installment_rows (plan_id);
CREATE INDEX idx_qip_allotment_month ON quarter_installment_plans (allotment_id, month);
