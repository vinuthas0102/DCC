/*
  # Add selected_workflow_id to quarter_allotments

  ## Summary
  Adds a `selected_workflow_id` column to `quarter_allotments` so the Estate Manager
  can pre-select a workflow during the Allocated stage before formally initiating
  the approval process in the Unapproved Allocation stage.

  ## Changes
  - `quarter_allotments`: new nullable FK column `selected_workflow_id` referencing
    `quarter_approval_workflows(id)`.

  ## Notes
  - Column is nullable; existing rows remain unchanged.
  - No RLS changes needed — the table's existing policies cover this column.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quarter_allotments' AND column_name = 'selected_workflow_id'
  ) THEN
    ALTER TABLE quarter_allotments
      ADD COLUMN selected_workflow_id uuid REFERENCES quarter_approval_workflows(id) ON DELETE SET NULL;
  END IF;
END $$;
