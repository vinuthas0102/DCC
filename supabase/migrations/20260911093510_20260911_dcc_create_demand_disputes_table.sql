-- DCC: Per-row dispute history table (one entry per dispute, linked to demand + line item row number)
CREATE TABLE IF NOT EXISTS dcc_demand_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id uuid NOT NULL REFERENCES dcc_demands(id) ON DELETE CASCADE,
  row_number int NOT NULL DEFAULT 1,
  dispute_date date NOT NULL,
  reason text NOT NULL,
  remarks text,
  author_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for efficient lookup by demand
CREATE INDEX IF NOT EXISTS idx_dcc_demand_disputes_demand_id ON dcc_demand_disputes(demand_id);
-- Index for filtering by specific row within a demand
CREATE INDEX IF NOT EXISTS idx_dcc_demand_disputes_demand_row ON dcc_demand_disputes(demand_id, row_number);

-- Enable RLS
ALTER TABLE dcc_demand_disputes ENABLE ROW LEVEL SECURITY;

-- All roles can read dispute entries (public/no-auth app pattern)
CREATE POLICY "select_disputes" ON dcc_demand_disputes
  FOR SELECT TO anon, authenticated USING (true);

-- All roles can insert dispute entries
CREATE POLICY "insert_disputes" ON dcc_demand_disputes
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- All roles can update dispute entries
CREATE POLICY "update_disputes" ON dcc_demand_disputes
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- All roles can delete dispute entries
CREATE POLICY "delete_disputes" ON dcc_demand_disputes
  FOR DELETE TO anon, authenticated USING (true);
