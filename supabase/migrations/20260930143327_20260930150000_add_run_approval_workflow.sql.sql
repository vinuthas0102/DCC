/*
# Add Approval Workflow to Demand Run Log

1. Modified Tables
- `dcc_demand_run_log`: adds `approval_status` (text, default 'PENDING'),
  `approved_at` (timestamptz, nullable), `approved_by` (text, nullable),
  `amended_at` (timestamptz, nullable), `amended_by` (text, nullable).
  These track whether a run is pending, approved, or amended after approval.
- `dcc_demands`: adds `is_amended` (boolean, default false) to mark individual
  demand records that were edited after the run was approved.

2. Security
- No RLS policy changes. Existing policies on `dcc_demand_run_log` and
  `dcc_demands` already allow admin/manager to UPDATE. No new tables created.
*/

ALTER TABLE dcc_demand_run_log
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by text,
  ADD COLUMN IF NOT EXISTS amended_at timestamptz,
  ADD COLUMN IF NOT EXISTS amended_by text;

ALTER TABLE dcc_demands
  ADD COLUMN IF NOT EXISTS is_amended boolean NOT NULL DEFAULT false;
