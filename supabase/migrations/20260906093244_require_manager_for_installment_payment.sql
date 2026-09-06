/*
  # Require manager/admin rights to settle an installment row

  dcc_pay_installment_row is SECURITY DEFINER and was callable by anyone, with no
  authorization check, letting an unauthenticated caller mark any installment as
  paid. It now applies the same role gate as dcc_create_installment_plan and
  dcc_record_payment, and EXECUTE is revoked from anon.
*/

CREATE OR REPLACE FUNCTION public.dcc_pay_installment_row(p_row_id uuid, p_amount numeric, p_payment_date date)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_current    dcc_installment_rows;
  v_new_paid   numeric;
  v_new_status text;
  v_updated    json;
BEGIN
  IF extensions.get_user_role() NOT IN ('admin', 'manager') THEN
    RAISE EXCEPTION 'Only Estate Managers and Administrators can record installment payments';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;

  SELECT * INTO v_current FROM dcc_installment_rows WHERE id = p_row_id;
  IF v_current IS NULL THEN
    RAISE EXCEPTION 'Installment row not found';
  END IF;

  IF p_amount > GREATEST(COALESCE(v_current.amount, 0) - COALESCE(v_current.paid_amt, 0), 0) THEN
    RAISE EXCEPTION 'Payment amount cannot exceed the outstanding installment balance';
  END IF;

  v_new_paid := COALESCE(v_current.paid_amt, 0) + p_amount;
  v_new_status := CASE WHEN v_new_paid >= v_current.amount THEN 'PAID' ELSE 'DUE' END;

  UPDATE dcc_installment_rows
  SET paid_amt = v_new_paid,
      paid_date = CASE WHEN v_new_status = 'PAID' THEN p_payment_date ELSE paid_date END,
      status = v_new_status,
      updated_at = now()
  WHERE id = p_row_id
  RETURNING to_json(dcc_installment_rows.*) INTO v_updated;

  RETURN v_updated;
END;
$function$;

REVOKE ALL ON FUNCTION public.dcc_pay_installment_row(uuid, numeric, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dcc_pay_installment_row(uuid, numeric, date) TO authenticated;

REVOKE ALL ON FUNCTION public.dcc_create_installment_plan(uuid, jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dcc_create_installment_plan(uuid, jsonb, jsonb) TO authenticated;
