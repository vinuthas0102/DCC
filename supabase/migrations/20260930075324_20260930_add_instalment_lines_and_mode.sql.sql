/*
# Add Instalment Mode and Lines to Payable Installment Specs

1. Purpose
- Extends the instalment payment model to support two configuration modes:
  MANUAL_LINES (officer specifies each instalment line individually) and
  AUTO_CALC (officer enters a single instalment amount and the system
  auto-calculates the number of instalments and due-date schedule).
- Adds a new child table `payable_instalment_lines` that stores per-line
  instalment definitions (seq, amount, due_date_reference, days_offset).
  In MANUAL_LINES mode, these are the officer-entered lines. In AUTO_CALC
  mode, these are the system-expanded lines saved at rule-save time.

2. Modified Tables
  payable_installment_specs (add columns)
  - instalment_mode (text, default 'AUTO_CALC') — 'MANUAL_LINES' or 'AUTO_CALC'
  - instalment_count (integer, nullable) — explicit count; NULL = auto-calculate
  - interval_days (integer, default 30) — days between consecutive instalment due dates (AUTO_CALC mode)

3. New Tables
  payable_instalment_lines
  - id (uuid PK)
  - criteria_id (uuid FK -> payable_criteria_mt, cascade delete)
  - seq (integer) — sequence number starting at 1
  - amount (numeric(14,2)) — instalment amount for this line
  - due_date_reference (text) — reference date key for computing due date
  - days_offset (integer) — offset from reference date for due date
  - created_at (timestamptz)

4. Security
- RLS enabled on payable_instalment_lines.
- SELECT: authenticated (all logged-in users can read).
- INSERT/UPDATE/DELETE: admin and manager roles only (via extensions.get_user_role()).
- Matches the pattern used by all other payable_*_specs tables.
*/

-- ── Add columns to payable_installment_specs ──────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payable_installment_specs' AND column_name = 'instalment_mode') THEN
    ALTER TABLE payable_installment_specs
      ADD COLUMN instalment_mode TEXT NOT NULL DEFAULT 'AUTO_CALC'
      CHECK (instalment_mode IN ('MANUAL_LINES','AUTO_CALC'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payable_installment_specs' AND column_name = 'instalment_count') THEN
    ALTER TABLE payable_installment_specs
      ADD COLUMN instalment_count INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payable_installment_specs' AND column_name = 'interval_days') THEN
    ALTER TABLE payable_installment_specs
      ADD COLUMN interval_days INTEGER NOT NULL DEFAULT 30;
  END IF;
END $$;

-- ── Create payable_instalment_lines table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS payable_instalment_lines (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criteria_id        UUID NOT NULL REFERENCES payable_criteria_mt(id) ON DELETE CASCADE,
  seq                INTEGER NOT NULL DEFAULT 1,
  amount             NUMERIC(14,2) NOT NULL DEFAULT 0,
  due_date_reference TEXT NOT NULL DEFAULT 'payable_generation_date',
  days_offset        INTEGER NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE payable_instalment_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pil_select_authenticated" ON payable_instalment_lines;
CREATE POLICY "pil_select_authenticated" ON payable_instalment_lines
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "pil_insert_admin_manager" ON payable_instalment_lines;
CREATE POLICY "pil_insert_admin_manager" ON payable_instalment_lines
  FOR INSERT TO authenticated WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "pil_update_admin_manager" ON payable_instalment_lines;
CREATE POLICY "pil_update_admin_manager" ON payable_instalment_lines
  FOR UPDATE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'))
  WITH CHECK (extensions.get_user_role() IN ('admin','manager'));

DROP POLICY IF EXISTS "pil_delete_admin_manager" ON payable_instalment_lines;
CREATE POLICY "pil_delete_admin_manager" ON payable_instalment_lines
  FOR DELETE TO authenticated USING (extensions.get_user_role() IN ('admin','manager'));

CREATE INDEX IF NOT EXISTS idx_pil_criteria ON payable_instalment_lines(criteria_id);
