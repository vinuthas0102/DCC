/*
  # Withdraw 5 Demo Quarters from Allotted DP

  Moves the ALLOTTED requests for QTR-E-1203, QTR-E-0501, QTR-C-2204, QTR-C-4401,
  and QTR-D-0102 (REQ-2025-Q2-001) to WITHDRAWN status so they no longer appear
  in the govt official's Allotted panel.

  Changes:
  - quarter_requests: set request_status = 'WITHDRAWN' for 5 request IDs
  - quarter_allotments: set approval_status = 'DECLINED' for their allotments
  - quarters: reset occupancy_status = 'AVAILABLE' if any were set OCCUPIED
*/

-- 1. Withdraw the requests
UPDATE quarter_requests
SET request_status = 'WITHDRAWN', updated_at = now()
WHERE id IN (
  'f042fc97-58b3-4df8-b4c7-31d851631518', -- QTR-C-2204
  'b1ed8d30-3523-414d-b8df-40e3276c69a1', -- QTR-C-4401
  'b604844f-c8df-4ccc-ad5a-6879f522b9a7', -- QTR-D-0102 (REQ-2025-Q2-001)
  '5840767d-84fa-4d6a-9f33-40ae395fd314', -- QTR-E-0501
  '43b17811-1a34-469d-b917-f283238d410e'  -- QTR-E-1203
);

-- 2. Decline the allotments
UPDATE quarter_allotments
SET approval_status = 'DECLINED', updated_at = now()
WHERE id IN (
  '7a64b933-a61b-4f1f-803f-dedfe222ff38', -- QTR-C-2204
  '7e468777-5b42-40f8-a63a-76da14936f95', -- QTR-C-4401
  '8988379f-f42d-4a1b-b270-b06091343784', -- QTR-D-0102 (REQ-2025-Q2-001)
  '8a6da8cb-9812-4f3b-8e98-7408f65030ab', -- QTR-E-0501
  'fe4c3f29-ea18-48a8-bdb3-265efa721f0b'  -- QTR-E-1203
);

-- 3. Reset occupancy_status for affected quarters (safety)
UPDATE quarters
SET occupancy_status = 'AVAILABLE', updated_at = now()
WHERE quarter_number IN ('QTR-C-2204','QTR-C-4401','QTR-D-0102','QTR-E-0501','QTR-E-1203')
  AND occupancy_status = 'OCCUPIED';
