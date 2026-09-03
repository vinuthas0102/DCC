/*
# DCC — Atomic Installment Plan Creation

1. Purpose
- Replaces the multi-step client-side flow (delete plan → insert plan → insert rows)
  with a single atomic SECURITY DEFINER function.
- Fixes the 401 RLS rejection that occurs when the frontend inserts directly into
  dcc_installment_plans: the JWT role claim is sometimes stale after login/role
  switch, so get_user_role() returns 'public' and the INSERT policy rejects.
- Ensures the existing plan is only deleted if the new plan + all rows insert
  successfully. On any failure, the transaction rolls back and the old plan
  remains intact.

2. New Function
- `dcc_create_installment_plan(p_demand_id, p_config jsonb, p_rows jsonb)`
  - SECURITY DEFINER so it bypasses RLS for the internal inserts (same pattern as
    the existing dcc_record_payment and dcc_pay_installment_row functions).
  - Validates the caller's role server-side: only 'admin' and 'manager' may create
    or replace a plan. Other roles get a clear permission error.
  - Deletes any existing plan for the demand, inserts the new plan, inserts all
    installment rows, and returns the created plan + rows as JSON.
  - All inside a single transaction — if row insertion fails, the plan delete and
    plan insert are rolled back automatically.

3. Security
- SECURITY DEFINER with search_path = public, extensions.
- EXECUTE granted to authenticated (the frontend role).
- Role check uses extensions.get_user_role() which reads the JWT claim with a
  fallback to the users table.

4. Important Notes
- The existing RLS policies on dcc_installment_plans and dcc_installment_rows
  remain unchanged. The function bypasses them via SECURITY DEFINER, but the
  server-side role check enforces the same admin/manager restriction.
- The existing dcc_pay_installment_row trigger continues to keep
  installments_paid / installments_due in sync.
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
  v_existing_plan_id uuid;
  v_plan_id uuid;
  v_plan json;
  v_inserted_rows json;
  v_row record;
BEGIN
  -- Validate caller role server-side
  v_role := extensions.get_user_role();
  IF v_role NOT IN ('admin', 'manager') THEN
    RAISE EXCEPTION 'Only Estate Managers and Administrators can create installment plans';
  END IF;

  -- Validate demand exists
  PERFORM 1 FROM dcc_demands WHERE id = p_demand_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demand not found: %', p_demand_id;
  END IF;

  -- Delete existing plan for this demand (replace flow)
  DELETE FROM dcc_installment_plans WHERE demand_id = p_demand_id
    RETURNING id INTO v_existing_plan_id;

  -- Insert the new plan
  INSERT INTO dcc_installment_plans (
    demand_id,
    no_of_installments,
    installment_start_date,
    late_fee,
    due_days_with_late_fee,
    interest_pct_pa,
    discount_full_payment_pct,
    gst_pct,
    gst_type,
    balance_payment
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
    COALESCE((p_config->>'balance_payment')::numeric, 0)
  )
  RETURNING id, to_json(dcc_installment_plans.*) INTO v_plan_id, v_plan;

  -- Insert all installment rows
  FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows) AS row_data
  LOOP
    INSERT INTO dcc_installment_rows (
      plan_id,
      row_number,
      label,
      percentage,
      amount,
      due_date,
      late_fee,
      due_date_with_late_fee,
      gst_amount
    ) VALUES (
      v_plan_id,
      (v_row.row_data->>'row_number')::integer,
      v_row.row_data->>'label',
      (v_row.row_data->>'percentage')::numeric,
      (v_row.row_data->>'amount')::numeric,
      NULLIF(v_row.row_data->>'due_date', '')::date,
      COALESCE((v_row.row_data->>'late_fee')::numeric, 0),
      NULLIF(v_row.row_data->>'due_date_with_late_fee', '')::date,
      COALESCE((v_row.row_data->>'gst_amount')::numeric, 0)
    );
  END LOOP;

  -- Return the created plan and rows
  SELECT COALESCE(json_agg(r), '[]'::json) INTO v_inserted_rows
  FROM (
    SELECT * FROM dcc_installment_rows WHERE plan_id = v_plan_id ORDER BY row_number
  ) r;

  RETURN json_build_object('plan', v_plan, 'rows', v_inserted_rows);
END;
$function$;

-- Grant execute to authenticated (the frontend role)
GRANT EXECUTE ON FUNCTION public.dcc_create_installment_plan(uuid, jsonb, jsonb) TO authenticated;
