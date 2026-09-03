/*
# DCC Phase 2 — Add Demand Rule keying columns to payable_criteria_mt

1. Purpose
- The existing payable_criteria_mt table is keyed by dept/subdept/module_id/
  location/grade_designation. Phase 2 introduces the DCC concepts of Demand Type,
  Object, and Object Owner as the primary keying for demand rules.
- This migration adds nullable columns for the new keying so existing rows are
  not affected, while new DCC rules can be created with the new fields.

2. Changes to payable_criteria_mt
- demand_type_id (uuid, nullable) — FK to dcc_demand_types; identifies which
  demand type this rule generates (Rent, Tax, Insurance, etc.)
- object_type (text, nullable) — the type of object this rule applies to
  (PROPERTY, CAR, LOAN, QUARTER, etc.)
- object_owner_id (uuid, nullable) — FK to dcc_object_owners; the person or
  organization that owns/pays for the objects
- import_source (text, nullable) — 'TPA', 'EXCEL', 'AUTO', 'MANUAL'; how demands
  under this rule are generated

3. Security
- No new tables; no policy changes. Existing RLS on payable_criteria_mt applies.
- Added columns inherit the table's existing policies.

4. Indexes
- idx_pcm_demand_type on demand_type_id
- idx_pcm_object_owner on object_owner_id
*/

ALTER TABLE payable_criteria_mt
  ADD COLUMN IF NOT EXISTS demand_type_id UUID REFERENCES dcc_demand_types(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS object_type TEXT,
  ADD COLUMN IF NOT EXISTS object_owner_id UUID REFERENCES dcc_object_owners(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS import_source TEXT CHECK (import_source IN ('TPA','EXCEL','AUTO','MANUAL'));

CREATE INDEX IF NOT EXISTS idx_pcm_demand_type ON payable_criteria_mt(demand_type_id);
CREATE INDEX IF NOT EXISTS idx_pcm_object_owner ON payable_criteria_mt(object_owner_id);
