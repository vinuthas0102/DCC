/*
# Create Payable Criteria Master Table (MT Setup)

1. Purpose
- Establishes a generic, flexible "Payable Criteria MT" master table that defines
  rules for generating and tracking any payable amount from Entity A to Entity B.
- Supports payable transaction types: PP, TPF, EMD, SD, Rent, Lease, Maintenance,
  Loan, Purchase, Tax, Insurance.
- Stores BTM (Bill-To-Monthly) run schedule, available payment modes, GST toggle,
  and flexible payment specs (full payment with discount slabs, advance payment,
  installment payments, penalty slabs, and alert criteria).

2. New Tables

  payable_criteria_mt (master)
  - id (uuid PK)
  - dept (text) — department
  - subdept (text) — sub-department
  - module_id (text) — module key: Quarter, Facility, etc.
  - location (text) — location key
  - grade_designation (text) — employee grade/designation, or "TP" for third parties
  - payable_transaction_type (text) — PP, TPF, EMD, SD, RENT, LEASE, MAINT, LOAN, PURCHASE, TAX, INSURANCE
  - first_btm_run_date (date) — first BTM run date
  - subsequent_btm_run_day (text) — day-of-month number OR 'EOM'
  - next_run_date (date, nullable) — next scheduled BTM run; NULL means no run done yet
  - available_payment_modes (text[]) — multi-select: EPAY, MANUAL, SALARY_ADJUSTED, CHEQUE, DD, ONLINE
  - include_gst (boolean) — whether GST applies
  - is_active (boolean)
  - created_by (uuid, refs auth.users)
  - created_at, updated_at (timestamptz)

  payable_full_payment_specs
  - id (uuid PK)
  - criteria_id (uuid FK -> payable_criteria_mt)
  - reference_date (text) — payable_generation_date, allotment_submitted_date, allotted_date, accepted_date, handover_date, calendar_year_beginning, fiscal_year_beginning
  - days_offset (integer) — reference_date + offset = full payment due date
  - discount_slabs (jsonb) — array of up to 5 rows: { days_offset, discount_pct, discount_amount, applicable_days }
  - created_at (timestamptz)

  payable_advance_specs
  - id (uuid PK)
  - criteria_id (uuid FK)
  - advance_type (text) — PERCENTAGE or AMOUNT
  - advance_value (numeric) — percentage or exact amount
  - reference_date (text)
  - days_offset (integer)
  - created_at (timestamptz)

  payable_installment_specs
  - id (uuid PK)
  - criteria_id (uuid FK)
  - installment_type (text) — PERCENTAGE or AMOUNT
  - installment_value (numeric)
  - reference_date (text) — used for first installment only
  - days_offset (integer)
  - created_at (timestamptz)

  payable_penalty_slabs
  - id (uuid PK)
  - criteria_id (uuid FK)
  - slab_row (integer) — 1..5
  - penalty_type (text) — PERCENTAGE or AMOUNT
  - penalty_value (numeric)
  - late_days (integer) — number of late days w.r.t. payment due date
  - created_at (timestamptz)

  payable_alert_specs
  - id (uuid PK)
  - criteria_id (uuid FK)
  - days_before_due (integer) — alert X days before payment due date
  - message_hook (text) — reference to message table hook#
  - created_at (timestamptz)

3. Security
- RLS enabled on all tables.
- SELECT: authenticated (all logged-in users can read).
- INSERT/UPDATE/DELETE: admin and manager roles only (via extensions.get_user_role()).
- Uses extensions.get_user_role() helper consistent with existing migrations.

4. Seed Data
- Inserts demo payable criteria records covering all 11 transaction types with at
  least 2 examples each (22 total records), with representative child spec rows.
*/

-- ── Master table ──────────────────────────────────────────────────────────────
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

DROP POLICY IF EXISTS "pcm_select_authenticated" ON payable_criteria_mt;
CREATE POLICY "pcm_select_authenticated" ON payable_criteria_mt
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "pcm_insert_admin_manager" ON payable_criteria_mt;
CREATE POLICY "pcm_insert_admin_manager" ON payable_criteria_mt
  FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "pcm_update_admin_manager" ON payable_criteria_mt;
CREATE POLICY "pcm_update_admin_manager" ON payable_criteria_mt
  FOR UPDATE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'))
  WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "pcm_delete_admin_manager" ON payable_criteria_mt;
CREATE POLICY "pcm_delete_admin_manager" ON payable_criteria_mt
  FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

