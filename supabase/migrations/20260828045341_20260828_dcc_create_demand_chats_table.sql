/*
# Create DCC demand chats table

1. New Tables
- `dcc_demand_chats` — Stores chat messages between users about a specific DCC demand.
  - `id` (uuid, primary key)
  - `demand_id` (uuid, FK to dcc_demands.id, ON DELETE CASCADE)
  - `sender_role` (text: 'manager' or 'owner')
  - `message` (text, not null)
  - `delivery_mode` (text, nullable — e.g. 'SMS', 'EMAIL', 'WHATSAPP', 'MANUAL')
  - `created_at` (timestamptz, default now())
2. Security
- Enable RLS on `dcc_demand_chats`.
- Allow `anon, authenticated` full CRUD (single-tenant demo app, no sign-in gate on DCC module).
3. Indexes
- Index on `demand_id` for efficient per-demand message retrieval.
*/

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

DROP POLICY IF EXISTS "anon_select_dcc_demand_chats" ON dcc_demand_chats;
CREATE POLICY "anon_select_dcc_demand_chats" ON dcc_demand_chats FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_dcc_demand_chats" ON dcc_demand_chats;
CREATE POLICY "anon_insert_dcc_demand_chats" ON dcc_demand_chats FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_dcc_demand_chats" ON dcc_demand_chats;
CREATE POLICY "anon_update_dcc_demand_chats" ON dcc_demand_chats FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_dcc_demand_chats" ON dcc_demand_chats;
CREATE POLICY "anon_delete_dcc_demand_chats" ON dcc_demand_chats FOR DELETE
  TO anon, authenticated USING (true);
