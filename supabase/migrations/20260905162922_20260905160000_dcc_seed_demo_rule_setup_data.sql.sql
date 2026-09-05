/*
# Seed DCC-Keyed Demo Demand Rules for Rule Setup Screen

1. Purpose
   Populates the `payable_criteria_mt` table with 10 diverse DCC-keyed demo
   rules so the Demand Rule Setup screen shows meaningful data on first load.
   Each rule has DCC keying columns set (demand_type_id, object_type,
   object_owner_id, import_source) plus representative child spec rows
   (full payment, advance, installment, penalty, alert, increase, collection
   exceptions, instalment grid).

2. Approach
   - Uses a DO $$ block to insert master rows and capture their UUIDs.
   - Links to existing dcc_demand_types by code (RENT, SD, LOAN, MAINT,
     PROPERTY_TAX, INSURANCE, ADVANCE).
   - Links to existing dcc_object_owners by name.
   - Covers all 4 import sources (AUTO, TPA, EXCEL, MANUAL).
   - Covers multiple frequency codes (monthly, quarterly, yearly, instalment).
   - Some rules set to inactive to demonstrate the active/inactive distinction.
   - Varies next_run_date so some show "Next run" and some show "No run yet".
   - Idempotent: checks for existing DCC-keyed rows before inserting.

3. Tables affected
   - payable_criteria_mt (INSERT)
   - payable_full_payment_specs (INSERT)
   - payable_advance_specs (INSERT)
   - payable_installment_specs (INSERT)
   - payable_penalty_slabs (INSERT)
   - payable_alert_specs (INSERT)
   - payable_increase_specs (INSERT)
   - payable_collection_exceptions (INSERT)
   - payable_instalment_grid (INSERT) — only for the freq-code-95 rule

4. Security
   - No schema changes; no policy changes.
   - All inserts respect existing RLS (admin/manager can INSERT).

5. Important notes
   - This migration is safe to re-run: it only inserts if no DCC-keyed rules
     exist yet (checked via demand_type_id IS NOT NULL).
   - Child rows cascade on delete from the master table.
*/

DO $$
DECLARE
  c UUID;
  dt_rent UUID;
  dt_sd UUID;
  dt_loan UUID;
  dt_maint UUID;
  dt_tax UUID;
  dt_ins UUID;
  dt_adv UUID;
  own_rajesh UUID;
  own_priya UUID;
  own_antares UUID;
  own_nexus UUID;
  existing_count INTEGER;
