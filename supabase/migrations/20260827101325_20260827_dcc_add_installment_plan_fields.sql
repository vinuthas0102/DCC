/*
# DCC — Add Installment Plan Configuration Fields

1. Purpose
- Brings the DCC installment plan screen to parity with the rent tracker module.
- Adds missing configuration fields so the plan setup form can capture:
  installment start date, due days with late fee, and balance payment.
- Adds computed summary columns (installments_paid, installments_due) so the
  plan header can show progress without re-counting rows in the frontend.

2. Modified Tables
  dcc_installment_plans
  - installment_start_date (date, nullable) — when the first installment becomes due
  - due_days_with_late_fee (integer, default 0) — grace days before late fee applies
  - balance_payment (numeric(14,2), default 0) — the demand balance the plan was created against

  dcc_installment_plans also gets two generated columns:
  - installments_paid (integer GENERATED ALWAYS AS (...) STORED)
  - installments_due (integer GENERATED ALWAYS AS (...) STORED)

  Because generated columns cannot reference other tables, installments_paid and
  installments_due are maintained via triggers instead of GENERATED columns. We add
  two trigger functions that count rows in dcc_installment_rows for the plan and
  update the plan accordingly on INSERT/UPDATE/DELETE.

3. Security
- No policy changes. Existing RLS policies already restrict writes to admin/manager.

4. Important Notes
- All additions are additive — no data is lost.
- The trigger keeps installments_paid / installments_due in sync automatically.
*/

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
