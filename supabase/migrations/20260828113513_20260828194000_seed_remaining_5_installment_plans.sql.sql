/*
# Seed installment plans for 5 remaining demands that still lack plans

1. Purpose
- The previous migration used UUIDs e444...010 through e444...028, but UUIDs
  e444...010 through e444...014 were already in use by other demands.
- This migration uses new unique UUIDs (e444...030 through e444...034) for the
  5 demands that still lack installment plans.

2. Data Added
- Plans for: ADVANCE d...060 (PAID), ADVANCE d...061 (EXEMPTED),
  INSURANCE d...030 (PAID), INSURANCE 2186605c (PAID), INSURANCE e28aec89 (OVERDUE).
- Each plan has a Full Payment row + 2 installment rows.
- remaining_amount is a GENERATED column, so it is NOT inserted.

3. Important Notes
- Uses ON CONFLICT DO NOTHING for idempotency.
- Fixed UUIDs for all plans and rows.
*/

INSERT INTO dcc_installment_plans (id, demand_id, no_of_installments, installment_start_date, late_fee, due_days_with_late_fee, interest_pct_pa, discount_full_payment_pct, gst_pct, gst_type, balance_payment, installments_paid, installments_due)
VALUES
  ('e4440000-0000-0000-0000-000000000030', 'd3330000-0000-0000-0000-000000000060', 2, '2026-02-10', 500, 15, 0, 0, 0, 'inclusive', 100000, 2, 0),
  ('e4440000-0000-0000-0000-000000000031', 'd3330000-0000-0000-0000-000000000061', 2, '2026-02-10', 500, 15, 0, 0, 0, 'inclusive', 100000, 0, 2),
  ('e4440000-0000-0000-0000-000000000032', 'd3330000-0000-0000-0000-000000000030', 2, '2026-01-15', 300, 15, 0, 0, 18, 'inclusive', 24000, 2, 0),
  ('e4440000-0000-0000-0000-000000000033', '2186605c-a30d-49c3-8942-ab17a379d297', 2, '2026-01-15', 100, 15, 0, 0, 0, 'inclusive', 8500, 2, 0),
  ('e4440000-0000-0000-0000-000000000034', 'e28aec89-4025-432b-996f-259ec9b026dd', 2, '2026-02-15', 100, 15, 0, 0, 0, 'inclusive', 7200, 0, 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dcc_installment_rows (id, plan_id, row_number, label, percentage, amount, due_date, paid_date, paid_amt, status, late_fee, due_date_with_late_fee, gst_amount)
VALUES
  -- ═══ ADVANCE d...060 (PAID, 100000) — plan e444...030 ═══
  ('f5550030-0000-0000-0000-000000000000', 'e4440000-0000-0000-0000-000000000030', 0, 'Full Payment', 100, 100000, '2026-02-10', '2026-02-08', 100000, 'PAID', 0, NULL, 0),
  ('f5550030-0000-0000-0000-000000000001', 'e4440000-0000-0000-0000-000000000030', 1, 'Instalment 1 — Feb 2026', 50, 50000, '2026-02-10', '2026-02-08', 50000, 'PAID', 500, NULL, 0),
  ('f5550030-0000-0000-0000-000000000002', 'e4440000-0000-0000-0000-000000000030', 2, 'Instalment 2 — Mar 2026', 50, 50000, '2026-03-10', '2026-02-08', 50000, 'PAID', 500, NULL, 0),

  -- ═══ ADVANCE d...061 (EXEMPTED, 100000) — plan e444...031 ═══
  ('f5550031-0000-0000-0000-000000000000', 'e4440000-0000-0000-0000-000000000031', 0, 'Full Payment', 100, 100000, '2026-02-10', NULL, 0, 'DUE', 0, NULL, 0),
  ('f5550031-0000-0000-0000-000000000001', 'e4440000-0000-0000-0000-000000000031', 1, 'Instalment 1 — Feb 2026', 50, 50000, '2026-02-10', NULL, 0, 'DUE', 500, '2026-02-25', 0),
  ('f5550031-0000-0000-0000-000000000002', 'e4440000-0000-0000-0000-000000000031', 2, 'Instalment 2 — Mar 2026', 50, 50000, '2026-03-10', NULL, 0, 'PENDING', 500, '2026-03-25', 0),

  -- ═══ INSURANCE d...030 (PAID, 24000) — plan e444...032 ═══
  ('f5550032-0000-0000-0000-000000000000', 'e4440000-0000-0000-0000-000000000032', 0, 'Full Payment', 100, 24000, '2026-01-15', '2026-01-10', 24000, 'PAID', 0, NULL, 0),
  ('f5550032-0000-0000-0000-000000000001', 'e4440000-0000-0000-0000-000000000032', 1, 'First Half — Jan 2026', 50, 12000, '2026-01-15', '2026-01-10', 12000, 'PAID', 300, NULL, 0),
  ('f5550032-0000-0000-0000-000000000002', 'e4440000-0000-0000-0000-000000000032', 2, 'Second Half — Jul 2026', 50, 12000, '2026-07-15', '2026-01-10', 12000, 'PAID', 300, NULL, 0),

  -- ═══ INSURANCE 2186605c (PAID, 8500) — plan e444...033 ═══
  ('f5550033-0000-0000-0000-000000000000', 'e4440000-0000-0000-0000-000000000033', 0, 'Full Payment', 100, 8500, '2026-01-15', '2026-01-10', 8500, 'PAID', 0, NULL, 0),
  ('f5550033-0000-0000-0000-000000000001', 'e4440000-0000-0000-0000-000000000033', 1, 'First Half — Jan 2026', 50, 4250, '2026-01-15', '2026-01-10', 4250, 'PAID', 100, NULL, 0),
  ('f5550033-0000-0000-0000-000000000002', 'e4440000-0000-0000-0000-000000000033', 2, 'Second Half — Jul 2026', 50, 4250, '2026-07-15', '2026-01-10', 4250, 'PAID', 100, NULL, 0),

  -- ═══ INSURANCE e28aec89 (OVERDUE, 7200) — plan e444...034 ═══
  ('f5550034-0000-0000-0000-000000000000', 'e4440000-0000-0000-0000-000000000034', 0, 'Full Payment', 100, 7200, '2026-02-15', NULL, 0, 'OVERDUE', 100, '2026-03-01', 0),
  ('f5550034-0000-0000-0000-000000000001', 'e4440000-0000-0000-0000-000000000034', 1, 'First Half — Feb 2026', 50, 3600, '2026-02-15', NULL, 0, 'OVERDUE', 100, '2026-03-01', 0),
  ('f5550034-0000-0000-0000-000000000002', 'e4440000-0000-0000-0000-000000000034', 2, 'Second Half — Aug 2026', 50, 3600, '2026-08-15', NULL, 0, 'PENDING', 100, NULL, 0)
ON CONFLICT (id) DO NOTHING;