/*
# DCC Phase 6 — Complete Generation, Collection, Reconciliation Rule Model

1. Purpose
   Fills gaps between the existing payable_criteria_mt schema and the full
   DCC scope. Adds generation frequency codes, default demand amount / GST /
   due-date controls, periodic demand increase specs, per-object instalment
   grids (frequency code 95), a unified collection exception grid, TPA URL
   tracking, and last-run / next-instalment-seq tracking columns.

2. Modified Table: payable_criteria_mt
   New columns added (all nullable / with defaults so existing rows are safe):
   - generation_frequency_code  INTEGER  (default 1 = monthly day 1)
   - default_demand_amount      NUMERIC(14,2)
   - default_gst_pct             NUMERIC(5,2)
   - due_date_reference          TEXT  ('TPA' | 'Run' | 'Next')
   - grace_period_days           INTEGER (default 0)
   - tpa_url_id                  TEXT
   - last_run_date               DATE
   - next_instalment_seq         INTEGER

3. New Tables
   - payable_increase_specs (one row per criteria)
   - payable_instalment_grid (per-object instalment schedule for freq code 95)
   - payable_collection_exceptions (unified exception grid)

4. Security
   - RLS enabled on all three new tables.
   - SELECT: authenticated (all logged-in users can read).
   - INSERT/UPDATE/DELETE: admin and manager roles only.
   - Follows the same pattern as existing payable_* child tables.

5. Important Notes
   - All new columns on payable_criteria_mt are nullable or have safe defaults.
   - No data is lost; this is purely additive.
   - Indexes added on criteria_id for all new child tables.
*/

-- ── Add new columns to payable_criteria_mt ─────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payable_criteria_mt' AND column_name = 'generation_frequency_code'
  ) THEN
    ALTER TABLE payable_criteria_mt
      ADD COLUMN generation_frequency_code INTEGER NOT NULL DEFAULT 1;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payable_criteria_mt' AND column_name = 'default_demand_amount'
  ) THEN
    ALTER TABLE payable_criteria_mt
      ADD COLUMN default_demand_amount NUMERIC(14,2);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payable_criteria_mt' AND column_name = 'default_gst_pct'
  ) THEN
    ALTER TABLE payable_criteria_mt
      ADD COLUMN default_gst_pct NUMERIC(5,2);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payable_criteria_mt' AND column_name = 'due_date_reference'
  ) THEN
    ALTER TABLE payable_criteria_mt
      ADD COLUMN due_date_reference TEXT CHECK (due_date_reference IN ('TPA','Run','Next'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payable_criteria_mt' AND column_name = 'grace_period_days'
  ) THEN
    ALTER TABLE payable_criteria_mt
      ADD COLUMN grace_period_days INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payable_criteria_mt' AND column_name = 'tpa_url_id'
  ) THEN
    ALTER TABLE payable_criteria_mt
      ADD COLUMN tpa_url_id TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payable_criteria_mt' AND column_name = 'last_run_date'
  ) THEN
    ALTER TABLE payable_criteria_mt
      ADD COLUMN last_run_date DATE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payable_criteria_mt' AND column_name = 'next_instalment_seq'
  ) THEN
    ALTER TABLE payable_criteria_mt
      ADD COLUMN next_instalment_seq INTEGER;
  END IF;
END $$;

-- ── payable_increase_specs ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payable_increase_specs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criteria_id           UUID NOT NULL REFERENCES payable_criteria_mt(id) ON DELETE CASCADE,
  increase_after_months INTEGER NOT NULL DEFAULT 12,
  increase_pct          NUMERIC(5,2) NOT NULL DEFAULT 0,
  increase_min          NUMERIC(14,2),
  increase_max          NUMERIC(14,2),
  alert_message_hook    TEXT NOT NULL DEFAULT '',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE payable_increase_specs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pis_inc_select_authenticated" ON payable_increase_specs;
