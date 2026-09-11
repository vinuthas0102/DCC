/*
# DCC: Seed Multiple Demonstration Payments

## Purpose
Adds two additional demonstration payments to an existing partially-paid LOAN
demand so the Paid History tab can showcase multiple payment entries with
different dates, modes, and references.

## Changes
1. Inserts two new rows into dcc_payments for demand
   d4388124-732e-4cff-b865-64f6948d59fb (LOAN-HBL-2026-001, 200000 total).
2. Updates the demand's amount_paid to reflect the three combined payments
   and keeps status as DUE (still partially paid).

## Important Notes
1. The existing payment (50000 RTGS on 2026-08-11) is untouched.
2. New payment 1: 25000 via UPI on 2026-08-25, ref UPI-LOAN-002
3. New payment 2: 25000 via CHEQUE on 2026-09-05, ref CHQ-LOAN-003
4. Combined amount_paid after this migration: 100000 (of 200000 total).
5. Idempotent: uses a guard check so re-running does not create duplicates.
*/

DO $$
DECLARE
  v_demand_id uuid := 'd4388124-732e-4cff-b865-64f6948d59fb';
  v_object_id uuid;
  v_existing_count int;
BEGIN
  -- Fetch the object_id from the demand
  SELECT object_id INTO v_object_id FROM dcc_demands WHERE id = v_demand_id;
  IF v_object_id IS NULL THEN
    RAISE NOTICE 'Demand % not found — skipping seed', v_demand_id;
    RETURN;
  END IF;

  -- Check if we already added the demo payments (idempotency guard)
  SELECT COUNT(*) INTO v_existing_count
  FROM dcc_payments
  WHERE demand_id = v_demand_id
    AND reference_number IN ('UPI-LOAN-002', 'CHQ-LOAN-003');

  IF v_existing_count > 0 THEN
    RAISE NOTICE 'Demo payments already seeded for demand %', v_demand_id;
    RETURN;
  END IF;

  -- Insert two additional demonstration payments
  INSERT INTO dcc_payments (demand_id, object_id, amount, payment_mode, payment_date, reference_number, remarks)
  VALUES
    (v_demand_id, v_object_id, 25000, 'UPI',    DATE '2026-08-25', 'UPI-LOAN-002', 'Partial loan repayment — August'),
    (v_demand_id, v_object_id, 25000, 'CHEQUE', DATE '2026-09-05', 'CHQ-LOAN-003', 'Partial loan repayment — September');

  -- Update amount_paid to reflect all three payments (50000 + 25000 + 25000 = 100000)
  UPDATE dcc_demands
  SET amount_paid = 100000,
      status      = 'DUE',
      updated_at  = now()
  WHERE id = v_demand_id;

  RAISE NOTICE 'Seeded 2 demo payments for demand %', v_demand_id;
END $$;
