-- Add ELECTRICITY demand type and seed demo demands with installment plans

-- 1. Insert the new demand type
INSERT INTO dcc_demand_types (id, code, label, description, is_active)
VALUES ('e6600000-0000-0000-0000-000000000001', 'ELECTRICITY', 'Electricity', 'Monthly electricity charges', true)
ON CONFLICT (code) DO NOTHING;

-- 2. Seed 3 electricity demands across both property objects with mixed statuses
INSERT INTO dcc_demands (id, object_id, owner_id, demand_type_id, amount, amount_paid, due_date, demand_run_date, status, created_at, updated_at)
VALUES
  ('d7700000-0000-0000-0000-000000000001',
   '26b3d754-fa26-438b-9a66-c0a9d445cc61',
   'f156c252-25db-42e0-88da-e3b494721c82',
   'e6600000-0000-0000-0000-000000000001',
   2800.00, 0, '2026-09-15', '2026-09-01', 'DUE', now(), now()),

  ('d7700000-0000-0000-0000-000000000002',
   '89f95023-d7fe-4fec-89fa-29c3d4576c39',
   'd20c5942-79bd-4802-b2ea-650c8644fcfc',
   'e6600000-0000-0000-0000-000000000001',
   3400.00, 0, '2026-08-01', '2026-08-01', 'OVERDUE', now(), now()),

  ('d7700000-0000-0000-0000-000000000003',
   '26b3d754-fa26-438b-9a66-c0a9d445cc61',
   'f156c252-25db-42e0-88da-e3b494721c82',
   'e6600000-0000-0000-0000-000000000001',
   2200.00, 2200.00, '2026-07-15', '2026-07-01', 'PAID', now(), now())
ON CONFLICT (id) DO NOTHING;

-- 3. Seed installment plans for the 3 electricity demands
INSERT INTO dcc_installment_plans (id, demand_id, no_of_installments, installment_start_date, late_fee, due_days_with_late_fee, interest_pct_pa, discount_full_payment_pct, gst_pct, gst_type, balance_payment, installments_paid, installments_due)
VALUES
  ('e7700000-0000-0000-0000-000000000001', 'd7700000-0000-0000-0000-000000000001', 2, '2026-09-01', 50, 15, 0, 0, 0, 'inclusive', 2800, 0, 2),
  ('e7700000-0000-0000-0000-000000000002', 'd7700000-0000-0000-0000-000000000002', 2, '2026-08-01', 50, 15, 0, 0, 0, 'inclusive', 3400, 0, 2),
  ('e7700000-0000-0000-0000-000000000003', 'd7700000-0000-0000-0000-000000000003', 2, '2026-07-01', 50, 15, 0, 0, 0, 'inclusive', 2200, 2, 0)
ON CONFLICT (id) DO NOTHING;

-- 4. Seed installment rows (Full Payment + 2 instalments each)
INSERT INTO dcc_installment_rows (id, plan_id, row_number, label, percentage, amount, due_date, paid_date, paid_amt, status, late_fee, due_date_with_late_fee, gst_amount)
VALUES
  ('f7700000-0000-0000-0000-000000000001', 'e7700000-0000-0000-0000-000000000001', 0, 'Full Payment', 100, 2800, '2026-09-01', NULL, 0, 'DUE', 0, NULL, 0),
  ('f7700000-0000-0000-0000-000000000002', 'e7700000-0000-0000-0000-000000000001', 1, 'Instalment 1', 50, 1400, '2026-09-01', NULL, 0, 'DUE', 50, NULL, 0),
  ('f7700000-0000-0000-0000-000000000003', 'e7700000-0000-0000-0000-000000000001', 2, 'Instalment 2', 50, 1400, '2026-10-01', NULL, 0, 'PENDING', 50, NULL, 0),

  ('f7700000-0000-0000-0000-000000000004', 'e7700000-0000-0000-0000-000000000002', 0, 'Full Payment', 100, 3400, '2026-08-01', NULL, 0, 'OVERDUE', 0, NULL, 0),
  ('f7700000-0000-0000-0000-000000000005', 'e7700000-0000-0000-0000-000000000002', 1, 'Instalment 1', 50, 1700, '2026-08-01', NULL, 0, 'OVERDUE', 50, NULL, 0),
  ('f7700000-0000-0000-0000-000000000006', 'e7700000-0000-0000-0000-000000000002', 2, 'Instalment 2', 50, 1700, '2026-10-01', NULL, 0, 'PENDING', 50, NULL, 0),

  ('f7700000-0000-0000-0000-000000000007', 'e7700000-0000-0000-0000-000000000003', 0, 'Full Payment', 100, 2200, '2026-07-01', '2026-07-10', 2200, 'PAID', 0, NULL, 0),
  ('f7700000-0000-0000-0000-000000000008', 'e7700000-0000-0000-0000-000000000003', 1, 'Instalment 1', 50, 1100, '2026-07-01', '2026-07-10', 1100, 'PAID', 50, NULL, 0),
  ('f7700000-0000-0000-0000-000000000009', 'e7700000-0000-0000-0000-000000000003', 2, 'Instalment 2', 50, 1100, '2026-10-01', '2026-07-10', 1100, 'PAID', 50, NULL, 0)
ON CONFLICT (id) DO NOTHING;