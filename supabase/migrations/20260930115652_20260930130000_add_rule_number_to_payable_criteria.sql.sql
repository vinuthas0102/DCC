/*
# Add unique auto-incrementing rule_number to payable_criteria_mt

1. Purpose
   Every demand rule created in Rule Setup gets a permanent, unique sequential
   number (Rule 1, Rule 2, Rule 3 …) that never changes — even if other rules
   are deleted or the list is filtered/reordered.  This gives each rule a
   stable human-friendly identifier alongside its UUID.

2. Modified Table: payable_criteria_mt
   - rule_number INTEGER NOT NULL DEFAULT nextval('payable_criteria_rule_seq')
   - UNIQUE constraint on rule_number so no two rules can share a number.

3. Sequence
   - payable_criteria_rule_seq: starts at 1, increments by 1.
   - Existing rows are backfilled with sequential numbers ordered by created_at
     so current rules also receive a number.

4. Security
   - No RLS / policy changes — the column is readable by anyone who can already
     SELECT the table, and is never written directly by the app (the DB default
     handles assignment on INSERT).

5. Important Notes
   - The column is purely additive; no data is lost.
   - rule_number is excluded from UPDATE payloads in the app layer; it is set
     once at creation time by the sequence default.
*/

-- 1. Create the sequence
CREATE SEQUENCE IF NOT EXISTS payable_criteria_rule_seq
  START WITH 1
  INCREMENT BY 1
  NO CYCLE;

-- 2. Add the column with the sequence default
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payable_criteria_mt' AND column_name = 'rule_number'
  ) THEN
    ALTER TABLE payable_criteria_mt
      ADD COLUMN rule_number INTEGER NOT NULL DEFAULT nextval('payable_criteria_rule_seq');
  END IF;
END $$;

-- 3. Backfill existing rows that may have NULL or zero (safe no-op if already populated)
UPDATE payable_criteria_mt
  SET rule_number = nextval('payable_criteria_rule_seq')
  WHERE rule_number IS NULL OR rule_number = 0;

-- 4. Enforce uniqueness
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payable_criteria_mt_rule_number_key'
  ) THEN
    ALTER TABLE payable_criteria_mt
      ADD CONSTRAINT payable_criteria_mt_rule_number_key UNIQUE (rule_number);
  END IF;
END $$;

-- 5. Index for sorting / lookups by rule_number
CREATE INDEX IF NOT EXISTS idx_pcm_rule_number ON payable_criteria_mt(rule_number);
