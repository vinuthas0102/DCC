/*
# Restrict real DCC payments to Estate Managers

1. Purpose
- Prevents department users, department officials, government officials, and other non-manager roles from recording real DCC payments.
- Keeps payment recording atomic and server-enforced.

2. Modified Function
- `public.dcc_record_payment(uuid, uuid, numeric, text, date, text, text)`
  - Adds a caller-role check before any payment or demand update.
  - Retains existing amount and demand validation.
  - Updates the demand status to `PAID` when fully collected and otherwise preserves `OVERDUE` when the due date has passed.

3. Security
- Revokes public and anonymous execution.
- Grants execution only to authenticated callers whose server-side role is `manager`.
- The browser UI is not the security boundary; direct RPC calls from other roles are rejected.

4. Important Notes
- Existing payment rows and demand balances are not deleted or changed by this migration.
*/

CREATE OR REPLACE FUNCTION public.dcc_record_payment(
  p_demand_id uuid,
  p_object_id uuid,
  p_amount numeric,
  p_payment_mode text,
  p_payment_date date,
  p_reference_number text DEFAULT NULL,
  p_remarks text DEFAULT NULL
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
  v_new_paid numeric;
  v_due_date date;
  v_new_status text;
BEGIN
  IF extensions.get_user_role() <> 'manager' THEN
    RAISE EXCEPTION 'Only Estate Managers can record real payments';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;

  SELECT amount, amount_paid, due_date
  INTO v_total_amount, v_current_paid, v_due_date
  FROM dcc_demands
  WHERE id = p_demand_id;

  IF v_total_amount IS NULL THEN
    RAISE EXCEPTION 'Demand not found';
  END IF;

  IF p_amount > GREATEST(v_total_amount - v_current_paid, 0) THEN
    RAISE EXCEPTION 'Payment amount cannot exceed the outstanding balance';
  END IF;

  INSERT INTO dcc_payments (
    demand_id, object_id, amount, payment_mode, payment_date, reference_number, remarks
  ) VALUES (
    p_demand_id, p_object_id, p_amount, p_payment_mode, p_payment_date, p_reference_number, p_remarks
  )
  RETURNING to_json(dcc_payments.*) INTO v_inserted_row;

  v_new_paid := v_current_paid + p_amount;
  v_new_status := CASE
    WHEN v_new_paid >= v_total_amount THEN 'PAID'
    WHEN v_due_date < CURRENT_DATE THEN 'OVERDUE'
    ELSE 'DUE'
  END;

  UPDATE dcc_demands
  SET amount_paid = v_new_paid, status = v_new_status, updated_at = now()
  WHERE id = p_demand_id;

  RETURN v_inserted_row;
END;
$$;

REVOKE ALL ON FUNCTION public.dcc_record_payment(uuid, uuid, numeric, text, date, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.dcc_record_payment(uuid, uuid, numeric, text, date, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.dcc_record_payment(uuid, uuid, numeric, text, date, text, text) TO authenticated;
