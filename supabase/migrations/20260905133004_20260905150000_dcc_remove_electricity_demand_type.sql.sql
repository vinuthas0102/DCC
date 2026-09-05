-- Remove standalone ELECTRICITY demand type and its demo data

-- Delete installment rows for the 3 electricity demands
DELETE FROM dcc_installment_rows
WHERE plan_id IN (
  'e7700000-0000-0000-0000-000000000001',
  'e7700000-0000-0000-0000-000000000002',
  'e7700000-0000-0000-0000-000000000003'
);

-- Delete installment plans for the 3 electricity demands
DELETE FROM dcc_installment_plans
WHERE id IN (
  'e7700000-0000-0000-0000-000000000001',
  'e7700000-0000-0000-0000-000000000002',
  'e7700000-0000-0000-0000-000000000003'
);

-- Delete the 3 electricity demands
DELETE FROM dcc_demands
WHERE id IN (
  'd7700000-0000-0000-0000-000000000001',
  'd7700000-0000-0000-0000-000000000002',
  'd7700000-0000-0000-0000-000000000003'
);

-- Delete the ELECTRICITY demand type
DELETE FROM dcc_demand_types
WHERE code = 'ELECTRICITY';