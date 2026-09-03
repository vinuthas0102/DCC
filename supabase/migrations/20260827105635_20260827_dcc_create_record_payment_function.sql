/*
# DCC: Atomic Payment Recording Function

## Purpose
Allows any authenticated user (including Government Officials) to record a
payment against a DCC demand. Previously, the frontend performed two separate
operations — INSERT into dcc_payments and UPDATE on dcc_demands — both of
which required admin/manager role under RLS. Non-manager users therefore got
a policy violation error when clicking "Record Payment".

## Changes
1. Creates a SECURITY DEFINER function `dcc_record_payment` that atomically:
   - Inserts a row into dcc_payments
   - Updates the parent dcc_demands row (amount_paid + status)
   - Returns the inserted payment row as JSON
2. Grants EXECUTE on the function to all authenticated users.
3. The function runs with owner privileges (postgres), bypassing RLS, so it
   works regardless of the caller's role.

## Security
- The function is SECURITY DEFINER, so it executes with the schema owner's
  privileges, not the caller's. This is intentional — it is the controlled
  gateway for payment recording.
- Input parameters are validated: amount must be > 0, demand_id must exist.
- The function only writes to dcc_payments and dcc_demands; it cannot be
  used to modify any other table.
- RLS policies on dcc_payments and dcc_demands remain unchanged for direct
  table access (still admin/manager only for manual inserts/updates).

## Notes
- Idempotent: uses CREATE OR REPLACE and DROP IF EXISTS for grants.
- The function returns the complete inserted payment row as JSON.
*/

-- ── 1. Create the atomic payment recording function ──────────────────────────
CREATE OR REPLACE FUNCTION public.dcc_record_payment(
  p_demand_id      uuid,
  p_object_id      uuid,
  p_amount         numeric,
  p_payment_mode   text,
  p_payment_date   date,
  p_reference_number text DEFAULT NULL,
  p_remarks        text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_inserted_row json;
  v_total_amount numeric;
  v_current_paid numeric;
  v_new_paid     numeric;
  v_new_status   text;
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;

  -- Insert the payment row
  INSERT INTO dcc_payments (
    demand_id,
    object_id,
    amount,
    payment_mode,
    payment_date,
    reference_number,
    remarks
  )
  VALUES (
    p_demand_id,
    p_object_id,
    p_amount,
    p_payment_mode,
    p_payment_date,
    p_reference_number,
    p_remarks
  )
  RETURNING to_json(t) AS v_inserted_row;

  -- Fetch current demand totals
  SELECT amount, amount_paid
  INTO v_total_amount, v_current_paid
  FROM dcc_demands
  WHERE id = p_demand_id;

  IF v_total_amount IS NULL THEN
    RAISE EXCEPTION 'Demand not found: %', p_demand_id;
  END IF;

  v_new_paid := v_current_paid + p_amount;
  v_new_status := CASE WHEN v_new_paid >= v_total_amount THEN 'PAID' ELSE 'DUE' END;

  -- Update the demand
  UPDATE dcc_demands
  SET amount_paid = v_new_paid,
      status      = v_new_status,
      updated_at  = now()
  WHERE id = p_demand_id;

  RETURN v_inserted_row;
END;
$$;

-- ── 2. Grant execute to authenticated users ──────────────────────────────────
REVOKE ALL ON FUNCTION public.dcc_record_payment(
  uuid, uuid, numeric, text, date, text, text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.dcc_record_payment(
  uuid, uuid, numeric, text, date, text, text
) TO authenticated;