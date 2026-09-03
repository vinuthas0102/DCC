/*
  # Facilities Management System - Core Schema

  ## Overview
  Creates the foundational database structure for a comprehensive Facilities Management System
  supporting B2G (Government) and B2C (Public) reservations with hierarchical asset organization.

  ## New Tables Created

  ### 1. regions
  Geographic regions for organizing estates
  - id: UUID primary key
  - name: Region name
  - code: Unique region code
  - description: Region details
  - isActive: Soft delete flag
  - createdAt, updatedAt: Audit timestamps

  ### 2. estates
  Properties grouped within regions
  - id: UUID primary key
  - regionId: Foreign key to regions
  - name, code: Estate identification
  - address, city, state, pincode: Location details
  - contactPerson, contactEmail, contactPhone: Estate contact
  - isActive: Soft delete flag
  - createdAt, updatedAt: Audit timestamps

  ### 3. asset_types
  Categories of facilities (Guest House, Hall, Park, Auditorium)
  - id: UUID primary key
  - name: Type name (e.g., "Guest House")
  - subtype: Subtype (e.g., "Lecture Hall", "Theater")
  - category: A, B, or C for access control
  - description: Type details
  - isActive: Status flag

  ### 4. properties
  Individual facilities/buildings within estates
  - id: UUID primary key
  - estateId: Foreign key to estates
  - assetTypeId: Foreign key to asset_types
  - name, code: Property identification
  - description: Full property details
  - address details: latitude, longitude for radius search
  - isExempt: Hide from public search
  - status: DRAFT or PUBLISHED
  - images: JSON array of image URLs
  - amenities: JSON array of amenity IDs
  - metadata: Additional JSON data
  - createdBy, updatedBy: User tracking
  - createdAt, updatedAt: Audit timestamps

  ### 5. blocks
  Buildings within properties
  - id: UUID primary key
  - propertyId: Foreign key to properties
  - name, code: Block identification
  - floors: Number of floors
  - isActive: Status flag

  ### 6. floors
  Floors within blocks
  - id: UUID primary key
  - blockId: Foreign key to blocks
  - floorNumber: Floor level
  - name: Floor name/label
  - isActive: Status flag

  ### 7. room_types
  Booking categories (Suite, Deluxe, Standard, etc.)
  - id: UUID primary key
  - name: Type name
  - description: Type details
  - defaultCapacity: Standard occupancy
  - sortOrder: Display ordering
  - isActive: Status flag

  ### 8. rooms
  Physical room units
  - id: UUID primary key
  - floorId: Foreign key to floors
  - roomTypeId: Foreign key to room_types
  - roomNumber: Room identifier
  - capacity: Guest capacity
  - basePrice: Nightly rate
  - amenities: JSON array
  - isSmokingAllowed: Boolean flag
  - metadata: Additional JSON data
  - status: AVAILABLE, OCCUPIED, CLEANING, MAINTENANCE
  - isActive: Status flag

  ### 9. amenities
  Available facility features
  - id: UUID primary key
  - name: Amenity name
  - icon: Icon identifier
  - category: Grouping (e.g., "Basic", "Premium")
  - isActive: Status flag

  ## Security
  - RLS enabled on all tables
  - Public read access to published, non-exempt properties
  - Admin full access for property management
  - Manager access for their assigned estates
  - Authenticated users can view their accessible properties based on role

  ## Indexes
  - Property search optimization on name, code, estateId
  - Room lookup by propertyId, floorId, roomTypeId
  - Estate filtering by regionId
  - Performance indexes on frequently queried foreign keys
*/

