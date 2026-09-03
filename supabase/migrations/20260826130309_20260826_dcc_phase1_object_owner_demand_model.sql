/*
# DCC Phase 1 — Object, Object Owner, Demand Type & Demand/Collection Model

1. Purpose
- Generalizes the DCC (Demand and Collection Center) from a quarter/rent-only
  model into an object-agnostic demand-and-collection product.
- Introduces three core concepts:
  * Demand Type — the kind of payable: Rent, SD, Advance, Loan, Property Tax,
    Insurance, etc.
  * Object — the thing the demand is raised against: a property, a loan, a
    car, etc. Each object has a flexible "details" JSONB column for type-specific
    attributes.
  * Object Owner — the person or organization that owns/pays for the object.

2. New Tables

  dcc_object_owners
  - id (uuid PK)
  - name (text) — owner display name
  - owner_type (text) — 'PERSON' or 'ORGANIZATION'
  - contact_number (text)
  - email (text, nullable)
  - address (text, nullable)
  - city (text, nullable)
  - state (text, nullable)
  - pincode (text, nullable)
  - is_active (boolean, default true)
  - created_at, updated_at (timestamptz)

  dcc_objects
  - id (uuid PK)
  - owner_id (uuid FK -> dcc_object_owners)
  - object_type (text) — 'PROPERTY', 'LOAN', 'CAR', 'QUARTER', etc.
  - object_ref (text) — human-readable identifier (quarter number, reg number, loan id…)
  - description (text) — short display description
  - details (jsonb) — flexible type-specific attributes
  - region (text, nullable) — region name if applicable
  - group_name (text, nullable) — group if applicable
  - subgroup (text, nullable) — subgroup if applicable
  - is_active (boolean, default true)
  - created_at, updated_at (timestamptz)

  dcc_demand_types (reference table)
  - id (uuid PK)
  - code (text, unique) — RENT, SD, ADVANCE, LOAN, PROPERTY_TAX, INSURANCE, etc.
  - label (text) — display label
  - description (text, nullable)
  - is_active (boolean, default true)
  - created_at (timestamptz)

  dcc_demands
  - id (uuid PK)
  - object_id (uuid FK -> dcc_objects)
  - owner_id (uuid FK -> dcc_object_owners)
  - demand_type_id (uuid FK -> dcc_demand_types)
  - criteria_id (uuid FK -> payable_criteria_mt, nullable) — the rule that generated this demand
  - demand_run_date (date) — the run/as-of date this demand was generated on
  - due_date (date) — when payment is due
  - amount (numeric) — total demand amount
  - amount_paid (numeric, default 0) — amount collected so far
  - status (text) — 'DUE', 'OVERDUE', 'PAID', 'EXEMPTED'
  - dispute_date (date, nullable) — set when an admin disputes this line
  - dispute_reason (text, nullable)
  - dispute_remarks (text, nullable)
  - generation_source (text) — 'TPA', 'EXCEL', 'AUTO', 'MANUAL'
  - created_at, updated_at (timestamptz)

  dcc_payments
  - id (uuid PK)
  - demand_id (uuid FK -> dcc_demands)
  - object_id (uuid FK -> dcc_objects)
  - amount (numeric)
  - payment_mode (text) — EPAY, MANUAL, CHEQUE, DD, ONLINE, etc.
  - payment_date (date)
  - reference_number (text, nullable) — cheque/DD/transaction ref
  - remarks (text, nullable)
  - created_at (timestamptz)

  dcc_demand_run_log
  - id (uuid PK)
  - run_date (date)
  - source (text) — 'TPA', 'EXCEL', 'AUTO', 'MANUAL'
  - demand_type_id (uuid FK -> dcc_demand_types, nullable)
  - records_created (integer)
  - total_amount (numeric)
  - created_at (timestamptz)

3. Security
- RLS enabled on all new tables.
- SELECT: authenticated (all logged-in users can read).
- INSERT/UPDATE/DELETE: admin and manager roles only (via extensions.get_user_role()).
- dcc_demand_types: all roles can SELECT; admin/manager can write.

4. Seed Data
- Demand Types: RENT, SD, ADVANCE, LOAN, PROPERTY_TAX, INSURANCE, MAINTENANCE.
- Object Owners: "Antares Logistics" (organization) and "Rajesh Kumar" (person).
- Objects: 2 cars owned by Antares, 1 property owned by Rajesh.
- Demands: tax + insurance demands for the cars, rent + maintenance for the property.
- Payments: one paid insurance demand to demonstrate collection history.
*/

