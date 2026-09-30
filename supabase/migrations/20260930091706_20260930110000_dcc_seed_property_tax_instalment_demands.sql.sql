/*
# Seed 4 Property Tax Instalment Demands with Plans and Payment

## What this does
The TAX rule (criteria 368dd95c-3864-4c7f-8d11-3211df5f83ef) exists with 4 instalment
lines (Rs 11,250 each, offsets +15/+105/+195/+285 days) but ZERO demand rows exist
in `dcc_demands`. This migration:

1. Creates 4 Property Tax demand rows for object SEC-14/TYPE-II/42 (Rajesh Kumar)
2. Records a payment for the first demand (Rs 11,250 via NEFT on 2026-09-10)
3. Marks the first demand as PAID with amount_paid = 11,250
4. Creates a run log entry for the TAX auto-generation run
5. Creates runtime instalment plans + rows for all 4 demands

## Object/Owner
- Object: 26b3d754-fa26-438b-9a66-c0a9d445cc61 (SEC-14/TYPE-II/42, Type-II Quarter, Chandigarh)
- Owner: f156c252-25db-42e0-88da-e3b494721c82 (Rajesh Kumar)

## Criteria
- Criteria: 368dd95c-3864-4c7f-8d11-3211df5f83ef (TAX, PROPERTY_TAX)
- Demand type: f74fb695-704f-40b6-9c3b-1bc7aa1c20e9 (PROPERTY_TAX)
- Run date: 2026-09-01
- Instalment template: Rs 11,250 x 4, offsets +15/+105/+195/+285 days from run date
- Due dates: 2026-09-16, 2026-12-15, 2026-03-15, 2026-06-13

## Tables affected
- `dcc_demands` — 4 new rows
- `dcc_payments` — 1 new row (first demand payment)
- `dcc_demand_run_log` — 1 new row
- `dcc_installment_plans` — 4 new rows
- `dcc_installment_rows` — 8 new rows (Full Payment + 1 instalment per plan)

## Notes
- Idempotent: uses WHERE NOT EXISTS checks so re-running is safe.
- `remaining_amount` is a GENERATED ALWAYS column, so it is NOT inserted.
- No RLS changes needed — tables already have policies.
*/

-- ── Step 1: Insert 4 Property Tax demand rows ─────────────────────────────────
-- Run date: 2026-09-01, offsets: +15/+105/+195/+285 days
-- Due dates: 2026-09-16, 2026-12-15, 2026-03-15, 2026-06-13

INSERT INTO dcc_demands (id, object_id, owner_id, demand_type_id, criteria_id, demand_run_date, due_date, amount, amount_paid, status, generation_source, include_gst, gst_pct, gst_type, gst_amount)
SELECT 'a1b2c3d4-0001-4000-8000-000000000001', '26b3d754-fa26-438b-9a66-c0a9d445cc61', 'f156c252-25db-42e0-88da-e3b494721c82', 'f74fb695-704f-40b6-9c3b-1bc7aa1c20e9', '368dd95c-3864-4c7f-8d11-3211df5f83ef', '2026-09-01', '2026-09-16', 11250, 0, 'DUE', 'AUTO', false, 0, 'exclusive', 0
WHERE NOT EXISTS (SELECT 1 FROM dcc_demands WHERE id = 'a1b2c3d4-0001-4000-8000-000000000001');

INSERT INTO dcc_demands (id, object_id, owner_id, demand_type_id, criteria_id, demand_run_date, due_date, amount, amount_paid, status, generation_source, include_gst, gst_pct, gst_type, gst_amount)
SELECT 'a1b2c3d4-0001-4000-8000-000000000002', '26b3d754-fa26-438b-9a66-c0a9d445cc61', 'f156c252-25db-42e0-88da-e3b494721c82', 'f74fb695-704f-40b6-9c3b-1bc7aa1c20e9', '368dd95c-3864-4c7f-8d11-3211df5f83ef', '2026-09-01', '2026-12-15', 11250, 0, 'DUE', 'AUTO', false, 0, 'exclusive', 0
WHERE NOT EXISTS (SELECT 1 FROM dcc_demands WHERE id = 'a1b2c3d4-0001-4000-8000-000000000002');

INSERT INTO dcc_demands (id, object_id, owner_id, demand_type_id, criteria_id, demand_run_date, due_date, amount, amount_paid, status, generation_source, include_gst, gst_pct, gst_type, gst_amount)
SELECT 'a1b2c3d4-0001-4000-8000-000000000003', '26b3d754-fa26-438b-9a66-c0a9d445cc61', 'f156c252-25db-42e0-88da-e3b494721c82', 'f74fb695-704f-40b6-9c3b-1bc7aa1c20e9', '368dd95c-3864-4c7f-8d11-3211df5f83ef', '2026-09-01', '2027-03-15', 11250, 0, 'DUE', 'AUTO', false, 0, 'exclusive', 0
WHERE NOT EXISTS (SELECT 1 FROM dcc_demands WHERE id = 'a1b2c3d4-0001-4000-8000-000000000003');

