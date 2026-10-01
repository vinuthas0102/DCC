/*
# Add demand audit history and reconcile installment payment allocation

1. New Tables
- `dcc_demand_audit_log`
- `id`: unique audit entry identifier.
- `demand_id`: demand that was created or amended.
- `event_type`: CREATED or AMENDED.
- `changed_fields`: list of demand fields changed by an amendment.
- `old_values`: previous demand values for an amendment.
- `new_values`: demand values after creation or amendment.
- `actor_id`: authenticated user who caused the change, when available.
- `actor_label`: readable actor label captured at the time of the change.
- `created_at`: time the history entry was recorded.

2. Modified Tables and Data Integrity
- Add an automatic trigger to `dcc_demands` so creation and later amendments are recorded without relying on browser code.
- Reconcile the affected loan demonstration plan so its four installment rows total the plan balance of 150000 and their allocations total the existing payment ledger of 100000.
- Preserve all existing payment records; only correct installment row allocation and totals.

3. Security
- Enable row level security on `dcc_demand_audit_log`.
- Allow anon and authenticated users to read audit history consistently with the existing DCC demo screens.
- Do not allow browser clients to insert, update, or delete audit records.
- The trigger function runs with a fixed search path and is not callable by anon or authenticated users.

4. Important Notes
- Audit entries are append-only and retain both before and after values.
- Existing demand data and payment records are not deleted.
- The installment reconciliation applies only to the identified legacy loan plan whose rows exceed its configured balance.
*/

CREATE TABLE IF NOT EXISTS public.dcc_demand_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id uuid NOT NULL REFERENCES public.dcc_demands(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('CREATED', 'AMENDED')),
  changed_fields text[] NOT NULL DEFAULT ARRAY[]::text[],
  old_values jsonb,
  new_values jsonb NOT NULL,
  actor_id uuid,
  actor_label text NOT NULL DEFAULT 'System',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dcc_demand_audit_log_demand_created_idx
  ON public.dcc_demand_audit_log (demand_id, created_at DESC);

ALTER TABLE public.dcc_demand_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "DCC audit history is readable" ON public.dcc_demand_audit_log;
CREATE POLICY "DCC audit history is readable"
  ON public.dcc_demand_audit_log
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.dcc_record_demand_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_json jsonb;
  new_json jsonb;
  changed text[] := ARRAY[]::text[];
  key text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    new_json := to_jsonb(NEW);
    INSERT INTO public.dcc_demand_audit_log (
      demand_id, event_type, changed_fields, old_values, new_values, actor_id, actor_label
    ) VALUES (
      NEW.id,
      'CREATED',
      ARRAY[]::text[],
      NULL,
      new_json,
      auth.uid(),
      COALESCE(auth.jwt() ->> 'email', 'System')
    );
    RETURN NEW;
  END IF;

  old_json := to_jsonb(OLD);
  new_json := to_jsonb(NEW);

  FOR key IN SELECT jsonb_object_keys(new_json)
  LOOP
    IF (old_json -> key) IS DISTINCT FROM (new_json -> key) THEN
      changed := array_append(changed, key);
    END IF;
  END LOOP;

  IF cardinality(changed) > 0 THEN
    INSERT INTO public.dcc_demand_audit_log (
      demand_id, event_type, changed_fields, old_values, new_values, actor_id, actor_label
    ) VALUES (
      NEW.id,
      'AMENDED',
      changed,
      old_json,
      new_json,
      auth.uid(),
      COALESCE(auth.jwt() ->> 'email', 'System')
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS dcc_demands_audit_trigger ON public.dcc_demands;
CREATE TRIGGER dcc_demands_audit_trigger
  AFTER INSERT OR UPDATE ON public.dcc_demands
  FOR EACH ROW
  EXECUTE FUNCTION public.dcc_record_demand_audit();

REVOKE ALL ON FUNCTION public.dcc_record_demand_audit() FROM PUBLIC, anon, authenticated;

INSERT INTO public.dcc_demand_audit_log (demand_id, event_type, changed_fields, old_values, new_values, actor_label)
SELECT d.id, 'CREATED', ARRAY[]::text[], NULL, to_jsonb(d), 'Historical record'
FROM public.dcc_demands d
WHERE NOT EXISTS (
  SELECT 1 FROM public.dcc_demand_audit_log a
  WHERE a.demand_id = d.id
);

DO $$
DECLARE
  v_demand_id uuid := 'd4388124-732e-4cff-b865-64f6948d59fb';
  v_plan_id uuid := '2de144f0-f6d6-4fb7-af32-495fe3326789';
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.dcc_demands WHERE id = v_demand_id
  ) AND EXISTS (
    SELECT 1 FROM public.dcc_installment_plans WHERE id = v_plan_id AND demand_id = v_demand_id
  ) THEN
    UPDATE public.dcc_installment_rows
    SET amount = CASE row_number
      WHEN 1 THEN 37500
      WHEN 2 THEN 37500
      WHEN 3 THEN 37500
      WHEN 4 THEN 37500
      ELSE amount
    END,
    paid_amt = CASE row_number
      WHEN 1 THEN 37500
      WHEN 2 THEN 37500
      WHEN 3 THEN 25000
      WHEN 4 THEN 0
      ELSE paid_amt
    END,
    paid_date = CASE row_number
      WHEN 1 THEN '2026-08-11'::date
      WHEN 2 THEN '2026-08-25'::date
      WHEN 3 THEN '2026-09-05'::date
      WHEN 4 THEN NULL
      ELSE paid_date
    END,
    status = CASE row_number
      WHEN 1 THEN 'PAID'
      WHEN 2 THEN 'PAID'
      WHEN 3 THEN 'DUE'
      WHEN 4 THEN 'PENDING'
      ELSE status
    END,
    updated_at = now()
    WHERE plan_id = v_plan_id
      AND row_number BETWEEN 1 AND 4;

    UPDATE public.dcc_installment_plans
    SET balance_payment = 150000,
        installments_paid = 2,
        installments_due = 2,
        updated_at = now()
    WHERE id = v_plan_id;
  END IF;
END $$;