-- ── Object Owners ──────────────────────────────────────────────────────────────
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

DROP POLICY IF EXISTS "dcc_owners_select" ON dcc_object_owners;
CREATE POLICY "dcc_owners_select" ON dcc_object_owners
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "dcc_owners_insert" ON dcc_object_owners;
CREATE POLICY "dcc_owners_insert" ON dcc_object_owners
  FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "dcc_owners_update" ON dcc_object_owners;
CREATE POLICY "dcc_owners_update" ON dcc_object_owners
  FOR UPDATE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'))
  WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "dcc_owners_delete" ON dcc_object_owners;
CREATE POLICY "dcc_owners_delete" ON dcc_object_owners
  FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

-- ── Objects ─────────────────────────────────────────────────────────────────────
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

DROP POLICY IF EXISTS "dcc_objects_select" ON dcc_objects;
CREATE POLICY "dcc_objects_select" ON dcc_objects
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "dcc_objects_insert" ON dcc_objects;
CREATE POLICY "dcc_objects_insert" ON dcc_objects
  FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "dcc_objects_update" ON dcc_objects;
CREATE POLICY "dcc_objects_update" ON dcc_objects
  FOR UPDATE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'))
  WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "dcc_objects_delete" ON dcc_objects;
CREATE POLICY "dcc_objects_delete" ON dcc_objects
  FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

