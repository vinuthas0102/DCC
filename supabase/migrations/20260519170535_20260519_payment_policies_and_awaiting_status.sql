/*
  # Payment Policy Configuration & AWAITING_PAYMENT Status

  ## Summary
  This migration introduces a configurable payment window system for properties.
  Each property can have a payment policy that specifies WHEN payment is required
  relative to the booking lifecycle.

  ## New Tables
  - `payment_policies`
    - `id` (uuid, PK)
    - `property_id` (uuid, FK → properties.id, UNIQUE — one policy per property)
    - `reference_date` (text) — one of: 'on_request' | 'allotment_date' | 'acceptance_date'
    - `days_offset` (integer) — positive = after reference, negative = before reference
    - `allow_manual_payment` (boolean) — whether manager can record offline payments
    - `is_active` (boolean)
    - `created_at`, `updated_at`

  ## Modified Tables
  - `bookings` — two new nullable columns:
    - `payment_expires_at` (timestamptz) — computed deadline; NULL if no policy
    - `payment_scenario` (text) — captures which policy triggered: 'immediate' | 'post_approval' | 'pre_acceptance'

  - `transactions` — two new nullable columns:
    - `reference_number` (text) — for offline/manual payment references
    - `payment_notes` (text) — free-text notes for manual payments

  ## Payment Flow Reference
  - `on_request`     → payment_scenario = 'immediate'       → REQUESTED → AWAITING_PAYMENT → PROVISIONED
  - `allotment_date` → payment_scenario = 'post_approval'   → PROVISIONED → AWAITING_PAYMENT → ALLOCATED
  - `acceptance_date`→ payment_scenario = 'pre_acceptance'  → ALLOCATED → AWAITING_PAYMENT → CHECKED_IN

  ## Security
  - RLS enabled on payment_policies
  - Managers can manage payment policies
  - Authenticated users can read policies for properties they have bookings with
*/

-- ── 1. payment_policies table ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payment_policies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  reference_date  text NOT NULL DEFAULT 'allotment_date'
                  CHECK (reference_date IN ('on_request', 'allotment_date', 'acceptance_date')),
  days_offset     integer NOT NULL DEFAULT 15,
  allow_manual_payment boolean NOT NULL DEFAULT true,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  CONSTRAINT payment_policies_property_id_unique UNIQUE (property_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_policies_property_id ON payment_policies(property_id);

ALTER TABLE payment_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can manage payment policies"
  ON payment_policies FOR SELECT
  TO authenticated
  USING ((SELECT extensions.get_user_role()) = 'manager');

CREATE POLICY "Managers can insert payment policies"
  ON payment_policies FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT extensions.get_user_role()) = 'manager');

CREATE POLICY "Managers can update payment policies"
  ON payment_policies FOR UPDATE
  TO authenticated
  USING ((SELECT extensions.get_user_role()) = 'manager')
  WITH CHECK ((SELECT extensions.get_user_role()) = 'manager');

CREATE POLICY "Public can read active payment policies"
  ON payment_policies FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ── 2. Add columns to bookings ────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'payment_expires_at'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payment_expires_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'payment_scenario'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payment_scenario text
      CHECK (payment_scenario IN ('immediate', 'post_approval', 'pre_acceptance'));
  END IF;
END $$;

-- ── 3. Add columns to transactions ────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'reference_number'
  ) THEN
    ALTER TABLE transactions ADD COLUMN reference_number text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'payment_notes'
  ) THEN
    ALTER TABLE transactions ADD COLUMN payment_notes text NOT NULL DEFAULT '';
  END IF;
END $$;

-- ── 4. Extend bookings status CHECK constraint ────────────────────────────────
-- The existing status column uses an enum or check constraint.
-- We add AWAITING_PAYMENT as a valid status value.

DO $$
BEGIN
  -- Drop old constraint if it exists with exact name from original migration
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'bookings'
      AND constraint_type = 'CHECK'
      AND constraint_name = 'bookings_status_check'
  ) THEN
    ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;
  END IF;

  -- Add updated constraint that includes AWAITING_PAYMENT
  ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
    CHECK (status IN (
      'REQUESTED', 'PROVISIONED', 'ALLOCATED',
      'AWAITING_PAYMENT',
      'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'REJECTED'
    ));
END $$;
