/*
  # Vacate 3 Demo Quarters from Occupied DP

  Moves the ACKNOWLEDGED requests for QTR-G-2201, QTR-F-1104, and QTR-F-0301
  to VACATED status so they no longer appear in the govt official's Occupied panel.

  Changes:
  - quarter_requests: set request_status = 'VACATED' for the 3 request IDs
  - quarters: reset occupancy_status = 'AVAILABLE' for any that were OCCUPIED
  - quarter_allotments: set vacate_date = today for the 3 allotment records
*/

-- 1. Vacate the requests
UPDATE quarter_requests
SET request_status = 'VACATED', updated_at = now()
WHERE id IN (
  '7f84eb80-8c81-4f20-b9c3-f3e73b6779f2', -- QTR-F-0301
  '28332bc0-4b26-4a6b-a3bb-40fec39ba890', -- QTR-F-1104
  '5ac78f1e-de8f-4f5b-bbaa-f9e269ea37ea'  -- QTR-G-2201
);

-- 2. Set vacate_date on allotments
UPDATE quarter_allotments
SET vacate_date = CURRENT_DATE, updated_at = now()
WHERE id IN (
  'e622ec4f-df77-4f47-891a-30170453c8ee', -- QTR-F-0301
  '1c7b2498-6fa8-417c-939a-e032d6c9a22b', -- QTR-F-1104
  '403710aa-669f-41fc-82ab-fe5aa1f2275d'  -- QTR-G-2201
);

-- 3. Reset occupancy_status for any quarters that were set to OCCUPIED
UPDATE quarters
SET occupancy_status = 'AVAILABLE', updated_at = now()
WHERE quarter_number IN ('QTR-G-2201', 'QTR-F-1104', 'QTR-F-0301')
  AND occupancy_status = 'OCCUPIED';
