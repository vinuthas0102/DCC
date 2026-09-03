/*
  # Update Demo Property Data

  ## Summary
  Updates demo properties with meaningful addresses, descriptions, and amenities
  so that the Available Properties panel shows human-readable data instead of
  placeholder text and UUID amenity tags.

  ## Changes

  ### Community Hall (COMM-BLR-001)
  - Fix dummy address "asdghj" → real-looking government complex address
  - Add more amenities (WiFi, Parking, Kitchen)

  ### Guest House 001 (GH-BLR-001)
  - Update address to be more descriptive
  - Add standard guest house amenities

  ### Guest House 002 (GH-BLR-002)
  - Update address and add amenities

  ### Guest House BNG North (GH-BLR-009)
  - Already has amenities, update address to be descriptive

  ### Heritage Guest House (PROP001)
  - Add amenities appropriate for a guest house

  ### Marine Drive Community Hall (PROP002)
  - Add amenities appropriate for a community hall
  - Fix address

  ## Amenity UUIDs used
  - WiFi:              66c494be-b0bd-4296-80a0-6233b892e83f
  - Air Conditioning:  6ce26aa1-3486-4844-af13-bbc5f566b373
  - Parking:           989d92eb-1454-4529-9c94-76939323ff5f
  - Television:        a915fa73-46b1-4f85-a333-f142cc1078cd
  - Room Service:      0128b3e5-b179-46d8-8b0e-c5c42c64d397
  - Kitchen:           21bfe258-d254-4d1c-b4d4-e2e04927c3fd
  - Projector:         07b190f6-2669-4c44-be5d-6bf858aa10f9
  - Sound System:      ce32d100-2ac2-4bf5-80ee-2b10bfd72481
  - Stage:             73b27aac-e701-41c1-9bc5-7bcc4ab6b7c0
  - Catering:          060726d1-26e3-4bee-b60b-ef722331a8ae
  - Conference Room:   dc6a23cb-eeea-491b-a094-456e7955a414
  - Elevator:          e6e17687-0050-4721-8020-af849ed72da6
  - Wheelchair Access: a0a0d883-6f35-4bbd-8c17-2ca8d92416a6
  - Breakfast:         e14279fe-86fb-46a7-8c5f-75320379b51e
  - Laundry:           0687b5d8-d800-4020-8fb8-9486f4374049
*/

-- Community Hall: fix address, description, expand amenities
UPDATE properties
SET
  address     = 'Sector 5, Government Complex, Near Central Park, Bengaluru - 560001',
  description = 'A spacious community and marriage hall managed by the Government, ideal for large gatherings, cultural events, and official ceremonies. Features modern audio-visual equipment and ample parking.',
  amenities   = '["07b190f6-2669-4c44-be5d-6bf858aa10f9","ce32d100-2ac2-4bf5-80ee-2b10bfd72481","73b27aac-e701-41c1-9bc5-7bcc4ab6b7c0","6ce26aa1-3486-4844-af13-bbc5f566b373","060726d1-26e3-4bee-b60b-ef722331a8ae","66c494be-b0bd-4296-80a0-6233b892e83f","989d92eb-1454-4529-9c94-76939323ff5f","21bfe258-d254-4d1c-b4d4-e2e04927c3fd"]'::jsonb
WHERE code = 'COMM-BLR-001';

-- Guest House 001: update address and add amenities
UPDATE properties
SET
  address     = 'Block A, Government Employee Quarters, Koramangala, Bengaluru - 560034',
  description = 'Well-maintained government guest house offering comfortable accommodation for officials and employees on official duty. Centrally located with easy access to key government offices.',
  amenities   = '["66c494be-b0bd-4296-80a0-6233b892e83f","6ce26aa1-3486-4844-af13-bbc5f566b373","a915fa73-46b1-4f85-a333-f142cc1078cd","989d92eb-1454-4529-9c94-76939323ff5f","0128b3e5-b179-46d8-8b0e-c5c42c64d397","e14279fe-86fb-46a7-8c5f-75320379b51e"]'::jsonb
WHERE code = 'GH-BLR-001';

-- Guest House 002: update address and add amenities
UPDATE properties
SET
  address     = 'Block B, Government Employee Quarters, Koramangala, Bengaluru - 560034',
  description = 'Standard government guest house with essential amenities. Suitable for short-term stays by government officials and visiting dignitaries.',
  amenities   = '["66c494be-b0bd-4296-80a0-6233b892e83f","6ce26aa1-3486-4844-af13-bbc5f566b373","a915fa73-46b1-4f85-a333-f142cc1078cd","989d92eb-1454-4529-9c94-76939323ff5f","0687b5d8-d800-4020-8fb8-9486f4374049"]'::jsonb
WHERE code = 'GH-BLR-002';

-- Guest House BNG North: update address to be descriptive
UPDATE properties
SET
  address     = 'Northern Sector, NMDC Government Campus, Rajajinagar, Bengaluru - 560010',
  description = 'Modern government guest house in the northern sector of the NMDC campus. Equipped with all essential facilities for comfortable official stays.'
WHERE code = 'GH-BLR-009';

-- Heritage Guest House: add amenities, improve address if generic
UPDATE properties
SET
  description = 'A heritage property offering elegant accommodation with classic interiors. A preferred stay for senior officials visiting Delhi on official engagements.',
  amenities   = '["66c494be-b0bd-4296-80a0-6233b892e83f","6ce26aa1-3486-4844-af13-bbc5f566b373","a915fa73-46b1-4f85-a333-f142cc1078cd","989d92eb-1454-4529-9c94-76939323ff5f","0128b3e5-b179-46d8-8b0e-c5c42c64d397","e14279fe-86fb-46a7-8c5f-75320379b51e","e6e17687-0050-4721-8020-af849ed72da6"]'::jsonb
WHERE code = 'PROP001';

-- Marine Drive Community Hall: add amenities and improve description
UPDATE properties
SET
  address     = 'Marine Drive Sector, Government Colony, Near Marine Lines, Mumbai - 400002',
  description = 'Premier community hall situated along Marine Drive, ideal for official receptions, conferences, and large-scale government events. Equipped with state-of-the-art audio-visual facilities.',
  amenities   = '["07b190f6-2669-4c44-be5d-6bf858aa10f9","ce32d100-2ac2-4bf5-80ee-2b10bfd72481","73b27aac-e701-41c1-9bc5-7bcc4ab6b7c0","6ce26aa1-3486-4844-af13-bbc5f566b373","060726d1-26e3-4bee-b60b-ef722331a8ae","dc6a23cb-eeea-491b-a094-456e7955a414","989d92eb-1454-4529-9c94-76939323ff5f","a0a0d883-6f35-4bbd-8c17-2ca8d92416a6"]'::jsonb
WHERE code = 'PROP002';
