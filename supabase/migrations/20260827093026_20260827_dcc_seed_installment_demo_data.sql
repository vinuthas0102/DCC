/*
# Seed DCC installment plan demo data

1. Purpose
- Adds installment plans and installment rows for several existing DCC demands
  so the "Installments" tab on the demand detail page has meaningful data.
- Covers paid, due, overdue, and partially-paid installment scenarios.

2. Data Added
- 6 installment plans across different demands (LOAN, RENT, PROPERTY_TAX, SD, MAINTENANCE, INSURANCE)
- Each plan has a "Full Payment" row (row_number=0) plus 2-4 installment rows
- Installment rows cover all statuses: PAID, DUE, OVERDUE, PENDING

3. Important Notes
- All demand IDs reference existing rows from the comprehensive demo seed migration.
- Plans use ON CONFLICT DO NOTHING to be idempotent.
- Installment rows use fixed UUIDs for idempotency.
- Row 0 = Full Payment option; rows 1+ = individual installments.
*/

-- ── Installment Plans ──────────────────────────────────────────────────────────

INSERT INTO dcc_installment_plans (id, demand_id, no_of_installments, late_fee, interest_pct_pa, discount_full_payment_pct, gst_pct, gst_type)
VALUES
  -- LOAN demand: d3330000-...-000000000040 (DUE, 12500)
  ('e4440000-0000-0000-0000-000000000001', 'd3330000-0000-0000-0000-000000000040', 4, 200, 8.5, 2, 18, 'inclusive'),
  -- RENT demand: d3330000-...-000000000004 (DUE partial, 8500, paid 4250)
  ('e4440000-0000-0000-0000-000000000002', 'd3330000-0000-0000-0000-000000000004', 2, 100, 0, 0, 0, 'inclusive'),
  -- PROPERTY_TAX demand: d3330000-...-000000000012 (DUE, 48000)
  ('e4440000-0000-0000-0000-000000000003', 'd3330000-0000-0000-0000-000000000012', 4, 500, 0, 1.5, 0, 'inclusive'),
  -- SD demand: d3330000-...-000000000051 (DUE partial, 50000, paid 25000)
  ('e4440000-0000-0000-0000-000000000004', 'd3330000-0000-0000-0000-000000000051', 2, 0, 0, 0, 0, 'inclusive'),
  -- MAINTENANCE demand: d3330000-...-000000000020 (DUE, 1500)
  ('e4440000-0000-0000-0000-000000000005', 'd3330000-0000-0000-0000-000000000020', 3, 50, 0, 0, 0, 'inclusive'),
  -- INSURANCE demand: d3330000-...-000000000031 (OVERDUE, 24000)
  ('e4440000-0000-0000-0000-000000000006', 'd3330000-0000-0000-0000-000000000031', 2, 300, 0, 0, 18, 'inclusive')
ON CONFLICT (id) DO NOTHING;

-- ── Installment Rows ────────────────────────────────────────────────────────────
-- Row 0 = Full Payment, Row 1+ = installments

