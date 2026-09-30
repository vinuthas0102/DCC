/*
# Seed LOAN Instalment Plans for 4 Existing Loan Demands

## What this does
The 4 LOAN demand rows already exist in `dcc_demands` with correct amounts, due dates,
and one payment on the first demand. However, the runtime instalment plan tables
(`dcc_installment_plans` and `dcc_installment_rows`) are empty for these demands.
This migration creates a runtime instalment plan for each LOAN demand so the
"Due Demand" tab on the demand detail page shows the instalment schedule.

## Demand details
- 956d393c-1b9a-4152-a34d-bf60a3449331 (due 2026-09-15, PAID, Rs 25,000) — payment already exists
- e36ab9b9-8d27-46ba-8d9c-bdf4613b9273 (due 2026-10-15, DUE, Rs 25,000)
- d65e8e86-d8df-406b-8520-604992508eb1 (due 2026-11-15, DUE, Rs 25,000)
- 7f41b01b-7410-4b60-8b90-3f443342ad20 (due 2026-12-15, DUE, Rs 27,200)

## Tables affected
- `dcc_installment_plans` — 4 new rows (one per demand)
- `dcc_installment_rows` — 8 new rows (Full Payment + 1 instalment per plan)

## Notes
- Idempotent: uses WHERE NOT EXISTS checks so re-running is safe.
- First demand's instalment row is marked PAID with paid_date and paid_amt.
- `remaining_amount` is a GENERATED ALWAYS column (amount - paid_amt), so it is NOT inserted.
- No RLS changes needed — tables already have policies.
*/

-- ── Plan 1: First LOAN demand (PAID) ──────────────────────────────────────────
INSERT INTO dcc_installment_plans (demand_id, no_of_installments, installment_start_date, late_fee, due_days_with_late_fee, interest_pct_pa, discount_full_payment_pct, gst_pct, gst_type, balance_payment, installments_paid, installments_due)
SELECT '956d393c-1b9a-4152-a34d-bf60a3449331', 1, '2026-09-15', 0, 0, 0, 0, 0, 'inclusive', 25000, 1, 0
WHERE NOT EXISTS (
  SELECT 1 FROM dcc_installment_plans WHERE demand_id = '956d393c-1b9a-4152-a34d-bf60a3449331'
);

INSERT INTO dcc_installment_rows (plan_id, row_number, label, percentage, amount, due_date, paid_date, paid_amt, status, late_fee, due_date_with_late_fee, gst_amount)
SELECT p.id, 0, 'Full Payment', 100, 25000, '2026-09-15', NULL, 0, 'PENDING', 0, NULL, 0
FROM dcc_installment_plans p
WHERE p.demand_id = '956d393c-1b9a-4152-a34d-bf60a3449331'
  AND NOT EXISTS (SELECT 1 FROM dcc_installment_rows r WHERE r.plan_id = p.id AND r.row_number = 0);

INSERT INTO dcc_installment_rows (plan_id, row_number, label, percentage, amount, due_date, paid_date, paid_amt, status, late_fee, due_date_with_late_fee, gst_amount)
SELECT p.id, 1, 'Installment 1', 100, 25000, '2026-09-15', '2026-09-10', 25000, 'PAID', 0, NULL, 0
FROM dcc_installment_plans p
WHERE p.demand_id = '956d393c-1b9a-4152-a34d-bf60a3449331'
  AND NOT EXISTS (SELECT 1 FROM dcc_installment_rows r WHERE r.plan_id = p.id AND r.row_number = 1);

-- ── Plan 2: Second LOAN demand (DUE) ──────────────────────────────────────────
INSERT INTO dcc_installment_plans (demand_id, no_of_installments, installment_start_date, late_fee, due_days_with_late_fee, interest_pct_pa, discount_full_payment_pct, gst_pct, gst_type, balance_payment, installments_paid, installments_due)
SELECT 'e36ab9b9-8d27-46ba-8d9c-bdf4613b9273', 1, '2026-10-15', 0, 0, 0, 0, 0, 'inclusive', 25000, 0, 1
WHERE NOT EXISTS (
  SELECT 1 FROM dcc_installment_plans WHERE demand_id = 'e36ab9b9-8d27-46ba-8d9c-bdf4613b9273'
);

INSERT INTO dcc_installment_rows (plan_id, row_number, label, percentage, amount, due_date, paid_date, paid_amt, status, late_fee, due_date_with_late_fee, gst_amount)
SELECT p.id, 0, 'Full Payment', 100, 25000, '2026-10-15', NULL, 0, 'PENDING', 0, NULL, 0
FROM dcc_installment_plans p
WHERE p.demand_id = 'e36ab9b9-8d27-46ba-8d9c-bdf4613b9273'
  AND NOT EXISTS (SELECT 1 FROM dcc_installment_rows r WHERE r.plan_id = p.id AND r.row_number = 0);

