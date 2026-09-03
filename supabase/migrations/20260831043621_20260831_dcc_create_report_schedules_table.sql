/*
# Create DCC Report Schedules table

1. Purpose
   Stores user-defined scheduled report definitions for the DCC (Demand & Collection Center) module.
   Each row captures the report type, the full criteria JSON (date range, demand type, object type,
   owner, status, etc.), the next run date/time, recurrence pattern, and ownership.

2. New Tables
   - `dcc_report_schedules`
     - `id` (uuid, primary key)
     - `name` (text, not null) — user-given label for the scheduled report
     - `report_type` (text, not null) — one of: by_type | by_owner | overdue | detailed
     - `criteria` (jsonb, not null) — the full DccDemandFilters snapshot to use when generating
     - `recurrence` (text, not null) — one of: one-time | daily | weekly | monthly
     - `next_run_at` (timestamptz, not null) — when the report should next be generated
     - `last_run_at` (timestamptz, nullable) — when the report was last generated
     - `is_active` (boolean, default true) — paused/inactive schedules are skipped
     - `user_id` (uuid, not null, default auth.uid()) — owner of the schedule
     - `created_at` (timestamptz, default now())
     - `updated_at` (timestamptz, default now())

3. Security
   - Enable RLS on `dcc_report_schedules`.
   - Owner-scoped CRUD: each authenticated user can only access rows they own.
   - `user_id` defaults to `auth.uid()` so inserts that omit it still satisfy the WITH CHECK.
*/

CREATE TABLE IF NOT EXISTS dcc_report_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  report_type text NOT NULL,
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  recurrence text NOT NULL DEFAULT 'one-time',
  next_run_at timestamptz NOT NULL,
  last_run_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE dcc_report_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_report_schedules" ON dcc_report_schedules;
CREATE POLICY "select_own_report_schedules"
  ON dcc_report_schedules FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_report_schedules" ON dcc_report_schedules;
CREATE POLICY "insert_own_report_schedules"
  ON dcc_report_schedules FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_report_schedules" ON dcc_report_schedules;
CREATE POLICY "update_own_report_schedules"
  ON dcc_report_schedules FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_report_schedules" ON dcc_report_schedules;
CREATE POLICY "delete_own_report_schedules"
  ON dcc_report_schedules FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_dcc_report_schedules_next_run
  ON dcc_report_schedules (next_run_at)
  WHERE is_active = true;
