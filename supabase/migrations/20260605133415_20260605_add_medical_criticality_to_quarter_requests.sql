ALTER TABLE quarter_requests
  ADD COLUMN IF NOT EXISTS medical_criticality text
    CHECK (medical_criticality IN ('HIGH', 'MEDIUM', 'LOW'));
