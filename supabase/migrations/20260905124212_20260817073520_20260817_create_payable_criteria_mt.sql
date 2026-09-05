-- payable_criteria_mt and child tables (from 20260817 migration)
CREATE TABLE IF NOT EXISTS payable_criteria_mt (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dept                    TEXT NOT NULL,
  subdept                 TEXT NOT NULL DEFAULT '',
  module_id               TEXT NOT NULL,
  location                TEXT NOT NULL,
  grade_designation       TEXT NOT NULL,
  payable_transaction_type TEXT NOT NULL CHECK (payable_transaction_type IN (
    'PP','TPF','EMD','SD','RENT','LEASE','MAINT','LOAN','PURCHASE','TAX','INSURANCE'
  )),
  first_btm_run_date      DATE,
  subsequent_btm_run_day  TEXT NOT NULL DEFAULT '1',
  next_run_date           DATE,
  available_payment_modes TEXT[] NOT NULL DEFAULT ARRAY['EPAY']::text[],
  include_gst             BOOLEAN NOT NULL DEFAULT false,
  is_active               BOOLEAN NOT NULL DEFAULT true,
  created_by              UUID REFERENCES auth.users(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE payable_criteria_mt ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pcm_select_authenticated" ON payable_criteria_mt FOR SELECT TO authenticated USING (true);
CREATE POLICY "pcm_insert_admin_manager" ON payable_criteria_mt FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() IN ('admin','manager'));
CREATE POLICY "pcm_update_admin_manager" ON payable_criteria_mt FOR UPDATE TO authenticated USING (extensions.get_user_role() IN ('admin','manager')) WITH CHECK (extensions.get_user_role() IN ('admin','manager'));
CREATE POLICY "pcm_delete_admin_manager" ON payable_criteria_mt FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

CREATE TABLE IF NOT EXISTS payable_full_payment_specs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criteria_id   UUID NOT NULL REFERENCES payable_criteria_mt(id) ON DELETE CASCADE,
  reference_date TEXT NOT NULL,
  days_offset   INTEGER NOT NULL DEFAULT 0,
  discount_slabs JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE payable_full_payment_specs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pfps_select_authenticated" ON payable_full_payment_specs FOR SELECT TO authenticated USING (true);
CREATE POLICY "pfps_insert_admin_manager" ON payable_full_payment_specs FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() IN ('admin','manager'));
CREATE POLICY "pfps_update_admin_manager" ON payable_full_payment_specs FOR UPDATE TO authenticated USING (extensions.get_user_role() IN ('admin','manager')) WITH CHECK (extensions.get_user_role() IN ('admin','manager'));
CREATE POLICY "pfps_delete_admin_manager" ON payable_full_payment_specs FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

CREATE TABLE IF NOT EXISTS payable_advance_specs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criteria_id   UUID NOT NULL REFERENCES payable_criteria_mt(id) ON DELETE CASCADE,
  advance_type  TEXT NOT NULL DEFAULT 'PERCENTAGE' CHECK (advance_type IN ('PERCENTAGE','AMOUNT')),
  advance_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  reference_date TEXT NOT NULL,
  days_offset   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE payable_advance_specs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pas_select_authenticated" ON payable_advance_specs FOR SELECT TO authenticated USING (true);
CREATE POLICY "pas_insert_admin_manager" ON payable_advance_specs FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() IN ('admin','manager'));
CREATE POLICY "pas_update_admin_manager" ON payable_advance_specs FOR UPDATE TO authenticated USING (extensions.get_user_role() IN ('admin','manager')) WITH CHECK (extensions.get_user_role() IN ('admin','manager'));
CREATE POLICY "pas_delete_admin_manager" ON payable_advance_specs FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

CREATE TABLE IF NOT EXISTS payable_installment_specs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criteria_id       UUID NOT NULL REFERENCES payable_criteria_mt(id) ON DELETE CASCADE,
  installment_type  TEXT NOT NULL DEFAULT 'PERCENTAGE' CHECK (installment_type IN ('PERCENTAGE','AMOUNT')),
  installment_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  reference_date    TEXT NOT NULL,
  days_offset       INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE payable_installment_specs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pis_select_authenticated" ON payable_installment_specs FOR SELECT TO authenticated USING (true);
CREATE POLICY "pis_insert_admin_manager" ON payable_installment_specs FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() IN ('admin','manager'));
CREATE POLICY "pis_update_admin_manager" ON payable_installment_specs FOR UPDATE TO authenticated USING (extensions.get_user_role() IN ('admin','manager')) WITH CHECK (extensions.get_user_role() IN ('admin','manager'));
CREATE POLICY "pis_delete_admin_manager" ON payable_installment_specs FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

CREATE TABLE IF NOT EXISTS payable_penalty_slabs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criteria_id   UUID NOT NULL REFERENCES payable_criteria_mt(id) ON DELETE CASCADE,
  slab_row      INTEGER NOT NULL DEFAULT 1,
  penalty_type  TEXT NOT NULL DEFAULT 'PERCENTAGE' CHECK (penalty_type IN ('PERCENTAGE','AMOUNT')),
  penalty_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  late_days     INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE payable_penalty_slabs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pps_select_authenticated" ON payable_penalty_slabs FOR SELECT TO authenticated USING (true);
CREATE POLICY "pps_insert_admin_manager" ON payable_penalty_slabs FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() IN ('admin','manager'));
CREATE POLICY "pps_update_admin_manager" ON payable_penalty_slabs FOR UPDATE TO authenticated USING (extensions.get_user_role() IN ('admin','manager')) WITH CHECK (extensions.get_user_role() IN ('admin','manager'));
CREATE POLICY "pps_delete_admin_manager" ON payable_penalty_slabs FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

CREATE TABLE IF NOT EXISTS payable_alert_specs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criteria_id     UUID NOT NULL REFERENCES payable_criteria_mt(id) ON DELETE CASCADE,
  days_before_due INTEGER NOT NULL DEFAULT 7,
  message_hook    TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE payable_alert_specs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pas2_select_authenticated" ON payable_alert_specs FOR SELECT TO authenticated USING (true);
CREATE POLICY "pas2_insert_admin_manager" ON payable_alert_specs FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() IN ('admin','manager'));
CREATE POLICY "pas2_update_admin_manager" ON payable_alert_specs FOR UPDATE TO authenticated USING (extensions.get_user_role() IN ('admin','manager')) WITH CHECK (extensions.get_user_role() IN ('admin','manager'));
CREATE POLICY "pas2_delete_admin_manager" ON payable_alert_specs FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

CREATE INDEX IF NOT EXISTS idx_pcm_transaction_type ON payable_criteria_mt(payable_transaction_type);
CREATE INDEX IF NOT EXISTS idx_pcm_module_location ON payable_criteria_mt(module_id, location);
CREATE INDEX IF NOT EXISTS idx_pcm_dept ON payable_criteria_mt(dept);
CREATE INDEX IF NOT EXISTS idx_pfps_criteria ON payable_full_payment_specs(criteria_id);
CREATE INDEX IF NOT EXISTS idx_pas_criteria ON payable_advance_specs(criteria_id);
CREATE INDEX IF NOT EXISTS idx_pis_criteria ON payable_installment_specs(criteria_id);
CREATE INDEX IF NOT EXISTS idx_pps_criteria ON payable_penalty_slabs(criteria_id);
CREATE INDEX IF NOT EXISTS idx_pas2_criteria ON payable_alert_specs(criteria_id);