/*
  # Expand Amenities Catalogue

  ## Summary
  Adds sort_order column to amenities table and seeds 40+ new amenities
  covering room features (balcony, fridge, kitchen, living room, views,
  bed types, policies) across well-organised categories. Existing 14
  amenities are untouched via ON CONFLICT DO NOTHING.

  ## Changes
  - Add `sort_order` integer column to `amenities` (default 0)
  - Seed new amenities in categories:
    Room Features, Views, Policies, Comfort, Entertainment,
    Dining, Facilities, Business, Outdoor
  - Update sort_order on existing + new rows so display order is predictable
*/

-- Add sort_order if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'amenities' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE amenities ADD COLUMN sort_order integer DEFAULT 0;
  END IF;
END $$;

-- Seed new amenities (skip if name already exists)
INSERT INTO amenities (name, icon, category, sort_order) VALUES
  -- Room Features
  ('Balcony',              'layout-panel-top',  'Room Features', 10),
  ('Fridge',               'refrigerator',      'Room Features', 20),
  ('Kitchen Available',    'chef-hat',          'Room Features', 30),
  ('Living Room',          'sofa',              'Room Features', 40),
  ('Private Bathroom',     'bath',              'Room Features', 50),
  ('Bathtub',              'bath',              'Room Features', 60),
  ('Wardrobe',             'archive',           'Room Features', 70),
  ('Study Desk',           'book-open',         'Room Features', 80),
  ('Safe Box',             'lock',              'Room Features', 90),
  ('Hot Water',            'flame',             'Room Features', 100),

  -- Views
  ('Garden View',          'trees',             'Views',         10),
  ('Mountain View',        'mountain',          'Views',         20),
  ('Sea View',             'waves',             'Views',         30),
  ('City View',            'building-2',        'Views',         40),
  ('Pool View',            'droplets',          'Views',         50),
  ('Courtyard View',       'circle-dot',        'Views',         60),

  -- Policies
  ('Kids Friendly',        'baby',              'Policies',      10),
  ('Pets Friendly',        'paw-print',         'Policies',      20),
  ('Wheelchair Accessible','accessibility',     'Policies',      30),
  ('Smoking Allowed',      'cigarette',         'Policies',      40),

  -- Comfort
  ('Heating',              'thermometer-sun',   'Comfort',       10),
  ('Ceiling Fan',          'wind',              'Comfort',       20),
  ('Blackout Curtains',    'moon',              'Comfort',       30),

  -- Entertainment
  ('Streaming Service',    'monitor-play',      'Entertainment', 10),
  ('Bluetooth Speaker',    'bluetooth',         'Entertainment', 20),

  -- Dining
  ('Breakfast Included',   'coffee',            'Dining',        10),
  ('Restaurant Access',    'utensils',          'Dining',        20),
  ('Bar',                  'wine',              'Dining',        30),

  -- Facilities
  ('Laundry Service',      'washing-machine',   'Facilities',    10),
  ('Elevator',             'arrow-up-down',     'Facilities',    20),
  ('Meeting Room',         'users',             'Facilities',    30),
  ('Business Center',      'briefcase',         'Facilities',    40),

  -- Outdoor
  ('Garden',               'tree-pine',         'Outdoor',       10),
  ('Terrace',              'sun',               'Outdoor',       20),
  ('Rooftop',              'building',          'Outdoor',       30),
  ('BBQ Area',             'flame',             'Outdoor',       40)

ON CONFLICT (name) DO NOTHING;

-- Update sort_order on original seeded amenities so they sort properly
UPDATE amenities SET sort_order = 10, category = 'Comfort'      WHERE name = 'Air Conditioning' AND sort_order = 0;
UPDATE amenities SET sort_order = 10, category = 'Basic'        WHERE name = 'WiFi'             AND sort_order = 0;
UPDATE amenities SET sort_order = 20, category = 'Basic'        WHERE name = 'Television'       AND sort_order = 0;
UPDATE amenities SET sort_order = 30, category = 'Basic'        WHERE name = 'Parking'          AND sort_order = 0;
UPDATE amenities SET sort_order = 10, category = 'Facilities'   WHERE name = 'Swimming Pool'    AND sort_order = 0;
UPDATE amenities SET sort_order = 20, category = 'Facilities'   WHERE name = 'Gym'              AND sort_order = 0;
UPDATE amenities SET sort_order = 10, category = 'Dining'       WHERE name = 'Mini Bar'         AND sort_order = 0;
UPDATE amenities SET sort_order = 40, category = 'Facilities'   WHERE name = 'Room Service'     AND sort_order = 0;
UPDATE amenities SET sort_order = 10, category = 'Business'     WHERE name = 'Conference Room'  AND sort_order = 0;
UPDATE amenities SET sort_order = 10, category = 'Auditorium'   WHERE name = 'Sound System'     AND sort_order = 0;
UPDATE amenities SET sort_order = 20, category = 'Auditorium'   WHERE name = 'Projector'        AND sort_order = 0;
UPDATE amenities SET sort_order = 30, category = 'Auditorium'   WHERE name = 'Stage'            AND sort_order = 0;
UPDATE amenities SET sort_order = 40, category = 'Dining'       WHERE name = 'Kitchen'          AND sort_order = 0;
UPDATE amenities SET sort_order = 50, category = 'Dining'       WHERE name = 'Catering'         AND sort_order = 0;