-- ── Full payment specs ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payable_full_payment_specs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criteria_id   UUID NOT NULL REFERENCES payable_criteria_mt(id) ON DELETE CASCADE,
  reference_date TEXT NOT NULL,
  days_offset   INTEGER NOT NULL DEFAULT 0,
  discount_slabs JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE payable_full_payment_specs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pfps_select_authenticated" ON payable_full_payment_specs;
CREATE POLICY "pfps_select_authenticated" ON payable_full_payment_specs
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "pfps_insert_admin_manager" ON payable_full_payment_specs;
CREATE POLICY "pfps_insert_admin_manager" ON payable_full_payment_specs
  FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "pfps_update_admin_manager" ON payable_full_payment_specs;
CREATE POLICY "pfps_update_admin_manager" ON payable_full_payment_specs
  FOR UPDATE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'))
  WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "pfps_delete_admin_manager" ON payable_full_payment_specs;
CREATE POLICY "pfps_delete_admin_manager" ON payable_full_payment_specs
  FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

-- ── Advance payment specs ──────────────────────────────────────────────────────
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

DROP POLICY IF EXISTS "pas_select_authenticated" ON payable_advance_specs;
CREATE POLICY "pas_select_authenticated" ON payable_advance_specs
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "pas_insert_admin_manager" ON payable_advance_specs;
CREATE POLICY "pas_insert_admin_manager" ON payable_advance_specs
  FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "pas_update_admin_manager" ON payable_advance_specs;
CREATE POLICY "pas_update_admin_manager" ON payable_advance_specs
  FOR UPDATE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'))
  WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "pas_delete_admin_manager" ON payable_advance_specs;
CREATE POLICY "pas_delete_admin_manager" ON payable_advance_specs
  FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

-- ── Installment specs ──────────────────────────────────────────────────────────
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

DROP POLICY IF EXISTS "pis_select_authenticated" ON payable_installment_specs;
CREATE POLICY "pis_select_authenticated" ON payable_installment_specs
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "pis_insert_admin_manager" ON payable_installment_specs;
CREATE POLICY "pis_insert_admin_manager" ON payable_installment_specs
  FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "pis_update_admin_manager" ON payable_installment_specs;
CREATE POLICY "pis_update_admin_manager" ON payable_installment_specs
  FOR UPDATE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'))
  WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "pis_delete_admin_manager" ON payable_installment_specs;
CREATE POLICY "pis_delete_admin_manager" ON payable_installment_specs
  FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

-- ── Penalty slabs ───────────────────────────────────────────────────────────────
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

DROP POLICY IF EXISTS "pps_select_authenticated" ON payable_penalty_slabs;
CREATE POLICY "pps_select_authenticated" ON payable_penalty_slabs
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "pps_insert_admin_manager" ON payable_penalty_slabs;
CREATE POLICY "pps_insert_admin_manager" ON payable_penalty_slabs
  FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "pps_update_admin_manager" ON payable_penalty_slabs;
CREATE POLICY "pps_update_admin_manager" ON payable_penalty_slabs
  FOR UPDATE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'))
  WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "pps_delete_admin_manager" ON payable_penalty_slabs;
CREATE POLICY "pps_delete_admin_manager" ON payable_penalty_slabs
  FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

-- ── Alert specs ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payable_alert_specs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criteria_id     UUID NOT NULL REFERENCES payable_criteria_mt(id) ON DELETE CASCADE,
  days_before_due INTEGER NOT NULL DEFAULT 7,
  message_hook    TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE payable_alert_specs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pas2_select_authenticated" ON payable_alert_specs;
CREATE POLICY "pas2_select_authenticated" ON payable_alert_specs
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "pas2_insert_admin_manager" ON payable_alert_specs;
CREATE POLICY "pas2_insert_admin_manager" ON payable_alert_specs
  FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "pas2_update_admin_manager" ON payable_alert_specs;
CREATE POLICY "pas2_update_admin_manager" ON payable_alert_specs
  FOR UPDATE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'))
  WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "pas2_delete_admin_manager" ON payable_alert_specs;
CREATE POLICY "pas2_delete_admin_manager" ON payable_alert_specs
  FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

-- ── Indexes ─────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pcm_transaction_type ON payable_criteria_mt(payable_transaction_type);
CREATE INDEX IF NOT EXISTS idx_pcm_module_location ON payable_criteria_mt(module_id, location);
CREATE INDEX IF NOT EXISTS idx_pcm_dept ON payable_criteria_mt(dept);
CREATE INDEX IF NOT EXISTS idx_pfps_criteria ON payable_full_payment_specs(criteria_id);
CREATE INDEX IF NOT EXISTS idx_pas_criteria ON payable_advance_specs(criteria_id);
CREATE INDEX IF NOT EXISTS idx_pis_criteria ON payable_installment_specs(criteria_id);
CREATE INDEX IF NOT EXISTS idx_pps_criteria ON payable_penalty_slabs(criteria_id);
CREATE INDEX IF NOT EXISTS idx_pas2_criteria ON payable_alert_specs(criteria_id);