INSERT INTO dcc_installment_rows (id, plan_id, row_number, label, percentage, amount, due_date, paid_date, paid_amt, status, late_fee, due_date_with_late_fee, gst_amount)
VALUES
  -- ═══ Plan 1: LOAN demand (d3330000-...-040) — 4 installments of 3125 each ═══
  ('f5550001-0000-0000-0000-000000000000', 'e4440000-0000-0000-0000-000000000001', 0, 'Full Payment', 100, 12500, '2026-08-05', NULL, 0, 'DUE', 0, NULL, 0),
  ('f5550001-0000-0000-0000-000000000001', 'e4440000-0000-0000-0000-000000000001', 1, 'Instalment 1 — Aug 2026', 25, 3125, '2026-08-05', NULL, 0, 'DUE', 0, NULL, 0),
  ('f5550001-0000-0000-0000-000000000002', 'e4440000-0000-0000-0000-000000000001', 2, 'Instalment 2 — Sep 2026', 25, 3125, '2026-09-05', NULL, 0, 'PENDING', 0, NULL, 0),
  ('f5550001-0000-0000-0000-000000000003', 'e4440000-0000-0000-0000-000000000001', 3, 'Instalment 3 — Oct 2026', 25, 3125, '2026-10-05', NULL, 0, 'PENDING', 0, NULL, 0),
  ('f5550001-0000-0000-0000-000000000004', 'e4440000-0000-0000-0000-000000000001', 4, 'Instalment 4 — Nov 2026', 25, 3125, '2026-11-05', NULL, 0, 'PENDING', 0, NULL, 0),

  -- ═══ Plan 2: RENT demand (d3330000-...-004) — 2 installments, partial payment ═══
  ('f5550002-0000-0000-0000-000000000000', 'e4440000-0000-0000-0000-000000000002', 0, 'Full Payment', 100, 8500, '2026-07-10', NULL, 4250, 'DUE', 0, NULL, 0),
  ('f5550002-0000-0000-0000-000000000001', 'e4440000-0000-0000-0000-000000000002', 1, 'First Half — Jul 2026', 50, 4250, '2026-07-10', '2026-07-05', 4250, 'PAID', 0, NULL, 0),
  ('f5550002-0000-0000-0000-000000000002', 'e4440000-0000-0000-0000-000000000002', 2, 'Second Half — Aug 2026', 50, 4250, '2026-08-10', NULL, 0, 'DUE', 0, NULL, 0),

  -- ═══ Plan 3: PROPERTY_TAX demand (d3330000-...-012) — 4 quarterly installments ═══
  ('f5550003-0000-0000-0000-000000000000', 'e4440000-0000-0000-0000-000000000003', 0, 'Full Payment (2% discount)', 100, 47280, '2026-08-15', NULL, 0, 'DUE', 0, NULL, 0),
  ('f5550003-0000-0000-0000-000000000001', 'e4440000-0000-0000-0000-000000000003', 1, 'Q1 — Aug 2026', 25, 12000, '2026-08-15', NULL, 0, 'DUE', 0, NULL, 0),
  ('f5550003-0000-0000-0000-000000000002', 'e4440000-0000-0000-0000-000000000003', 2, 'Q2 — Nov 2026', 25, 12000, '2026-11-15', NULL, 0, 'PENDING', 0, NULL, 0),
  ('f5550003-0000-0000-0000-000000000003', 'e4440000-0000-0000-0000-000000000003', 3, 'Q3 — Feb 2027', 25, 12000, '2027-02-15', NULL, 0, 'PENDING', 0, NULL, 0),
  ('f5550003-0000-0000-0000-000000000004', 'e4440000-0000-0000-0000-000000000003', 4, 'Q4 — May 2027', 25, 12000, '2027-05-15', NULL, 0, 'PENDING', 0, NULL, 0),

  -- ═══ Plan 4: SD demand (d3330000-...-051) — 2 installments, partial paid ═══
  ('f5550004-0000-0000-0000-000000000000', 'e4440000-0000-0000-0000-000000000004', 0, 'Full Payment', 100, 50000, '2026-01-30', NULL, 25000, 'DUE', 0, NULL, 0),
  ('f5550004-0000-0000-0000-000000000001', 'e4440000-0000-0000-0000-000000000004', 1, 'First Instalment', 50, 25000, '2026-01-30', '2026-01-28', 25000, 'PAID', 0, NULL, 0),
  ('f5550004-0000-0000-0000-000000000002', 'e4440000-0000-0000-0000-000000000004', 2, 'Second Instalment', 50, 25000, '2026-07-30', NULL, 0, 'OVERDUE', 0, '2026-08-29', 0),

  -- ═══ Plan 5: MAINTENANCE demand (d3330000-...-020) — 3 monthly installments ═══
  ('f5550005-0000-0000-0000-000000000000', 'e4440000-0000-0000-0000-000000000005', 0, 'Full Payment', 100, 1500, '2026-08-15', NULL, 0, 'DUE', 0, NULL, 0),
  ('f5550005-0000-0000-0000-000000000001', 'e4440000-0000-0000-0000-000000000005', 1, 'Month 1 — Aug 2026', 33.33, 500, '2026-08-15', NULL, 0, 'DUE', 0, NULL, 0),
  ('f5550005-0000-0000-0000-000000000002', 'e4440000-0000-0000-0000-000000000005', 2, 'Month 2 — Sep 2026', 33.33, 500, '2026-09-15', NULL, 0, 'PENDING', 0, NULL, 0),
  ('f5550005-0000-0000-0000-000000000003', 'e4440000-0000-0000-0000-000000000005', 3, 'Month 3 — Oct 2026', 33.34, 500, '2026-10-15', NULL, 0, 'PENDING', 0, NULL, 0),

  -- ═══ Plan 6: INSURANCE demand (d3330000-...-031) — 2 semi-annual installments, OVERDUE ═══
  ('f5550006-0000-0000-0000-000000000000', 'e4440000-0000-0000-0000-000000000006', 0, 'Full Payment', 100, 24000, '2026-07-15', NULL, 0, 'OVERDUE', 300, '2026-08-14', 0),
  ('f5550006-0000-0000-0000-000000000001', 'e4440000-0000-0000-0000-000000000006', 1, 'First Half — Jan 2026', 50, 12000, '2026-01-15', NULL, 0, 'OVERDUE', 150, '2026-02-14', 0),
  ('f5550006-0000-0000-0000-000000000002', 'e4440000-0000-0000-0000-000000000006', 2, 'Second Half — Jul 2026', 50, 12000, '2026-07-15', NULL, 0, 'OVERDUE', 150, '2026-08-14', 0)
ON CONFLICT (id) DO NOTHING;
