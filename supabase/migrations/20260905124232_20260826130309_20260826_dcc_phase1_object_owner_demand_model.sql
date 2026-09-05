-- DCC Phase 1: Object, Owner, Demand Type, Demand/Collection model
CREATE TABLE IF NOT EXISTS dcc_object_owners (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  owner_type    TEXT NOT NULL DEFAULT 'PERSON' CHECK (owner_type IN ('PERSON','ORGANIZATION')),
  contact_number TEXT NOT NULL DEFAULT '',
  email         TEXT,
  address       TEXT,
  city          TEXT,
  state         TEXT,
  pincode       TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE dcc_object_owners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dcc_owners_select" ON dcc_object_owners FOR SELECT TO authenticated USING (true);
CREATE POLICY "dcc_owners_insert" ON dcc_object_owners FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() IN ('admin','manager'));
CREATE POLICY "dcc_owners_update" ON dcc_object_owners FOR UPDATE TO authenticated USING (extensions.get_user_role() IN ('admin','manager')) WITH CHECK (extensions.get_user_role() IN ('admin','manager'));
CREATE POLICY "dcc_owners_delete" ON dcc_object_owners FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

CREATE TABLE IF NOT EXISTS dcc_objects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES dcc_object_owners(id) ON DELETE CASCADE,
  object_type TEXT NOT NULL,
  object_ref  TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  details     JSONB NOT NULL DEFAULT '{}'::jsonb,
  region      TEXT,
  group_name  TEXT,
  subgroup    TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE dcc_objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dcc_objects_select" ON dcc_objects FOR SELECT TO authenticated USING (true);
CREATE POLICY "dcc_objects_insert" ON dcc_objects FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() IN ('admin','manager'));
CREATE POLICY "dcc_objects_update" ON dcc_objects FOR UPDATE TO authenticated USING (extensions.get_user_role() IN ('admin','manager')) WITH CHECK (extensions.get_user_role() IN ('admin','manager'));
CREATE POLICY "dcc_objects_delete" ON dcc_objects FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