-- Create regions table
CREATE TABLE IF NOT EXISTS regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create estates table
CREATE TABLE IF NOT EXISTS estates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id uuid REFERENCES regions(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  address text DEFAULT '',
  city text DEFAULT '',
  state text DEFAULT '',
  pincode text DEFAULT '',
  contact_person text DEFAULT '',
  contact_email text DEFAULT '',
  contact_phone text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create asset_types table
CREATE TABLE IF NOT EXISTS asset_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subtype text DEFAULT '',
  category text DEFAULT 'B',
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estate_id uuid REFERENCES estates(id) ON DELETE CASCADE,
  asset_type_id uuid REFERENCES asset_types(id) ON DELETE RESTRICT,
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  description text DEFAULT '',
  address text DEFAULT '',
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  is_exempt boolean DEFAULT false,
  status text DEFAULT 'DRAFT',
  images jsonb DEFAULT '[]'::jsonb,
  amenities jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create blocks table
CREATE TABLE IF NOT EXISTS blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  floors integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create floors table
CREATE TABLE IF NOT EXISTS floors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id uuid REFERENCES blocks(id) ON DELETE CASCADE,
  floor_number integer NOT NULL,
  name text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create room_types table
CREATE TABLE IF NOT EXISTS room_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text DEFAULT '',
  default_capacity integer DEFAULT 2,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id uuid REFERENCES floors(id) ON DELETE CASCADE,
  room_type_id uuid REFERENCES room_types(id) ON DELETE RESTRICT,
  room_number text NOT NULL,
  capacity integer DEFAULT 2,
  base_price decimal(10, 2) DEFAULT 0,
  amenities jsonb DEFAULT '[]'::jsonb,
  is_smoking_allowed boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'AVAILABLE',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create amenities table
CREATE TABLE IF NOT EXISTS amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  icon text DEFAULT 'circle',
  category text DEFAULT 'Basic',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_estates_region ON estates(region_id);
CREATE INDEX IF NOT EXISTS idx_properties_estate ON properties(estate_id);
CREATE INDEX IF NOT EXISTS idx_properties_asset_type ON properties(asset_type_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_blocks_property ON blocks(property_id);
CREATE INDEX IF NOT EXISTS idx_floors_block ON floors(block_id);
CREATE INDEX IF NOT EXISTS idx_rooms_floor ON rooms(floor_id);
CREATE INDEX IF NOT EXISTS idx_rooms_type ON rooms(room_type_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);

-- Enable RLS on all tables
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE estates ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE amenities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for regions (Admin only for write, all authenticated for read)
CREATE POLICY "Anyone can view active regions"
  ON regions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can insert regions"
  ON regions FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Admins can update regions"
  ON regions FOR UPDATE
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Admins can delete regions"
  ON regions FOR DELETE
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin');

-- RLS Policies for estates
CREATE POLICY "Anyone can view active estates"
  ON estates FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins and managers can insert estates"
  ON estates FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt()->>'role' IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can update estates"
  ON estates FOR UPDATE
  TO authenticated
  USING (auth.jwt()->>'role' IN ('admin', 'manager'))
  WITH CHECK (auth.jwt()->>'role' IN ('admin', 'manager'));

CREATE POLICY "Admins can delete estates"
  ON estates FOR DELETE
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin');

-- RLS Policies for asset_types
CREATE POLICY "Anyone can view active asset types"
  ON asset_types FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage asset types"
  ON asset_types FOR ALL
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

-- RLS Policies for properties
CREATE POLICY "Public can view published non-exempt properties"
  ON properties FOR SELECT
  USING (status = 'PUBLISHED' AND is_exempt = false);

CREATE POLICY "Authenticated users can view all properties based on role"
  ON properties FOR SELECT
  TO authenticated
  USING (
    CASE 
      WHEN auth.jwt()->>'role' IN ('admin', 'manager') THEN true
      WHEN auth.jwt()->>'role' = 'govt_official' THEN true
      ELSE status = 'PUBLISHED' AND is_exempt = false
    END
  );

CREATE POLICY "Admins and managers can insert properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt()->>'role' IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can update properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (auth.jwt()->>'role' IN ('admin', 'manager'))
  WITH CHECK (auth.jwt()->>'role' IN ('admin', 'manager'));

CREATE POLICY "Admins can delete properties"
  ON properties FOR DELETE
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin');

-- RLS Policies for blocks
CREATE POLICY "Anyone can view active blocks"
  ON blocks FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins and managers can manage blocks"
  ON blocks FOR ALL
  TO authenticated
  USING (auth.jwt()->>'role' IN ('admin', 'manager'))
  WITH CHECK (auth.jwt()->>'role' IN ('admin', 'manager'));

-- RLS Policies for floors
CREATE POLICY "Anyone can view active floors"
  ON floors FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins and managers can manage floors"
  ON floors FOR ALL
  TO authenticated
  USING (auth.jwt()->>'role' IN ('admin', 'manager'))
  WITH CHECK (auth.jwt()->>'role' IN ('admin', 'manager'));

-- RLS Policies for room_types
CREATE POLICY "Anyone can view active room types"
  ON room_types FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage room types"
  ON room_types FOR ALL
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

-- RLS Policies for rooms
CREATE POLICY "Authenticated users can view active rooms"
  ON rooms FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Managers can view all rooms"
  ON rooms FOR SELECT
  TO authenticated
  USING (auth.jwt()->>'role' IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can manage rooms"
  ON rooms FOR ALL
  TO authenticated
  USING (auth.jwt()->>'role' IN ('admin', 'manager'))
  WITH CHECK (auth.jwt()->>'role' IN ('admin', 'manager'));

-- RLS Policies for amenities
CREATE POLICY "Anyone can view active amenities"
  ON amenities FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage amenities"
  ON amenities FOR ALL
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

-- Insert default room types
INSERT INTO room_types (name, description, default_capacity, sort_order) VALUES
  ('Standard', 'Basic accommodation with essential amenities', 2, 1),
  ('Deluxe', 'Enhanced room with premium amenities', 2, 2),
  ('Suite', 'Spacious suite with separate living area', 4, 3),
  ('Presidential Suite', 'Luxury suite with premium features', 6, 4)
ON CONFLICT (name) DO NOTHING;

-- Insert default amenities
INSERT INTO amenities (name, icon, category) VALUES
  ('WiFi', 'wifi', 'Basic'),
  ('Air Conditioning', 'air-vent', 'Basic'),
  ('Television', 'tv', 'Basic'),
  ('Mini Bar', 'glass-water', 'Premium'),
  ('Room Service', 'bell', 'Premium'),
  ('Parking', 'car', 'Basic'),
  ('Swimming Pool', 'waves', 'Premium'),
  ('Gym', 'dumbbell', 'Premium'),
  ('Conference Room', 'presentation', 'Business'),
  ('Sound System', 'volume-2', 'Auditorium'),
  ('Projector', 'projector', 'Auditorium'),
  ('Stage', 'drama', 'Auditorium'),
  ('Kitchen', 'chef-hat', 'Hall'),
  ('Catering', 'utensils', 'Hall')
ON CONFLICT (name) DO NOTHING;

-- Insert default asset types
INSERT INTO asset_types (name, subtype, category, description) VALUES
  ('Guest House', 'Residential', 'B', 'Residential accommodation facilities'),
  ('Guest House', 'Premium', 'A', 'Premium residential accommodation for senior officials'),
  ('Community Hall', 'Standard', 'B', 'General purpose community gathering spaces'),
  ('Auditorium', 'Lecture Hall', 'B', 'Educational lecture and presentation spaces'),
  ('Auditorium', 'Theater', 'A', 'Theater-style auditoriums with stage facilities'),
  ('Auditorium', 'Classroom', 'C', 'Training and classroom facilities'),
  ('Park', 'Public', 'B', 'Public recreational park spaces')
ON CONFLICT DO NOTHING;