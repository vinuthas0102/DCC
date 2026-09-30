ALTER TABLE payable_installment_specs
  ADD COLUMN IF NOT EXISTS default_interest_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS default_defaulted_interest_pct NUMERIC(6,2) NOT NULL DEFAULT 0;
