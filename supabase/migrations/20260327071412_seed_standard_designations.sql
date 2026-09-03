/*
  # Seed Standard Designations

  1. Initial Data
    - CEO (Chief Executive Officer) - Level 1 (Highest)
    - GM (General Manager) - Level 2
    - DY_SEC (Deputy Secretary) - Level 3
    - UNDER_SEC (Under Secretary) - Level 4
    - SEC_OFF (Section Officer) - Level 5
    - ASST (Assistant) - Level 6
    - STAFF (General Staff) - Level 7 (Lowest)

  2. Notes
    - Lower level numbers = higher seniority and more booking privileges
    - These designations will control access to restricted rooms during special dates
    - Admins can add more designations through the admin interface
*/

INSERT INTO designation_master (designation_name, designation_code, level, description, is_active)
VALUES
  ('Chief Executive Officer', 'CEO', 1, 'Chief Executive Officer - Highest level designation', true),
  ('General Manager', 'GM', 2, 'General Manager - Senior management level', true),
  ('Deputy Secretary', 'DY_SEC', 3, 'Deputy Secretary - Senior officer level', true),
  ('Under Secretary', 'UNDER_SEC', 4, 'Under Secretary - Mid-level officer', true),
  ('Section Officer', 'SEC_OFF', 5, 'Section Officer - Junior officer level', true),
  ('Assistant', 'ASST', 6, 'Assistant - Entry level officer', true),
  ('General Staff', 'STAFF', 7, 'General Staff - Support staff level', true)
ON CONFLICT (designation_code) DO NOTHING;