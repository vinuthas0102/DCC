-- Fix: Insert installment plans with NEW UUIDs (previous UUIDs already existed for other demands)

-- LOAN plan (₹50,000, 4 installments)
INSERT INTO dcc_installment_plans (id, demand_id, no_of_installments, installment_start_date, late_fee, due_days_with_late_fee, interest_pct_pa, discount_full_payment_pct, gst_pct, gst_type, balance_payment, installments_paid, installments_due)
VALUES (
  'e4440030-0000-0000-0000-000000000020',
  'd3330000-0000-0000-0000-000000000080',
  4, '2026-09-05', 500.00, 15, 8.00, 2.00, 0.00, 'inclusive', 50000.00, 0, 4
) ON CONFLICT (id) DO NOTHING;

-- SD plan (₹25,000, 2 installments)
INSERT INTO dcc_installment_plans (id, demand_id, no_of_installments, installment_start_date, late_fee, due_days_with_late_fee, interest_pct_pa, discount_full_payment_pct, gst_pct, gst_type, balance_payment, installments_paid, installments_due)
VALUES (
  'e4440030-0000-0000-0000-000000000021',
  'd3330000-0000-0000-0000-000000000081',
  2, '2026-07-30', 250.00, 10, 0.00, 0.00, 0.00, 'inclusive', 25000.00, 0, 2
) ON CONFLICT (id) DO NOTHING;

-- ADVANCE plan (₹15,000, 1 installment, fully paid)
INSERT INTO dcc_installment_plans (id, demand_id, no_of_installments, installment_start_date, late_fee, due_days_with_late_fee, interest_pct_pa, discount_full_payment_pct, gst_pct, gst_type, balance_payment, installments_paid, installments_due)
VALUES (
  'e4440030-0000-0000-0000-000000000022',
  'd3330000-0000-0000-0000-000000000082',
  1, '2026-06-15', 0.00, 0, 0.00, 0.00, 0.00, 'inclusive', 15000.00, 1, 0
) ON CONFLICT (id) DO NOTHING;

-- MAINTENANCE EXEMPTED plan (₹1,200, 1 installment, exempted)
INSERT INTO dcc_installment_plans (id, demand_id, no_of_installments, installment_start_date, late_fee, due_days_with_late_fee, interest_pct_pa, discount_full_payment_pct, gst_pct, gst_type, balance_payment, installments_paid, installments_due)
VALUES (
  'e4440030-0000-0000-0000-000000000023',
  'd3330000-0000-0000-0000-000000000083',
  1, '2026-08-10', 0.00, 0, 0.00, 0.00, 0.00, 'inclusive', 1200.00, 0, 1
) ON CONFLICT (id) DO NOTHING;

-- ── Insert installment rows with matching new plan UUIDs ───────────────────────

-- LOAN rows
INSERT INTO dcc_installment_rows (id, plan_id, row_number, label, percentage, amount, due_date, due_date_with_late_fee, late_fee, gst_amount, paid_amt, paid_date, status)
VALUES
  ('f5550030-0000-0000-0000-000000000000', 'e4440030-0000-0000-0000-000000000020', 0, 'Full Payment (2% discount)', 100, 49000.00, '2026-09-05', null, 0.00, 0.00, 0.00, null, 'DUE'),
  ('f5550030-0000-0000-0000-000000000001', 'e4440030-0000-0000-0000-000000000020', 1, 'Q1 — Sep 2026', 25, 12500.00, '2026-09-05', '2026-09-20', 500.00, 0.00, 0.00, null, 'DUE'),
  ('f5550030-0000-0000-0000-000000000002', 'e4440030-0000-0000-0000-000000000020', 2, 'Q2 — Dec 2026', 25, 12500.00, '2026-12-05', '2026-12-20', 500.00, 0.00, 0.00, null, 'PENDING'),
  ('f5550030-0000-0000-0000-000000000003', 'e4440030-0000-0000-0000-000000000020', 3, 'Q3 — Mar 2027', 25, 12500.00, '2027-03-05', '2027-03-20', 500.00, 0.00, 0.00, null, 'PENDING'),
  ('f5550030-0000-0000-0000-000000000004', 'e4440030-0000-0000-0000-000000000020', 4, 'Q4 — Jun 2027', 25, 12500.00, '2027-06-05', '2027-06-20', 500.00, 0.00, 0.00, null, 'PENDING')
ON CONFLICT (id) DO NOTHING;

-- SD rows
INSERT INTO dcc_installment_rows (id, plan_id, row_number, label, percentage, amount, due_date, due_date_with_late_fee, late_fee, gst_amount, paid_amt, paid_date, status)
VALUES
  ('f5550031-0000-0000-0000-000000000000', 'e4440030-0000-0000-0000-000000000021', 0, 'Full Payment', 100, 25000.00, '2026-07-30', '2026-08-09', 250.00, 0.00, 0.00, null, 'OVERDUE'),
  ('f5550031-0000-0000-0000-000000000001', 'e4440030-0000-0000-0000-000000000021', 1, '1st Installment — Jul 2026', 50, 12500.00, '2026-07-30', '2026-08-09', 250.00, 0.00, 0.00, null, 'OVERDUE'),
  ('f5550031-0000-0000-0000-000000000002', 'e4440030-0000-0000-0000-000000000021', 2, '2nd Installment — Aug 2026', 50, 12500.00, '2026-08-30', null, 0.00, 0.00, 0.00, null, 'PENDING')
ON CONFLICT (id) DO NOTHING;

-- ADVANCE rows (all PAID)
INSERT INTO dcc_installment_rows (id, plan_id, row_number, label, percentage, amount, due_date, due_date_with_late_fee, late_fee, gst_amount, paid_amt, paid_date, status)
VALUES
  ('f5550032-0000-0000-0000-000000000000', 'e4440030-0000-0000-0000-000000000022', 0, 'Full Payment', 100, 15000.00, '2026-06-15', null, 0.00, 0.00, 15000.00, '2026-06-10', 'PAID'),
  ('f5550032-0000-0000-0000-000000000001', 'e4440030-0000-0000-0000-000000000022', 1, 'Single Payment', 100, 15000.00, '2026-06-15', null, 0.00, 0.00, 15000.00, '2026-06-10', 'PAID')
ON CONFLICT (id) DO NOTHING;

-- MAINTENANCE EXEMPTED rows
INSERT INTO dcc_installment_rows (id, plan_id, row_number, label, percentage, amount, due_date, due_date_with_late_fee, late_fee, gst_amount, paid_amt, paid_date, status)
VALUES
  ('f5550033-0000-0000-0000-000000000000', 'e4440030-0000-0000-0000-000000000023', 0, 'Full Payment', 100, 1200.00, '2026-08-10', null, 0.00, 0.00, 0.00, null, 'EXEMPTED'),
  ('f5550033-0000-0000-0000-000000000001', 'e4440030-0000-0000-0000-000000000023', 1, 'Single Payment', 100, 1200.00, '2026-08-10', null, 0.00, 0.00, 0.00, null, 'EXEMPTED')
ON CONFLICT (id) DO NOTHING;
