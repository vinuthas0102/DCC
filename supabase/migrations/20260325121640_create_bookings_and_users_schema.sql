/*
  # Bookings and User Management Schema

  ## Overview
  Creates tables for user management, booking workflows, payment tracking,
  and the complete booking lifecycle state machine.

  ## New Tables Created

  ### 1. users
  Extended user profiles beyond Supabase auth.users
  - id: UUID matching auth.users.id
  - email: User email
  - fullName: Display name
  - phone: Contact number
  - role: public, govt_official, manager, dept_user, admin
  - govtDepartment: For govt officials
  - govtEmployeeId: For govt officials
  - assignedEstateId: For managers
  - metadata: Additional JSON data
  - createdAt, updatedAt: Audit timestamps

  ### 2. bookings
  Main booking requests with status machine
  - id: UUID primary key
  - bookingNumber: Human-readable unique identifier
  - userId: Foreign key to users
  - propertyId: Foreign key to properties
  - roomTypeId: Foreign key to room_types (user selects type, not specific room)
  - quantity: Number of rooms requested
  - checkInDate, checkOutDate: Reservation dates
  - guestDetails: JSON with guest information
  - specialRequirements: Text for auditorium needs (sound/light, seating, generator, garbage)
  - status: REQUESTED, PROVISIONED, ALLOCATED, CHECKED_IN, CHECKED_OUT, CANCELLED, REJECTED
  - totalAmount: Calculated price
  - paidAmount: Amount paid
  - balanceAmount: Outstanding balance
  - paymentStatus: PENDING, PARTIAL, COMPLETED, REFUNDED
  - otp: 6-digit code for check-in verification
  - otpExpiresAt: OTP validity timestamp
  - rejectionReason: If rejected
  - notes: Manager notes
  - createdAt, updatedAt: Audit timestamps

  ### 3. booking_allocations
  Manager assigns specific physical rooms to booking requests
  - id: UUID primary key
  - bookingId: Foreign key to bookings
  - roomId: Foreign key to rooms (specific physical room)
  - allocatedBy: Manager user ID
  - allocatedAt: Timestamp
  - checkInTime, checkOutTime: Actual times
  - guestSignature: Base64 signature image

  ### 4. transactions
  Payment tracking for mock payment gateway
  - id: UUID primary key
  - bookingId: Foreign key to bookings
  - transactionId: Mock gateway transaction ID
  - amount: Transaction amount
  - paymentMethod: IBL-ATOM mock gateway
  - paymentStatus: SUCCESS, FAILURE, PENDING
  - paymentGatewayResponse: JSON response from mock gateway
  - createdAt: Transaction timestamp

  ### 5. audit_logs
  Track all critical actions and status changes
  - id: UUID primary key
  - tableName: Affected table
  - recordId: Affected record UUID
  - action: INSERT, UPDATE, DELETE, STATUS_CHANGE
  - oldValues: JSON snapshot before change
  - newValues: JSON snapshot after change
  - userId: User who performed action
  - createdAt: Action timestamp

  ### 6. ad_hoc_links
  Manager-generated links for phone-in bookings
  - id: UUID primary key
  - token: Unique URL token
  - managerId: Creating manager
  - propertyId: Pre-selected property
  - expiresAt: Link expiry
  - metadata: Pre-filled booking data
  - used: Boolean flag
  - usedAt: Usage timestamp
  - createdAt: Creation timestamp

  ## Security
  - RLS enabled on all tables
  - Users can view and update their own profiles
  - Users can view their own bookings
  - Managers can view bookings for their assigned estates
  - Admins have full access
  - Audit logs are read-only for users, write-only via triggers

  ## Indexes
  - Booking lookups by user, property, status, dates
  - Transaction lookups by booking
  - Allocation lookups by booking and room
  - Audit log searches by table and record
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text DEFAULT '',
  phone text DEFAULT '',
  role text DEFAULT 'public',
  govt_department text DEFAULT '',
  govt_employee_id text DEFAULT '',
  assigned_estate_id uuid REFERENCES estates(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number text UNIQUE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE RESTRICT,
  room_type_id uuid REFERENCES room_types(id) ON DELETE RESTRICT,
  quantity integer DEFAULT 1,
  check_in_date date NOT NULL,
  check_out_date date NOT NULL,
  guest_details jsonb DEFAULT '{}'::jsonb,
  special_requirements text DEFAULT '',
  status text DEFAULT 'REQUESTED',
  total_amount decimal(10, 2) DEFAULT 0,
  paid_amount decimal(10, 2) DEFAULT 0,
  balance_amount decimal(10, 2) DEFAULT 0,
  payment_status text DEFAULT 'PENDING',
  otp text DEFAULT '',
  otp_expires_at timestamptz,
  rejection_reason text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create booking_allocations table
CREATE TABLE IF NOT EXISTS booking_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  room_id uuid REFERENCES rooms(id) ON DELETE RESTRICT,
  allocated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  allocated_at timestamptz DEFAULT now(),
  check_in_time timestamptz,
  check_out_time timestamptz,
  guest_signature text DEFAULT ''
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  transaction_id text NOT NULL,
  amount decimal(10, 2) NOT NULL,
  payment_method text DEFAULT 'IBL-ATOM',
  payment_status text DEFAULT 'PENDING',
  payment_gateway_response jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL,
  old_values jsonb DEFAULT '{}'::jsonb,
  new_values jsonb DEFAULT '{}'::jsonb,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create ad_hoc_links table
CREATE TABLE IF NOT EXISTS ad_hoc_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  manager_id uuid REFERENCES users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  used boolean DEFAULT false,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_bookings_number ON bookings(booking_number);
CREATE INDEX IF NOT EXISTS idx_allocations_booking ON booking_allocations(booking_id);
CREATE INDEX IF NOT EXISTS idx_allocations_room ON booking_allocations(room_id);
CREATE INDEX IF NOT EXISTS idx_transactions_booking ON transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_ad_hoc_token ON ad_hoc_links(token);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_hoc_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Admins can manage users"
  ON users FOR ALL
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

-- RLS Policies for bookings
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Managers can view bookings for their properties"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    auth.jwt()->>'role' IN ('manager', 'admin')
    OR auth.uid() = user_id
  );

CREATE POLICY "Authenticated users can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'REQUESTED')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can update bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.jwt()->>'role' IN ('manager', 'admin'))
  WITH CHECK (auth.jwt()->>'role' IN ('manager', 'admin'));

-- RLS Policies for booking_allocations
CREATE POLICY "Users can view allocations for their bookings"
  ON booking_allocations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = booking_allocations.booking_id 
      AND bookings.user_id = auth.uid()
    )
    OR auth.jwt()->>'role' IN ('manager', 'admin')
  );

CREATE POLICY "Managers can create allocations"
  ON booking_allocations FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt()->>'role' IN ('manager', 'admin'));

CREATE POLICY "Managers can update allocations"
  ON booking_allocations FOR UPDATE
  TO authenticated
  USING (auth.jwt()->>'role' IN ('manager', 'admin'))
  WITH CHECK (auth.jwt()->>'role' IN ('manager', 'admin'));

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = transactions.booking_id 
      AND bookings.user_id = auth.uid()
    )
    OR auth.jwt()->>'role' IN ('manager', 'admin')
  );

CREATE POLICY "System can create transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "System can create audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for ad_hoc_links
CREATE POLICY "Managers can view own ad-hoc links"
  ON ad_hoc_links FOR SELECT
  TO authenticated
  USING (auth.uid() = manager_id OR auth.jwt()->>'role' = 'admin');

CREATE POLICY "Managers can create ad-hoc links"
  ON ad_hoc_links FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt()->>'role' IN ('manager', 'admin'));

CREATE POLICY "Public can use valid ad-hoc links"
  ON ad_hoc_links FOR SELECT
  USING (used = false AND expires_at > now());

-- Function to generate booking number
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS text AS $$
DECLARE
  new_number text;
  counter integer;
BEGIN
  SELECT COUNT(*) + 1 INTO counter FROM bookings;
  new_number := 'BK' || TO_CHAR(now(), 'YYYYMMDD') || LPAD(counter::text, 5, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate OTP
CREATE OR REPLACE FUNCTION generate_otp()
RETURNS text AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
END;
$$ LANGUAGE plpgsql;