INSERT INTO dcc_installment_rows (plan_id, row_number, label, percentage, amount, due_date, paid_date, paid_amt, status, late_fee, due_date_with_late_fee, gst_amount)
SELECT p.id, 1, 'Installment 1', 100, 25000, '2026-10-15', NULL, 0, 'PENDING', 0, NULL, 0
FROM dcc_installment_plans p
WHERE p.demand_id = 'e36ab9b9-8d27-46ba-8d9c-bdf4613b9273'
  AND NOT EXISTS (SELECT 1 FROM dcc_installment_rows r WHERE r.plan_id = p.id AND r.row_number = 1);

-- ── Plan 3: Third LOAN demand (DUE) ───────────────────────────────────────────
INSERT INTO dcc_installment_plans (demand_id, no_of_installments, installment_start_date, late_fee, due_days_with_late_fee, interest_pct_pa, discount_full_payment_pct, gst_pct, gst_type, balance_payment, installments_paid, installments_due)
SELECT 'd65e8e86-d8df-406b-8520-604992508eb1', 1, '2026-11-15', 0, 0, 0, 0, 0, 'inclusive', 25000, 0, 1
WHERE NOT EXISTS (
  SELECT 1 FROM dcc_installment_plans WHERE demand_id = 'd65e8e86-d8df-406b-8520-604992508eb1'
);

INSERT INTO dcc_installment_rows (plan_id, row_number, label, percentage, amount, due_date, paid_date, paid_amt, status, late_fee, due_date_with_late_fee, gst_amount)
SELECT p.id, 0, 'Full Payment', 100, 25000, '2026-11-15', NULL, 0, 'PENDING', 0, NULL, 0
FROM dcc_installment_plans p
WHERE p.demand_id = 'd65e8e86-d8df-406b-8520-604992508eb1'
  AND NOT EXISTS (SELECT 1 FROM dcc_installment_rows r WHERE r.plan_id = p.id AND r.row_number = 0);

INSERT INTO dcc_installment_rows (plan_id, row_number, label, percentage, amount, due_date, paid_date, paid_amt, status, late_fee, due_date_with_late_fee, gst_amount)
SELECT p.id, 1, 'Installment 1', 100, 25000, '2026-11-15', NULL, 0, 'PENDING', 0, NULL, 0
FROM dcc_installment_plans p
WHERE p.demand_id = 'd65e8e86-d8df-406b-8520-604992508eb1'
  AND NOT EXISTS (SELECT 1 FROM dcc_installment_rows r WHERE r.plan_id = p.id AND r.row_number = 1);

-- ── Plan 4: Fourth LOAN demand (DUE, different amount) ─────────────────────────
INSERT INTO dcc_installment_plans (demand_id, no_of_installments, installment_start_date, late_fee, due_days_with_late_fee, interest_pct_pa, discount_full_payment_pct, gst_pct, gst_type, balance_payment, installments_paid, installments_due)
SELECT '7f41b01b-7410-4b60-8b90-3f443342ad20', 1, '2026-12-15', 0, 0, 0, 0, 0, 'inclusive', 27200, 0, 1
WHERE NOT EXISTS (
  SELECT 1 FROM dcc_installment_plans WHERE demand_id = '7f41b01b-7410-4b60-8b90-3f443342ad20'
);

INSERT INTO dcc_installment_rows (plan_id, row_number, label, percentage, amount, due_date, paid_date, paid_amt, status, late_fee, due_date_with_late_fee, gst_amount)
SELECT p.id, 0, 'Full Payment', 100, 27200, '2026-12-15', NULL, 0, 'PENDING', 0, NULL, 0
FROM dcc_installment_plans p
WHERE p.demand_id = '7f41b01b-7410-4b60-8b90-3f443342ad20'
  AND NOT EXISTS (SELECT 1 FROM dcc_installment_rows r WHERE r.plan_id = p.id AND r.row_number = 0);

INSERT INTO dcc_installment_rows (plan_id, row_number, label, percentage, amount, due_date, paid_date, paid_amt, status, late_fee, due_date_with_late_fee, gst_amount)
SELECT p.id, 1, 'Installment 1', 100, 27200, '2026-12-15', NULL, 0, 'PENDING', 0, NULL, 0
FROM dcc_installment_plans p
WHERE p.demand_id = '7f41b01b-7410-4b60-8b90-3f443342ad20'
  AND NOT EXISTS (SELECT 1 FROM dcc_installment_rows r WHERE r.plan_id = p.id AND r.row_number = 1);
