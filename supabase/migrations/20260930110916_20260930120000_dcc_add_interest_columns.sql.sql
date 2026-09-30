/*
# Add Interest % and Defaulted Interest % to Rule + Runtime Tables

## What this does
Adds interest_pct and defaulted_interest_pct columns to:
- payable_penalty_slabs (rule-level, for single-payment scenario in penalty section)
- payable_instalment_lines (rule-level, per-line for instalment scenario)
- dcc_demands (runtime, each generated demand carries its interest config)
- dcc_installment_rows (runtime, each instalment row carries its interest)

Also adds interest_basis to payable_criteria_mt:
- 'demand_amount' (default) = interest applied to THAT demand amount only
- 'outstanding_amount' = interest applied to total outstanding amount

And adds defaulted_interest_pct to dcc_installment_plans (runtime plan level).

All columns are additive with defaults — no data loss.
*/

-- ── Rule-level: payable_criteria_mt ───────────────────────────────────────────
ALTER TABLE payable_criteria_mt
  ADD COLUMN IF NOT EXISTS interest_basis TEXT NOT NULL DEFAULT 'demand_amount'
    CHECK (interest_basis IN ('demand_amount', 'outstanding_amount'));

-- ── Rule-level: payable_penalty_slabs ─────────────────────────────────────────
ALTER TABLE payable_penalty_slabs
  ADD COLUMN IF NOT EXISTS interest_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS defaulted_interest_pct NUMERIC(6,2) NOT NULL DEFAULT 0;

-- ── Rule-level: payable_instalment_lines ──────────────────────────────────────
ALTER TABLE payable_instalment_lines
  ADD COLUMN IF NOT EXISTS interest_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS defaulted_interest_pct NUMERIC(6,2) NOT NULL DEFAULT 0;

-- ── Runtime: dcc_demands ──────────────────────────────────────────────────────
ALTER TABLE dcc_demands
  ADD COLUMN IF NOT EXISTS interest_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS defaulted_interest_pct NUMERIC(6,2) NOT NULL DEFAULT 0;

-- ── Runtime: dcc_installment_plans ────────────────────────────────────────────
ALTER TABLE dcc_installment_plans
  ADD COLUMN IF NOT EXISTS defaulted_interest_pct NUMERIC(6,2) NOT NULL DEFAULT 0;

-- ── Runtime: dcc_installment_rows ─────────────────────────────────────────────
ALTER TABLE dcc_installment_rows
  ADD COLUMN IF NOT EXISTS interest_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS defaulted_interest_pct NUMERIC(6,2) NOT NULL DEFAULT 0;
