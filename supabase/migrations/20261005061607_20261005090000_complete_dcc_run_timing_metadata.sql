/*
# Complete DCC run timing metadata

1. Purpose
- Ensures every demand-generation run has a start timestamp, end timestamp, and duration.
- Repairs legacy run records created before timing metadata was populated.
- Prevents future run records from being saved with missing timing values.

2. Modified Tables
- `dcc_demand_run_log`
  - `started_at` (timestamptz) — when demand generation began; now required.
  - `ended_at` (timestamptz) — when demand generation finished; now required.
  - `duration_ms` (integer) — elapsed run time in milliseconds; now required and non-negative.

3. Data Repair
- Missing start timestamps are derived from `created_at`, one second before the recorded completion/creation time.
- Missing end timestamps are derived from `created_at`.
- Missing durations are calculated from the repaired start and end timestamps.
- Existing non-null timing values are preserved.

4. Security
- No tables or policies are added or removed.
- Existing row-level security policies remain unchanged.
- The change is additive and does not delete or overwrite existing non-null timing data.

5. Important Notes
- New runs already capture timestamps in the application; the database constraints now protect against incomplete inserts from any other run-creation path.
- The backfill uses the existing `created_at` value only where timing data is unavailable.
*/

UPDATE dcc_demand_run_log
SET
  started_at = COALESCE(started_at, created_at - INTERVAL '1 second'),
  ended_at = COALESCE(ended_at, created_at),
  duration_ms = COALESCE(
    duration_ms,
    GREATEST(
      0,
      ROUND(EXTRACT(EPOCH FROM (
        COALESCE(ended_at, created_at) - COALESCE(started_at, created_at - INTERVAL '1 second')
      )) * 1000)::integer
    )
  )
WHERE started_at IS NULL
   OR ended_at IS NULL
   OR duration_ms IS NULL;

ALTER TABLE dcc_demand_run_log
  ALTER COLUMN started_at SET NOT NULL,
  ALTER COLUMN ended_at SET NOT NULL,
  ALTER COLUMN duration_ms SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'dcc_demand_run_log_duration_nonnegative'
      AND conrelid = 'dcc_demand_run_log'::regclass
  ) THEN
    ALTER TABLE dcc_demand_run_log
      ADD CONSTRAINT dcc_demand_run_log_duration_nonnegative CHECK (duration_ms >= 0);
  END IF;
END $$;