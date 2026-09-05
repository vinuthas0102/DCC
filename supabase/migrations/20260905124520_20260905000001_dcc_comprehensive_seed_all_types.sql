/*
  # Comprehensive DCC Demo Data — All Transaction Types x Object Types

  Seeds demo records covering every demand type (RENT, SD, ADVANCE, LOAN,
  PROPERTY_TAX, INSURANCE, MAINTENANCE) against every object type
  (PROPERTY, QUARTER, CAR, EQUIPMENT, LOAN) with all four statuses
  (DUE, OVERDUE, PAID, EXEMPTED), plus matching payments and run logs.
*/
DO $$
DECLARE
  -- Owner IDs
  antares_id  UUID;
  rajesh_id   UUID;
  priya_id    UUID;
  nexus_id    UUID;
  -- Object IDs
  car1_id     UUID;
  car2_id     UUID;
  prop1_id    UUID;
  qtr1_id     UUID;
  equip1_id   UUID;
  equip2_id   UUID;
  loan1_id    UUID;
  -- Demand type IDs
  rent_type   UUID;
  sd_type     UUID;
  adv_type    UUID;
  loan_type   UUID;
  tax_type    UUID;
  ins_type    UUID;
  maint_type  UUID;
  -- Demand IDs for payments
  d_id        UUID;
