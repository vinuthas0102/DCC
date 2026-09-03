/*
# DCC Phase 5 — Installment Plans & Rows for DCC Demands

1. Purpose
- Brings the DCC demand detail "Installments" tab to life with real database-backed
  installment plans, so admins/managers can split a demand into multiple rows
  (full payment + installment rows), track each row's paid/remaining status, and
  record payments against individual installment rows.

2. New Tables

  dcc_installment_plans
  - id (uuid PK)
  - demand_id (uuid FK -> dcc_demands, ON DELETE CASCADE, UNIQUE) — one plan per demand
  - no_of_installments (integer) — total number of installment rows (excluding full payment row)
  - late_fee (numeric, default 0)
  - interest_pct_pa (numeric, default 0)
  - discount_full_payment_pct (numeric, default 0)
  - gst_pct (numeric, default 0)
  - gst_type (text, 'inclusive' | 'exclusive', default 'inclusive')
  - created_at, updated_at (timestamptz)

  dcc_installment_rows
  - id (uuid PK)
  - plan_id (uuid FK -> dcc_installment_plans, ON DELETE CASCADE)
  - row_number (integer) — 0 = Full Payment, 1+ = nth installment
  - label (text) — display label
  - percentage (numeric) — percentage of total demand
  - amount (numeric) — absolute amount
  - due_date (date, nullable)
  - paid_date (date, nullable)
  - paid_amt (numeric, default 0)
  - remaining_amount (numeric, GENERATED ALWAYS AS (amount - paid_amt) STORED)
  - status (text, 'PAID' | 'DUE' | 'PENDING' | 'OVERDUE', default 'PENDING')
  - late_fee (numeric, default 0)
  - due_date_with_late_fee (date, nullable)
  - gst_amount (numeric, default 0)
  - created_at, updated_at (timestamptz)
  - UNIQUE (plan_id, row_number)

3. Security
- RLS enabled on both tables.
- SELECT: authenticated (all logged-in users can read).
- INSERT/UPDATE/DELETE: admin and manager roles only (via extensions.get_user_role()).

4. Important Notes
- One installment plan per demand (UNIQUE constraint on demand_id).
- Row 0 = Full Payment option; rows 1+ = individual installments.
- remaining_amount is a generated column (amount - paid_amt).
- When an installment row is fully paid, status becomes 'PAID'.
*/

-- ── Installment Plans ──────────────────────────────────────────────────────────
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

DROP POLICY IF EXISTS "dcc_ip_select" ON dcc_installment_plans;
CREATE POLICY "dcc_ip_select" ON dcc_installment_plans
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "dcc_ip_insert" ON dcc_installment_plans;
CREATE POLICY "dcc_ip_insert" ON dcc_installment_plans
  FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "dcc_ip_update" ON dcc_installment_plans;
CREATE POLICY "dcc_ip_update" ON dcc_installment_plans
  FOR UPDATE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'))
  WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "dcc_ip_delete" ON dcc_installment_plans;
CREATE POLICY "dcc_ip_delete" ON dcc_installment_plans
  FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

-- ── Installment Rows ───────────────────────────────────────────────────────────
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

DROP POLICY IF EXISTS "dcc_ir_select" ON dcc_installment_rows;
CREATE POLICY "dcc_ir_select" ON dcc_installment_rows
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "dcc_ir_insert" ON dcc_installment_rows;
CREATE POLICY "dcc_ir_insert" ON dcc_installment_rows
  FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "dcc_ir_update" ON dcc_installment_rows;
CREATE POLICY "dcc_ir_update" ON dcc_installment_rows
  FOR UPDATE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'))
  WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "dcc_ir_delete" ON dcc_installment_rows;
CREATE POLICY "dcc_ir_delete" ON dcc_installment_rows
  FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

-- ── Indexes ──────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_dcc_ip_demand ON dcc_installment_plans(demand_id);
CREATE INDEX IF NOT EXISTS idx_dcc_ir_plan ON dcc_installment_rows(plan_id);