BEGIN
  -- Check if DCC-keyed rules already exist
  SELECT count(*) INTO existing_count FROM payable_criteria_mt WHERE demand_type_id IS NOT NULL;
  IF existing_count > 0 THEN RETURN; END IF;

  -- Resolve demand type UUIDs by code
  SELECT id INTO dt_rent FROM dcc_demand_types WHERE code = 'RENT';
  SELECT id INTO dt_sd   FROM dcc_demand_types WHERE code = 'SD';
  SELECT id INTO dt_loan FROM dcc_demand_types WHERE code = 'LOAN';
  SELECT id INTO dt_maint FROM dcc_demand_types WHERE code = 'MAINTENANCE';
  SELECT id INTO dt_tax  FROM dcc_demand_types WHERE code = 'PROPERTY_TAX';
  SELECT id INTO dt_ins  FROM dcc_demand_types WHERE code = 'INSURANCE';
  SELECT id INTO dt_adv  FROM dcc_demand_types WHERE code = 'ADVANCE';

  -- Resolve owner UUIDs by name
  SELECT id INTO own_rajesh  FROM dcc_object_owners WHERE name = 'Rajesh Kumar';
  SELECT id INTO own_priya  FROM dcc_object_owners WHERE name = 'Priya Sharma';
  SELECT id INTO own_antares FROM dcc_object_owners WHERE name = 'Antares Logistics';
  SELECT id INTO own_nexus   FROM dcc_object_owners WHERE name = 'Nexus Infra Pvt Ltd';

  -- ── Rule 1: Rent — Monthly Auto for Rajesh Kumar (PROPERTY) ──
  INSERT INTO payable_criteria_mt (
    dept, subdept, module_id, location, grade_designation,
    payable_transaction_type, first_btm_run_date, subsequent_btm_run_day,
    next_run_date, available_payment_modes, include_gst, is_active,
    demand_type_id, object_type, object_owner_id, import_source,
    generation_frequency_code, default_demand_amount, default_gst_pct,
    due_date_reference, grace_period_days
  ) VALUES (
    'DCC', '', 'DCC', 'South', 'ALL',
    'RENT', DATE '2026-01-01', '1',
    DATE '2026-10-01', ARRAY['EPAY','MANUAL','SALARY_ADJUSTED']::text[], false, true,
    dt_rent, 'PROPERTY', own_rajesh, 'AUTO',
    1, 25000, 0,
    'Run', 5
  ) RETURNING id INTO c;

  INSERT INTO payable_full_payment_specs (criteria_id, reference_date, days_offset, discount_slabs)
  VALUES (c, 'allotted_date', 45, jsonb_build_array(
    jsonb_build_object('days_offset',15,'discount_pct',2,'discount_amount',0,'applicable_days',15),
    jsonb_build_object('days_offset',30,'discount_pct',1,'discount_amount',0,'applicable_days',30)
  ));
  INSERT INTO payable_advance_specs (criteria_id, advance_type, advance_value, reference_date, days_offset)
  VALUES (c, 'PERCENTAGE', 10, 'allotted_date', 7);
  INSERT INTO payable_installment_specs (criteria_id, installment_type, installment_value, reference_date, days_offset)
  VALUES (c, 'PERCENTAGE', 20, 'allotted_date', 30);
  INSERT INTO payable_penalty_slabs (criteria_id, slab_row, penalty_type, penalty_value, late_days)
  VALUES (c, 1, 'PERCENTAGE', 1, 7), (c, 2, 'PERCENTAGE', 2, 15), (c, 3, 'AMOUNT', 500, 30);
  INSERT INTO payable_alert_specs (criteria_id, days_before_due, message_hook)
  VALUES (c, 5, 'HOOK_RENT_DUE_REMINDER');
  INSERT INTO payable_increase_specs (criteria_id, increase_after_months, increase_pct, increase_min, increase_max, alert_message_hook)
  VALUES (c, 12, 5, 500, 5000, 'HOOK_RENT_INCREASE_ALERT');

  -- ── Rule 2: Security Deposit — Manual for Rajesh Kumar (PROPERTY) ──
  INSERT INTO payable_criteria_mt (
    dept, subdept, module_id, location, grade_designation,
    payable_transaction_type, first_btm_run_date, subsequent_btm_run_day,
    next_run_date, available_payment_modes, include_gst, is_active,
    demand_type_id, object_type, object_owner_id, import_source,
    generation_frequency_code, default_demand_amount, default_gst_pct,
    due_date_reference, grace_period_days
  ) VALUES (
    'DCC', '', 'DCC', 'South', 'ALL',
    'SD', DATE '2026-01-01', '1',
    NULL, ARRAY['EPAY','CHEQUE','DD']::text[], false, true,
    dt_sd, 'PROPERTY', own_rajesh, 'MANUAL',
    89, 50000, 0,
    'Run', 15
  ) RETURNING id INTO c;

  INSERT INTO payable_full_payment_specs (criteria_id, reference_date, days_offset, discount_slabs)
  VALUES (c, 'allotted_date', 30, '[]'::jsonb);
  INSERT INTO payable_advance_specs (criteria_id, advance_type, advance_value, reference_date, days_offset)
  VALUES (c, 'AMOUNT', 5000, 'allotted_date', 0);
  INSERT INTO payable_penalty_slabs (criteria_id, slab_row, penalty_type, penalty_value, late_days)
  VALUES (c, 1, 'PERCENTAGE', 2, 10), (c, 2, 'AMOUNT', 1000, 30);
  INSERT INTO payable_alert_specs (criteria_id, days_before_due, message_hook)
  VALUES (c, 7, 'HOOK_SD_DUE_REMINDER');

  -- ── Rule 3: Loan Instalment — Auto for Antares Logistics (LOAN) ──
  INSERT INTO payable_criteria_mt (
    dept, subdept, module_id, location, grade_designation,
    payable_transaction_type, first_btm_run_date, subsequent_btm_run_day,
    next_run_date, available_payment_modes, include_gst, is_active,
    demand_type_id, object_type, object_owner_id, import_source,
    generation_frequency_code, default_demand_amount, default_gst_pct,
    due_date_reference, grace_period_days
  ) VALUES (
    'DCC', '', 'DCC', 'West', 'ALL',
    'LOAN', DATE '2026-01-01', '5',
    DATE '2026-09-05', ARRAY['EPAY','MANUAL']::text[], false, true,
    dt_loan, 'LOAN', own_antares, 'AUTO',
    1, 22000, 0,
    'Run', 3
  ) RETURNING id INTO c;

  INSERT INTO payable_full_payment_specs (criteria_id, reference_date, days_offset, discount_slabs)
  VALUES (c, 'allotted_date', 60, jsonb_build_array(
    jsonb_build_object('days_offset',30,'discount_pct',1,'discount_amount',0,'applicable_days',30)
  ));
  INSERT INTO payable_installment_specs (criteria_id, installment_type, installment_value, reference_date, days_offset)
  VALUES (c, 'AMOUNT', 22000, 'allotted_date', 30);
  INSERT INTO payable_penalty_slabs (criteria_id, slab_row, penalty_type, penalty_value, late_days)
  VALUES (c, 1, 'PERCENTAGE', 1, 5), (c, 2, 'PERCENTAGE', 2, 10), (c, 3, 'AMOUNT', 1000, 30);
  INSERT INTO payable_alert_specs (criteria_id, days_before_due, message_hook)
  VALUES (c, 3, 'HOOK_LOAN_DUE_URGENT');
  INSERT INTO payable_increase_specs (criteria_id, increase_after_months, increase_pct, increase_min, increase_max, alert_message_hook)
  VALUES (c, 24, 0, 0, 0, '');

  -- ── Rule 4: Maintenance — TPA for Priya Sharma (PROPERTY) ──
  INSERT INTO payable_criteria_mt (
    dept, subdept, module_id, location, grade_designation,
    payable_transaction_type, first_btm_run_date, subsequent_btm_run_day,
    next_run_date, available_payment_modes, include_gst, is_active,
    demand_type_id, object_type, object_owner_id, import_source,
    generation_frequency_code, default_demand_amount, default_gst_pct,
    due_date_reference, grace_period_days, tpa_url_id
  ) VALUES (
    'DCC', '', 'DCC', 'South', 'ALL',
    'MAINT', DATE '2026-01-01', 'EOM',
    DATE '2026-08-31', ARRAY['EPAY','ONLINE']::text[], true, true,
    dt_maint, 'PROPERTY', own_priya, 'TPA',
    1, 8500, 18,
    'TPA', 0, 'TPA_MAINT_ENDPOINT'
  ) RETURNING id INTO c;

  INSERT INTO payable_full_payment_specs (criteria_id, reference_date, days_offset, discount_slabs)
  VALUES (c, 'handover_date', 15, '[]'::jsonb);
  INSERT INTO payable_advance_specs (criteria_id, advance_type, advance_value, reference_date, days_offset)
  VALUES (c, 'PERCENTAGE', 0, 'handover_date', 0);
  INSERT INTO payable_penalty_slabs (criteria_id, slab_row, penalty_type, penalty_value, late_days)
  VALUES (c, 1, 'PERCENTAGE', 2, 7), (c, 2, 'AMOUNT', 200, 15);
  INSERT INTO payable_alert_specs (criteria_id, days_before_due, message_hook)
  VALUES (c, 3, 'HOOK_MAINT_DUE_REMINDER');
  INSERT INTO payable_collection_exceptions (criteria_id, exception_type, seq_no, demand_slab_min, demand_slab_max, offset_days, applicable_pct, pct_basis, pct_min, pct_max, actual_amount, message_hook)
  VALUES
    (c, 'Penalty', 1, 0, 5000, 7, 1, 'Daily', null, null, null, ''),
    (c, 'Penalty', 2, 5001, 999999, 7, 2, 'Daily', null, null, null, ''),
    (c, 'Discount', 1, 0, 999999, 15, 2, 'Monthly', null, null, null, '');

  -- ── Rule 5: Property Tax — Yearly Excel for Rajesh Kumar (PROPERTY) ──
  INSERT INTO payable_criteria_mt (
    dept, subdept, module_id, location, grade_designation,
    payable_transaction_type, first_btm_run_date, subsequent_btm_run_day,
    next_run_date, available_payment_modes, include_gst, is_active,
    demand_type_id, object_type, object_owner_id, import_source,
    generation_frequency_code, default_demand_amount, default_gst_pct,
    due_date_reference, grace_period_days
  ) VALUES (
    'DCC', '', 'DCC', 'North', 'ALL',
    'TAX', DATE '2026-04-01', '1',
    NULL, ARRAY['EPAY','CHEQUE','DD','ONLINE']::text[], false, true,
    dt_tax, 'PROPERTY', own_rajesh, 'EXCEL',
    81, 45000, 0,
    'Run', 30
  ) RETURNING id INTO c;

  INSERT INTO payable_full_payment_specs (criteria_id, reference_date, days_offset, discount_slabs)
  VALUES (c, 'fiscal_year_beginning', 90, jsonb_build_array(
    jsonb_build_object('days_offset',30,'discount_pct',5,'discount_amount',0,'applicable_days',30),
    jsonb_build_object('days_offset',60,'discount_pct',3,'discount_amount',0,'applicable_days',60)
  ));
  INSERT INTO payable_penalty_slabs (criteria_id, slab_row, penalty_type, penalty_value, late_days)
  VALUES (c, 1, 'PERCENTAGE', 1, 15), (c, 2, 'PERCENTAGE', 2, 30), (c, 3, 'AMOUNT', 2000, 60);
  INSERT INTO payable_alert_specs (criteria_id, days_before_due, message_hook)
  VALUES (c, 15, 'HOOK_TAX_DUE_REMINDER');
  INSERT INTO payable_collection_exceptions (criteria_id, exception_type, seq_no, demand_slab_min, demand_slab_max, offset_days, applicable_pct, pct_basis, pct_min, pct_max, actual_amount, message_hook)
  VALUES
    (c, 'Alert', 1, 0, 999999, 15, 0, 'Monthly', null, null, null, 'HOOK_TAX_EARLY_BIRD'),
    (c, 'Installment', 1, 0, 999999, 30, 50, 'Monthly', null, null, null, '');

  -- ── Rule 6: Insurance — Yearly Auto for Antares Logistics (CAR) ──
  INSERT INTO payable_criteria_mt (
    dept, subdept, module_id, location, grade_designation,
    payable_transaction_type, first_btm_run_date, subsequent_btm_run_day,
    next_run_date, available_payment_modes, include_gst, is_active,
    demand_type_id, object_type, object_owner_id, import_source,
    generation_frequency_code, default_demand_amount, default_gst_pct,
    due_date_reference, grace_period_days
  ) VALUES (
    'DCC', '', 'DCC', 'South', 'ALL',
    'INSURANCE', DATE '2026-01-01', '1',
    DATE '2026-12-01', ARRAY['EPAY','MANUAL','ONLINE']::text[], true, true,
    dt_ins, 'CAR', own_antares, 'AUTO',
    81, 12000, 18,
    'Run', 7
  ) RETURNING id INTO c;

  INSERT INTO payable_full_payment_specs (criteria_id, reference_date, days_offset, discount_slabs)
  VALUES (c, 'calendar_year_beginning', 30, '[]'::jsonb);
  INSERT INTO payable_advance_specs (criteria_id, advance_type, advance_value, reference_date, days_offset)
  VALUES (c, 'PERCENTAGE', 100, 'calendar_year_beginning', 0);
  INSERT INTO payable_penalty_slabs (criteria_id, slab_row, penalty_type, penalty_value, late_days)
  VALUES (c, 1, 'PERCENTAGE', 2, 7), (c, 2, 'AMOUNT', 500, 30);
  INSERT INTO payable_alert_specs (criteria_id, days_before_due, message_hook)
  VALUES (c, 7, 'HOOK_INSURANCE_DUE_REMINDER');

  -- ── Rule 7: Advance — One-time Manual for Priya Sharma (PROPERTY) — INACTIVE ──
  INSERT INTO payable_criteria_mt (
    dept, subdept, module_id, location, grade_designation,
    payable_transaction_type, first_btm_run_date, subsequent_btm_run_day,
    next_run_date, available_payment_modes, include_gst, is_active,
    demand_type_id, object_type, object_owner_id, import_source,
    generation_frequency_code, default_demand_amount, default_gst_pct,
    due_date_reference, grace_period_days
  ) VALUES (
    'DCC', '', 'DCC', 'South', 'ALL',
    'PP', DATE '2026-01-01', '1',
    NULL, ARRAY['EPAY','CHEQUE']::text[], false, false,
    dt_adv, 'PROPERTY', own_priya, 'MANUAL',
    89, 15000, 0,
    'Run', 10
  ) RETURNING id INTO c;

  INSERT INTO payable_full_payment_specs (criteria_id, reference_date, days_offset, discount_slabs)
  VALUES (c, 'allotted_date', 15, '[]'::jsonb);
  INSERT INTO payable_penalty_slabs (criteria_id, slab_row, penalty_type, penalty_value, late_days)
  VALUES (c, 1, 'PERCENTAGE', 1, 7);
  INSERT INTO payable_alert_specs (criteria_id, days_before_due, message_hook)
  VALUES (c, 3, 'HOOK_ADVANCE_DUE_REMINDER');

  -- ── Rule 8: Rent — Instalment (freq code 95) for Nexus Infra (QUARTER) ──
  INSERT INTO payable_criteria_mt (
    dept, subdept, module_id, location, grade_designation,
    payable_transaction_type, first_btm_run_date, subsequent_btm_run_day,
    next_run_date, available_payment_modes, include_gst, is_active,
    demand_type_id, object_type, object_owner_id, import_source,
    generation_frequency_code, default_demand_amount, default_gst_pct,
    due_date_reference, grace_period_days, next_instalment_seq
  ) VALUES (
    'DCC', '', 'DCC', 'Central', 'ALL',
    'RENT', DATE '2026-01-01', '1',
    DATE '2026-09-15', ARRAY['EPAY','MANUAL','SALARY_ADJUSTED']::text[], false, true,
    dt_rent, 'QUARTER', own_nexus, 'AUTO',
    95, 30000, 0,
    'Next', 5, 3
  ) RETURNING id INTO c;

  INSERT INTO payable_full_payment_specs (criteria_id, reference_date, days_offset, discount_slabs)
  VALUES (c, 'allotted_date', 30, jsonb_build_array(
    jsonb_build_object('days_offset',15,'discount_pct',3,'discount_amount',0,'applicable_days',15)
  ));
  INSERT INTO payable_installment_specs (criteria_id, installment_type, installment_value, reference_date, days_offset)
  VALUES (c, 'PERCENTAGE', 25, 'allotted_date', 0);
  INSERT INTO payable_penalty_slabs (criteria_id, slab_row, penalty_type, penalty_value, late_days)
  VALUES (c, 1, 'PERCENTAGE', 1, 5), (c, 2, 'AMOUNT', 300, 15);
  INSERT INTO payable_alert_specs (criteria_id, days_before_due, message_hook)
  VALUES (c, 5, 'HOOK_QUARTER_RENT_REMINDER');
  INSERT INTO payable_increase_specs (criteria_id, increase_after_months, increase_pct, increase_min, increase_max, alert_message_hook)
  VALUES (c, 12, 8, 1000, 10000, 'HOOK_QUARTER_RENT_INCREASE');
  INSERT INTO payable_instalment_grid (criteria_id, object_id, instalment_seq, instalment_date, instalment_amount, next_run_date)
  VALUES
    (c, NULL, 1, DATE '2026-07-15', 7500, DATE '2026-07-15'),
    (c, NULL, 2, DATE '2026-08-15', 7500, DATE '2026-08-15'),
    (c, NULL, 3, DATE '2026-09-15', 7500, DATE '2026-09-15'),
    (c, NULL, 4, DATE '2026-10-15', 7500, DATE '2026-10-15');

  -- ── Rule 9: Maintenance — Quarterly TPA for Nexus Infra (ASSET) ──
  INSERT INTO payable_criteria_mt (
    dept, subdept, module_id, location, grade_designation,
    payable_transaction_type, first_btm_run_date, subsequent_btm_run_day,
    next_run_date, available_payment_modes, include_gst, is_active,
    demand_type_id, object_type, object_owner_id, import_source,
    generation_frequency_code, default_demand_amount, default_gst_pct,
    due_date_reference, grace_period_days, tpa_url_id
  ) VALUES (
    'DCC', '', 'DCC', 'Central', 'ALL',
    'MAINT', DATE '2026-01-01', '15',
    DATE '2026-10-15', ARRAY['EPAY','ONLINE']::text[], true, true,
    dt_maint, 'ASSET', own_nexus, 'TPA',
    75, 5000, 12,
    'TPA', 0, 'TPA_ASSET_MAINT_ENDPOINT'
  ) RETURNING id INTO c;

  INSERT INTO payable_full_payment_specs (criteria_id, reference_date, days_offset, discount_slabs)
  VALUES (c, 'handover_date', 10, '[]'::jsonb);
  INSERT INTO payable_penalty_slabs (criteria_id, slab_row, penalty_type, penalty_value, late_days)
  VALUES (c, 1, 'PERCENTAGE', 1, 7), (c, 2, 'AMOUNT', 250, 15);
  INSERT INTO payable_alert_specs (criteria_id, days_before_due, message_hook)
  VALUES (c, 3, 'HOOK_ASSET_MAINT_REMINDER');
  INSERT INTO payable_collection_exceptions (criteria_id, exception_type, seq_no, demand_slab_min, demand_slab_max, offset_days, applicable_pct, pct_basis, pct_min, pct_max, actual_amount, message_hook)
  VALUES
    (c, 'Penalty', 1, 0, 999999, 7, 1.5, 'Daily', null, null, null, ''),
    (c, 'Alert', 1, 0, 999999, 3, 0, 'Monthly', null, null, null, 'HOOK_ASSET_MAINT_ALERT');

  -- ── Rule 10: Rent — Monthly Excel for Priya Sharma (PROPERTY) — INACTIVE ──
  INSERT INTO payable_criteria_mt (
    dept, subdept, module_id, location, grade_designation,
    payable_transaction_type, first_btm_run_date, subsequent_btm_run_day,
    next_run_date, available_payment_modes, include_gst, is_active,
    demand_type_id, object_type, object_owner_id, import_source,
    generation_frequency_code, default_demand_amount, default_gst_pct,
    due_date_reference, grace_period_days
  ) VALUES (
    'DCC', '', 'DCC', 'East', 'ALL',
    'RENT', DATE '2026-01-01', '1',
    NULL, ARRAY['EPAY','CHEQUE']::text[], false, false,
    dt_rent, 'PROPERTY', own_priya, 'EXCEL',
    1, 18000, 0,
    'Run', 5
  ) RETURNING id INTO c;

  INSERT INTO payable_full_payment_specs (criteria_id, reference_date, days_offset, discount_slabs)
  VALUES (c, 'allotted_date', 30, '[]'::jsonb);
  INSERT INTO payable_advance_specs (criteria_id, advance_type, advance_value, reference_date, days_offset)
  VALUES (c, 'PERCENTAGE', 5, 'allotted_date', 3);
  INSERT INTO payable_penalty_slabs (criteria_id, slab_row, penalty_type, penalty_value, late_days)
  VALUES (c, 1, 'PERCENTAGE', 1, 7), (c, 2, 'AMOUNT', 200, 15);
  INSERT INTO payable_alert_specs (criteria_id, days_before_due, message_hook)
  VALUES (c, 5, 'HOOK_RENT_DUE_REMINDER');
END $$;