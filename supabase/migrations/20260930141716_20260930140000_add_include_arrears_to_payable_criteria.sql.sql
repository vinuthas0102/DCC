/*
# Add "Include Arrears" flag to Payable Criteria

1. Modified Tables
- `payable_criteria_mt`: adds `include_arrears` boolean column (NOT NULL, default false).
  When enabled, unpaid demands from previous months' runs are carried forward
  (added to the current run's total) for any rule using this criteria.

2. Security
- No RLS policy changes. Existing policies on `payable_criteria_mt` remain unchanged.
*/

ALTER TABLE payable_criteria_mt
  ADD COLUMN IF NOT EXISTS include_arrears boolean NOT NULL DEFAULT false;
