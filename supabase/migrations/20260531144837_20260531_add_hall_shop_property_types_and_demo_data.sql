/*
  # Add Marriage Hall, Party Hall, Convention Hall, Commercial Shop property types

  ## Summary
  Adds four new property types to the system matching the master data spreadsheets
  provided by the admin, plus adds a shop_details JSONB column for commercial shop
  specific fields, and seeds one fully-populated demo property of each new type.

  ## 1. New Property Types (under Govt Facilities module)
    - Marriage Hall (MARRIAGE_HALL)
    - Party Hall (PARTY_HALL)
    - Convention Hall (CONVENTION_HALL)
    - Commercial Rented Property/Shop (COMMERCIAL_SHOP, under Other Facilities)

  ## 2. New Asset Type
    - Commercial Shop / Retail (for COMMERCIAL_SHOP property type)

  ## 3. Schema Change
    - `shop_details` JSONB column added to `properties` table

  ## 4. Demo Properties
    - 4 demo properties seeded (one per new type), all PUBLISHED status

  ## Notes
    - MARRIAGE_HALL was previously defined in frontend helpers but never seeded in DB
    - All hall types reuse the existing `hall_details` JSONB column
    - Commercial shops use the new `shop_details` JSONB column
    - RLS policies already cover all properties via the properties table policies
*/

-- ── 1. New Asset Type for Commercial Shop ──────────────────────────────────
INSERT INTO asset_types (name, subtype, category, description, is_active)
VALUES ('Commercial Shop', 'Retail', 'C', 'Government-owned commercial shop/retail unit on lease', true)
ON CONFLICT DO NOTHING;

-- ── 2. Add shop_details JSONB column ───────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'shop_details'
  ) THEN
    ALTER TABLE properties ADD COLUMN shop_details JSONB DEFAULT NULL;
  END IF;
END $$;

-- ── 3. New Property Types ───────────────────────────────────────────────────
DO $$
DECLARE
  v_govt_module_id uuid;
  v_other_module_id uuid;
BEGIN
  SELECT id INTO v_govt_module_id  FROM modules WHERE code = 'GOVT_FAC';
  SELECT id INTO v_other_module_id FROM modules WHERE code = 'OTHER_FAC';

  -- Marriage Hall (under Govt Facilities)
  INSERT INTO property_types (module_id, name, code, description, sort_order, is_active)
  VALUES (v_govt_module_id, 'Marriage Hall', 'MARRIAGE_HALL', 'Government-owned marriage ceremony halls', 8, true)
  ON CONFLICT (module_id, code) DO UPDATE SET
    name = EXCLUDED.name, description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order, updated_at = now();

  -- Party Hall (under Govt Facilities)
  INSERT INTO property_types (module_id, name, code, description, sort_order, is_active)
  VALUES (v_govt_module_id, 'Party Hall', 'PARTY_HALL', 'Government-owned party and celebration halls', 9, true)
  ON CONFLICT (module_id, code) DO UPDATE SET
    name = EXCLUDED.name, description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order, updated_at = now();

  -- Convention Hall (under Govt Facilities)
  INSERT INTO property_types (module_id, name, code, description, sort_order, is_active)
  VALUES (v_govt_module_id, 'Convention Hall', 'CONVENTION_HALL', 'Government-owned convention and conference halls', 10, true)
  ON CONFLICT (module_id, code) DO UPDATE SET
    name = EXCLUDED.name, description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order, updated_at = now();

  -- Commercial Shop (under Other Facilities)
  INSERT INTO property_types (module_id, name, code, description, sort_order, is_active)
  VALUES (v_other_module_id, 'Commercial Shop', 'COMMERCIAL_SHOP', 'Government-owned commercial shops and retail units on lease', 5, true)
  ON CONFLICT (module_id, code) DO UPDATE SET
    name = EXCLUDED.name, description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order, updated_at = now();
END $$;

