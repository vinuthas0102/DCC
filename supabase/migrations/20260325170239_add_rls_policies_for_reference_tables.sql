/*
  # Add RLS Policies for Reference Data Tables

  1. Overview
    This migration adds SELECT policies for reference data tables to allow all authenticated users
    to read the data needed for property creation and booking workflows.

  2. Tables Updated
    - `asset_types` - Asset classification data (Guest House, Conference Hall, etc.)
    - `regions` - Geographic regions
    - `estates` - Estate/campus information
    - `room_types` - Room classifications (Single, Double, Suite, etc.)
    - `amenities` - Available amenities (WiFi, AC, TV, etc.)

  3. Security Changes
    - Add SELECT policy for authenticated users on all reference tables
    - These are read-only reference tables, so SELECT-only access is appropriate
    - Only active records are exposed through the application layer

  4. Important Notes
    - Reference data is needed by all users for property search and booking
    - These tables contain no sensitive user data
    - Write access remains restricted to administrators through existing policies
*/

-- Asset Types: Allow all authenticated users to read asset types
CREATE POLICY "Authenticated users can view asset types"
  ON asset_types
  FOR SELECT
  TO authenticated
  USING (true);

-- Regions: Allow all authenticated users to read regions
CREATE POLICY "Authenticated users can view regions"
  ON regions
  FOR SELECT
  TO authenticated
  USING (true);

-- Estates: Allow all authenticated users to read estates
CREATE POLICY "Authenticated users can view estates"
  ON estates
  FOR SELECT
  TO authenticated
  USING (true);

-- Room Types: Allow all authenticated users to read room types
CREATE POLICY "Authenticated users can view room types"
  ON room_types
  FOR SELECT
  TO authenticated
  USING (true);

-- Amenities: Allow all authenticated users to read amenities
CREATE POLICY "Authenticated users can view amenities"
  ON amenities
  FOR SELECT
  TO authenticated
  USING (true);

-- Properties: Allow all authenticated users to read properties
CREATE POLICY "Authenticated users can view properties"
  ON properties
  FOR SELECT
  TO authenticated
  USING (true);

-- Blocks: Allow all authenticated users to read blocks
CREATE POLICY "Authenticated users can view blocks"
  ON blocks
  FOR SELECT
  TO authenticated
  USING (true);

-- Floors: Allow all authenticated users to read floors
CREATE POLICY "Authenticated users can view floors"
  ON floors
  FOR SELECT
  TO authenticated
  USING (true);

-- Rooms: Allow all authenticated users to read rooms
CREATE POLICY "Authenticated users can view rooms"
  ON rooms
  FOR SELECT
  TO authenticated
  USING (true);