INSERT INTO dcc_demands (id, object_id, owner_id, demand_type_id, criteria_id, demand_run_date, due_date, amount, amount_paid, status, generation_source, include_gst, gst_pct, gst_type, gst_amount)
SELECT 'a1b2c3d4-0001-4000-8000-000000000004', '26b3d754-fa26-438b-9a66-c0a9d445cc61', 'f156c252-25db-42e0-88da-e3b494721c82', 'f74fb695-704f-40b6-9c3b-1bc7aa1c20e9', '368dd95c-3864-4c7f-8d11-3211df5f83ef', '2026-09-01', '2027-06-13', 11250, 0, 'DUE', 'AUTO', false, 0, 'exclusive', 0
WHERE NOT EXISTS (SELECT 1 FROM dcc_demands WHERE id = 'a1b2c3d4-0001-4000-8000-000000000004');

-- ── Step 2: Record payment for first demand ───────────────────────────────────
INSERT INTO dcc_payments (demand_id, object_id, amount, payment_mode, payment_date, reference_number, remarks)
SELECT 'a1b2c3d4-0001-4000-8000-000000000001', '26b3d754-fa26-438b-9a66-c0a9d445cc61', 11250, 'NEFT', '2026-09-10', 'NEFT-PTAX-INST1-001', 'Property Tax Q1 instalment payment'
WHERE NOT EXISTS (
  SELECT 1 FROM dcc_payments WHERE demand_id = 'a1b2c3d4-0001-4000-8000-000000000001'
);

-- ── Step 3: Update first demand to PAID ───────────────────────────────────────
UPDATE dcc_demands
SET amount_paid = 11250, status = 'PAID', updated_at = now()
WHERE id = 'a1b2c3d4-0001-4000-8000-000000000001'
  AND status = 'DUE';

-- ── Step 4: Run log entry ─────────────────────────────────────────────────────
INSERT INTO dcc_demand_run_log (run_date, source, demand_type_id, records_created, total_amount, started_at, ended_at, duration_ms, run_summary)
SELECT '2026-09-01', 'AUTO', 'f74fb695-704f-40b6-9c3b-1bc7aa1c20e9', 4, 45000, '2026-09-01T06:00:00Z', '2026-09-01T06:00:05Z', 5000, '{"total_rows_input": 4, "object_count": 1, "criteria_id": "368dd95c-3864-4c7f-8d11-3211df5f83ef"}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM dcc_demand_run_log
  WHERE run_date = '2026-09-01'
    AND demand_type_id = 'f74fb695-704f-40b6-9c3b-1bc7aa1c20e9'
    AND source = 'AUTO'
);

-- ── Step 5: Instalment plans for all 4 TAX demands ────────────────────────────

-- Plan 1: First TAX demand (PAID)
INSERT INTO dcc_installment_plans (demand_id, no_of_installments, installment_start_date, late_fee, due_days_with_late_fee, interest_pct_pa, discount_full_payment_pct, gst_pct, gst_type, balance_payment, installments_paid, installments_due)
SELECT 'a1b2c3d4-0001-4000-8000-000000000001', 1, '2026-09-16', 0, 0, 0, 0, 0, 'inclusive', 11250, 1, 0
WHERE NOT EXISTS (
  SELECT 1 FROM dcc_installment_plans WHERE demand_id = 'a1b2c3d4-0001-4000-8000-000000000001'
);

INSERT INTO dcc_installment_rows (plan_id, row_number, label, percentage, amount, due_date, paid_date, paid_amt, status, late_fee, due_date_with_late_fee, gst_amount)
SELECT p.id, 0, 'Full Payment', 100, 11250, '2026-09-16', NULL, 0, 'PENDING', 0, NULL, 0
FROM dcc_installment_plans p
WHERE p.demand_id = 'a1b2c3d4-0001-4000-8000-000000000001'
  AND NOT EXISTS (SELECT 1 FROM dcc_installment_rows r WHERE r.plan_id = p.id AND r.row_number = 0);

INSERT INTO dcc_installment_rows (plan_id, row_number, label, percentage, amount, due_date, paid_date, paid_amt, status, late_fee, due_date_with_late_fee, gst_amount)
SELECT p.id, 1, 'Installment 1', 100, 11250, '2026-09-16', '2026-09-10', 11250, 'PAID', 0, NULL, 0
FROM dcc_installment_plans p
WHERE p.demand_id = 'a1b2c3d4-0001-4000-8000-000000000001'
  AND NOT EXISTS (SELECT 1 FROM dcc_installment_rows r WHERE r.plan_id = p.id AND r.row_number = 1);

-- Plan 2: Second TAX demand (DUE)
INSERT INTO dcc_installment_plans (demand_id, no_of_installments, installment_start_date, late_fee, due_days_with_late_fee, interest_pct_pa, discount_full_payment_pct, gst_pct, gst_type, balance_payment, installments_paid, installments_due)
SELECT 'a1b2c3d4-0001-4000-8000-000000000002', 1, '2026-12-15', 0, 0, 0, 0, 0, 'inclusive', 11250, 0, 1
WHERE NOT EXISTS (
  SELECT 1 FROM dcc_installment_plans WHERE demand_id = 'a1b2c3d4-0001-4000-8000-000000000002'
);

