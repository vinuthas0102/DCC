/*
  # Add Public SELECT Policy for Rooms Table

  ## Summary
  Fixes the availability calendar showing "0/0" for all dates by allowing anonymous users to view active rooms.

  ## Problem
  The blocks and floors tables have public SELECT policies, but the rooms table only allows authenticated users to query rooms. This breaks the availability calendar for guest users because the rooms query returns empty due to RLS restrictions.

  ## Changes
  1. Add a public SELECT policy for the rooms table that allows anyone to view active rooms
  2. This matches the existing pattern used for blocks and floors tables
  3. The policy only exposes active rooms, maintaining appropriate data visibility

  ## Security Considerations
  - Only active rooms are visible to public users
  - Read-only access (SELECT only)
  - No sensitive data is exposed (room numbers, types, and status are public information)
  - Write operations still require authentication
*/

-- Add public SELECT policy for rooms to allow availability calendar to work for guests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'rooms' 
    AND policyname = 'Anyone can view active rooms'
  ) THEN
    CREATE POLICY "Anyone can view active rooms"
      ON rooms
      FOR SELECT
      TO public
      USING (is_active = true);
  END IF;
END $$;
