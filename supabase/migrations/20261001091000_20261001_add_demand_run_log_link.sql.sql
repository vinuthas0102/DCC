/*
# Link demands to their exact generation run

1. Purpose
- Add a durable relationship between each demand and the run that created it.
- Prevent run details from mixing demands when multiple runs share a date or source.

2. Modified Tables
- `dcc_demands`
  - Adds nullable `run_log_id`, referencing `dcc_demand_run_log.id`.
  - Existing rows remain intact; the column is nullable so legacy records are safe.

3. Indexes
- Adds an index on `dcc_demands.run_log_id` for fast run-detail loading.

4. Existing Data
- Backfills only unambiguous legacy demand groups where the number and demand type match one run exactly.
- Ambiguous legacy records are left unchanged rather than assigned to the wrong run.

5. Security
- No new tables or policies are created.
- Existing RLS policies on `dcc_demands` continue to protect the table.
*/

ALTER TABLE dcc_demands
  ADD COLUMN IF NOT EXISTS run_log_id uuid REFERENCES dcc_demand_run_log(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_dcc_demands_run_log_id
  ON dcc_demands(run_log_id);

DO $$
DECLARE
  run_row RECORD;
  candidate_count integer;
BEGIN
  FOR run_row IN
    SELECT id, run_date, source, demand_type_id, records_created
    FROM dcc_demand_run_log
    WHERE records_created > 0
  LOOP
    SELECT COUNT(*)::integer
    INTO candidate_count
    FROM dcc_demands
    WHERE run_log_id IS NULL
      AND demand_run_date = run_row.run_date
      AND generation_source = run_row.source
      AND (run_row.demand_type_id IS NULL OR demand_type_id = run_row.demand_type_id);

    IF candidate_count = run_row.records_created THEN
      UPDATE dcc_demands
      SET run_log_id = run_row.id
      WHERE run_log_id IS NULL
        AND demand_run_date = run_row.run_date
        AND generation_source = run_row.source
        AND (run_row.demand_type_id IS NULL OR demand_type_id = run_row.demand_type_id);
    END IF;
  END LOOP;
END $$;