CREATE POLICY "pis_inc_select_authenticated" ON payable_increase_specs
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "pis_inc_insert_admin_manager" ON payable_increase_specs;
CREATE POLICY "pis_inc_insert_admin_manager" ON payable_increase_specs
  FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "pis_inc_update_admin_manager" ON payable_increase_specs;
CREATE POLICY "pis_inc_update_admin_manager" ON payable_increase_specs
  FOR UPDATE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'))
  WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "pis_inc_delete_admin_manager" ON payable_increase_specs;
CREATE POLICY "pis_inc_delete_admin_manager" ON payable_increase_specs
  FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

CREATE INDEX IF NOT EXISTS idx_pis_inc_criteria ON payable_increase_specs(criteria_id);

-- ── payable_instalment_grid ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payable_instalment_grid (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criteria_id       UUID NOT NULL REFERENCES payable_criteria_mt(id) ON DELETE CASCADE,
  object_id         UUID,
  instalment_seq    INTEGER NOT NULL DEFAULT 1,
  instalment_date   DATE,
  instalment_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  next_run_date     DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE payable_instalment_grid ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pig_select_authenticated" ON payable_instalment_grid;
CREATE POLICY "pig_select_authenticated" ON payable_instalment_grid
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "pig_insert_admin_manager" ON payable_instalment_grid;
CREATE POLICY "pig_insert_admin_manager" ON payable_instalment_grid
  FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "pig_update_admin_manager" ON payable_instalment_grid;
CREATE POLICY "pig_update_admin_manager" ON payable_instalment_grid
  FOR UPDATE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'))
  WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "pig_delete_admin_manager" ON payable_instalment_grid;
CREATE POLICY "pig_delete_admin_manager" ON payable_instalment_grid
  FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

CREATE INDEX IF NOT EXISTS idx_pig_criteria ON payable_instalment_grid(criteria_id);
CREATE INDEX IF NOT EXISTS idx_pig_object ON payable_instalment_grid(object_id);

-- ── payable_collection_exceptions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payable_collection_exceptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criteria_id       UUID NOT NULL REFERENCES payable_criteria_mt(id) ON DELETE CASCADE,
  exception_type    TEXT NOT NULL CHECK (exception_type IN ('Installment','Discount','Penalty','Alert')),
  seq_no            INTEGER NOT NULL DEFAULT 1,
  demand_slab_min   NUMERIC(14,2),
  demand_slab_max   NUMERIC(14,2),
  offset_days       INTEGER NOT NULL DEFAULT 0,
  applicable_pct    NUMERIC(5,2) NOT NULL DEFAULT 0,
  pct_basis         TEXT NOT NULL DEFAULT 'Monthly' CHECK (pct_basis IN ('Daily','Monthly','Yearly')),
  pct_min           NUMERIC(14,2),
  pct_max           NUMERIC(14,2),
  actual_amount     NUMERIC(14,2),
  message_hook      TEXT NOT NULL DEFAULT '',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE payable_collection_exceptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pce_select_authenticated" ON payable_collection_exceptions;
CREATE POLICY "pce_select_authenticated" ON payable_collection_exceptions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "pce_insert_admin_manager" ON payable_collection_exceptions;
CREATE POLICY "pce_insert_admin_manager" ON payable_collection_exceptions
  FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "pce_update_admin_manager" ON payable_collection_exceptions;
CREATE POLICY "pce_update_admin_manager" ON payable_collection_exceptions
  FOR UPDATE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'))
  WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "pce_delete_admin_manager" ON payable_collection_exceptions;
CREATE POLICY "pce_delete_admin_manager" ON payable_collection_exceptions
  FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

CREATE INDEX IF NOT EXISTS idx_pce_criteria ON payable_collection_exceptions(criteria_id);
CREATE INDEX IF NOT EXISTS idx_pce_type ON payable_collection_exceptions(exception_type);