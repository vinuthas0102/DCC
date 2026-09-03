/*
  # Add sub_status to quarter_requests

  Adds a `sub_status` text column to `quarter_requests` to track sub-states like 'DECLINED'
  when an employee declines or cancels an allotment.
*/

ALTER TABLE quarter_requests ADD COLUMN IF NOT EXISTS sub_status text DEFAULT NULL;
