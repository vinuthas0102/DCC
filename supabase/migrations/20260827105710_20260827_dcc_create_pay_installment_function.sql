/*
# DCC: Atomic Installment Row Payment Function

## Purpose
Allows any authenticated user to pay an installment row. The
dcc_installment_rows table has RLS that only allows admin/manager to UPDATE,
so non-manager users clicking "Pay" on an installment row would fail.

## Changes
1. Creates a SECURITY DEFINER function `dcc_pay_installment_row` that:
   - Reads the current installment row
   - Updates paid_amt, paid_date, status, updated_at
   - Returns the updated row as JSON
2. Grants EXECUTE to authenticated users.

## Security
- SECURITY DEFINER: runs as owner, bypassing RLS. This is the controlled
  gateway for installment payments.
- Validates that amount > 0 and the row exists.
- Only modifies dcc_installment_rows.
*/

CREATE OR REPLACE FUNCTION public.dcc_pay_installment_row(
  p_row_id      uuid,
  p_amount      numeric,
  p_payment_date date
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_current      dcc_installment_rows;
  v_new_paid     numeric;
  v_new_status   text;
  v_updated      json;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;

  SELECT * INTO v_current FROM dcc_installment_rows WHERE id = p_row_id;
  IF v_current IS NULL THEN
    RAISE EXCEPTION 'Installment row not found: %', p_row_id;
  END IF;

  v_new_paid := v_current.paid_amt + p_amount;
  v_new_status := CASE WHEN v_new_paid >= v_current.amount THEN 'PAID' ELSE 'DUE' END;

  UPDATE dcc_installment_rows
  SET paid_amt   = v_new_paid,
      paid_date  = CASE WHEN v_new_status = 'PAID' THEN p_payment_date ELSE paid_date END,
      status     = v_new_status,
      updated_at = now()
  WHERE id = p_row_id
  RETURNING to_json(t) INTO v_updated;

  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.dcc_pay_installment_row(uuid, numeric, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dcc_pay_installment_row(uuid, numeric, date) TO authenticated;