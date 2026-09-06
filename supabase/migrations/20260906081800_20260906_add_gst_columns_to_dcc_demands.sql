/*
# Add GST columns to dcc_demands

1. Purpose
   Each demand record currently has no GST snapshot. GST configuration lives
   on `payable_criteria_mt` (include_gst, default_gst_pct) but is never copied
   onto the demand itself. This migration adds four GST columns directly to
   `dcc_demands` so every demand carries its own GST details at creation time,
   and backfills existing rows from the linked payable criteria row.

2. New Columns on dcc_demands
   - include_gst  (boolean, default false) — whether GST applies to this demand
   - gst_pct      (numeric, default 0)      — GST percentage (e.g. 18 for 18%)
   - gst_type     (text, default 'exclusive') — 'inclusive' or 'exclusive'
   - gst_amount   (numeric, default 0)      — computed GST amount on the demand amount

3. Backfill
   Existing demands are backfilled by joining to payable_criteria_mt on
   criteria_id. For rows with a matching criteria row where include_gst is
   true, gst_pct is copied from default_gst_pct, gst_type defaults to
   'exclusive', and gst_amount is computed as amount * gst_pct / 100 (rounded
   to 2 decimals). Rows without a criteria link or where include_gst is false
   get include_gst=false, gst_pct=0, gst_type='exclusive', gst_amount=0.

4. Security
   No new tables. No RLS policy changes — existing policies on dcc_demands
   already cover the new columns (column-level privileges are not restricted).

5. Notes
   - All statements are idempotent (DO $$ ... IF NOT EXISTS ... END $$).
   - No data is lost; only additive columns are added.
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dcc_demands' AND column_name = 'include_gst'
  ) THEN
    ALTER TABLE dcc_demands ADD COLUMN include_gst boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dcc_demands' AND column_name = 'gst_pct'
  ) THEN
    ALTER TABLE dcc_demands ADD COLUMN gst_pct numeric NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dcc_demands' AND column_name = 'gst_type'
  ) THEN
    ALTER TABLE dcc_demands ADD COLUMN gst_type text NOT NULL DEFAULT 'exclusive';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dcc_demands' AND column_name = 'gst_amount'
  ) THEN
    ALTER TABLE dcc_demands ADD COLUMN gst_amount numeric NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Backfill from payable_criteria_mt where possible
UPDATE dcc_demands d
SET
  include_gst = COALESCE(pc.include_gst, false),
  gst_pct    = COALESCE(pc.default_gst_pct, 0),
  gst_type   = 'exclusive',
  gst_amount = CASE
    WHEN COALESCE(pc.include_gst, false) AND COALESCE(pc.default_gst_pct, 0) > 0
    THEN ROUND(d.amount * COALESCE(pc.default_gst_pct, 0) / 100, 2)
    ELSE 0
  END
FROM payable_criteria_mt pc
WHERE d.criteria_id = pc.id
  AND d.include_gst = false
  AND d.gst_amount = 0;
