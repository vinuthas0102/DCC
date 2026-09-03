-- Add missing demand types (LOAN, SD, ADVANCE) and an EXEMPTED demand for govt official (Rajesh Kumar)
-- This ensures the govt official can demonstrate all 7 demand types with relevant statuses

-- ── 0. Extend installment row status constraint to include EXEMPTED ─────────────
ALTER TABLE dcc_installment_rows DROP CONSTRAINT IF EXISTS dcc_installment_rows_status_check;
ALTER TABLE dcc_installment_rows ADD CONSTRAINT dcc_installment_rows_status_check
  CHECK (status = ANY (ARRAY['PAID'::text, 'DUE'::text, 'PENDING'::text, 'OVERDUE'::text, 'EXEMPTED'::text]));

-- ── 1. Insert new demands for Rajesh Kumar ─────────────────────────────────────
-- owner_id: e994a47e-bed9-4c0c-a443-f68c266bca51
-- object_id: fad04fce-1f0b-46d6-8863-f859da1fbdf0

-- LOAN demand — DUE status (₹50,000 loan instalment)
INSERT INTO dcc_demands (id, object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
VALUES (
  'd3330000-0000-0000-0000-000000000080',
  'fad04fce-1f0b-46d6-8863-f859da1fbdf0',
  'e994a47e-bed9-4c0c-a443-f68c266bca51',
  'd49fd9db-7f63-4ffe-9bce-8926655d6b90',
  '2026-08-01', '2026-09-05', 50000.00, 0.00, 'DUE', 'AUTO'
) ON CONFLICT (id) DO NOTHING;

-- SD (Security Deposit) — OVERDUE status (₹25,000)
INSERT INTO dcc_demands (id, object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
VALUES (
  'd3330000-0000-0000-0000-000000000081',
  'fad04fce-1f0b-46d6-8863-f859da1fbdf0',
  'e994a47e-bed9-4c0c-a443-f68c266bca51',
  '6c6aec26-0a5a-4fbc-8e7a-410c9c1f7204',
  '2026-06-01', '2026-07-30', 25000.00, 0.00, 'OVERDUE', 'AUTO'
) ON CONFLICT (id) DO NOTHING;

-- ADVANCE — PAID status (₹15,000 advance, fully paid)
INSERT INTO dcc_demands (id, object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
VALUES (
  'd3330000-0000-0000-0000-000000000082',
  'fad04fce-1f0b-46d6-8863-f859da1fbdf0',
  'e994a47e-bed9-4c0c-a443-f68c266bca51',
  '62a929c9-1ffc-4774-986b-430accdbac33',
  '2026-05-01', '2026-06-15', 15000.00, 15000.00, 'PAID', 'AUTO'
) ON CONFLICT (id) DO NOTHING;

-- MAINTENANCE — EXEMPTED status (₹1,200, exempted)
INSERT INTO dcc_demands (id, object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
VALUES (
  'd3330000-0000-0000-0000-000000000083',
  'fad04fce-1f0b-46d6-8863-f859da1fbdf0',
  'e994a47e-bed9-4c0c-a443-f68c266bca51',
  'aacbfa56-6bc3-4850-bd7b-fcbc73085ac6',
  '2026-07-01', '2026-08-10', 1200.00, 0.00, 'EXEMPTED', 'AUTO'
) ON CONFLICT (id) DO NOTHING;

-- ── 2. Insert installment plans for new demands ───────────────────────────────

INSERT INTO dcc_installment_plans (id, demand_id, no_of_installments, installment_start_date, late_fee, due_days_with_late_fee, interest_pct_pa, discount_full_payment_pct, gst_pct, gst_type, balance_payment, installments_paid, installments_due)
VALUES
  ('e4440000-0000-0000-0000-000000000020', 'd3330000-0000-0000-0000-000000000080', 4, '2026-09-05', 500.00, 15, 8.00, 2.00, 0.00, 'inclusive', 50000.00, 0, 4),
  ('e4440000-0000-0000-0000-000000000021', 'd3330000-0000-0000-0000-000000000081', 2, '2026-07-30', 250.00, 10, 0.00, 0.00, 0.00, 'inclusive', 25000.00, 0, 2),
  ('e4440000-0000-0000-0000-000000000022', 'd3330000-0000-0000-0000-000000000082', 1, '2026-06-15', 0.00, 0, 0.00, 0.00, 0.00, 'inclusive', 15000.00, 1, 0),
  ('e4440000-0000-0000-0000-000000000023', 'd3330000-0000-0000-0000-000000000083', 1, '2026-08-10', 0.00, 0, 0.00, 0.00, 0.00, 'inclusive', 1200.00, 0, 1)
ON CONFLICT (id) DO NOTHING;

-- ── 3. Insert installment rows for new plans ───────────────────────────────────
-- NOTE: remaining_amount is a generated column (amount - paid_amt), must NOT be inserted

-- LOAN rows: Full Payment + 4 installments, all DUE/PENDING
INSERT INTO dcc_installment_rows (id, plan_id, row_number, label, percentage, amount, due_date, due_date_with_late_fee, late_fee, gst_amount, paid_amt, paid_date, status)
VALUES
  ('f5550020-0000-0000-0000-000000000000', 'e4440000-0000-0000-0000-000000000020', 0, 'Full Payment (2% discount)', 100, 49000.00, '2026-09-05', null, 0.00, 0.00, 0.00, null, 'DUE'),
  ('f5550020-0000-0000-0000-000000000001', 'e4440000-0000-0000-0000-000000000020', 1, 'Q1 — Sep 2026', 25, 12500.00, '2026-09-05', '2026-09-20', 500.00, 0.00, 0.00, null, 'DUE'),
  ('f5550020-0000-0000-0000-000000000002', 'e4440000-0000-0000-0000-000000000020', 2, 'Q2 — Dec 2026', 25, 12500.00, '2026-12-05', '2026-12-20', 500.00, 0.00, 0.00, null, 'PENDING'),
  ('f5550020-0000-0000-0000-000000000003', 'e4440000-0000-0000-0000-000000000020', 3, 'Q3 — Mar 2027', 25, 12500.00, '2027-03-05', '2027-03-20', 500.00, 0.00, 0.00, null, 'PENDING'),
  ('f5550020-0000-0000-0000-000000000004', 'e4440000-0000-0000-0000-000000000020', 4, 'Q4 — Jun 2027', 25, 12500.00, '2027-06-05', '2027-06-20', 500.00, 0.00, 0.00, null, 'PENDING')
ON CONFLICT (id) DO NOTHING;

-- SD rows: Full Payment + 2 installments, all OVERDUE/PENDING
INSERT INTO dcc_installment_rows (id, plan_id, row_number, label, percentage, amount, due_date, due_date_with_late_fee, late_fee, gst_amount, paid_amt, paid_date, status)
VALUES
  ('f5550021-0000-0000-0000-000000000000', 'e4440000-0000-0000-0000-000000000021', 0, 'Full Payment', 100, 25000.00, '2026-07-30', '2026-08-09', 250.00, 0.00, 0.00, null, 'OVERDUE'),
  ('f5550021-0000-0000-0000-000000000001', 'e4440000-0000-0000-0000-000000000021', 1, '1st Installment — Jul 2026', 50, 12500.00, '2026-07-30', '2026-08-09', 250.00, 0.00, 0.00, null, 'OVERDUE'),
  ('f5550021-0000-0000-0000-000000000002', 'e4440000-0000-0000-0000-000000000021', 2, '2nd Installment — Aug 2026', 50, 12500.00, '2026-08-30', null, 0.00, 0.00, 0.00, null, 'PENDING')
ON CONFLICT (id) DO NOTHING;

-- ADVANCE rows: Full Payment + 1 installment, all PAID
INSERT INTO dcc_installment_rows (id, plan_id, row_number, label, percentage, amount, due_date, due_date_with_late_fee, late_fee, gst_amount, paid_amt, paid_date, status)
VALUES
  ('f5550022-0000-0000-0000-000000000000', 'e4440000-0000-0000-0000-000000000022', 0, 'Full Payment', 100, 15000.00, '2026-06-15', null, 0.00, 0.00, 15000.00, '2026-06-10', 'PAID'),
  ('f5550022-0000-0000-0000-000000000001', 'e4440000-0000-0000-0000-000000000022', 1, 'Single Payment', 100, 15000.00, '2026-06-15', null, 0.00, 0.00, 15000.00, '2026-06-10', 'PAID')
ON CONFLICT (id) DO NOTHING;

-- MAINTENANCE EXEMPTED rows: Full Payment + 1 installment, EXEMPTED
INSERT INTO dcc_installment_rows (id, plan_id, row_number, label, percentage, amount, due_date, due_date_with_late_fee, late_fee, gst_amount, paid_amt, paid_date, status)
VALUES
  ('f5550023-0000-0000-0000-000000000000', 'e4440000-0000-0000-0000-000000000023', 0, 'Full Payment', 100, 1200.00, '2026-08-10', null, 0.00, 0.00, 0.00, null, 'EXEMPTED'),
  ('f5550023-0000-0000-0000-000000000001', 'e4440000-0000-0000-0000-000000000023', 1, 'Single Payment', 100, 1200.00, '2026-08-10', null, 0.00, 0.00, 0.00, null, 'EXEMPTED')
ON CONFLICT (id) DO NOTHING;