-- ── Seed demo data: 2 records per transaction type (22 total) ──────────────────
-- Using a DO block to insert master + child rows cleanly per type.
DO $$
DECLARE
  c1 UUID; c2 UUID;
  t TEXT;
  types TEXT[] := ARRAY[
    'PP','TPF','EMD','SD','RENT','LEASE','MAINT','LOAN','PURCHASE','TAX','INSURANCE'
  ];
  i INTEGER;
BEGIN
  FOR i IN 1..array_length(types,1) LOOP
    t := types[i];

    -- Record 1 for this type
    INSERT INTO payable_criteria_mt (
      dept, subdept, module_id, location, grade_designation,
      payable_transaction_type, first_btm_run_date, subsequent_btm_run_day,
      next_run_date, available_payment_modes, include_gst, is_active
    ) VALUES (
      'Estate Dept', 'Administration', 'Quarter', 'HQ-Campus', 'Grade-A',
      t, DATE '2026-01-01', '1',
      NULL,
      ARRAY['EPAY','MANUAL','SALARY_ADJUSTED']::text[],
      (i % 2 = 0),
      true
    ) RETURNING id INTO c1;

    INSERT INTO payable_full_payment_specs (criteria_id, reference_date, days_offset, discount_slabs)
    VALUES (c1, 'allotted_date', 45, jsonb_build_array(
      jsonb_build_object('days_offset',15,'discount_pct',2,'discount_amount',0,'applicable_days',15),
      jsonb_build_object('days_offset',30,'discount_pct',1,'discount_amount',0,'applicable_days',30)
    ));

    INSERT INTO payable_advance_specs (criteria_id, advance_type, advance_value, reference_date, days_offset)
    VALUES (c1, 'PERCENTAGE', 10, 'allotted_date', 7);

    INSERT INTO payable_installment_specs (criteria_id, installment_type, installment_value, reference_date, days_offset)
    VALUES (c1, 'PERCENTAGE', 20, 'allotted_date', 30);

    INSERT INTO payable_penalty_slabs (criteria_id, slab_row, penalty_type, penalty_value, late_days)
    VALUES
      (c1, 1, 'PERCENTAGE', 1, 7),
      (c1, 2, 'PERCENTAGE', 2, 15),
      (c1, 3, 'AMOUNT', 500, 30);

    INSERT INTO payable_alert_specs (criteria_id, days_before_due, message_hook)
    VALUES (c1, 5, 'HOOK_PAYABLE_DUE_REMINDER');

    -- Record 2 for this type
    INSERT INTO payable_criteria_mt (
      dept, subdept, module_id, location, grade_designation,
      payable_transaction_type, first_btm_run_date, subsequent_btm_run_day,
      next_run_date, available_payment_modes, include_gst, is_active
    ) VALUES (
      'Estate Dept', 'Maintenance', 'Facility', 'Regional-Office', 'TP',
      t, DATE '2026-02-01', 'EOM',
      NULL,
      ARRAY['EPAY','CHEQUE','DD']::text[],
      (i % 2 = 1),
      true
    ) RETURNING id INTO c2;

    INSERT INTO payable_full_payment_specs (criteria_id, reference_date, days_offset, discount_slabs)
    VALUES (c2, 'handover_date', 10, '[]'::jsonb);

    INSERT INTO payable_advance_specs (criteria_id, advance_type, advance_value, reference_date, days_offset)
    VALUES (c2, 'AMOUNT', 5000, 'handover_date', 0);

    INSERT INTO payable_installment_specs (criteria_id, installment_type, installment_value, reference_date, days_offset)
    VALUES (c2, 'AMOUNT', 2000, 'handover_date', 15);

    INSERT INTO payable_penalty_slabs (criteria_id, slab_row, penalty_type, penalty_value, late_days)
    VALUES
      (c2, 1, 'PERCENTAGE', 2, 10),
      (c2, 2, 'AMOUNT', 1000, 30);

    INSERT INTO payable_alert_specs (criteria_id, days_before_due, message_hook)
    VALUES (c2, 3, 'HOOK_PAYABLE_DUE_URGENT');
  END LOOP;
END $$;