/*
# Seed Instalment Lines for Demo Rules + House Building Loan Instalment Demands

1. Updates existing LOAN rule (d9befe9a) installment spec to MANUAL_LINES mode
   and adds 4 instalment lines (House Building Loan - quarterly).
2. Creates or updates installment spec for TAX rule (368dd95c) in AUTO_CALC mode
   and adds 4 quarterly instalment lines (Property Tax).
3. Seeds 4 instalment demand rows for House Building Loan with realistic
   amounts, due dates, and statuses (Paid, Due, Upcoming x2).
*/

-- ── 1. Update LOAN rule installment spec to MANUAL_LINES ──────────────────────
UPDATE payable_installment_specs
SET instalment_mode = 'MANUAL_LINES',
    instalment_count = NULL,
    interval_days = 90
WHERE criteria_id = 'd9befe9a-4fb1-491d-bbe6-0ecde7726a4f';

-- Clear existing lines for this criteria, then seed 4 quarterly lines
DELETE FROM payable_instalment_lines
WHERE criteria_id = 'd9befe9a-4fb1-491d-bbe6-0ecde7726a4f';

INSERT INTO payable_instalment_lines (criteria_id, seq, amount, due_date_reference, days_offset)
VALUES
  ('d9befe9a-4fb1-491d-bbe6-0ecde7726a4f', 1, 25000.00, 'payable_generation_date', 15),
  ('d9befe9a-4fb1-491d-bbe6-0ecde7726a4f', 2, 25000.00, 'payable_generation_date', 45),
  ('d9befe9a-4fb1-491d-bbe6-0ecde7726a4f', 3, 25000.00, 'payable_generation_date', 75),
  ('d9befe9a-4fb1-491d-bbe6-0ecde7726a4f', 4, 27200.00, 'payable_generation_date', 105);

-- ── 2. Create or update TAX rule installment spec ─────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM payable_installment_specs WHERE criteria_id = '368dd95c-3864-4c7f-8d11-3211df5f83ef') THEN
    UPDATE payable_installment_specs
    SET installment_type = 'AMOUNT',
        installment_value = 11250.00,
        reference_date = 'payable_generation_date',
        days_offset = 15,
        instalment_mode = 'AUTO_CALC',
        instalment_count = 4,
        interval_days = 90
    WHERE criteria_id = '368dd95c-3864-4c7f-8d11-3211df5f83ef';
  ELSE
    INSERT INTO payable_installment_specs (criteria_id, installment_type, installment_value, reference_date, days_offset, instalment_mode, instalment_count, interval_days)
    VALUES ('368dd95c-3864-4c7f-8d11-3211df5f83ef', 'AMOUNT', 11250.00, 'payable_generation_date', 15, 'AUTO_CALC', 4, 90);
  END IF;
END $$;

-- Seed 4 quarterly instalment lines for Property Tax (total 45000 / 4 = 11250)
DELETE FROM payable_instalment_lines
WHERE criteria_id = '368dd95c-3864-4c7f-8d11-3211df5f83ef';

INSERT INTO payable_instalment_lines (criteria_id, seq, amount, due_date_reference, days_offset)
VALUES
  ('368dd95c-3864-4c7f-8d11-3211df5f83ef', 1, 11250.00, 'payable_generation_date', 15),
  ('368dd95c-3864-4c7f-8d11-3211df5f83ef', 2, 11250.00, 'payable_generation_date', 105),
  ('368dd95c-3864-4c7f-8d11-3211df5f83ef', 3, 11250.00, 'payable_generation_date', 195),
  ('368dd95c-3864-4c7f-8d11-3211df5f83ef', 4, 11250.00, 'payable_generation_date', 285);

-- ── 3. Seed House Building Loan instalment demands ────────────────────────────
-- Use a DO block to capture generated UUIDs for the payment insert
DO $$
DECLARE
  v_demand_id_1 uuid;
  v_obj_id uuid := '2fceeac2-fc9b-4e97-8eb1-66ac8d01e26e';
  v_owner_id uuid := '4bce314d-fea7-44c3-835c-eaec5234fdf3';
  v_dt_id uuid := '32040e98-9792-4914-83f7-cd58c1163e3a';
  v_criteria_id uuid := 'd9befe9a-4fb1-491d-bbe6-0ecde7726a4f';
BEGIN
  -- Instalment 1: PAID
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, criteria_id, demand_run_date, due_date, amount, amount_paid, status, generation_source, include_gst, gst_pct, gst_type, gst_amount)
  VALUES (v_obj_id, v_owner_id, v_dt_id, v_criteria_id, '2026-09-01', '2026-09-15', 25000.00, 25000.00, 'PAID', 'AUTO', false, 0, 'exclusive', 0)
  RETURNING id INTO v_demand_id_1;

  -- Payment for instalment 1
  IF v_demand_id_1 IS NOT NULL THEN
    INSERT INTO dcc_payments (demand_id, object_id, amount, payment_mode, payment_date, reference_number, remarks)
    VALUES (v_demand_id_1, v_obj_id, 25000.00, 'UPI', '2026-09-10', 'UPI-HBL-INST1-001', 'First instalment paid via UPI');
  END IF;

  -- Instalment 2: DUE
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, criteria_id, demand_run_date, due_date, amount, amount_paid, status, generation_source, include_gst, gst_pct, gst_type, gst_amount)
  VALUES (v_obj_id, v_owner_id, v_dt_id, v_criteria_id, '2026-09-01', '2026-10-15', 25000.00, 0, 'DUE', 'AUTO', false, 0, 'exclusive', 0);

  -- Instalment 3: DUE (upcoming)
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, criteria_id, demand_run_date, due_date, amount, amount_paid, status, generation_source, include_gst, gst_pct, gst_type, gst_amount)
  VALUES (v_obj_id, v_owner_id, v_dt_id, v_criteria_id, '2026-09-01', '2026-11-15', 25000.00, 0, 'DUE', 'AUTO', false, 0, 'exclusive', 0);

  -- Instalment 4: DUE (upcoming, includes remainder)
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, criteria_id, demand_run_date, due_date, amount, amount_paid, status, generation_source, include_gst, gst_pct, gst_type, gst_amount)
  VALUES (v_obj_id, v_owner_id, v_dt_id, v_criteria_id, '2026-09-01', '2026-12-15', 27200.00, 0, 'DUE', 'AUTO', false, 0, 'exclusive', 0);
END $$;
