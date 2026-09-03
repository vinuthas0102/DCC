/*
  # Add delivery_mode to all chat tables

  ## Summary
  Adds a `delivery_mode` column to all four chat tables so each message records
  how the sender intended it to be delivered (in-app, email, SMS, or WhatsApp).

  ## New Column
  - `delivery_mode` (text, NOT NULL, default 'IN_APP')
    - Allowed values: 'IN_APP', 'EMAIL', 'SMS', 'WA'
    - Applied to: quarter_service_chats, quarter_allotment_chats,
      quarter_inspection_chats, booking_service_chats

  ## Notes
  - All existing rows will default to 'IN_APP'
  - The check constraint ensures only known delivery modes are stored
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quarter_service_chats' AND column_name = 'delivery_mode'
  ) THEN
    ALTER TABLE quarter_service_chats
      ADD COLUMN delivery_mode text NOT NULL DEFAULT 'IN_APP'
      CHECK (delivery_mode IN ('IN_APP', 'EMAIL', 'SMS', 'WA'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quarter_allotment_chats' AND column_name = 'delivery_mode'
  ) THEN
    ALTER TABLE quarter_allotment_chats
      ADD COLUMN delivery_mode text NOT NULL DEFAULT 'IN_APP'
      CHECK (delivery_mode IN ('IN_APP', 'EMAIL', 'SMS', 'WA'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quarter_inspection_chats' AND column_name = 'delivery_mode'
  ) THEN
    ALTER TABLE quarter_inspection_chats
      ADD COLUMN delivery_mode text NOT NULL DEFAULT 'IN_APP'
      CHECK (delivery_mode IN ('IN_APP', 'EMAIL', 'SMS', 'WA'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'booking_service_chats' AND column_name = 'delivery_mode'
  ) THEN
    ALTER TABLE booking_service_chats
      ADD COLUMN delivery_mode text NOT NULL DEFAULT 'IN_APP'
      CHECK (delivery_mode IN ('IN_APP', 'EMAIL', 'SMS', 'WA'));
  END IF;
END $$;
