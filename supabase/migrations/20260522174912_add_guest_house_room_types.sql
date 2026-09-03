/*
  # Add Guest House Room Types

  Inserts four standard government guest house room type categories:
  - Executive
  - Non-Executive
  - Executive AC
  - Non-Executive Non-AC

  These are added with sort_order 5–8, continuing after the existing
  Standard / Deluxe / Suite / Presidential Suite entries.
*/

INSERT INTO room_types (name, description, default_capacity, sort_order, is_active)
VALUES
  ('Executive',             'Executive category room for senior officials',         2, 5, true),
  ('Non-Executive',         'Non-executive category room for staff',                2, 6, true),
  ('Executive AC',          'Air-conditioned executive category room',              2, 7, true),
  ('Non-Executive Non-AC',  'Non-air-conditioned room for non-executive staff',     2, 8, true)
ON CONFLICT DO NOTHING;
