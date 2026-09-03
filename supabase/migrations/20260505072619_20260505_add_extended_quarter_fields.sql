/*
  # Add extended quarter fields

  ## Summary
  Adds comprehensive property/quarter metadata columns to the quarters table
  to support the full display of quarter summary cards in the right panel.

  ## New Columns Added to `quarters`

  ### Identity & Location
  - `region` (text) — Region / State
  - `district` (text) — District
  - `pin_code` (text) — PIN code
  - `unit_number` (text) — Unit Number / Quarters No. (alias/display label for quarter_number)
  - `quota` (text) — Quota type (e.g., General, Reserved, HBA)
  - `counter_no` (text) — Counter No. for administrative reference
  - `location_area` (text) — Sector / Location / Area description
  - `facing` (text) — Facing direction (North/South/East/West)
  - `total_floors` (integer) — Total floors in the building
  - `total_area_sqft` (numeric) — Total carpet/built-up area (separate from unit area_sqft)

  ### Sanitation
  - `toilet_western` (boolean) — Has Western-style toilet
  - `toilet_indian` (boolean) — Has Indian-style toilet
  - `parking_details` (text) — Parking availability details

  ### Financial
  - `electricity_rate` (numeric) — Per unit electricity rate
  - `water_charges` (numeric) — Monthly water charges
  - `penalty_terms` (text) — Penalty/damage terms

  ### Amenities & Features
  - `pooja_room` (boolean) — Has dedicated pooja room
  - `electrical_fixtures` (text) — Description of electrical fixtures
  - `power_backup` (boolean) — Has power backup (generator/UPS)
  - `water_heating` (text) — Water heating type (Solar/Geyser/None)
  - `lift_access` (boolean) — Has lift/elevator access
  - `kitchen_exhaust` (boolean) — Has kitchen exhaust/chimney
  - `housing_style` (text) — Housing style (Row/Multi-storey/Independent/Flat)
  - `balcony` (boolean) — Has balcony
  - `renovation_status` (text) — Renovation state (Renovated/Needs Repair/New/Good Condition)
  - `resident_type` (text) — Resident type eligibility (Gazetted/Non-Gazetted/General/Senior)
  - `current_availability_status` (text) — Granular availability (Available/Occupied/Under Maintenance/Reserved)

  ## Security
  - No RLS changes required — quarters table RLS already covers these new columns
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quarters' AND column_name = 'region') THEN
    ALTER TABLE quarters ADD COLUMN region text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quarters' AND column_name = 'district') THEN
    ALTER TABLE quarters ADD COLUMN district text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quarters' AND column_name = 'pin_code') THEN
    ALTER TABLE quarters ADD COLUMN pin_code text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quarters' AND column_name = 'unit_number') THEN
    ALTER TABLE quarters ADD COLUMN unit_number text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quarters' AND column_name = 'quota') THEN
    ALTER TABLE quarters ADD COLUMN quota text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quarters' AND column_name = 'counter_no') THEN
    ALTER TABLE quarters ADD COLUMN counter_no text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quarters' AND column_name = 'location_area') THEN
    ALTER TABLE quarters ADD COLUMN location_area text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quarters' AND column_name = 'facing') THEN
    ALTER TABLE quarters ADD COLUMN facing text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quarters' AND column_name = 'total_floors') THEN
    ALTER TABLE quarters ADD COLUMN total_floors integer DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quarters' AND column_name = 'total_area_sqft') THEN
    ALTER TABLE quarters ADD COLUMN total_area_sqft numeric DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quarters' AND column_name = 'toilet_western') THEN
    ALTER TABLE quarters ADD COLUMN toilet_western boolean DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quarters' AND column_name = 'toilet_indian') THEN
    ALTER TABLE quarters ADD COLUMN toilet_indian boolean DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quarters' AND column_name = 'parking_details') THEN
    ALTER TABLE quarters ADD COLUMN parking_details text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quarters' AND column_name = 'electricity_rate') THEN
    ALTER TABLE quarters ADD COLUMN electricity_rate numeric DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quarters' AND column_name = 'water_charges') THEN
    ALTER TABLE quarters ADD COLUMN water_charges numeric DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quarters' AND column_name = 'penalty_terms') THEN
    ALTER TABLE quarters ADD COLUMN penalty_terms text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quarters' AND column_name = 'pooja_room') THEN
    ALTER TABLE quarters ADD COLUMN pooja_room boolean DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quarters' AND column_name = 'electrical_fixtures') THEN
    ALTER TABLE quarters ADD COLUMN electrical_fixtures text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quarters' AND column_name = 'power_backup') THEN
    ALTER TABLE quarters ADD COLUMN power_backup boolean DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quarters' AND column_name = 'water_heating') THEN
    ALTER TABLE quarters ADD COLUMN water_heating text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quarters' AND column_name = 'lift_access') THEN
    ALTER TABLE quarters ADD COLUMN lift_access boolean DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quarters' AND column_name = 'kitchen_exhaust') THEN
    ALTER TABLE quarters ADD COLUMN kitchen_exhaust boolean DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quarters' AND column_name = 'housing_style') THEN
    ALTER TABLE quarters ADD COLUMN housing_style text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quarters' AND column_name = 'balcony') THEN
    ALTER TABLE quarters ADD COLUMN balcony boolean DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quarters' AND column_name = 'renovation_status') THEN
    ALTER TABLE quarters ADD COLUMN renovation_status text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quarters' AND column_name = 'resident_type') THEN
    ALTER TABLE quarters ADD COLUMN resident_type text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quarters' AND column_name = 'current_availability_status') THEN
    ALTER TABLE quarters ADD COLUMN current_availability_status text DEFAULT '';
  END IF;
END $$;

-- Seed some realistic demo values for the existing seeded quarters
UPDATE quarters SET
  region = 'Chhattisgarh',
  district = 'Dantewada',
  pin_code = '494449',
  quota = 'General',
  location_area = 'Sector 3, Bacheli Township',
  facing = 'East',
  total_floors = 4,
  total_area_sqft = 1420,
  toilet_western = true,
  toilet_indian = false,
  parking_details = 'Open parking - 1 slot',
  electricity_rate = 5.50,
  water_charges = 150,
  penalty_terms = 'Damage beyond normal wear will be charged at actuals.',
  pooja_room = true,
  power_backup = true,
  water_heating = 'Geyser',
  lift_access = false,
  kitchen_exhaust = true,
  housing_style = 'Multi-storey',
  balcony = true,
  renovation_status = 'Good Condition',
  resident_type = 'Gazetted',
  current_availability_status = 'Occupied'
WHERE quarter_number LIKE 'QTR-B-%' AND (region = '' OR region IS NULL);

UPDATE quarters SET
  region = 'Chhattisgarh',
  district = 'Dantewada',
  pin_code = '494449',
  quota = 'Senior Staff',
  location_area = 'Sector 5, Bacheli Township',
  facing = 'North',
  total_floors = 5,
  total_area_sqft = 1580,
  toilet_western = true,
  toilet_indian = true,
  parking_details = 'Covered parking - 1 slot + open visitor',
  electricity_rate = 5.50,
  water_charges = 200,
  penalty_terms = 'Security deposit adjusted against damages on vacation.',
  pooja_room = true,
  power_backup = true,
  water_heating = 'Solar',
  lift_access = true,
  kitchen_exhaust = true,
  housing_style = 'Multi-storey',
  balcony = true,
  renovation_status = 'Renovated',
  resident_type = 'Gazetted',
  current_availability_status = 'Occupied'
WHERE quarter_number LIKE 'QTR-A-%' AND (region = '' OR region IS NULL);
