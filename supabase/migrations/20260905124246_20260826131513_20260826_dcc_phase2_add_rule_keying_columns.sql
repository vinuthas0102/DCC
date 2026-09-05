-- DCC Phase 2: Add rule keying columns to payable_criteria_mt
ALTER TABLE payable_criteria_mt
  ADD COLUMN IF NOT EXISTS demand_type_id UUID REFERENCES dcc_demand_types(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS object_type TEXT,
  ADD COLUMN IF NOT EXISTS object_owner_id UUID REFERENCES dcc_object_owners(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS import_source TEXT CHECK (import_source IN ('TPA','EXCEL','AUTO','MANUAL'));

CREATE INDEX IF NOT EXISTS idx_pcm_demand_type ON payable_criteria_mt(demand_type_id);
CREATE INDEX IF NOT EXISTS idx_pcm_object_owner ON payable_criteria_mt(object_owner_id);