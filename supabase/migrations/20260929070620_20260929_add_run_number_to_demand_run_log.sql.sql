/*
# Add unique run_number to dcc_demand_run_log

## Purpose
Each generation run in the Demand Generation screen currently shows an array-index
based row number (1, 2, 3...) which changes when filters are applied. This migration
adds a permanent, unique, auto-incrementing `run_number` column so every run has a
stable identifier (RUN-001, RUN-002, etc.) that never changes regardless of filtering.

## Changes
1. Adds `run_number` column (integer, NOT NULL, auto-incrementing via sequence) to
   `dcc_demand_run_log`.
2. Backfills existing rows with sequential numbers ordered by created_at.
3. Creates a dedicated sequence `dcc_demand_run_log_run_number_seq` and sets it as
   the column default so new rows automatically get the next number.

## Security
- No changes to RLS policies. Existing policies remain intact.
- The column is read-only from the client (auto-assigned by the database).
*/

-- Add the column without NOT NULL first (so existing rows can be backfilled)
ALTER TABLE dcc_demand_run_log
  ADD COLUMN IF NOT EXISTS run_number integer;

-- Backfill existing rows with sequential numbers ordered by creation time
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dcc_demand_run_log'
      AND column_name = 'run_number'
      AND is_nullable = 'YES'
  ) THEN
    WITH ranked AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) AS rn
      FROM dcc_demand_run_log
      WHERE run_number IS NULL
    )
    UPDATE dcc_demand_run_log
      SET run_number = ranked.rn
      FROM ranked
      WHERE dcc_demand_run_log.id = ranked.id;
  END IF;
END $$;

-- Create a sequence starting after the max existing run_number
DO $$
DECLARE
  max_rn integer;
  start_val integer;
BEGIN
  SELECT COALESCE(MAX(run_number), 0) INTO max_rn FROM dcc_demand_run_log;
  start_val := max_rn + 1;

  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS dcc_demand_run_log_run_number_seq START WITH %s', start_val);
END $$;

-- Set the column to NOT NULL with the sequence as default
ALTER TABLE dcc_demand_run_log
  ALTER COLUMN run_number SET NOT NULL,
  ALTER COLUMN run_number SET DEFAULT nextval('dcc_demand_run_log_run_number_seq');

-- Sequence ownership
ALTER SEQUENCE dcc_demand_run_log_run_number_seq OWNED BY dcc_demand_run_log.run_number;
