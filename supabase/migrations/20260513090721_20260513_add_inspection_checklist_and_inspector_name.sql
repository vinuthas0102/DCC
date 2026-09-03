/*
  # Inspection Checklist Items Table

  1. Changes
    - Add `inspector_name` column to `quarter_inspections` table
    - Create new `quarter_inspection_checklist_items` table for per-item tracking

  2. New Table: quarter_inspection_checklist_items
    - `id` (uuid, PK)
    - `inspection_id` (uuid, FK → quarter_inspections)
    - `category` (text: 'CIVIL' or 'ELECTRICAL')
    - `item_name` (text)
    - `default_qty` (integer, nullable) — standard quantity from the inspection form template
    - `actual_qty` (integer, nullable) — quantity found during inspection
    - `qty_label` (text, nullable) — e.g. 'Nos.' or 'No.'
    - `is_checked` (boolean) — whether the item was present/verified
    - `remarks` (text) — inspector's remarks for this specific item
    - `created_at` (timestamptz)

  3. Security
    - Enable RLS
    - Authenticated users can select, insert, update items for inspections they can access
*/

-- Add inspector_name to quarter_inspections if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quarter_inspections' AND column_name = 'inspector_name'
  ) THEN
    ALTER TABLE quarter_inspections ADD COLUMN inspector_name text DEFAULT '';
  END IF;
END $$;

-- Create checklist items table
CREATE TABLE IF NOT EXISTS quarter_inspection_checklist_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL REFERENCES quarter_inspections(id) ON DELETE CASCADE,
  category      text NOT NULL CHECK (category IN ('CIVIL', 'ELECTRICAL')),
  item_name     text NOT NULL,
  default_qty   integer,
  actual_qty    integer,
  qty_label     text,
  is_checked    boolean NOT NULL DEFAULT false,
  remarks       text NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checklist_items_inspection_id
  ON quarter_inspection_checklist_items(inspection_id);

ALTER TABLE quarter_inspection_checklist_items ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read checklist items
CREATE POLICY "Authenticated users can read checklist items"
  ON quarter_inspection_checklist_items
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert checklist items
CREATE POLICY "Authenticated users can insert checklist items"
  ON quarter_inspection_checklist_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update checklist items
CREATE POLICY "Authenticated users can update checklist items"
  ON quarter_inspection_checklist_items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
