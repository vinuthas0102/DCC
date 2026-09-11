DO $$
DECLARE
  v_object_id uuid := '2fceeac2-fc9b-4e97-8eb1-66ac8d01e26e';
  v_owner_id uuid := '4bce314d-fea7-44c3-835c-eaec5234fdf3';
  v_demand_type_id uuid := '32040e98-9792-4914-83f7-cd58c1163e3a';
  v_demand_id uuid;
  v_plan_id uuid;
  v_today date := CURRENT_DATE;
  v_run_date date := date_trunc('month', v_today) - interval '1 month';
  v_amount numeric := 200000;
  v_paid_amt numeric := 50000;
  v_per_inst numeric := 50000;
  v_full_disc_pct numeric := 5;
  v_gst_pct numeric := 0;
BEGIN
  -- Create the demand: partially paid (first installment already collected)
  INSERT INTO dcc_demands (
    object_id, owner_id, demand_type_id, criteria_id,
    demand_run_date, due_date, amount, amount_paid, status,
    generation_source, include_gst, gst_pct, gst_type, gst_amount
  ) VALUES (
    v_object_id, v_owner_id, v_demand_type_id, NULL,
    v_run_date, v_run_date + interval '15 days',
    v_amount, v_paid_amt, 'DUE',
    'MANUAL', false, v_gst_pct, 'inclusive', 0
  )
  RETURNING id INTO v_demand_id;

  -- Create installment plan: 4 installments, 5% full-pay discount, 500 late fee, 15-day grace
  INSERT INTO dcc_installment_plans (
    demand_id, no_of_installments, installment_start_date,
    late_fee, due_days_with_late_fee, interest_pct_pa,
    discount_full_payment_pct, gst_pct, gst_type, balance_payment,
    installments_paid, installments_due
  ) VALUES (
    v_demand_id, 4, v_run_date,
    500, 15, 0,
    v_full_disc_pct, v_gst_pct, 'inclusive', v_amount - v_paid_amt,
    1, 3
  )
  RETURNING id INTO v_plan_id;

  -- Row 0: Full Payment option
  INSERT INTO dcc_installment_rows (
    plan_id, row_number, label, percentage, amount,
    due_date, paid_date, paid_amt, status,
    late_fee, due_date_with_late_fee, gst_amount
  ) VALUES (
    v_plan_id, 0, 'Full Payment', 100, v_amount - v_paid_amt,
    v_run_date, NULL, 0, 'DUE',
    0, NULL, 0
  );

  -- Row 1: Installment 1 — PAID
  INSERT INTO dcc_installment_rows (
    plan_id, row_number, label, percentage, amount,
    due_date, paid_date, paid_amt, status,
    late_fee, due_date_with_late_fee, gst_amount
  ) VALUES (
    v_plan_id, 1, 'Installment 1', 25, v_per_inst,
    v_run_date, v_run_date + interval '10 days', v_per_inst, 'PAID',
    500, v_run_date + interval '15 days', 0
  );

  -- Row 2: Installment 2 — DUE (current period)
  INSERT INTO dcc_installment_rows (
    plan_id, row_number, label, percentage, amount,
    due_date, paid_date, paid_amt, status,
    late_fee, due_date_with_late_fee, gst_amount
  ) VALUES (
    v_plan_id, 2, 'Installment 2', 25, v_per_inst,
    v_run_date + interval '1 month', NULL, 0, 'DUE',
    500, v_run_date + interval '1 month' + interval '15 days', 0
  );

  -- Row 3: Installment 3 — PENDING (future)
  INSERT INTO dcc_installment_rows (
    plan_id, row_number, label, percentage, amount,
    due_date, paid_date, paid_amt, status,
    late_fee, due_date_with_late_fee, gst_amount
  ) VALUES (
    v_plan_id, 3, 'Installment 3', 25, v_per_inst,
    v_run_date + interval '2 months', NULL, 0, 'PENDING',
    500, v_run_date + interval '2 months' + interval '15 days', 0
  );

  -- Row 4: Installment 4 — PENDING (future)
  INSERT INTO dcc_installment_rows (
    plan_id, row_number, label, percentage, amount,
    due_date, paid_date, paid_amt, status,
    late_fee, due_date_with_late_fee, gst_amount
  ) VALUES (
    v_plan_id, 4, 'Installment 4', 25, v_per_inst,
    v_run_date + interval '3 months', NULL, 0, 'PENDING',
    500, v_run_date + interval '3 months' + interval '15 days', 0
  );

  -- Record the payment for installment 1
  INSERT INTO dcc_payments (
    demand_id, object_id, amount, payment_mode, payment_date,
    reference_number, remarks
  ) VALUES (
    v_demand_id, v_object_id, v_paid_amt, 'RTGS',
    v_run_date + interval '10 days',
    'UTR-DEMO-0001', 'Installment 1 payment — demo seed'
  );
END $$;