INSERT INTO dcc_installment_rows (plan_id, row_number, label, percentage, amount, due_date, paid_date, paid_amt, status, late_fee, due_date_with_late_fee, gst_amount)
SELECT p.id, 0, 'Full Payment', 100, 11250, '2026-12-15', NULL, 0, 'PENDING', 0, NULL, 0
FROM dcc_installment_plans p
WHERE p.demand_id = 'a1b2c3d4-0001-4000-8000-000000000002'
  AND NOT EXISTS (SELECT 1 FROM dcc_installment_rows r WHERE r.plan_id = p.id AND r.row_number = 0);

INSERT INTO dcc_installment_rows (plan_id, row_number, label, percentage, amount, due_date, paid_date, paid_amt, status, late_fee, due_date_with_late_fee, gst_amount)
SELECT p.id, 1, 'Installment 1', 100, 11250, '2026-12-15', NULL, 0, 'PENDING', 0, NULL, 0
FROM dcc_installment_plans p
WHERE p.demand_id = 'a1b2c3d4-0001-4000-8000-000000000002'
  AND NOT EXISTS (SELECT 1 FROM dcc_installment_rows r WHERE r.plan_id = p.id AND r.row_number = 1);

-- Plan 3: Third TAX demand (DUE)
INSERT INTO dcc_installment_plans (demand_id, no_of_installments, installment_start_date, late_fee, due_days_with_late_fee, interest_pct_pa, discount_full_payment_pct, gst_pct, gst_type, balance_payment, installments_paid, installments_due)
SELECT 'a1b2c3d4-0001-4000-8000-000000000003', 1, '2027-03-15', 0, 0, 0, 0, 0, 'inclusive', 11250, 0, 1
WHERE NOT EXISTS (
  SELECT 1 FROM dcc_installment_plans WHERE demand_id = 'a1b2c3d4-0001-4000-8000-000000000003'
);

INSERT INTO dcc_installment_rows (plan_id, row_number, label, percentage, amount, due_date, paid_date, paid_amt, status, late_fee, due_date_with_late_fee, gst_amount)
SELECT p.id, 0, 'Full Payment', 100, 11250, '2027-03-15', NULL, 0, 'PENDING', 0, NULL, 0
FROM dcc_installment_plans p
WHERE p.demand_id = 'a1b2c3d4-0001-4000-8000-000000000003'
  AND NOT EXISTS (SELECT 1 FROM dcc_installment_rows r WHERE r.plan_id = p.id AND r.row_number = 0);

INSERT INTO dcc_installment_rows (plan_id, row_number, label, percentage, amount, due_date, paid_date, paid_amt, status, late_fee, due_date_with_late_fee, gst_amount)
SELECT p.id, 1, 'Installment 1', 100, 11250, '2027-03-15', NULL, 0, 'PENDING', 0, NULL, 0
FROM dcc_installment_plans p
WHERE p.demand_id = 'a1b2c3d4-0001-4000-8000-000000000003'
  AND NOT EXISTS (SELECT 1 FROM dcc_installment_rows r WHERE r.plan_id = p.id AND r.row_number = 1);

-- Plan 4: Fourth TAX demand (DUE)
INSERT INTO dcc_installment_plans (demand_id, no_of_installments, installment_start_date, late_fee, due_days_with_late_fee, interest_pct_pa, discount_full_payment_pct, gst_pct, gst_type, balance_payment, installments_paid, installments_due)
SELECT 'a1b2c3d4-0001-4000-8000-000000000004', 1, '2027-06-13', 0, 0, 0, 0, 0, 'inclusive', 11250, 0, 1
WHERE NOT EXISTS (
  SELECT 1 FROM dcc_installment_plans WHERE demand_id = 'a1b2c3d4-0001-4000-8000-000000000004'
);

INSERT INTO dcc_installment_rows (plan_id, row_number, label, percentage, amount, due_date, paid_date, paid_amt, status, late_fee, due_date_with_late_fee, gst_amount)
SELECT p.id, 0, 'Full Payment', 100, 11250, '2027-06-13', NULL, 0, 'PENDING', 0, NULL, 0
FROM dcc_installment_plans p
WHERE p.demand_id = 'a1b2c3d4-0001-4000-8000-000000000004'
  AND NOT EXISTS (SELECT 1 FROM dcc_installment_rows r WHERE r.plan_id = p.id AND r.row_number = 0);

INSERT INTO dcc_installment_rows (plan_id, row_number, label, percentage, amount, due_date, paid_date, paid_amt, status, late_fee, due_date_with_late_fee, gst_amount)
SELECT p.id, 1, 'Installment 1', 100, 11250, '2027-06-13', NULL, 0, 'PENDING', 0, NULL, 0
FROM dcc_installment_plans p
WHERE p.demand_id = 'a1b2c3d4-0001-4000-8000-000000000004'
  AND NOT EXISTS (SELECT 1 FROM dcc_installment_rows r WHERE r.plan_id = p.id AND r.row_number = 1);