-- ── 4. Demo Properties ──────────────────────────────────────────────────────
DO $$
DECLARE
  v_central_estate_id uuid;
  v_govt_module_id uuid;
  v_other_module_id uuid;
  v_marriage_hall_type_id uuid;
  v_party_hall_type_id uuid;
  v_convention_hall_type_id uuid;
  v_commercial_shop_type_id uuid;
  v_community_hall_asset_id uuid;
  v_commercial_shop_asset_id uuid;

  -- Hall details JSON for Marriage Hall (based on master data spreadsheet)
  v_marriage_hall_details jsonb := '{
    "inchargeName": "Shri R.K. Sharma",
    "contactDetails": "02321-2784939",
    "capacity": {
      "mainHallSeating": 500,
      "diningCapacity": 200,
      "guestRooms": 5,
      "acRooms": 2,
      "nonAcRooms": 3,
      "auxiliaryAreaSqft": 5000,
      "twoWheelerParking": 100,
      "fourWheelerParking": 50,
      "kitchenSizeSqft": 500
    },
    "billing": [
      {"label": "Base Hall Rent (NMDC Employee)",       "amount": "10000", "unit": "per day"},
      {"label": "Base Hall Rent (Non-NMDC Employee)",   "amount": "15000", "unit": "per day"},
      {"label": "Hall Rent (NMDC Employee)",            "amount": "2000",  "unit": "per day"},
      {"label": "Hall Rent (Non-NMDC Employee)",        "amount": "5000",  "unit": "per day"},
      {"label": "Additional Rooms Rent",                "amount": "500",   "unit": "per room/day"},
      {"label": "Security Deposit (NMDC Employee)",     "amount": "1500",  "unit": "flat"},
      {"label": "Security Deposit (Non-NMDC Employee)", "amount": "3000",  "unit": "flat"},
      {"label": "Water Utility Fee",                    "amount": "500",   "unit": "flat per day"},
      {"label": "Electricity Charges",                  "amount": "2000",  "unit": "per day"},
      {"label": "Lighting Charges",                     "amount": "1500",  "unit": "per day"},
      {"label": "Gas Charges",                          "amount": "500",   "unit": "per day"},
      {"label": "Music System Charge",                  "amount": "2000",  "unit": "per day"},
      {"label": "Cleaning Charges",                     "amount": "1000",  "unit": "per event"},
      {"label": "Damage Recovery Policy",               "amount": "",      "unit": "as applicable"},
      {"label": "Operating Time & Noise",               "amount": "",      "unit": "6am-10pm as per policy"}
    ],
    "facilities": {
      "musicSystem": true,
      "waterSupply": true,
      "electricityDG": true,
      "bathroomFacility": true,
      "kitchenAccess": true,
      "centralAC": true,
      "cctvMonitoring": true,
      "fireSafetySystem": true,
      "physicalSecurity": true,
      "fans": true
    },
    "terms": {
      "cancellationRules": "50% refund before 7 days. No refund within 7 days of event.",
      "bookingRules": "Advance booking minimum 3 months. Full payment required.",
      "termsAndConditions": "Hall to be vacated by 11 PM. Standard convention rules apply."
    }
  }';

  -- Hall details JSON for Party Hall
  v_party_hall_details jsonb := '{
    "inchargeName": "Shri A.K. Verma",
    "contactDetails": "02321-2784940",
    "capacity": {
      "mainHallSeating": 200,
      "diningCapacity": 100,
      "guestRooms": 3,
      "acRooms": 1,
      "nonAcRooms": 2,
      "auxiliaryAreaSqft": 2000,
      "twoWheelerParking": 50,
      "fourWheelerParking": 25,
      "kitchenSizeSqft": 200
    },
    "billing": [
      {"label": "Base Hall Rent (NMDC Employee)",       "amount": "5000",  "unit": "per day"},
      {"label": "Base Hall Rent (Non-NMDC Employee)",   "amount": "8000",  "unit": "per day"},
      {"label": "Hall Rent (NMDC Employee)",            "amount": "1000",  "unit": "per day"},
      {"label": "Hall Rent (Non-NMDC Employee)",        "amount": "2500",  "unit": "per day"},
      {"label": "Additional Rooms Rent",                "amount": "500",   "unit": "per room/day"},
      {"label": "Security Deposit (NMDC Employee)",     "amount": "1000",  "unit": "flat"},
      {"label": "Security Deposit (Non-NMDC Employee)", "amount": "2000",  "unit": "flat"},
      {"label": "Water Utility Fee",                    "amount": "300",   "unit": "flat per day"},
      {"label": "Electricity Charges",                  "amount": "1000",  "unit": "per day"},
      {"label": "Lighting Charges",                     "amount": "800",   "unit": "per day"},
      {"label": "Gas Charges",                          "amount": "300",   "unit": "per day"},
      {"label": "Music System Charge",                  "amount": "1500",  "unit": "per day"},
      {"label": "Cleaning Charges",                     "amount": "500",   "unit": "per event"},
      {"label": "Damage Recovery Policy",               "amount": "",      "unit": "as applicable"},
      {"label": "Operating Time & Noise",               "amount": "",      "unit": "8am-10pm as per policy"}
    ],
    "facilities": {
      "musicSystem": true,
      "waterSupply": true,
      "electricityDG": true,
      "bathroomFacility": true,
      "kitchenAccess": true,
      "centralAC": false,
      "cctvMonitoring": true,
      "fireSafetySystem": true,
      "physicalSecurity": false,
      "fans": true
    },
    "terms": {
      "cancellationRules": "50% refund before 7 days. No refund within 7 days of event.",
      "bookingRules": "Advance booking minimum 1 month. 50% payment on booking.",
      "termsAndConditions": "Hall to be vacated by 10 PM. Noise restrictions apply after 9 PM."
    }
  }';

  -- Hall details JSON for Convention Hall
  v_convention_hall_details jsonb := '{
    "inchargeName": "Shri P.N. Mishra",
    "contactDetails": "02321-2784941",
    "capacity": {
      "mainHallSeating": 500,
      "diningCapacity": 200,
      "guestRooms": 5,
      "acRooms": 3,
      "nonAcRooms": 2,
      "auxiliaryAreaSqft": 5000,
      "twoWheelerParking": 100,
      "fourWheelerParking": 50,
      "kitchenSizeSqft": 500
    },
    "billing": [
      {"label": "Base Hall Rent (NMDC Employee)",       "amount": "10000", "unit": "per day"},
      {"label": "Base Hall Rent (Non-NMDC Employee)",   "amount": "15000", "unit": "per day"},
      {"label": "Hall Rent (NMDC Employee)",            "amount": "2000",  "unit": "per day"},
      {"label": "Hall Rent (Non-NMDC Employee)",        "amount": "5000",  "unit": "per day"},
      {"label": "Additional Rooms Rent",                "amount": "500",   "unit": "per room/day"},
      {"label": "Security Deposit (NMDC Employee)",     "amount": "1500",  "unit": "flat"},
      {"label": "Security Deposit (Non-NMDC Employee)", "amount": "3000",  "unit": "flat"},
      {"label": "Water Utility Fee",                    "amount": "500",   "unit": "flat per day"},
      {"label": "Electricity Charges",                  "amount": "2000",  "unit": "per day"},
      {"label": "Lighting Charges",                     "amount": "1500",  "unit": "per day"},
      {"label": "Gas Charges",                          "amount": "500",   "unit": "per day"},
      {"label": "Music System Charge",                  "amount": "2000",  "unit": "per day"},
      {"label": "Cleaning Charges",                     "amount": "1000",  "unit": "per event"},
      {"label": "Damage Recovery Policy",               "amount": "",      "unit": "as applicable"},
      {"label": "Operating Time & Noise",               "amount": "",      "unit": "6am-10pm as per policy"}
    ],
    "facilities": {
      "musicSystem": true,
      "waterSupply": true,
      "electricityDG": true,
      "bathroomFacility": true,
      "kitchenAccess": true,
      "centralAC": true,
      "cctvMonitoring": true,
      "fireSafetySystem": true,
      "physicalSecurity": true,
      "fans": true
    },
    "terms": {
      "cancellationRules": "50% refund before 7 days. No refund within 7 days of event.",
      "bookingRules": "Advance booking minimum 3 months. Full payment required.",
      "termsAndConditions": "Standard convention hall rules apply. Hall to be vacated by 11 PM."
    }
  }';

  -- Shop details JSON for Commercial Shop
  v_shop_details_json jsonb := '{
    "shopType": "General Stores",
    "totalAreaSqft": 600,
    "frontageWidth": 10,
    "mainDoorFacing": "East",
    "floorDetails": "Ground Floor",
    "twoWheelerParking": 10,
    "fourWheelerParking": 2,
    "roofing": true,
    "slidingDoors": true,
    "washroomFacility": true,
    "displayElectricMeter": true,
    "dedicatedConnection": true,
    "photoConnection": false,
    "backupGenerator": false,
    "waterConnection": true,
    "cctvConnection": true,
    "commonMonitoring": true,
    "fireSafetySystem": true,
    "leaseType": "MONTHLY",
    "monthlyRent": 5000,
    "leaseAmount": 60000,
    "maintenanceCharges": 1000,
    "securityDeposit": 10000,
    "electricityRatePerUnit": 0.18,
    "latePaymentPercent": 2,
    "gstApplicable": true,
    "rentLeasePeriodYears": 11,
    "escalationPercent": 6,
    "vacancyNoticePeriodDays": 30,
    "standardLeaseTerms": "10% on year on basis. Renewal subject to management approval.",
    "vendorName": "M/s Sharma General Stores",
    "vendorContact": "9876543210",
    "vendorAddress": "Bacheli Township, Dantewada, Chhattisgarh"
  }';