CREATE TABLE IF NOT EXISTS dcc_demand_types (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  label       TEXT NOT NULL,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE dcc_demand_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dcc_dtypes_select" ON dcc_demand_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "dcc_dtypes_insert" ON dcc_demand_types FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() IN ('admin','manager'));
CREATE POLICY "dcc_dtypes_update" ON dcc_demand_types FOR UPDATE TO authenticated USING (extensions.get_user_role() IN ('admin','manager')) WITH CHECK (extensions.get_user_role() IN ('admin','manager'));
CREATE POLICY "dcc_dtypes_delete" ON dcc_demand_types FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

CREATE TABLE IF NOT EXISTS dcc_demands (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id         UUID NOT NULL REFERENCES dcc_objects(id) ON DELETE CASCADE,
  owner_id          UUID NOT NULL REFERENCES dcc_object_owners(id) ON DELETE CASCADE,
  demand_type_id    UUID NOT NULL REFERENCES dcc_demand_types(id),
  criteria_id       UUID REFERENCES payable_criteria_mt(id) ON DELETE SET NULL,
  demand_run_date   DATE NOT NULL,
  due_date          DATE NOT NULL,
  amount            NUMERIC(14,2) NOT NULL DEFAULT 0,
  amount_paid       NUMERIC(14,2) NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'DUE' CHECK (status IN ('DUE','OVERDUE','PAID','EXEMPTED')),
  dispute_date      DATE,
  dispute_reason    TEXT,
  dispute_remarks   TEXT,
  generation_source TEXT NOT NULL DEFAULT 'MANUAL' CHECK (generation_source IN ('TPA','EXCEL','AUTO','MANUAL')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE dcc_demands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dcc_demands_select" ON dcc_demands FOR SELECT TO authenticated USING (true);
CREATE POLICY "dcc_demands_insert" ON dcc_demands FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() IN ('admin','manager'));
CREATE POLICY "dcc_demands_update" ON dcc_demands FOR UPDATE TO authenticated USING (extensions.get_user_role() IN ('admin','manager')) WITH CHECK (extensions.get_user_role() IN ('admin','manager'));
CREATE POLICY "dcc_demands_delete" ON dcc_demands FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

CREATE TABLE IF NOT EXISTS dcc_payments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id        UUID NOT NULL REFERENCES dcc_demands(id) ON DELETE CASCADE,
  object_id        UUID NOT NULL REFERENCES dcc_objects(id) ON DELETE CASCADE,
  amount           NUMERIC(14,2) NOT NULL DEFAULT 0,
  payment_mode     TEXT NOT NULL DEFAULT 'EPAY',
  payment_date     DATE NOT NULL,
  reference_number TEXT,
  remarks          TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE dcc_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dcc_payments_select" ON dcc_payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "dcc_payments_insert" ON dcc_payments FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() IN ('admin','manager'));
CREATE POLICY "dcc_payments_update" ON dcc_payments FOR UPDATE TO authenticated USING (extensions.get_user_role() IN ('admin','manager')) WITH CHECK (extensions.get_user_role() IN ('admin','manager'));
CREATE POLICY "dcc_payments_delete" ON dcc_payments FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

CREATE TABLE IF NOT EXISTS dcc_demand_run_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date        DATE NOT NULL,
  source          TEXT NOT NULL DEFAULT 'MANUAL' CHECK (source IN ('TPA','EXCEL','AUTO','MANUAL')),
  demand_type_id  UUID REFERENCES dcc_demand_types(id),
  records_created INTEGER NOT NULL DEFAULT 0,
  total_amount    NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE dcc_demand_run_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dcc_runlog_select" ON dcc_demand_run_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "dcc_runlog_insert" ON dcc_demand_run_log FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() IN ('admin','manager'));
CREATE POLICY "dcc_runlog_update" ON dcc_demand_run_log FOR UPDATE TO authenticated USING (extensions.get_user_role() IN ('admin','manager')) WITH CHECK (extensions.get_user_role() IN ('admin','manager'));
CREATE POLICY "dcc_runlog_delete" ON dcc_demand_run_log FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

CREATE INDEX IF NOT EXISTS idx_dcc_objects_owner ON dcc_objects(owner_id);
CREATE INDEX IF NOT EXISTS idx_dcc_objects_type ON dcc_objects(object_type);
CREATE INDEX IF NOT EXISTS idx_dcc_demands_object ON dcc_demands(object_id);
CREATE INDEX IF NOT EXISTS idx_dcc_demands_owner ON dcc_demands(owner_id);
CREATE INDEX IF NOT EXISTS idx_dcc_demands_type ON dcc_demands(demand_type_id);
CREATE INDEX IF NOT EXISTS idx_dcc_demands_status ON dcc_demands(status);
CREATE INDEX IF NOT EXISTS idx_dcc_demands_run_date ON dcc_demands(demand_run_date);
CREATE INDEX IF NOT EXISTS idx_dcc_payments_demand ON dcc_payments(demand_id);
CREATE INDEX IF NOT EXISTS idx_dcc_payments_object ON dcc_payments(object_id);

-- Seed demand types
INSERT INTO dcc_demand_types (code, label, description) VALUES
  ('RENT', 'Rent', 'Monthly rent for quarters or property'),
  ('SD', 'Security Deposit', 'Refundable security deposit'),
  ('ADVANCE', 'Advance', 'Advance payment'),
  ('LOAN', 'Loan Instalment', 'Loan repayment instalment'),
  ('PROPERTY_TAX', 'Property Tax', 'Annual property tax'),
  ('INSURANCE', 'Insurance', 'Insurance premium'),
  ('MAINTENANCE', 'Maintenance', 'Maintenance charges')
ON CONFLICT (code) DO NOTHING;