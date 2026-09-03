/*
  # Add Quarters Module and Property Types

  ## Summary
  Inserts a QUARTERS module into the modules table so that the "Quarters"
  option appears in the Module dropdown when creating a new property.
  Also inserts matching property_type rows (one per quarter grade) so the
  Property Type dropdown populates correctly when Quarters is selected.

  ## New Data
  - 1 module: Quarters (code: QUARTERS)
  - 5 property types linked to that module: Type-I through Type-V
*/

INSERT INTO modules (name, code, description, is_active)
VALUES ('Quarters', 'QUARTERS', 'Government staff quarters for residential allotment', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO property_types (module_id, name, code, description, is_active, sort_order)
SELECT
  m.id,
  pt.name,
  pt.code,
  pt.description,
  true,
  pt.sort_order
FROM modules m,
(VALUES
  ('Type-I Quarter',   'QTR_TYPE_I',   'Entry-level single BHK quarter',            1),
  ('Type-II Quarter',  'QTR_TYPE_II',  'Standard 2 BHK quarter',                    2),
  ('Type-III Quarter', 'QTR_TYPE_III', 'Mid-grade 2-3 BHK quarter',                 3),
  ('Type-IV Quarter',  'QTR_TYPE_IV',  'Senior grade 3 BHK quarter',                4),
  ('Type-V Quarter',   'QTR_TYPE_V',   'Executive 4 BHK quarter for senior staff',  5)
) AS pt(name, code, description, sort_order)
WHERE m.code = 'QUARTERS'
ON CONFLICT (module_id, code) DO NOTHING;
