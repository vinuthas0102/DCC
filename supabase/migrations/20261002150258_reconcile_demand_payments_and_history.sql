/*
# Reconcile Demand Payments and History

## Purpose
1. Insert a missing ₹45,000 payment record for a PAID demand that had amount_paid=45000 but no matching row in dcc_payments.
2. Reconcile amount_paid on all dcc_demands to match the actual sum of dcc_payments rows.
3. Recalculate demand status based on reconciled amounts (PAID if fully collected, OVERDUE if past due_date, DUE otherwise).

## Changes
- INSERT one row into dcc_payments for demand f59552f0-3db8-4e65-8fc1-eb68b2311f6d (₹45,000, dated 2026-09-25, historical reconciliation).
- UPDATE dcc_demands.amount_paid to match COALESCE(SUM(dcc_payments.amount)) for all demands.
- UPDATE dcc_demands.status:
  - PAID when amount_paid >= amount
  - OVERDUE when amount_paid < amount AND due_date < CURRENT_DATE
  - DUE when amount_paid < amount AND due_date >= CURRENT_DATE
  - EXEMPTED stays unchanged (not touched)

## Safety
- No tables or columns are dropped or renamed.
- No data is deleted — only inserts and updates.
- EXEMPTED demands are left untouched.
*/

-- Step 1: Insert the missing payment record for the ₹45,000 PAID demand
INSERT INTO dcc_payments (demand_id, object_id, amount, payment_mode, payment_date, reference_number, remarks)
SELECT
  'f59552f0-3db8-4e65-8fc1-eb68b2311f6d',
  object_id,
  45000,
  'EPAY',
  '2026-09-25',
  'RECON-45000',
  'Historical reconciliation — payment recorded to match stored amount_paid'
FROM dcc_demands
WHERE id = 'f59552f0-3db8-4e65-8fc1-eb68b2311f6d'
AND NOT EXISTS (
  SELECT 1 FROM dcc_payments WHERE demand_id = 'f59552f0-3db8-4e65-8fc1-eb68b2311f6d'
);

-- Step 2: Reconcile amount_paid across ALL demands to match actual payment sums
UPDATE dcc_demands d
SET amount_paid = COALESCE(
  (SELECT SUM(amount) FROM dcc_payments p WHERE p.demand_id = d.id),
  0
),
updated_at = now()
WHERE d.status <> 'EXEMPTED'
AND COALESCE(d.amount_paid, 0) <> COALESCE(
  (SELECT SUM(amount) FROM dcc_payments p WHERE p.demand_id = d.id),
  0
);

-- Step 3: Recalculate status for non-EXEMPTED demands
-- PAID: fully collected
UPDATE dcc_demands d
SET status = 'PAID',
    updated_at = now()
WHERE d.status <> 'EXEMPTED'
AND d.amount_paid >= d.amount;

-- OVERDUE: partially or fully unpaid AND past due date
UPDATE dcc_demands d
SET status = 'OVERDUE',
    updated_at = now()
WHERE d.status <> 'EXEMPTED'
AND d.status <> 'PAID'
AND d.amount_paid < d.amount
AND d.due_date < CURRENT_DATE;

-- DUE: partially or fully unpaid AND not yet past due date
UPDATE dcc_demands d
SET status = 'DUE',
    updated_at = now()
WHERE d.status <> 'EXEMPTED'
AND d.status <> 'PAID'
AND d.status <> 'OVERDUE'
AND d.amount_paid < d.amount
AND d.due_date >= CURRENT_DATE;
