-- DCC pay_installment_row function
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
  SET paid_amt = v_new_paid, paid_date = CASE WHEN v_new_status = 'PAID' THEN p_payment_date ELSE paid_date END, status = v_new_status, updated_at = now()
  WHERE id = p_row_id
  RETURNING to_json(t) INTO v_updated;
  RETURN v_updated;
END;
$$;
REVOKE ALL ON FUNCTION public.dcc_pay_installment_row(uuid, numeric, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dcc_pay_installment_row(uuid, numeric, date) TO authenticated;