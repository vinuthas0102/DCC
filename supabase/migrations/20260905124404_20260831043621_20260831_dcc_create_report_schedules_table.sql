-- DCC report schedules table
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
CREATE POLICY "select_own_report_schedules" ON dcc_report_schedules FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_report_schedules" ON dcc_report_schedules FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_report_schedules" ON dcc_report_schedules FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_report_schedules" ON dcc_report_schedules FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_dcc_report_schedules_next_run ON dcc_report_schedules (next_run_at) WHERE is_active = true;