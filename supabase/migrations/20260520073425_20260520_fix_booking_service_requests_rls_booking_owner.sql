/*
  # Fix booking_service_requests RLS — allow booking owner to read service requests

  ## Problem
  The existing SELECT policy on booking_service_requests only allows:
    employee_id = auth.uid()
  
  This means a booking owner (user_id on the bookings table) cannot see service
  requests attached to their own bookings unless they were also the employee who filed
  the request. In demo/production, booking owners need to see all service activity
  on their bookings.

  ## Changes
  - Add a new SELECT policy: booking owner can see all service requests on their bookings
    (JOIN through bookings table: bookings.user_id = auth.uid())
  - The existing employee_id policy remains in place for employees

  ## Security
  - Only the booking owner (user who made the booking) can read via this policy
  - Managers retain their existing broad read access
*/

CREATE POLICY "Booking owner can view service requests for their bookings"
  ON booking_service_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_service_requests.booking_id
        AND bookings.user_id = auth.uid()
    )
  );
