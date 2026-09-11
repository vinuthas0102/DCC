-- Seed a demo demand run log with 7 demands across different objects/types/statuses
DO $$
DECLARE
  v_run_date date := '2026-09-10';
  v_source text := 'AUTO';
  v_rent_type uuid := '5773cbc0-005d-4ce8-96f2-1ce51213fe77';
  v_maint_type uuid := 'd8b6e2a7-c3d1-43ef-928b-2e0b630a917c';
  v_tax_type uuid := 'f74fb695-704f-40b6-9c3b-1bc7aa1c20e9';
  v_insurance_type uuid := '79ffa4bd-86be-4903-b187-27dd571df51a';
  v_loan_type uuid := '32040e98-9792-4914-83f7-cd58c1163e3a';
  v_sd_type uuid := 'e49c7a0e-fb27-49c0-bef0-13f350f4ac34';

  v_obj_quarter uuid := '89f95023-d7fe-4fec-89fa-29c3d4576c39';
  v_obj_crane uuid := '2c400fbb-0238-44a5-a8de-c31e693156ea';
  v_obj_gen uuid := 'd6930a24-a2ef-47c4-867d-c07080a19737';
  v_obj_loan uuid := '2fceeac2-fc9b-4e97-8eb1-66ac8d01e26e';
  v_obj_car1 uuid := 'd38cbf0b-ee41-4ac2-8ff6-ef88407d0012';
  v_obj_car2 uuid := 'fb395e3f-c3c8-4ab3-a368-7bb74d168c3a';
  v_obj_prop uuid := '26b3d754-fa26-438b-9a66-c0a9d445cc61';

  v_owner_priya uuid := 'd20c5942-79bd-4802-b2ea-650c8644fcfc';
  v_owner_nexus uuid := '4bce314d-fea7-44c3-835c-eaec5234fdf3';
  v_owner_antares uuid := '3bb8bbf2-02df-4c4c-8b8c-ce4f08ac4e7b';
  v_owner_rajesh uuid := 'f156c252-25db-42e0-88da-e3b494721c82';

  v_started timestamptz := '2026-09-10T10:00:00Z';
  v_ended timestamptz := '2026-09-10T10:00:03Z';
  v_total numeric := 0;
  v_log_id uuid;
BEGIN
  SELECT id INTO v_log_id
  FROM dcc_demand_run_log
  WHERE run_date = v_run_date AND source = v_source AND total_amount = 233200;
  IF v_log_id IS NOT NULL THEN
    RAISE NOTICE 'Demo run already seeded, skipping';
    RETURN;
  END IF;

  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source, include_gst, gst_pct, gst_type, gst_amount)
  VALUES (v_obj_quarter, v_owner_priya, v_rent_type, v_run_date, '2026-10-10', 25000, 0, 'DUE', v_source, true, 18, 'exclusive', 4500);

  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source, include_gst, gst_pct, gst_type, gst_amount)
  VALUES (v_obj_quarter, v_owner_priya, v_maint_type, v_run_date, '2026-09-05', 3200, 0, 'OVERDUE', v_source, true, 12, 'exclusive', 384);

  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source, include_gst, gst_pct, gst_type, gst_amount)
  VALUES (v_obj_prop, v_owner_rajesh, v_tax_type, v_run_date, '2026-10-15', 45000, 45000, 'PAID', v_source, false, 0, 'exclusive', 0);

  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source, include_gst, gst_pct, gst_type, gst_amount)
  VALUES (v_obj_car1, v_owner_antares, v_insurance_type, v_run_date, '2026-10-20', 12000, 0, 'DUE', v_source, true, 18, 'inclusive', 1831);

  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source, include_gst, gst_pct, gst_type, gst_amount)
  VALUES (v_obj_loan, v_owner_nexus, v_loan_type, v_run_date, '2026-09-01', 22000, 0, 'OVERDUE', v_source, true, 18, 'exclusive', 3960);

  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source, include_gst, gst_pct, gst_type, gst_amount)
  VALUES (v_obj_prop, v_owner_rajesh, v_rent_type, v_run_date, '2026-10-01', 35000, 35000, 'PAID', v_source, true, 18, 'inclusive', 5339);

  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source, include_gst, gst_pct, gst_type, gst_amount)
  VALUES (v_obj_car2, v_owner_antares, v_sd_type, v_run_date, '2026-11-10', 50000, 0, 'DUE', v_source, false, 0, 'exclusive', 0);

  v_total := 25000 + 3200 + 45000 + 12000 + 22000 + 35000 + 50000;

  INSERT INTO dcc_demand_run_log (run_date, source, demand_type_id, records_created, total_amount, started_at, ended_at, duration_ms, records_failed, run_summary)
  VALUES (v_run_date, v_source, NULL, 7, v_total, v_started, v_ended, 3000, 0, jsonb_build_object('total_rows_input', 7, 'object_count', 5, 'criteria_id', null));
END $$;