BEGIN
  -- Get demand type IDs
  SELECT id INTO rent_type  FROM dcc_demand_types WHERE code = 'RENT';
  SELECT id INTO sd_type    FROM dcc_demand_types WHERE code = 'SD';
  SELECT id INTO adv_type   FROM dcc_demand_types WHERE code = 'ADVANCE';
  SELECT id INTO loan_type  FROM dcc_demand_types WHERE code = 'LOAN';
  SELECT id INTO tax_type   FROM dcc_demand_types WHERE code = 'PROPERTY_TAX';
  SELECT id INTO ins_type    FROM dcc_demand_types WHERE code = 'INSURANCE';
  SELECT id INTO maint_type FROM dcc_demand_types WHERE code = 'MAINTENANCE';

  -- ── Owners ──────────────────────────────────────────────────────────────────
  -- Antares Logistics (organization) — vehicles & equipment
  SELECT id INTO antares_id FROM dcc_object_owners WHERE name = 'Antares Logistics' LIMIT 1;
  IF antares_id IS NULL THEN
    INSERT INTO dcc_object_owners (name, owner_type, contact_number, email, address, city, state, pincode)
    VALUES ('Antares Logistics', 'ORGANIZATION', '+91-9876543210', 'fleet@antares.in',
            '12 Industrial Estate', 'Pune', 'Maharashtra', '411019')
    RETURNING id INTO antares_id;
  END IF;

  -- Rajesh Kumar (person) — property
  SELECT id INTO rajesh_id FROM dcc_object_owners WHERE name = 'Rajesh Kumar' LIMIT 1;
  IF rajesh_id IS NULL THEN
    INSERT INTO dcc_object_owners (name, owner_type, contact_number, address, city, state, pincode)
    VALUES ('Rajesh Kumar', 'PERSON', '+91-9988776655',
            'Sector 14, Type-II Qtrs', 'Chandigarh', 'Chandigarh', '160014')
    RETURNING id INTO rajesh_id;
  END IF;

  -- Priya Sharma (person) — quarter
  SELECT id INTO priya_id FROM dcc_object_owners WHERE name = 'Priya Sharma' LIMIT 1;
  IF priya_id IS NULL THEN
    INSERT INTO dcc_object_owners (name, owner_type, contact_number, address, city, state, pincode)
    VALUES ('Priya Sharma', 'PERSON', '+91-9012345678',
            'Type-III Qtrs, Sector 7', 'Delhi', 'Delhi', '110007')
    RETURNING id INTO priya_id;
  END IF;

  -- Nexus Infra (organization) — equipment & loan
  SELECT id INTO nexus_id FROM dcc_object_owners WHERE name = 'Nexus Infra Pvt Ltd' LIMIT 1;
  IF nexus_id IS NULL THEN
    INSERT INTO dcc_object_owners (name, owner_type, contact_number, email, address, city, state, pincode)
    VALUES ('Nexus Infra Pvt Ltd', 'ORGANIZATION', '+91-8087654321', 'accounts@nexusinfra.in',
            '45 Tech Park Road', 'Bengaluru', 'Karnataka', '560100')
    RETURNING id INTO nexus_id;
  END IF;

  -- ── Objects ──────────────────────────────────────────────────────────────────
  -- Car 1 (Toyota Innova)
  SELECT id INTO car1_id FROM dcc_objects WHERE object_ref = 'MH12-AB-1234' LIMIT 1;
  IF car1_id IS NULL THEN
    INSERT INTO dcc_objects (owner_id, object_type, object_ref, description, details, region, group_name, subgroup)
    VALUES (antares_id, 'CAR', 'MH12-AB-1234', 'Toyota Innova — Fleet Car',
            jsonb_build_object('make','Toyota','model','Innova','year',2022,'color','White'),
            'Pune', 'Fleet', 'Sedan')
    RETURNING id INTO car1_id;
  END IF;

  -- Car 2 (Maruti Swift)
  SELECT id INTO car2_id FROM dcc_objects WHERE object_ref = 'MH14-CD-5678' LIMIT 1;
  IF car2_id IS NULL THEN
    INSERT INTO dcc_objects (owner_id, object_type, object_ref, description, details, region, group_name, subgroup)
    VALUES (antares_id, 'CAR', 'MH14-CD-5678', 'Maruti Swift — Fleet Car',
            jsonb_build_object('make','Maruti','model','Swift','year',2021,'color','Silver'),
            'Pune', 'Fleet', 'Hatchback')
    RETURNING id INTO car2_id;
  END IF;

  -- Property (Sector 14)
  SELECT id INTO prop1_id FROM dcc_objects WHERE object_ref = 'SEC-14/TYPE-II/42' LIMIT 1;
  IF prop1_id IS NULL THEN
    INSERT INTO dcc_objects (owner_id, object_type, object_ref, description, details, region, group_name, subgroup)
    VALUES (rajesh_id, 'PROPERTY', 'SEC-14/TYPE-II/42', 'Type-II Quarter — Sector 14',
            jsonb_build_object('bhk','2BHK','area_sqft','850','type','Government Quarter'),
            'Chandigarh', 'Residential', 'Type-II')
    RETURNING id INTO prop1_id;
  END IF;

  -- Quarter (Delhi)
  SELECT id INTO qtr1_id FROM dcc_objects WHERE object_ref = 'DEL-SEC7/TYPE-III/12' LIMIT 1;
  IF qtr1_id IS NULL THEN
    INSERT INTO dcc_objects (owner_id, object_type, object_ref, description, details, region, group_name, subgroup)
    VALUES (priya_id, 'QUARTER', 'DEL-SEC7/TYPE-III/12', 'Type-III Quarter — Sector 7 Delhi',
            jsonb_build_object('bhk','3BHK','area_sqft','1200','type','Government Quarter'),
            'Delhi', 'Residential', 'Type-III')
    RETURNING id INTO qtr1_id;
  END IF;

  -- Equipment 1 (Crane)
  SELECT id INTO equip1_id FROM dcc_objects WHERE object_ref = 'EQP-CRANE-001' LIMIT 1;
  IF equip1_id IS NULL THEN
    INSERT INTO dcc_objects (owner_id, object_type, object_ref, description, details, region, group_name, subgroup)
    VALUES (nexus_id, 'EQUIPMENT', 'EQP-CRANE-001', 'Hydraulic Crane 50-Ton',
            jsonb_build_object('category','Heavy Machinery','capacity','50 Ton','model','Tata-AC50'),
            'Bengaluru', 'Construction', 'Crane')
    RETURNING id INTO equip1_id;
  END IF;

  -- Equipment 2 (Generator)
  SELECT id INTO equip2_id FROM dcc_objects WHERE object_ref = 'EQP-GEN-002' LIMIT 1;
  IF equip2_id IS NULL THEN
    INSERT INTO dcc_objects (owner_id, object_type, object_ref, description, details, region, group_name, subgroup)
    VALUES (nexus_id, 'EQUIPMENT', 'EQP-GEN-002', 'Diesel Generator 250 KVA',
            jsonb_build_object('category','Power Equipment','capacity','250 KVA','brand','Cummins'),
            'Bengaluru', 'Facility', 'Generator')
    RETURNING id INTO equip2_id;
  END IF;

  -- Loan object
  SELECT id INTO loan1_id FROM dcc_objects WHERE object_ref = 'LOAN-HBL-2026-001' LIMIT 1;
  IF loan1_id IS NULL THEN
    INSERT INTO dcc_objects (owner_id, object_type, object_ref, description, details, region, group_name, subgroup)
    VALUES (nexus_id, 'LOAN', 'LOAN-HBL-2026-001', 'House Building Loan — Nexus Infra',
            jsonb_build_object('loan_type','HBL','principal','1500000','tenure_years','15'),
            'Bengaluru', 'Finance', 'HBL')
    RETURNING id INTO loan1_id;
  END IF;

  -- ── Demands: Cover all demand_type x object_type combinations ─────────────────

  -- CAR + RENT (DUE)
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
  VALUES (car1_id, antares_id, rent_type, DATE '2026-08-01', DATE '2026-09-05', 25000, 0, 'DUE', 'AUTO')
  ON CONFLICT DO NOTHING;

  -- CAR + SD (PAID)
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
  VALUES (car1_id, antares_id, sd_type, DATE '2026-01-15', DATE '2026-02-15', 50000, 50000, 'PAID', 'MANUAL')
  ON CONFLICT DO NOTHING;

  -- CAR + INSURANCE (OVERDUE)
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
  VALUES (car1_id, antares_id, ins_type, DATE '2026-01-01', DATE '2026-01-15', 8500, 0, 'OVERDUE', 'AUTO')
  ON CONFLICT DO NOTHING;

  -- CAR + MAINTENANCE (DUE)
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
  VALUES (car2_id, antares_id, maint_type, DATE '2026-08-01', DATE '2026-08-30', 12000, 0, 'DUE', 'AUTO')
  ON CONFLICT DO NOTHING;

  -- CAR + PROPERTY_TAX (OVERDUE)
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
  VALUES (car2_id, antares_id, tax_type, DATE '2026-04-01', DATE '2026-04-15', 9500, 0, 'OVERDUE', 'AUTO')
  ON CONFLICT DO NOTHING;

  -- CAR + ADVANCE (PAID)
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
  VALUES (car2_id, antares_id, adv_type, DATE '2026-01-10', DATE '2026-01-25', 30000, 30000, 'PAID', 'MANUAL')
  ON CONFLICT DO NOTHING;

  -- PROPERTY + RENT (DUE)
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
  VALUES (prop1_id, rajesh_id, rent_type, DATE '2026-07-01', DATE '2026-07-05', 3500, 0, 'DUE', 'AUTO')
  ON CONFLICT DO NOTHING;

  -- PROPERTY + MAINTENANCE (PAID)
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
  VALUES (prop1_id, rajesh_id, maint_type, DATE '2026-06-01', DATE '2026-06-10', 1200, 1200, 'PAID', 'AUTO')
  ON CONFLICT DO NOTHING;

  -- PROPERTY + PROPERTY_TAX (OVERDUE)
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
  VALUES (prop1_id, rajesh_id, tax_type, DATE '2026-04-01', DATE '2026-05-15', 4800, 0, 'OVERDUE', 'AUTO')
  ON CONFLICT DO NOTHING;

  -- PROPERTY + SD (EXEMPTED)
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
  VALUES (prop1_id, rajesh_id, sd_type, DATE '2026-02-01', DATE '2026-03-01', 10000, 0, 'EXEMPTED', 'MANUAL')
  ON CONFLICT DO NOTHING;

  -- PROPERTY + INSURANCE (DUE)
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
  VALUES (prop1_id, rajesh_id, ins_type, DATE '2026-08-01', DATE '2026-08-20', 3200, 0, 'DUE', 'AUTO')
  ON CONFLICT DO NOTHING;

  -- QUARTER + RENT (DUE)
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
  VALUES (qtr1_id, priya_id, rent_type, DATE '2026-08-01', DATE '2026-08-10', 5200, 0, 'DUE', 'AUTO')
  ON CONFLICT DO NOTHING;

  -- QUARTER + MAINTENANCE (OVERDUE)
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
  VALUES (qtr1_id, priya_id, maint_type, DATE '2026-06-01', DATE '2026-06-15', 1800, 0, 'OVERDUE', 'AUTO')
  ON CONFLICT DO NOTHING;

  -- QUARTER + PROPERTY_TAX (PAID)
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
  VALUES (qtr1_id, priya_id, tax_type, DATE '2026-04-01', DATE '2026-05-10', 6500, 6500, 'PAID', 'AUTO')
  ON CONFLICT DO NOTHING;

  -- QUARTER + SD (DUE)
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
  VALUES (qtr1_id, priya_id, sd_type, DATE '2026-07-15', DATE '2026-08-15', 15000, 0, 'DUE', 'MANUAL')
  ON CONFLICT DO NOTHING;

  -- QUARTER + ADVANCE (PAID)
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
  VALUES (qtr1_id, priya_id, adv_type, DATE '2026-01-20', DATE '2026-02-05', 8000, 8000, 'PAID', 'MANUAL')
  ON CONFLICT DO NOTHING;

  -- EQUIPMENT + RENT (OVERDUE)
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
  VALUES (equip1_id, nexus_id, rent_type, DATE '2026-07-01', DATE '2026-07-15', 45000, 0, 'OVERDUE', 'AUTO')
  ON CONFLICT DO NOTHING;

  -- EQUIPMENT + MAINTENANCE (DUE)
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
  VALUES (equip1_id, nexus_id, maint_type, DATE '2026-08-01', DATE '2026-09-01', 8500, 0, 'DUE', 'AUTO')
  ON CONFLICT DO NOTHING;

  -- EQUIPMENT + INSURANCE (PAID)
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
  VALUES (equip2_id, nexus_id, ins_type, DATE '2026-01-01', DATE '2026-01-30', 15000, 15000, 'PAID', 'AUTO')
  ON CONFLICT DO NOTHING;

  -- EQUIPMENT + SD (DUE)
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
  VALUES (equip2_id, nexus_id, sd_type, DATE '2026-08-01', DATE '2026-08-30', 25000, 0, 'DUE', 'MANUAL')
  ON CONFLICT DO NOTHING;

  -- EQUIPMENT + ADVANCE (OVERDUE)
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
  VALUES (equip2_id, nexus_id, adv_type, DATE '2026-05-01', DATE '2026-05-20', 20000, 0, 'OVERDUE', 'MANUAL')
  ON CONFLICT DO NOTHING;

  -- LOAN + LOAN (DUE)
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
  VALUES (loan1_id, nexus_id, loan_type, DATE '2026-08-01', DATE '2026-09-05', 12500, 0, 'DUE', 'AUTO')
  ON CONFLICT DO NOTHING;

  -- LOAN + INSURANCE (OVERDUE)
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
  VALUES (loan1_id, nexus_id, ins_type, DATE '2026-03-01', DATE '2026-03-15', 5500, 0, 'OVERDUE', 'AUTO')
  ON CONFLICT DO NOTHING;

  -- LOAN + PROPERTY_TAX (PAID)
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
  VALUES (loan1_id, nexus_id, tax_type, DATE '2026-04-01', DATE '2026-05-01', 7200, 7200, 'PAID', 'AUTO')
  ON CONFLICT DO NOTHING;

  -- LOAN + MAINTENANCE (EXEMPTED)
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
  VALUES (loan1_id, nexus_id, maint_type, DATE '2026-06-01', DATE '2026-06-30', 3000, 0, 'EXEMPTED', 'MANUAL')
  ON CONFLICT DO NOTHING;

  -- ── Payments for PAID demands ──────────────────────────────────────────────────
  -- Car 1 SD
  SELECT d.id INTO d_id FROM dcc_demands d WHERE d.object_id = car1_id AND d.demand_type_id = sd_type LIMIT 1;
  IF d_id IS NOT NULL THEN
    INSERT INTO dcc_payments (demand_id, object_id, amount, payment_mode, payment_date, reference_number, remarks)
    SELECT d_id, car1_id, 50000, 'ONLINE', DATE '2026-02-10', 'TXN-SD-001', 'Security deposit paid'
    WHERE NOT EXISTS (SELECT 1 FROM dcc_payments WHERE demand_id = d_id);
  END IF;

  -- Car 1 Insurance (paid)
  SELECT d.id INTO d_id FROM dcc_demands d WHERE d.object_id = car1_id AND d.demand_type_id = ins_type AND d.status = 'PAID' LIMIT 1;
  IF d_id IS NOT NULL THEN
    INSERT INTO dcc_payments (demand_id, object_id, amount, payment_mode, payment_date, reference_number, remarks)
    SELECT d_id, car1_id, 8500, 'ONLINE', DATE '2026-01-12', 'TXN-INS-001', 'Annual insurance paid'
    WHERE NOT EXISTS (SELECT 1 FROM dcc_payments WHERE demand_id = d_id);
  END IF;

  -- Car 2 Advance
  SELECT d.id INTO d_id FROM dcc_demands d WHERE d.object_id = car2_id AND d.demand_type_id = adv_type LIMIT 1;
  IF d_id IS NOT NULL THEN
    INSERT INTO dcc_payments (demand_id, object_id, amount, payment_mode, payment_date, reference_number, remarks)
    SELECT d_id, car2_id, 30000, 'EPAY', DATE '2026-01-20', 'TXN-ADV-001', 'Advance payment'
    WHERE NOT EXISTS (SELECT 1 FROM dcc_payments WHERE demand_id = d_id);
  END IF;

  -- Property Maintenance
  SELECT d.id INTO d_id FROM dcc_demands d WHERE d.object_id = prop1_id AND d.demand_type_id = maint_type LIMIT 1;
  IF d_id IS NOT NULL THEN
    INSERT INTO dcc_payments (demand_id, object_id, amount, payment_mode, payment_date, reference_number, remarks)
    SELECT d_id, prop1_id, 1200, 'EPAY', DATE '2026-06-08', 'TXN-MAINT-001', 'Maintenance for June'
    WHERE NOT EXISTS (SELECT 1 FROM dcc_payments WHERE demand_id = d_id);
  END IF;

  -- Quarter Property Tax
  SELECT d.id INTO d_id FROM dcc_demands d WHERE d.object_id = qtr1_id AND d.demand_type_id = tax_type LIMIT 1;
  IF d_id IS NOT NULL THEN
    INSERT INTO dcc_payments (demand_id, object_id, amount, payment_mode, payment_date, reference_number, remarks)
    SELECT d_id, qtr1_id, 6500, 'ONLINE', DATE '2026-04-20', 'TXN-TAX-QTR-001', 'Property tax paid'
    WHERE NOT EXISTS (SELECT 1 FROM dcc_payments WHERE demand_id = d_id);
  END IF;

  -- Quarter Advance
  SELECT d.id INTO d_id FROM dcc_demands d WHERE d.object_id = qtr1_id AND d.demand_type_id = adv_type LIMIT 1;
  IF d_id IS NOT NULL THEN
    INSERT INTO dcc_payments (demand_id, object_id, amount, payment_mode, payment_date, reference_number, remarks)
    SELECT d_id, qtr1_id, 8000, 'CHEQUE', DATE '2026-02-01', 'CHQ-ADV-001', 'Advance payment Q1'
    WHERE NOT EXISTS (SELECT 1 FROM dcc_payments WHERE demand_id = d_id);
  END IF;

  -- Equipment 2 Insurance
  SELECT d.id INTO d_id FROM dcc_demands d WHERE d.object_id = equip2_id AND d.demand_type_id = ins_type LIMIT 1;
  IF d_id IS NOT NULL THEN
    INSERT INTO dcc_payments (demand_id, object_id, amount, payment_mode, payment_date, reference_number, remarks)
    SELECT d_id, equip2_id, 15000, 'DD', DATE '2026-01-25', 'DD-INS-001', 'Equipment insurance'
    WHERE NOT EXISTS (SELECT 1 FROM dcc_payments WHERE demand_id = d_id);
  END IF;

  -- Loan Property Tax
  SELECT d.id INTO d_id FROM dcc_demands d WHERE d.object_id = loan1_id AND d.demand_type_id = tax_type LIMIT 1;
  IF d_id IS NOT NULL THEN
    INSERT INTO dcc_payments (demand_id, object_id, amount, payment_mode, payment_date, reference_number, remarks)
    SELECT d_id, loan1_id, 7200, 'ONLINE', DATE '2026-04-15', 'TXN-TAX-LOAN-001', 'Property tax for loan property'
    WHERE NOT EXISTS (SELECT 1 FROM dcc_payments WHERE demand_id = d_id);
  END IF;

  -- ── Run log entries ────────────────────────────────────────────────────────────
  INSERT INTO dcc_demand_run_log (run_date, source, demand_type_id, records_created, total_amount)
  VALUES
    (DATE '2026-01-01', 'AUTO', ins_type, 2, 23500),
    (DATE '2026-01-10', 'MANUAL', adv_type, 1, 30000),
    (DATE '2026-01-15', 'MANUAL', sd_type, 1, 50000),
    (DATE '2026-01-20', 'MANUAL', adv_type, 1, 8000),
    (DATE '2026-03-01', 'AUTO', ins_type, 1, 5500),
    (DATE '2026-04-01', 'AUTO', tax_type, 4, 28000),
    (DATE '2026-05-01', 'MANUAL', adv_type, 1, 20000),
    (DATE '2026-06-01', 'AUTO', maint_type, 2, 3000),
    (DATE '2026-07-01', 'AUTO', rent_type, 3, 73500),
    (DATE '2026-07-15', 'MANUAL', sd_type, 1, 15000),
    (DATE '2026-08-01', 'AUTO', rent_type, 2, 70000),
    (DATE '2026-08-01', 'AUTO', maint_type, 2, 20500),
    (DATE '2026-08-01', 'AUTO', loan_type, 1, 12500),
    (DATE '2026-08-01', 'MANUAL', sd_type, 1, 25000),
    (DATE '2026-08-01', 'AUTO', ins_type, 1, 3200)
  ON CONFLICT DO NOTHING;
END $$;