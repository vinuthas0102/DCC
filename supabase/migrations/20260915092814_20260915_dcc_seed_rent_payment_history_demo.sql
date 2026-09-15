/*
# DCC: Seed Rent Demand Payment History (Demo)

## Purpose
Adds demonstration payment records to RENT-type demands so the Paid History
tab shows realistic payment history for rent transactions.

## Changes
1. Inserts payment rows for several RENT demands across different objects/owners.
2. Updates each demand's amount_paid and status to match the seeded payments.
3. Covers scenarios: fully paid, partially paid (multiple payments), and
   one demand left with payments but still DUE.

## Idempotency
Uses a guard check on reference_number prefixes so re-running does not
create duplicates.
*/

DO $$
DECLARE
  v_count int;
BEGIN
  -- Idempotency guard: check if any RENT demo payments already exist
  SELECT COUNT(*) INTO v_count
  FROM dcc_payments p
  JOIN dcc_demands d ON p.demand_id = d.id
  JOIN dcc_demand_types dt ON d.demand_type_id = dt.id
  WHERE dt.code = 'RENT'
    AND p.reference_number LIKE 'RENT-DEMO-%';

  IF v_count > 0 THEN
    RAISE NOTICE 'RENT demo payments already seeded — skipping';
    RETURN;
  END IF;

  -- 1. Rajesh Kumar — SEC-14/TYPE-II/42 — Rent 35000 (Sep 2026 run)
  --    Fully paid with two partial payments
  INSERT INTO dcc_payments (demand_id, object_id, amount, payment_mode, payment_date, reference_number, remarks)
  SELECT d.id, d.object_id, 20000, 'UPI', DATE '2026-09-12', 'RENT-DEMO-RK-001', 'Partial rent payment — September'
  FROM dcc_demands d
  JOIN dcc_demand_types dt ON d.demand_type_id = dt.id
  WHERE dt.code = 'RENT' AND d.owner_id = 'f156c252-25db-42e0-88da-e3b494721c82'
    AND d.demand_run_date = DATE '2026-09-10';

  INSERT INTO dcc_payments (demand_id, object_id, amount, payment_mode, payment_date, reference_number, remarks)
  SELECT d.id, d.object_id, 15000, 'RTGS', DATE '2026-09-14', 'RENT-DEMO-RK-002', 'Balance rent payment — September'
  FROM dcc_demands d
  JOIN dcc_demand_types dt ON d.demand_type_id = dt.id
  WHERE dt.code = 'RENT' AND d.owner_id = 'f156c252-25db-42e0-88da-e3b494721c82'
    AND d.demand_run_date = DATE '2026-09-10';

  -- Update Rajesh Kumar's Sep demand to fully paid
  UPDATE dcc_demands
  SET amount_paid = 35000, status = 'PAID', updated_at = now()
  WHERE id = (
    SELECT d.id FROM dcc_demands d
    JOIN dcc_demand_types dt ON d.demand_type_id = dt.id
    WHERE dt.code = 'RENT' AND d.owner_id = 'f156c252-25db-42e0-88da-e3b494721c82'
      AND d.demand_run_date = DATE '2026-09-10'
  );

  -- 2. Priya Sharma — DEL-SEC7/TYPE-III/12 — Rent 25000 (Sep 2026 run)
  --    Partially paid (10000 of 25000), status stays DUE
  INSERT INTO dcc_payments (demand_id, object_id, amount, payment_mode, payment_date, reference_number, remarks)
  SELECT d.id, d.object_id, 10000, 'CHEQUE', DATE '2026-09-08', 'RENT-DEMO-PS-001', 'Partial rent payment — September'
  FROM dcc_demands d
  JOIN dcc_demand_types dt ON d.demand_type_id = dt.id
  WHERE dt.code = 'RENT' AND d.owner_id = 'd20c5942-79bd-4802-b2ea-650c8644fcfc'
    AND d.demand_run_date = DATE '2026-09-10';

  -- Update Priya Sharma's Sep demand to partially paid
  UPDATE dcc_demands
  SET amount_paid = 10000, status = 'DUE', updated_at = now()
  WHERE id = (
    SELECT d.id FROM dcc_demands d
    JOIN dcc_demand_types dt ON d.demand_type_id = dt.id
    WHERE dt.code = 'RENT' AND d.owner_id = 'd20c5942-79bd-4802-b2ea-650c8644fcfc'
      AND d.demand_run_date = DATE '2026-09-10'
  );

  -- 3. Priya Sharma — DEL-SEC7/TYPE-III/12 — Rent 5200 (Aug 2026 run)
  --    Fully paid in a single payment
  INSERT INTO dcc_payments (demand_id, object_id, amount, payment_mode, payment_date, reference_number, remarks)
  SELECT d.id, d.object_id, 5200, 'EPAY', DATE '2026-08-05', 'RENT-DEMO-PS-AUG-001', 'Full rent payment — August'
  FROM dcc_demands d
  JOIN dcc_demand_types dt ON d.demand_type_id = dt.id
  WHERE dt.code = 'RENT' AND d.owner_id = 'd20c5942-79bd-4802-b2ea-650c8644fcfc'
    AND d.demand_run_date = DATE '2026-08-01';

  -- Update Priya Sharma's Aug demand to fully paid
  UPDATE dcc_demands
  SET amount_paid = 5200, status = 'PAID', updated_at = now()
  WHERE id = (
    SELECT d.id FROM dcc_demands d
    JOIN dcc_demand_types dt ON d.demand_type_id = dt.id
    WHERE dt.code = 'RENT' AND d.owner_id = 'd20c5942-79bd-4802-b2ea-650c8644fcfc'
      AND d.demand_run_date = DATE '2026-08-01'
  );

  -- 4. Rajesh Kumar — SEC-14/TYPE-II/42 — Rent 3500 (Jul 2026 run)
  --    Fully paid in a single payment
  INSERT INTO dcc_payments (demand_id, object_id, amount, payment_mode, payment_date, reference_number, remarks)
  SELECT d.id, d.object_id, 3500, 'ONLINE', DATE '2026-07-03', 'RENT-DEMO-RK-JUL-001', 'Full rent payment — July'
  FROM dcc_demands d
  JOIN dcc_demand_types dt ON d.demand_type_id = dt.id
  WHERE dt.code = 'RENT' AND d.owner_id = 'f156c252-25db-42e0-88da-e3b494721c82'
    AND d.demand_run_date = DATE '2026-07-01';

  -- Update Rajesh Kumar's Jul demand to fully paid
  UPDATE dcc_demands
  SET amount_paid = 3500, status = 'PAID', updated_at = now()
  WHERE id = (
    SELECT d.id FROM dcc_demands d
    JOIN dcc_demand_types dt ON d.demand_type_id = dt.id
    WHERE dt.code = 'RENT' AND d.owner_id = 'f156c252-25db-42e0-88da-e3b494721c82'
      AND d.demand_run_date = DATE '2026-07-01'
  );

  -- 5. Antares Logistics — MH12-AB-1234 — Rent 25000 (Aug 2026 run)
  --    Partially paid (15000 of 25000), status stays DUE
  INSERT INTO dcc_payments (demand_id, object_id, amount, payment_mode, payment_date, reference_number, remarks)
  SELECT d.id, d.object_id, 15000, 'DD', DATE '2026-08-15', 'RENT-DEMO-AL-001', 'Partial vehicle rent — August'
  FROM dcc_demands d
  JOIN dcc_demand_types dt ON d.demand_type_id = dt.id
  WHERE dt.code = 'RENT' AND d.owner_id = '3bb8bbf2-02df-4c4c-8b8c-ce4f08ac4e7b'
    AND d.demand_run_date = DATE '2026-08-01';

  -- Update Antares Logistics's Aug demand to partially paid
  UPDATE dcc_demands
  SET amount_paid = 15000, status = 'DUE', updated_at = now()
  WHERE id = (
    SELECT d.id FROM dcc_demands d
    JOIN dcc_demand_types dt ON d.demand_type_id = dt.id
    WHERE dt.code = 'RENT' AND d.owner_id = '3bb8bbf2-02df-4c4c-8b8c-ce4f08ac4e7b'
      AND d.demand_run_date = DATE '2026-08-01'
  );

  -- 6. Nexus Infra — EQP-CRANE-001 — Rent 45000 (Jul 2026 run, OVERDUE)
  --    Partially paid (20000 of 45000), status stays OVERDUE
  INSERT INTO dcc_payments (demand_id, object_id, amount, payment_mode, payment_date, reference_number, remarks)
  SELECT d.id, d.object_id, 20000, 'RTGS', DATE '2026-07-10', 'RENT-DEMO-NI-001', 'Partial equipment rent — July'
  FROM dcc_demands d
  JOIN dcc_demand_types dt ON d.demand_type_id = dt.id
  WHERE dt.code = 'RENT' AND d.owner_id = '4bce314d-fea7-44c3-835c-eaec5234fdf3'
    AND d.demand_run_date = DATE '2026-07-01';

  -- Update Nexus Infra's Jul demand to partially paid but still OVERDUE
  UPDATE dcc_demands
  SET amount_paid = 20000, status = 'OVERDUE', updated_at = now()
  WHERE id = (
    SELECT d.id FROM dcc_demands d
    JOIN dcc_demand_types dt ON d.demand_type_id = dt.id
    WHERE dt.code = 'RENT' AND d.owner_id = '4bce314d-fea7-44c3-835c-eaec5234fdf3'
      AND d.demand_run_date = DATE '2026-07-01'
  );

  RAISE NOTICE 'Seeded RENT demo payment history across 6 demands';
END $$;
