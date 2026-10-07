/*
# Seed Multiple Rent Demands for Property SEC-14/TYPE-II/42

1. Purpose
   Adds 4 additional monthly RENT demands for the existing property object
   SEC-14/TYPE-II/42 (owner: Rajesh Kumar) to demonstrate the consolidated
   pending demands view in the Object Summary screen. Demands span
   Aug, Sep, Oct 2026 with DUE, OVERDUE and partially-paid statuses.

2. Data inserted
   - 4 new dcc_demands rows (RENT type, PROPERTY object, monthly cadence):
     * Aug 2026 — DUE, amount 3500, due 2026-08-05
     * Sep 2026 — OVERDUE, amount 3500, due 2026-09-05
     * Oct 2026 — DUE, amount 3500, due 2026-10-05
     * Jul 2026 — partially paid, amount 3500, paid 1500, due 2026-07-05, status DUE
   - 1 payment record for the partially-paid Jul demand (1500 via EPAY)

3. Idempotency
   All inserts use ON CONFLICT DO NOTHING or NOT EXISTS guards so re-running
   the migration is safe and will not create duplicates.

4. Security
   No new tables, no RLS policy changes — only demo data inserts.
*/

DO $$
DECLARE
  prop1_id    UUID;
  rajesh_id   UUID;
  rent_type   UUID;
  d_id        UUID;
BEGIN
  -- Resolve existing object, owner, and demand type
  SELECT id INTO prop1_id  FROM dcc_objects WHERE object_ref = 'SEC-14/TYPE-II/42' LIMIT 1;
  SELECT id INTO rajesh_id FROM dcc_object_owners WHERE name = 'Rajesh Kumar' LIMIT 1;
  SELECT id INTO rent_type FROM dcc_demand_types WHERE code = 'RENT' LIMIT 1;

  IF prop1_id IS NULL OR rajesh_id IS NULL OR rent_type IS NULL THEN
    RAISE NOTICE 'Missing object/owner/demand_type — skipping seed';
    RETURN;
  END IF;

  -- Jul 2026 — partially paid (1500 of 3500)
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
  VALUES (prop1_id, rajesh_id, rent_type, DATE '2026-06-01', DATE '2026-07-05', 3500, 1500, 'DUE', 'AUTO')
  ON CONFLICT DO NOTHING;

  -- Aug 2026 — DUE
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
  VALUES (prop1_id, rajesh_id, rent_type, DATE '2026-07-01', DATE '2026-08-05', 3500, 0, 'DUE', 'AUTO')
  ON CONFLICT DO NOTHING;

  -- Sep 2026 — OVERDUE
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
  VALUES (prop1_id, rajesh_id, rent_type, DATE '2026-08-01', DATE '2026-09-05', 3500, 0, 'OVERDUE', 'AUTO')
  ON CONFLICT DO NOTHING;

  -- Oct 2026 — DUE (current month)
  INSERT INTO dcc_demands (object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
  VALUES (prop1_id, rajesh_id, rent_type, DATE '2026-09-01', DATE '2026-10-05', 3500, 0, 'DUE', 'AUTO')
  ON CONFLICT DO NOTHING;

  -- Payment for the partially-paid Jul demand
  SELECT d.id INTO d_id
  FROM dcc_demands d
  WHERE d.object_id = prop1_id
    AND d.demand_type_id = rent_type
    AND d.demand_run_date = DATE '2026-06-01'
    AND d.due_date = DATE '2026-07-05'
  LIMIT 1;

  IF d_id IS NOT NULL THEN
    INSERT INTO dcc_payments (demand_id, object_id, amount, payment_mode, payment_date, reference_number, remarks)
    SELECT d_id, prop1_id, 1500, 'EPAY', DATE '2026-06-28', 'TXN-RENT-JUL-PART', 'Partial rent payment for July'
    WHERE NOT EXISTS (SELECT 1 FROM dcc_payments WHERE demand_id = d_id);
  END IF;
END $$;
