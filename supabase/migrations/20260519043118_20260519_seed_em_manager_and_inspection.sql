/*
  # Seed EM (Estate Manager) demo user and completed inspection record

  1. Changes
    - Creates auth.users entry for em@fms.com with role = manager in app_metadata
    - Inserts matching record into public.users table
    - Inserts a completed (CLOSED) quarter inspection for allotment b2000001-0000-0000-0000-000000000010

  2. Notes
    - manager role maps to EM/EO in the UI (isEO = user?.role === 'manager')
    - CLOSED inspection means inspection is done and Handover action becomes relevant
*/

DO $$
DECLARE
  v_user_id uuid := 'e0000001-e000-0000-0000-000000000001';
BEGIN
  -- Insert into auth.users if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'em@fms.com') THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'em@fms.com',
      crypt('em123456', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"role": "manager"}'::jsonb,
      '{"full_name": "Estate Manager Demo"}'::jsonb,
      false, '', '', '', ''
    );
  ELSE
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'em@fms.com';
  END IF;

  -- Insert into public.users
  INSERT INTO users (id, email, full_name, phone, role, govt_department, govt_employee_id, metadata)
  VALUES (
    v_user_id,
    'em@fms.com',
    'Estate Manager Demo',
    '+91 9876543211',
    'manager',
    'Central Public Works',
    'EM001',
    '{}'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert completed inspection for the ACKNOWLEDGED allotment
  INSERT INTO quarter_inspections (
    id, allotment_id, created_by, status,
    opening_remarks, closing_remarks, property_condition, inspector_name, closed_at
  ) VALUES (
    'a0000001-a000-0000-0000-000000000001',
    'b2000001-0000-0000-0000-000000000010',
    v_user_id,
    'CLOSED',
    'Pre-handover inspection initiated.',
    'Quarter inspected and found in good condition. Ready for handover.',
    'GOOD',
    'Estate Manager Demo',
    now()
  )
  ON CONFLICT (id) DO NOTHING;
END $$;
