/*
  # Apply missing DCC installment schema, functions, and seed data

  1. Schema Changes
  - Adds installment_start_date, due_days_with_late_fee, balance_payment,
    installments_paid, installments_due columns to dcc_installment_plans.
  - Creates trigger to keep installments_paid/due in sync with rows.

  2. Functions
  - Creates dcc_create_installment_plan (atomic plan creation with validation).
  - Replaces dcc_record_payment (restricts to manager role only).

  3. Security
  - Adds anon SELECT policy on dcc_installment_plans and dcc_installment_rows.
  - Revokes anon execute on dcc_create_installment_plan.

  4. Data
  - Seeds installment plans + rows for all 25 DCC demands.
  - Each plan has a Full Payment row (row 0) plus 2 installment rows.
  - Row statuses mirror the parent demand status.
  - Idempotent via ON CONFLICT DO NOTHING.
*/

-- ── 1. Add missing columns to dcc_installment_plans ──────────────────────────────


-- Add new columns to dcc_installment_plans
ALTER TABLE dcc_installment_plans
  ADD COLUMN IF NOT EXISTS installment_start_date DATE,
  ADD COLUMN IF NOT EXISTS due_days_with_late_fee INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_payment NUMERIC(14,2) NOT NULL DEFAULT 0;

ALTER TABLE dcc_installment_plans
  ADD COLUMN IF NOT EXISTS installments_paid INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS installments_due INTEGER NOT NULL DEFAULT 0;

-- ── Trigger to keep installments_paid / installments_due in sync ──────────────
CREATE OR REPLACE FUNCTION dcc_sync_installment_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_plan_id UUID;
BEGIN
  v_plan_id := COALESCE(NEW.plan_id, OLD.plan_id);

  IF v_plan_id IS NOT NULL THEN
    UPDATE dcc_installment_plans
    SET
      installments_paid = (
        SELECT COUNT(*) FROM dcc_installment_rows
        WHERE plan_id = v_plan_id AND row_number > 0 AND status = 'PAID'
      ),
      installments_due = (
        SELECT COUNT(*) FROM dcc_installment_rows
        WHERE plan_id = v_plan_id AND row_number > 0 AND status IN ('DUE','OVERDUE','PENDING')
      ),
      updated_at = now()
    WHERE id = v_plan_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS dcc_ir_sync_counts_ins ON dcc_installment_rows;
CREATE TRIGGER dcc_ir_sync_counts_ins
  AFTER INSERT ON dcc_installment_rows
  FOR EACH ROW EXECUTE FUNCTION dcc_sync_installment_counts();

DROP TRIGGER IF EXISTS dcc_ir_sync_counts_upd ON dcc_installment_rows;
CREATE TRIGGER dcc_ir_sync_counts_upd
  AFTER UPDATE ON dcc_installment_rows
  FOR EACH ROW EXECUTE FUNCTION dcc_sync_installment_counts();

DROP TRIGGER IF EXISTS dcc_ir_sync_counts_del ON dcc_installment_rows;
CREATE TRIGGER dcc_ir_sync_counts_del
  AFTER DELETE ON dcc_installment_rows
  FOR EACH ROW EXECUTE FUNCTION dcc_sync_installment_counts();


-- ── 2. Create atomic installment plan function ────────────────────────────────────


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


-- ── 3. Replace record_payment to restrict to managers ─────────────────────────────


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


-- ── 4. Add anon read access for demo ───────────────────────────────────────────────

-- Demo mode uses a local fake login, so browser requests use the anon role.
-- DCC demands already have an anon read policy; expose only the related demo
-- installment records for read-only display. No anon write policy is added.

CREATE POLICY "dcc_installment_plans_select_anon_demo"
  ON dcc_installment_plans
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "dcc_installment_rows_select_anon_demo"
  ON dcc_installment_rows
  FOR SELECT
  TO anon
  USING (true);


-- ── 5. Seed installment plans for all 25 demands ─────────────────────────────────


