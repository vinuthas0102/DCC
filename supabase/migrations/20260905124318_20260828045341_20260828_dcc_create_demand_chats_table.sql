-- DCC demand chats table
CREATE TABLE IF NOT EXISTS dcc_demand_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id uuid NOT NULL REFERENCES dcc_demands(id) ON DELETE CASCADE,
  sender_role text NOT NULL DEFAULT 'manager',
  message text NOT NULL,
  delivery_mode text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dcc_demand_chats_demand_id ON dcc_demand_chats(demand_id);
ALTER TABLE dcc_demand_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_dcc_demand_chats" ON dcc_demand_chats FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_dcc_demand_chats" ON dcc_demand_chats FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_dcc_demand_chats" ON dcc_demand_chats FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_dcc_demand_chats" ON dcc_demand_chats FOR DELETE TO anon, authenticated USING (true);