BEGIN
  SELECT id INTO v_central_estate_id  FROM estates WHERE code = 'EST001' LIMIT 1;
  SELECT id INTO v_govt_module_id     FROM modules WHERE code = 'GOVT_FAC';
  SELECT id INTO v_other_module_id    FROM modules WHERE code = 'OTHER_FAC';
  SELECT id INTO v_marriage_hall_type_id    FROM property_types WHERE code = 'MARRIAGE_HALL';
  SELECT id INTO v_party_hall_type_id       FROM property_types WHERE code = 'PARTY_HALL';
  SELECT id INTO v_convention_hall_type_id  FROM property_types WHERE code = 'CONVENTION_HALL';
  SELECT id INTO v_commercial_shop_type_id  FROM property_types WHERE code = 'COMMERCIAL_SHOP';
  SELECT id INTO v_community_hall_asset_id  FROM asset_types WHERE name = 'Community Hall' AND subtype = 'Standard';
  SELECT id INTO v_commercial_shop_asset_id FROM asset_types WHERE name = 'Commercial Shop' AND subtype = 'Retail';

  -- Demo Marriage Hall
  INSERT INTO properties (
    estate_id, asset_type_id, module_id, property_type_id,
    name, code, description, address, latitude, longitude,
    is_exempt, status, images, amenities, metadata, hall_details
  )
  VALUES (
    v_central_estate_id, v_community_hall_asset_id, v_govt_module_id, v_marriage_hall_type_id,
    'Narmada Marriage Hall', 'MH-BCL-001',
    'Spacious marriage hall at Bacheli township with full modern amenities, seating for 500 guests, dedicated parking and catering facilities.',
    'Narmada Hall, 6th main Lane, near SBI bank, opp to KV school, Bacheli, Dantewada, CG 494776',
    18.8281, 81.5125,
    false, 'PUBLISHED',
    '[]'::jsonb,
    '["Music System","CCTV","Central AC","Fire Safety","Ample Parking","Kitchen Facility","Backup Generator","Restrooms"]'::jsonb,
    '{"sector": "Sector 2", "district": "Dantewada", "state": "Chhattisgarh"}'::jsonb,
    v_marriage_hall_details
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name, description = EXCLUDED.description,
    hall_details = EXCLUDED.hall_details, status = EXCLUDED.status,
    updated_at = now();

  -- Demo Party Hall
  INSERT INTO properties (
    estate_id, asset_type_id, module_id, property_type_id,
    name, code, description, address, latitude, longitude,
    is_exempt, status, images, amenities, metadata, hall_details
  )
  VALUES (
    v_central_estate_id, v_community_hall_asset_id, v_govt_module_id, v_party_hall_type_id,
    'Narmada Party Hall', 'PH-BCL-001',
    'Vibrant party hall at Bacheli township for celebrations and social gatherings, seating for 200 guests with music and catering support.',
    'Narmada Hall Complex, 6th main Lane, near SBI bank, Bacheli, Dantewada, CG 494776',
    18.8279, 81.5122,
    false, 'PUBLISHED',
    '[]'::jsonb,
    '["Music System","CCTV","Fire Safety","Ample Parking","Kitchen Facility","Backup Generator","Restrooms"]'::jsonb,
    '{"sector": "Sector 2", "district": "Dantewada", "state": "Chhattisgarh"}'::jsonb,
    v_party_hall_details
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name, description = EXCLUDED.description,
    hall_details = EXCLUDED.hall_details, status = EXCLUDED.status,
    updated_at = now();

  -- Demo Convention Hall
  INSERT INTO properties (
    estate_id, asset_type_id, module_id, property_type_id,
    name, code, description, address, latitude, longitude,
    is_exempt, status, images, amenities, metadata, hall_details
  )
  VALUES (
    v_central_estate_id, v_community_hall_asset_id, v_govt_module_id, v_convention_hall_type_id,
    'Narmada Convention Hall', 'CH-BCL-001',
    'Large convention hall for conferences, seminars and corporate events at Bacheli. Fully air-conditioned with AV setup and 500-seat capacity.',
    'Narmada Hall Complex, 6th main Lane, near SBI bank, Bacheli, Dantewada, CG 494776',
    18.8283, 81.5128,
    false, 'PUBLISHED',
    '[]'::jsonb,
    '["Central AC","Music System","CCTV","Fire Safety","Ample Parking","Kitchen Facility","Backup Generator","Restrooms","AV Setup"]'::jsonb,
    '{"sector": "Sector 2", "district": "Dantewada", "state": "Chhattisgarh"}'::jsonb,
    v_convention_hall_details
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name, description = EXCLUDED.description,
    hall_details = EXCLUDED.hall_details, status = EXCLUDED.status,
    updated_at = now();

  -- Demo Commercial Shop
  INSERT INTO properties (
    estate_id, asset_type_id, module_id, property_type_id,
    name, code, description, address, latitude, longitude,
    is_exempt, status, images, amenities, metadata, shop_details
  )
  VALUES (
    v_central_estate_id, v_commercial_shop_asset_id, v_other_module_id, v_commercial_shop_type_id,
    'Bacheli General Store Unit-01', 'CS-BCL-001',
    'Ground-floor retail shop unit of 600 sqft in the Bacheli commercial complex. Suitable for general merchandise and retail operations.',
    'Commercial Complex, near SBI bank, opp to KV school, Bacheli, Dantewada, CG 494776',
    18.8275, 81.5130,
    false, 'PUBLISHED',
    '[]'::jsonb,
    '["CCTV","Water Connection","Fire Safety","Common Area Monitoring","Dedicated Power Connection"]'::jsonb,
    '{"sector": "Sector 1-2", "district": "Dantewada", "state": "Chhattisgarh"}'::jsonb,
    v_shop_details_json
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name, description = EXCLUDED.description,
    shop_details = EXCLUDED.shop_details, status = EXCLUDED.status,
    updated_at = now();

END $$;
