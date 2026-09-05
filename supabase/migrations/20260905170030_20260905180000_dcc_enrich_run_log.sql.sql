/*
# Enrich DCC Demand Run Log with detailed run metadata

1. Modified Tables
- `dcc_demand_run_log`
  - `started_at` (timestamptz, nullable) — when the generation run began
  - `ended_at` (timestampotz, nullable) — when the generation run finished
  - `duration_ms` (integer, nullable) — how long the run took in milliseconds
  - `records_failed` (integer, default 0) — count of rows that could not be created
  - `run_summary` (jsonb, nullable) — extra context: rule names, object count, error messages

2. Security
- No RLS policy changes. Existing policies on dcc_demand_run_log remain unchanged.
- All columns are additive — no data loss.
*/

ALTER TABLE dcc_demand_run_log
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS duration_ms INTEGER,
  ADD COLUMN IF NOT EXISTS records_failed INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS run_summary JSONB;
