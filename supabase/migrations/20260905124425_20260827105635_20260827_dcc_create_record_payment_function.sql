-- DCC record_payment function
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
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;
  INSERT INTO dcc_payments (demand_id, object_id, amount, payment_mode, payment_date, reference_number, remarks)
  VALUES (p_demand_id, p_object_id, p_amount, p_payment_mode, p_payment_date, p_reference_number, p_remarks)
  RETURNING to_json(t) AS v_inserted_row;
  SELECT amount, amount_paid INTO v_total_amount, v_current_paid FROM dcc_demands WHERE id = p_demand_id;
  IF v_total_amount IS NULL THEN
    RAISE EXCEPTION 'Demand not found: %', p_demand_id;
  END IF;
  v_new_paid := v_current_paid + p_amount;
  v_new_status := CASE WHEN v_new_paid >= v_total_amount THEN 'PAID' ELSE 'DUE' END;
  UPDATE dcc_demands SET amount_paid = v_new_paid, status = v_new_status, updated_at = now() WHERE id = p_demand_id;
  RETURN v_inserted_row;
END;
$$;
REVOKE ALL ON FUNCTION public.dcc_record_payment(uuid, uuid, numeric, text, date, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dcc_record_payment(uuid, uuid, numeric, text, date, text, text) TO authenticated;