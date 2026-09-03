/*
  # Seed Modules and Property Types

  This migration seeds the initial data for modules and property types.

  ## 1. Modules
  Two main modules are created:
  - **Govt Facilities** (GOVT_FAC): For government properties like community halls, auditoriums, etc.
  - **Other Facilities** (OTHER_FAC): For private properties like apartments, hotels, etc.

  ## 2. Property Types
  
  ### Govt Facilities Property Types:
  - Community Hall
  - Conference Hall
  - Auditorium
  - Guest House
  - Parks
  - Stadium
  - Open Grounds

  ### Other Facilities Property Types:
  - Apartment Society
  - Hotel
  - Apartments
  - Flats

  ## 3. Notes
  - All records are active by default
  - Sort order determines display order in UI
  - Codes are uppercase with underscores for system reference
*/

-- Insert modules (using DO block to make idempotent)
DO $$
DECLARE
  v_govt_module_id uuid;
  v_other_module_id uuid;
BEGIN
  -- Insert Govt Facilities module if not exists
  INSERT INTO modules (name, code, description, is_active)
  VALUES (
    'Govt Facilities',
    'GOVT_FAC',
    'Government-owned facilities including community halls, auditoriums, guest houses, and recreational spaces',
    true
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = now()
  RETURNING id INTO v_govt_module_id;

  -- Get the ID if already exists
  IF v_govt_module_id IS NULL THEN
    SELECT id INTO v_govt_module_id FROM modules WHERE code = 'GOVT_FAC';
  END IF;

  -- Insert Other Facilities module if not exists
  INSERT INTO modules (name, code, description, is_active)
  VALUES (
    'Other Facilities',
    'OTHER_FAC',
    'Private and commercial properties including apartment societies, hotels, and residential complexes',
    true
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = now()
  RETURNING id INTO v_other_module_id;

  -- Get the ID if already exists
  IF v_other_module_id IS NULL THEN
    SELECT id INTO v_other_module_id FROM modules WHERE code = 'OTHER_FAC';
  END IF;

  -- Insert Govt Facilities property types
  INSERT INTO property_types (module_id, name, code, description, sort_order, is_active)
  VALUES
    (v_govt_module_id, 'Community Hall', 'COMMUNITY_HALL', 'Public community gathering spaces', 1, true),
    (v_govt_module_id, 'Conference Hall', 'CONFERENCE_HALL', 'Professional meeting and conference facilities', 2, true),
    (v_govt_module_id, 'Auditorium', 'AUDITORIUM', 'Large-scale event and performance venues', 3, true),
    (v_govt_module_id, 'Guest House', 'GUEST_HOUSE', 'Government guest accommodation facilities', 4, true),
    (v_govt_module_id, 'Parks', 'PARKS', 'Public parks and recreational green spaces', 5, true),
    (v_govt_module_id, 'Stadium', 'STADIUM', 'Sports stadiums and athletic facilities', 6, true),
    (v_govt_module_id, 'Open Grounds', 'OPEN_GROUNDS', 'Open grounds for events and activities', 7, true)
  ON CONFLICT (module_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();

  -- Insert Other Facilities property types
  INSERT INTO property_types (module_id, name, code, description, sort_order, is_active)
  VALUES
    (v_other_module_id, 'Apartment Society', 'APARTMENT_SOCIETY', 'Residential apartment society complexes', 1, true),
    (v_other_module_id, 'Hotel', 'HOTEL', 'Commercial hotel properties', 2, true),
    (v_other_module_id, 'Apartments', 'APARTMENTS', 'Multi-unit residential apartment buildings', 3, true),
    (v_other_module_id, 'Flats', 'FLATS', 'Individual residential flat units', 4, true)
  ON CONFLICT (module_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();
END $$;