-- ── Demand Types (reference) ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dcc_demand_types (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  label       TEXT NOT NULL,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE dcc_demand_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dcc_dtypes_select" ON dcc_demand_types;
CREATE POLICY "dcc_dtypes_select" ON dcc_demand_types
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "dcc_dtypes_insert" ON dcc_demand_types;
CREATE POLICY "dcc_dtypes_insert" ON dcc_demand_types
  FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "dcc_dtypes_update" ON dcc_demand_types;
CREATE POLICY "dcc_dtypes_update" ON dcc_demand_types
  FOR UPDATE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'))
  WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "dcc_dtypes_delete" ON dcc_demand_types;
CREATE POLICY "dcc_dtypes_delete" ON dcc_demand_types
  FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

-- ── Demands ──────────────────────────────────────────────────────────────────────
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

DROP POLICY IF EXISTS "dcc_demands_select" ON dcc_demands;
CREATE POLICY "dcc_demands_select" ON dcc_demands
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "dcc_demands_insert" ON dcc_demands;
CREATE POLICY "dcc_demands_insert" ON dcc_demands
  FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "dcc_demands_update" ON dcc_demands;
CREATE POLICY "dcc_demands_update" ON dcc_demands
  FOR UPDATE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'))
  WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "dcc_demands_delete" ON dcc_demands;
CREATE POLICY "dcc_demands_delete" ON dcc_demands
  FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

-- ── Payments ────────────────────────────────────────────────────────────────────
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

DROP POLICY IF EXISTS "dcc_payments_select" ON dcc_payments;
CREATE POLICY "dcc_payments_select" ON dcc_payments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "dcc_payments_insert" ON dcc_payments;
CREATE POLICY "dcc_payments_insert" ON dcc_payments
  FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "dcc_payments_update" ON dcc_payments;
CREATE POLICY "dcc_payments_update" ON dcc_payments
  FOR UPDATE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'))
  WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "dcc_payments_delete" ON dcc_payments;
CREATE POLICY "dcc_payments_delete" ON dcc_payments
  FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

-- ── Demand Run Log ───────────────────────────────────────────────────────────────
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

DROP POLICY IF EXISTS "dcc_runlog_select" ON dcc_demand_run_log;
CREATE POLICY "dcc_runlog_select" ON dcc_demand_run_log
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "dcc_runlog_insert" ON dcc_demand_run_log;
CREATE POLICY "dcc_runlog_insert" ON dcc_demand_run_log
  FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "dcc_runlog_update" ON dcc_demand_run_log;
CREATE POLICY "dcc_runlog_update" ON dcc_demand_run_log
  FOR UPDATE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'))
  WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "dcc_runlog_delete" ON dcc_demand_run_log;
CREATE POLICY "dcc_runlog_delete" ON dcc_demand_run_log
  FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

-- ── Indexes ──────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_dcc_objects_owner ON dcc_objects(owner_id);
CREATE INDEX IF NOT EXISTS idx_dcc_objects_type ON dcc_objects(object_type);
CREATE INDEX IF NOT EXISTS idx_dcc_demands_object ON dcc_demands(object_id);
CREATE INDEX IF NOT EXISTS idx_dcc_demands_owner ON dcc_demands(owner_id);
CREATE INDEX IF NOT EXISTS idx_dcc_demands_type ON dcc_demands(demand_type_id);
CREATE INDEX IF NOT EXISTS idx_dcc_demands_status ON dcc_demands(status);
CREATE INDEX IF NOT EXISTS idx_dcc_demands_run_date ON dcc_demands(demand_run_date);
CREATE INDEX IF NOT EXISTS idx_dcc_payments_demand ON dcc_payments(demand_id);
CREATE INDEX IF NOT EXISTS idx_dcc_payments_object ON dcc_payments(object_id);

-- ── Seed: Demand Types ───────────────────────────────────────────────────────────
INSERT INTO dcc_demand_types (code, label, description) VALUES
  ('RENT', 'Rent', 'Monthly rent for quarters or property'),
  ('SD', 'Security Deposit', 'Refundable security deposit'),
  ('ADVANCE', 'Advance', 'Advance payment'),
  ('LOAN', 'Loan Instalment', 'Loan repayment instalment'),
  ('PROPERTY_TAX', 'Property Tax', 'Annual property tax'),
  ('INSURANCE', 'Insurance', 'Insurance premium'),
  ('MAINTENANCE', 'Maintenance', 'Maintenance charges')
ON CONFLICT (code) DO NOTHING;

-- ── Seed: Object Owners ──────────────────────────────────────────────────────────
DO $$
DECLARE
  antares_id UUID;
  rajesh_id UUID;
  car1_id UUID;
  car2_id UUID;
  prop_id UUID;
  rent_type UUID;
  tax_type UUID;
  ins_type UUID;
  maint_type UUID;
BEGIN
  -- Antares Logistics (organization)
  INSERT INTO dcc_object_owners (name, owner_type, contact_number, email, address, city, state, pincode)
  VALUES ('Antares Logistics', 'ORGANIZATION', '+91-9876543210', 'fleet@antares.in',
          '12 Industrial Estate', 'Pune', 'Maharashtra', '411019')
  ON CONFLICT DO NOTHING RETURNING id INTO antares_id;

  IF antares_id IS NULL THEN
    SELECT id INTO antares_id FROM dcc_object_owners WHERE name = 'Antares Logistics' LIMIT 1;
  END IF;

  -- Rajesh Kumar (person)
  INSERT INTO dcc_object_owners (name, owner_type, contact_number, address, city, state, pincode)
  VALUES ('Rajesh Kumar', 'PERSON', '+91-9988776655',
          'Sector 14, Type-II Qtrs', 'Chandigarh', 'Chandigarh', '160014')
  ON CONFLICT DO NOTHING RETURNING id INTO rajesh_id;

  IF rajesh_id IS NULL THEN
    SELECT id INTO rajesh_id FROM dcc_object_owners WHERE name = 'Rajesh Kumar' LIMIT 1;
  END IF;

  -- Car 1
  INSERT INTO dcc_objects (owner_id, object_type, object_ref, description, details, region, group_name, subgroup)
  VALUES (antares_id, 'CAR', 'MH12-AB-1234', 'Toyota Innova — Fleet Car',
          jsonb_build_object('make','Toyota','model','Innova','year',2022,'color','White'),
          'Pune', 'Fleet', 'Sedan')
  ON CONFLICT DO NOTHING RETURNING id INTO car1_id;

  IF car1_id IS NULL THEN
    SELECT id INTO car1_id FROM dcc_objects WHERE object_ref = 'MH12-AB-1234' LIMIT 1;
  END IF;

  -- Car 2
  INSERT INTO dcc_objects (owner_id, object_type, object_ref, description, details, region, group_name, subgroup)
  VALUES (antares_id, 'CAR', 'MH14-CD-5678', 'Maruti Swift — Fleet Car',
          jsonb_build_object('make','Maruti','model','Swift','year',2021,'color','Silver'),
          'Pune', 'Fleet', 'Hatchback')
  ON CONFLICT DO NOTHING RETURNING id INTO car2_id;

  IF car2_id IS NULL THEN
    SELECT id INTO car2_id FROM dcc_objects WHERE object_ref = 'MH14-CD-5678' LIMIT 1;
  END IF;

  -- Property
  INSERT INTO dcc_objects (owner_id, object_type, object_ref, description, details, region, group_name, subgroup)
  VALUES (rajesh_id, 'PROPERTY', 'SEC-14/TYPE-II/42', 'Type-II Quarter — Sector 14',
          jsonb_build_object('bhk','2BHK','area_sqft','850','type','Government Quarter'),
          'Chandigarh', 'Residential', 'Type-II')
  ON CONFLICT DO NOTHING RETURNING id INTO prop_id;

  IF prop_id IS NULL THEN
    SELECT id INTO prop_id FROM dcc_objects WHERE object_ref = 'SEC-14/TYPE-II/42' LIMIT 1;
  END IF;

  -- Get demand type IDs
  SELECT id INTO rent_type FROM dcc_demand_types WHERE code = 'RENT';
  SELECT id INTO tax_type FROM dcc_demand_types WHERE code = 'PROPERTY_TAX';
  SELECT id INTO ins_type FROM dcc_demand_types WHERE code = 'INSURANCE';
  SELECT id INTO maint_type FROM dcc_demand_types WHERE code = 'MAINTENANCE';

  -- Demands: Car 1 — Tax (due), Insurance (paid)
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
  VALUES
    (car1_id, antares_id, tax_type, DATE '2026-04-01', DATE '2026-04-15', 12000, 0, 'OVERDUE', 'AUTO'),
    (car1_id, antares_id, ins_type, DATE '2026-01-01', DATE '2026-01-15', 8500, 8500, 'PAID', 'AUTO')
  ON CONFLICT DO NOTHING;

  -- Demands: Car 2 — Tax (due), Insurance (due)
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
  VALUES
    (car2_id, antares_id, tax_type, DATE '2026-04-01', DATE '2026-04-15', 9500, 0, 'DUE', 'AUTO'),
    (car2_id, antares_id, ins_type, DATE '2026-02-01', DATE '2026-02-15', 7200, 0, 'OVERDUE', 'AUTO')
  ON CONFLICT DO NOTHING;

  -- Demands: Property — Rent (due), Maintenance (paid)
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
  VALUES
    (prop_id, rajesh_id, rent_type, DATE '2026-07-01', DATE '2026-07-05', 3500, 0, 'DUE', 'AUTO'),
    (prop_id, rajesh_id, maint_type, DATE '2026-06-01', DATE '2026-06-10', 1200, 1200, 'PAID', 'AUTO')
  ON CONFLICT DO NOTHING;

  -- Payment for Car 1 Insurance
  INSERT INTO dcc_payments (demand_id, object_id, amount, payment_mode, payment_date, reference_number, remarks)
  SELECT d.id, car1_id, 8500, 'ONLINE', DATE '2026-01-12', 'TXN-INS-001', 'Annual insurance paid'
  FROM dcc_demands d
  WHERE d.object_id = car1_id AND d.demand_type_id = ins_type
  ON CONFLICT DO NOTHING;

  -- Payment for Property Maintenance
  INSERT INTO dcc_payments (demand_id, object_id, amount, payment_mode, payment_date, reference_number, remarks)
  SELECT d.id, prop_id, 1200, 'EPAY', DATE '2026-06-08', 'TXN-MAINT-001', 'Maintenance for June'
  FROM dcc_demands d
  WHERE d.object_id = prop_id AND d.demand_type_id = maint_type
  ON CONFLICT DO NOTHING;

  -- Run log entries
  INSERT INTO dcc_demand_run_log (run_date, source, demand_type_id, records_created, total_amount)
  VALUES
    (DATE '2026-01-01', 'AUTO', ins_type, 1, 8500),
    (DATE '2026-02-01', 'AUTO', ins_type, 1, 7200),
    (DATE '2026-04-01', 'AUTO', tax_type, 2, 21500),
    (DATE '2026-06-01', 'AUTO', maint_type, 1, 1200),
    (DATE '2026-07-01', 'AUTO', rent_type, 1, 3500)
  ON CONFLICT DO NOTHING;
END $$;