INSERT INTO dcc_installment_plans (id, demand_id, no_of_installments, installment_start_date, late_fee, due_days_with_late_fee, interest_pct_pa, discount_full_payment_pct, gst_pct, gst_type, balance_payment, installments_paid, installments_due)
VALUES
  ('e5500000-0000-0000-0000-000000000001', 'afcaa452-02c4-4e1d-80ee-ccc55f905060', 2, '2026-08-01', 100, 15, 0, 0, 0, 'inclusive', 25000, 0, 2),
  ('e5500000-0000-0000-0000-000000000002', '9c55dc3d-f1a1-4bc4-a66c-3cb7136ece55', 2, '2026-01-15', 100, 15, 0, 0, 0, 'inclusive', 50000, 2, 0),
  ('e5500000-0000-0000-0000-000000000003', '3efe41ce-fc1c-4113-a9a1-34421ed3b039', 2, '2026-03-01', 100, 15, 0, 0, 0, 'inclusive', 8500, 0, 2),
  ('e5500000-0000-0000-0000-000000000004', '4a219eef-411e-43aa-8d1c-c64794eb34f3', 2, '2026-08-01', 100, 15, 0, 0, 0, 'inclusive', 12000, 0, 2),
  ('e5500000-0000-0000-0000-000000000005', '279e3550-9bd1-4214-abec-697491f38f62', 2, '2026-03-01', 100, 15, 0, 0, 0, 'inclusive', 9500, 0, 2),
  ('e5500000-0000-0000-0000-000000000006', '0b9e8c5e-cac6-43fd-b771-4ef893727e46', 2, '2026-01-15', 100, 15, 0, 0, 0, 'inclusive', 30000, 2, 0),
  ('e5500000-0000-0000-0000-000000000007', 'd1568ed7-3055-467d-a4d1-f100f85c894e', 2, '2026-08-01', 50, 15, 0, 0, 0, 'inclusive', 3500, 0, 2),
  ('e5500000-0000-0000-0000-000000000008', '49c63fe4-4203-4f1d-9761-5419f865878a', 2, '2026-01-15', 50, 15, 0, 0, 0, 'inclusive', 1200, 2, 0),
  ('e5500000-0000-0000-0000-000000000009', 'ed028f02-0e7f-499e-b5bb-c39a45059bba', 2, '2026-03-01', 50, 15, 0, 0, 0, 'inclusive', 4800, 0, 2),
  ('e5500000-0000-0000-0000-000000000010', '9f6bbcee-6928-4dd3-bb3b-c71fd76b5df6', 2, '2026-02-01', 100, 15, 0, 0, 0, 'inclusive', 10000, 0, 2),
  ('e5500000-0000-0000-0000-000000000011', '56aeba7e-6ca3-409e-ba6e-579c7607d22b', 2, '2026-08-01', 50, 15, 0, 0, 0, 'inclusive', 3200, 0, 2),
  ('e5500000-0000-0000-0000-000000000012', '88eeb00c-1487-4224-aa75-3e3b2009e754', 2, '2026-08-01', 100, 15, 0, 0, 0, 'inclusive', 5200, 0, 2),
  ('e5500000-0000-0000-0000-000000000013', '0e69db52-134c-44ce-a0af-a25d7a4f5e1f', 2, '2026-03-01', 50, 15, 0, 0, 0, 'inclusive', 1800, 0, 2),
  ('e5500000-0000-0000-0000-000000000014', 'd560c0da-543a-4b68-9962-fa5fab89c2c1', 2, '2026-01-15', 100, 15, 0, 0, 0, 'inclusive', 6500, 2, 0),
  ('e5500000-0000-0000-0000-000000000015', '8232cfe9-b99d-4d70-bff7-345e339cf8f4', 2, '2026-08-01', 100, 15, 0, 0, 0, 'inclusive', 15000, 0, 2),
  ('e5500000-0000-0000-0000-000000000016', '61dc476f-1520-4955-8573-6a6d4ed2db88', 2, '2026-01-15', 100, 15, 0, 0, 0, 'inclusive', 8000, 2, 0),
  ('e5500000-0000-0000-0000-000000000017', '2f322e99-7794-417c-b13a-edd5d824ff07', 2, '2026-03-01', 100, 15, 0, 0, 0, 'inclusive', 45000, 0, 2),
  ('e5500000-0000-0000-0000-000000000018', '97b92d3b-e1cf-4905-bf4d-8a541ecfb208', 2, '2026-08-01', 100, 15, 0, 0, 0, 'inclusive', 8500, 0, 2),
  ('e5500000-0000-0000-0000-000000000019', 'b02d9359-cb59-4722-9c90-3201e949f7c8', 2, '2026-01-15', 100, 15, 0, 0, 0, 'inclusive', 15000, 2, 0),
  ('e5500000-0000-0000-0000-000000000020', '862afce7-400c-4c8e-8406-0c6c8e28f66b', 2, '2026-08-01', 100, 15, 0, 0, 0, 'inclusive', 25000, 0, 2),
  ('e5500000-0000-0000-0000-000000000021', '7b0de207-1ae3-4ebe-b119-a60c57fbcdd5', 2, '2026-03-01', 100, 15, 0, 0, 0, 'inclusive', 20000, 0, 2),
  ('e5500000-0000-0000-0000-000000000022', 'b1d7a58b-1179-4e52-b3b7-64d7780ed592', 2, '2026-08-01', 100, 15, 0, 0, 0, 'inclusive', 12500, 0, 2),
  ('e5500000-0000-0000-0000-000000000023', 'd8616e7a-8580-45d2-af8e-41f1472e3b70', 2, '2026-03-01', 100, 15, 0, 0, 0, 'inclusive', 5500, 0, 2),
  ('e5500000-0000-0000-0000-000000000024', '321f3620-d9f7-4dd8-82d0-ec23c01fd9fa', 2, '2026-01-15', 100, 15, 0, 0, 0, 'inclusive', 7200, 2, 0),
  ('e5500000-0000-0000-0000-000000000025', '4d946755-0211-4a0c-9464-1872b5e30baa', 2, '2026-02-01', 50, 15, 0, 0, 0, 'inclusive', 3000, 0, 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dcc_installment_rows (id, plan_id, row_number, label, percentage, amount, due_date, paid_date, paid_amt, status, late_fee, due_date_with_late_fee, gst_amount)
VALUES
  ('f6600000-0000-0000-0000-000000000001', 'e5500000-0000-0000-0000-000000000001', 0, 'Full Payment', 100, 25000, '2026-08-01', NULL, 0, 'DUE', 0, NULL, 0),
  ('f6600000-0000-0000-0000-000000000002', 'e5500000-0000-0000-0000-000000000001', 1, 'Instalment 1', 50, 12500, '2026-08-01', NULL, 0, 'DUE', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000003', 'e5500000-0000-0000-0000-000000000001', 2, 'Instalment 2', 50, 12500, '2026-09-01', NULL, 0, 'PENDING', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000004', 'e5500000-0000-0000-0000-000000000002', 0, 'Full Payment', 100, 50000, '2026-01-15', '2026-01-10', 50000, 'PAID', 0, NULL, 0),
  ('f6600000-0000-0000-0000-000000000005', 'e5500000-0000-0000-0000-000000000002', 1, 'Instalment 1', 50, 25000, '2026-01-15', '2026-01-10', 25000, 'PAID', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000006', 'e5500000-0000-0000-0000-000000000002', 2, 'Instalment 2', 50, 25000, '2026-09-01', '2026-01-10', 25000, 'PAID', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000007', 'e5500000-0000-0000-0000-000000000003', 0, 'Full Payment', 100, 8500, '2026-03-01', NULL, 0, 'OVERDUE', 0, NULL, 0),
  ('f6600000-0000-0000-0000-000000000008', 'e5500000-0000-0000-0000-000000000003', 1, 'Instalment 1', 50, 4250, '2026-03-01', NULL, 0, 'OVERDUE', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000009', 'e5500000-0000-0000-0000-000000000003', 2, 'Instalment 2', 50, 4250, '2026-09-01', NULL, 0, 'PENDING', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000010', 'e5500000-0000-0000-0000-000000000004', 0, 'Full Payment', 100, 12000, '2026-08-01', NULL, 0, 'DUE', 0, NULL, 0),
  ('f6600000-0000-0000-0000-000000000011', 'e5500000-0000-0000-0000-000000000004', 1, 'Instalment 1', 50, 6000, '2026-08-01', NULL, 0, 'DUE', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000012', 'e5500000-0000-0000-0000-000000000004', 2, 'Instalment 2', 50, 6000, '2026-09-01', NULL, 0, 'PENDING', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000013', 'e5500000-0000-0000-0000-000000000005', 0, 'Full Payment', 100, 9500, '2026-03-01', NULL, 0, 'OVERDUE', 0, NULL, 0),
  ('f6600000-0000-0000-0000-000000000014', 'e5500000-0000-0000-0000-000000000005', 1, 'Instalment 1', 50, 4750, '2026-03-01', NULL, 0, 'OVERDUE', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000015', 'e5500000-0000-0000-0000-000000000005', 2, 'Instalment 2', 50, 4750, '2026-09-01', NULL, 0, 'PENDING', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000016', 'e5500000-0000-0000-0000-000000000006', 0, 'Full Payment', 100, 30000, '2026-01-15', '2026-01-10', 30000, 'PAID', 0, NULL, 0),
  ('f6600000-0000-0000-0000-000000000017', 'e5500000-0000-0000-0000-000000000006', 1, 'Instalment 1', 50, 15000, '2026-01-15', '2026-01-10', 15000, 'PAID', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000018', 'e5500000-0000-0000-0000-000000000006', 2, 'Instalment 2', 50, 15000, '2026-09-01', '2026-01-10', 15000, 'PAID', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000019', 'e5500000-0000-0000-0000-000000000007', 0, 'Full Payment', 100, 3500, '2026-08-01', NULL, 0, 'DUE', 0, NULL, 0),
  ('f6600000-0000-0000-0000-000000000020', 'e5500000-0000-0000-0000-000000000007', 1, 'Instalment 1', 50, 1750, '2026-08-01', NULL, 0, 'DUE', 50, NULL, 0),
  ('f6600000-0000-0000-0000-000000000021', 'e5500000-0000-0000-0000-000000000007', 2, 'Instalment 2', 50, 1750, '2026-09-01', NULL, 0, 'PENDING', 50, NULL, 0),
  ('f6600000-0000-0000-0000-000000000022', 'e5500000-0000-0000-0000-000000000008', 0, 'Full Payment', 100, 1200, '2026-01-15', '2026-01-10', 1200, 'PAID', 0, NULL, 0),
  ('f6600000-0000-0000-0000-000000000023', 'e5500000-0000-0000-0000-000000000008', 1, 'Instalment 1', 50, 600, '2026-01-15', '2026-01-10', 600, 'PAID', 50, NULL, 0),
  ('f6600000-0000-0000-0000-000000000024', 'e5500000-0000-0000-0000-000000000008', 2, 'Instalment 2', 50, 600, '2026-09-01', '2026-01-10', 600, 'PAID', 50, NULL, 0),
  ('f6600000-0000-0000-0000-000000000025', 'e5500000-0000-0000-0000-000000000009', 0, 'Full Payment', 100, 4800, '2026-03-01', NULL, 0, 'OVERDUE', 0, NULL, 0),
  ('f6600000-0000-0000-0000-000000000026', 'e5500000-0000-0000-0000-000000000009', 1, 'Instalment 1', 50, 2400, '2026-03-01', NULL, 0, 'OVERDUE', 50, NULL, 0),
  ('f6600000-0000-0000-0000-000000000027', 'e5500000-0000-0000-0000-000000000009', 2, 'Instalment 2', 50, 2400, '2026-09-01', NULL, 0, 'PENDING', 50, NULL, 0),
  ('f6600000-0000-0000-0000-000000000028', 'e5500000-0000-0000-0000-000000000010', 0, 'Full Payment', 100, 10000, '2026-02-01', NULL, 0, 'DUE', 0, NULL, 0),
  ('f6600000-0000-0000-0000-000000000029', 'e5500000-0000-0000-0000-000000000010', 1, 'Instalment 1', 50, 5000, '2026-02-01', NULL, 0, 'DUE', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000030', 'e5500000-0000-0000-0000-000000000010', 2, 'Instalment 2', 50, 5000, '2026-09-01', NULL, 0, 'PENDING', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000031', 'e5500000-0000-0000-0000-000000000011', 0, 'Full Payment', 100, 3200, '2026-08-01', NULL, 0, 'DUE', 0, NULL, 0),
  ('f6600000-0000-0000-0000-000000000032', 'e5500000-0000-0000-0000-000000000011', 1, 'Instalment 1', 50, 1600, '2026-08-01', NULL, 0, 'DUE', 50, NULL, 0),
  ('f6600000-0000-0000-0000-000000000033', 'e5500000-0000-0000-0000-000000000011', 2, 'Instalment 2', 50, 1600, '2026-09-01', NULL, 0, 'PENDING', 50, NULL, 0),
  ('f6600000-0000-0000-0000-000000000034', 'e5500000-0000-0000-0000-000000000012', 0, 'Full Payment', 100, 5200, '2026-08-01', NULL, 0, 'DUE', 0, NULL, 0),
  ('f6600000-0000-0000-0000-000000000035', 'e5500000-0000-0000-0000-000000000012', 1, 'Instalment 1', 50, 2600, '2026-08-01', NULL, 0, 'DUE', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000036', 'e5500000-0000-0000-0000-000000000012', 2, 'Instalment 2', 50, 2600, '2026-09-01', NULL, 0, 'PENDING', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000037', 'e5500000-0000-0000-0000-000000000013', 0, 'Full Payment', 100, 1800, '2026-03-01', NULL, 0, 'OVERDUE', 0, NULL, 0),
  ('f6600000-0000-0000-0000-000000000038', 'e5500000-0000-0000-0000-000000000013', 1, 'Instalment 1', 50, 900, '2026-03-01', NULL, 0, 'OVERDUE', 50, NULL, 0),
  ('f6600000-0000-0000-0000-000000000039', 'e5500000-0000-0000-0000-000000000013', 2, 'Instalment 2', 50, 900, '2026-09-01', NULL, 0, 'PENDING', 50, NULL, 0),
  ('f6600000-0000-0000-0000-000000000040', 'e5500000-0000-0000-0000-000000000014', 0, 'Full Payment', 100, 6500, '2026-01-15', '2026-01-10', 6500, 'PAID', 0, NULL, 0),
  ('f6600000-0000-0000-0000-000000000041', 'e5500000-0000-0000-0000-000000000014', 1, 'Instalment 1', 50, 3250, '2026-01-15', '2026-01-10', 3250, 'PAID', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000042', 'e5500000-0000-0000-0000-000000000014', 2, 'Instalment 2', 50, 3250, '2026-09-01', '2026-01-10', 3250, 'PAID', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000043', 'e5500000-0000-0000-0000-000000000015', 0, 'Full Payment', 100, 15000, '2026-08-01', NULL, 0, 'DUE', 0, NULL, 0),
  ('f6600000-0000-0000-0000-000000000044', 'e5500000-0000-0000-0000-000000000015', 1, 'Instalment 1', 50, 7500, '2026-08-01', NULL, 0, 'DUE', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000045', 'e5500000-0000-0000-0000-000000000015', 2, 'Instalment 2', 50, 7500, '2026-09-01', NULL, 0, 'PENDING', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000046', 'e5500000-0000-0000-0000-000000000016', 0, 'Full Payment', 100, 8000, '2026-01-15', '2026-01-10', 8000, 'PAID', 0, NULL, 0),
  ('f6600000-0000-0000-0000-000000000047', 'e5500000-0000-0000-0000-000000000016', 1, 'Instalment 1', 50, 4000, '2026-01-15', '2026-01-10', 4000, 'PAID', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000048', 'e5500000-0000-0000-0000-000000000016', 2, 'Instalment 2', 50, 4000, '2026-09-01', '2026-01-10', 4000, 'PAID', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000049', 'e5500000-0000-0000-0000-000000000017', 0, 'Full Payment', 100, 45000, '2026-03-01', NULL, 0, 'OVERDUE', 0, NULL, 0),
  ('f6600000-0000-0000-0000-000000000050', 'e5500000-0000-0000-0000-000000000017', 1, 'Instalment 1', 50, 22500, '2026-03-01', NULL, 0, 'OVERDUE', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000051', 'e5500000-0000-0000-0000-000000000017', 2, 'Instalment 2', 50, 22500, '2026-09-01', NULL, 0, 'PENDING', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000052', 'e5500000-0000-0000-0000-000000000018', 0, 'Full Payment', 100, 8500, '2026-08-01', NULL, 0, 'DUE', 0, NULL, 0),
  ('f6600000-0000-0000-0000-000000000053', 'e5500000-0000-0000-0000-000000000018', 1, 'Instalment 1', 50, 4250, '2026-08-01', NULL, 0, 'DUE', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000054', 'e5500000-0000-0000-0000-000000000018', 2, 'Instalment 2', 50, 4250, '2026-09-01', NULL, 0, 'PENDING', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000055', 'e5500000-0000-0000-0000-000000000019', 0, 'Full Payment', 100, 15000, '2026-01-15', '2026-01-10', 15000, 'PAID', 0, NULL, 0),
  ('f6600000-0000-0000-0000-000000000056', 'e5500000-0000-0000-0000-000000000019', 1, 'Instalment 1', 50, 7500, '2026-01-15', '2026-01-10', 7500, 'PAID', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000057', 'e5500000-0000-0000-0000-000000000019', 2, 'Instalment 2', 50, 7500, '2026-09-01', '2026-01-10', 7500, 'PAID', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000058', 'e5500000-0000-0000-0000-000000000020', 0, 'Full Payment', 100, 25000, '2026-08-01', NULL, 0, 'DUE', 0, NULL, 0),
  ('f6600000-0000-0000-0000-000000000059', 'e5500000-0000-0000-0000-000000000020', 1, 'Instalment 1', 50, 12500, '2026-08-01', NULL, 0, 'DUE', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000060', 'e5500000-0000-0000-0000-000000000020', 2, 'Instalment 2', 50, 12500, '2026-09-01', NULL, 0, 'PENDING', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000061', 'e5500000-0000-0000-0000-000000000021', 0, 'Full Payment', 100, 20000, '2026-03-01', NULL, 0, 'OVERDUE', 0, NULL, 0),
  ('f6600000-0000-0000-0000-000000000062', 'e5500000-0000-0000-0000-000000000021', 1, 'Instalment 1', 50, 10000, '2026-03-01', NULL, 0, 'OVERDUE', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000063', 'e5500000-0000-0000-0000-000000000021', 2, 'Instalment 2', 50, 10000, '2026-09-01', NULL, 0, 'PENDING', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000064', 'e5500000-0000-0000-0000-000000000022', 0, 'Full Payment', 100, 12500, '2026-08-01', NULL, 0, 'DUE', 0, NULL, 0),
  ('f6600000-0000-0000-0000-000000000065', 'e5500000-0000-0000-0000-000000000022', 1, 'Instalment 1', 50, 6250, '2026-08-01', NULL, 0, 'DUE', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000066', 'e5500000-0000-0000-0000-000000000022', 2, 'Instalment 2', 50, 6250, '2026-09-01', NULL, 0, 'PENDING', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000067', 'e5500000-0000-0000-0000-000000000023', 0, 'Full Payment', 100, 5500, '2026-03-01', NULL, 0, 'OVERDUE', 0, NULL, 0),
  ('f6600000-0000-0000-0000-000000000068', 'e5500000-0000-0000-0000-000000000023', 1, 'Instalment 1', 50, 2750, '2026-03-01', NULL, 0, 'OVERDUE', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000069', 'e5500000-0000-0000-0000-000000000023', 2, 'Instalment 2', 50, 2750, '2026-09-01', NULL, 0, 'PENDING', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000070', 'e5500000-0000-0000-0000-000000000024', 0, 'Full Payment', 100, 7200, '2026-01-15', '2026-01-10', 7200, 'PAID', 0, NULL, 0),
  ('f6600000-0000-0000-0000-000000000071', 'e5500000-0000-0000-0000-000000000024', 1, 'Instalment 1', 50, 3600, '2026-01-15', '2026-01-10', 3600, 'PAID', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000072', 'e5500000-0000-0000-0000-000000000024', 2, 'Instalment 2', 50, 3600, '2026-09-01', '2026-01-10', 3600, 'PAID', 100, NULL, 0),
  ('f6600000-0000-0000-0000-000000000073', 'e5500000-0000-0000-0000-000000000025', 0, 'Full Payment', 100, 3000, '2026-02-01', NULL, 0, 'DUE', 0, NULL, 0),
  ('f6600000-0000-0000-0000-000000000074', 'e5500000-0000-0000-0000-000000000025', 1, 'Instalment 1', 50, 1500, '2026-02-01', NULL, 0, 'DUE', 50, NULL, 0),
  ('f6600000-0000-0000-0000-000000000075', 'e5500000-0000-0000-0000-000000000025', 2, 'Instalment 2', 50, 1500, '2026-09-01', NULL, 0, 'PENDING', 50, NULL, 0)
ON CONFLICT (id) DO NOTHING;
