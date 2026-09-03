-- ── Enrich SEC-14 loan plan parameters and add Toyota Innova insurance demand ──

-- Update the SEC-14 loan demand amount to match a 6-installment plan at 12500 each = 75000
UPDATE dcc_demands
SET amount = 75000, due_date = '2026-08-05', demand_run_date = '2026-08-01'
WHERE id = 'd3330000-0000-0000-0000-000000000071';

-- Update the existing installment plan with richer parameters
UPDATE dcc_installment_plans
SET
  no_of_installments = 6,
  installment_start_date = '2026-08-05',
  late_fee = 200,
  due_days_with_late_fee = 15,
  interest_pct_pa = 8.50,
  discount_full_payment_pct = 2.00,
  gst_pct = 18.00,
  gst_type = 'inclusive',
  balance_payment = 75000,
  installments_due = 6
WHERE demand_id = 'd3330000-0000-0000-0000-000000000071';

-- Toyota Innova — Fleet Car (Insurance) → opens Demand Due view
INSERT INTO dcc_objects (id, owner_id, object_type, object_ref, description, region, group_name, subgroup)
VALUES
  ('b2222222-0000-0000-0000-000000000010', 'a1111111-0000-0000-0000-000000000002', 'ASSET', 'TOYOTA-INV-001', 'Toyota Innova — Fleet Car (Insurance)', 'Vellore', 'Vehicle', 'SUV')
ON CONFLICT (id) DO NOTHING;

-- INSURANCE demand type id: 406957d6-5572-4429-9e7f-b6f4fefa020e
INSERT INTO dcc_demands (id, object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
VALUES
  ('d3330000-0000-0000-0000-000000000070', 'b2222222-0000-0000-0000-000000000010', 'a1111111-0000-0000-0000-000000000002', '406957d6-5572-4429-9e7f-b6f4fefa020e', '2026-08-01', '2026-08-15', 18000, 0, 'DUE', 'AUTO')
ON CONFLICT (id) DO NOTHING;

-- Run log entries
INSERT INTO dcc_demand_run_log (run_date, source, demand_type_id, records_created, total_amount)
VALUES
  ('2026-08-01', 'AUTO', '406957d6-5572-4429-9e7f-b6f4fefa020e', 1, 18000),
  ('2026-08-01', 'AUTO', 'd49fd9db-7f63-4ffe-9bce-8926655d6b90', 1, 75000)
ON CONFLICT DO NOTHING;