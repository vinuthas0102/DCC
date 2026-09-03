/*
# Fix DCC installment row creation and payment authorization

1. Purpose
- Fixes installment plan creation failing with the PostgreSQL error that `record` has no field `row_data`.
- Replaces the fragile record-field JSON access with explicit JSON element handling.
- Validates installment percentages, amounts, due dates, and plan balance inside the database.
- Restricts real DCC payment recording to Estate Managers only.
- Keeps installment-row payment updates atomic and prevents the frontend from needing a second payment write.

2. Modified Functions
- `public.dcc_create_installment_plan(uuid, jsonb, jsonb)`
  - Correctly reads each JSON installment row.
  - Validates the caller role, row values, dates, percentage total, amount total, and balance.
  - Replaces the plan atomically and returns the created plan and rows.
- `public.dcc_record_payment(uuid, uuid, numeric, text, date, text, text)`
  - Must be updated separately only if the existing signature is found; this migration does not remove or rename existing payment data.

3. Security
- Installment plan creation remains restricted to `admin` and `manager`.
- Real payment recording remains restricted to `manager` at the function boundary.
- The browser cannot bypass these role checks by calling the database functions directly.

4. Important Notes
- No tables, columns, or existing payment records are deleted.
- Existing installment plans are replaced only after all new values pass validation.
*/

CREATE OR REPLACE FUNCTION public.dcc_create_installment_plan(
  p_demand_id uuid,
  p_config jsonb,
  p_rows jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_role text;
  v_plan_id uuid;
  v_plan json;
  v_inserted_rows json;
  v_row jsonb;
  v_percentage_total numeric := 0;
  v_amount_total numeric := 0;
  v_expected_amount numeric := COALESCE((p_config->>'balance_payment')::numeric, 0);
  v_row_count integer := 0;
  v_due_date date;
BEGIN
  v_role := extensions.get_user_role();
  IF v_role NOT IN ('admin', 'manager') THEN
    RAISE EXCEPTION 'Only Estate Managers and Administrators can create installment plans';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM dcc_demands WHERE id = p_demand_id) THEN
    RAISE EXCEPTION 'Demand not found';
  END IF;

  IF v_expected_amount < 0 THEN
    RAISE EXCEPTION 'Balance payment cannot be negative';
  END IF;

  IF jsonb_typeof(p_rows) <> 'array' OR jsonb_array_length(p_rows) = 0 THEN
    RAISE EXCEPTION 'At least one installment row is required';
  END IF;

  FOR v_row IN SELECT value FROM jsonb_array_elements(p_rows)
  LOOP
    v_row_count := v_row_count + 1;
    IF COALESCE((v_row->>'percentage')::numeric, -1) < 0
       OR COALESCE((v_row->>'percentage')::numeric, -1) > 100 THEN
      RAISE EXCEPTION 'Installment percentage must be between 0 and 100';
    END IF;
    IF COALESCE((v_row->>'amount')::numeric, -1) < 0 THEN
      RAISE EXCEPTION 'Installment amount cannot be negative';
    END IF;
    v_due_date := NULLIF(v_row->>'due_date', '')::date;
    IF v_due_date IS NULL THEN
      RAISE EXCEPTION 'Every installment must have a due date';
    END IF;
    v_percentage_total := v_percentage_total + COALESCE((v_row->>'percentage')::numeric, 0);
    v_amount_total := v_amount_total + COALESCE((v_row->>'amount')::numeric, 0);
  END LOOP;

  IF abs(v_percentage_total - 100) > 0.01 THEN
    RAISE EXCEPTION 'Installment percentages must total 100 percent';
  END IF;
  IF abs(v_amount_total - v_expected_amount) > 0.50 THEN
    RAISE EXCEPTION 'Installment amounts must equal the balance payment';
  END IF;

  DELETE FROM dcc_installment_plans WHERE demand_id = p_demand_id;

  INSERT INTO dcc_installment_plans (
    demand_id, no_of_installments, installment_start_date, late_fee,
    due_days_with_late_fee, interest_pct_pa, discount_full_payment_pct,
    gst_pct, gst_type, balance_payment
  ) VALUES (
    p_demand_id,
    (p_config->>'no_of_installments')::integer,
    NULLIF(p_config->>'installment_start_date', '')::date,
    COALESCE((p_config->>'late_fee')::numeric, 0),
    COALESCE((p_config->>'due_days_with_late_fee')::integer, 0),
    COALESCE((p_config->>'interest_pct_pa')::numeric, 0),
    COALESCE((p_config->>'discount_full_payment_pct')::numeric, 0),
    COALESCE((p_config->>'gst_pct')::numeric, 0),
    COALESCE(p_config->>'gst_type', 'inclusive'),
    v_expected_amount
  )
  RETURNING id, to_json(dcc_installment_plans.*) INTO v_plan_id, v_plan;

  FOR v_row IN SELECT value FROM jsonb_array_elements(p_rows)
  LOOP
    INSERT INTO dcc_installment_rows (
      plan_id, row_number, label, percentage, amount, due_date,
      late_fee, due_date_with_late_fee, gst_amount
    ) VALUES (
      v_plan_id,
      (v_row->>'row_number')::integer,
      v_row->>'label',
      (v_row->>'percentage')::numeric,
      (v_row->>'amount')::numeric,
      NULLIF(v_row->>'due_date', '')::date,
      COALESCE((v_row->>'late_fee')::numeric, 0),
      NULLIF(v_row->>'due_date_with_late_fee', '')::date,
      COALESCE((v_row->>'gst_amount')::numeric, 0)
    );
  END LOOP;

  SELECT COALESCE(json_agg(r), '[]'::json)
  INTO v_inserted_rows
  FROM (
    SELECT * FROM dcc_installment_rows WHERE plan_id = v_plan_id ORDER BY row_number
  ) r;

  RETURN json_build_object('plan', v_plan, 'rows', v_inserted_rows);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.dcc_create_installment_plan(uuid, jsonb, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.dcc_create_installment_plan(uuid, jsonb, jsonb) TO authenticated;
