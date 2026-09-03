-- Fix: Insert missing installment rows using gen_random_uuid() to avoid UUID conflicts

-- Delete the partial LOAN rows that did get inserted (we'll re-insert all)
DELETE FROM dcc_installment_rows WHERE plan_id = 'e4440030-0000-0000-0000-000000000020';

-- LOAN rows (5 rows: Full Payment + 4 installments)
INSERT INTO dcc_installment_rows (id, plan_id, row_number, label, percentage, amount, due_date, due_date_with_late_fee, late_fee, gst_amount, paid_amt, paid_date, status)
SELECT gen_random_uuid(), 'e4440030-0000-0000-0000-000000000020', row_number, label, percentage, amount, due_date, due_date_with_late_fee, late_fee, gst_amount, paid_amt, paid_date, status
FROM (VALUES
  (0, 'Full Payment (2% discount)', 100, 49000.00, '2026-09-05'::date, NULL::date, 0.00, 0.00, 0.00, NULL::date, 'DUE'),
  (1, 'Q1 — Sep 2026', 25, 12500.00, '2026-09-05'::date, '2026-09-20'::date, 500.00, 0.00, 0.00, NULL::date, 'DUE'),
  (2, 'Q2 — Dec 2026', 25, 12500.00, '2026-12-05'::date, '2026-12-20'::date, 500.00, 0.00, 0.00, NULL::date, 'PENDING'),
  (3, 'Q3 — Mar 2027', 25, 12500.00, '2027-03-05'::date, '2027-03-20'::date, 500.00, 0.00, 0.00, NULL::date, 'PENDING'),
  (4, 'Q4 — Jun 2027', 25, 12500.00, '2027-06-05'::date, '2027-06-20'::date, 500.00, 0.00, 0.00, NULL::date, 'PENDING')
) AS t(row_number, label, percentage, amount, due_date, due_date_with_late_fee, late_fee, gst_amount, paid_amt, paid_date, status);

-- SD rows (3 rows: Full Payment + 2 installments)
INSERT INTO dcc_installment_rows (id, plan_id, row_number, label, percentage, amount, due_date, due_date_with_late_fee, late_fee, gst_amount, paid_amt, paid_date, status)
SELECT gen_random_uuid(), 'e4440030-0000-0000-0000-000000000021', row_number, label, percentage, amount, due_date, due_date_with_late_fee, late_fee, gst_amount, paid_amt, paid_date, status
FROM (VALUES
  (0, 'Full Payment', 100, 25000.00, '2026-07-30'::date, '2026-08-09'::date, 250.00, 0.00, 0.00, NULL::date, 'OVERDUE'),
  (1, '1st Installment — Jul 2026', 50, 12500.00, '2026-07-30'::date, '2026-08-09'::date, 250.00, 0.00, 0.00, NULL::date, 'OVERDUE'),
  (2, '2nd Installment — Aug 2026', 50, 12500.00, '2026-08-30'::date, NULL::date, 0.00, 0.00, 0.00, NULL::date, 'PENDING')
) AS t(row_number, label, percentage, amount, due_date, due_date_with_late_fee, late_fee, gst_amount, paid_amt, paid_date, status);

-- ADVANCE rows (2 rows: Full Payment + 1 installment, all PAID)
INSERT INTO dcc_installment_rows (id, plan_id, row_number, label, percentage, amount, due_date, due_date_with_late_fee, late_fee, gst_amount, paid_amt, paid_date, status)
SELECT gen_random_uuid(), 'e4440030-0000-0000-0000-000000000022', row_number, label, percentage, amount, due_date, due_date_with_late_fee, late_fee, gst_amount, paid_amt, paid_date, status
FROM (VALUES
  (0, 'Full Payment', 100, 15000.00, '2026-06-15'::date, NULL::date, 0.00, 0.00, 15000.00, '2026-06-10'::date, 'PAID'),
  (1, 'Single Payment', 100, 15000.00, '2026-06-15'::date, NULL::date, 0.00, 0.00, 15000.00, '2026-06-10'::date, 'PAID')
) AS t(row_number, label, percentage, amount, due_date, due_date_with_late_fee, late_fee, gst_amount, paid_amt, paid_date, status);

-- MAINTENANCE EXEMPTED rows (2 rows: Full Payment + 1 installment, EXEMPTED)
INSERT INTO dcc_installment_rows (id, plan_id, row_number, label, percentage, amount, due_date, due_date_with_late_fee, late_fee, gst_amount, paid_amt, paid_date, status)
SELECT gen_random_uuid(), 'e4440030-0000-0000-0000-000000000023', row_number, label, percentage, amount, due_date, due_date_with_late_fee, late_fee, gst_amount, paid_amt, paid_date, status
FROM (VALUES
  (0, 'Full Payment', 100, 1200.00, '2026-08-10'::date, NULL::date, 0.00, 0.00, 0.00, NULL::date, 'EXEMPTED'),
  (1, 'Single Payment', 100, 1200.00, '2026-08-10'::date, NULL::date, 0.00, 0.00, 0.00, NULL::date, 'EXEMPTED')
) AS t(row_number, label, percentage, amount, due_date, due_date_with_late_fee, late_fee, gst_amount, paid_amt, paid_date, status);
