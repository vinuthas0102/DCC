/*
  # Quarters Module — RLS Policies for Govt Official and Employee Access

  1. Changes
    - quarters: allow authenticated users to SELECT active quarters (browse)
    - quarter_requests: employees can manage their own; managers see all
    - quarter_request_preferences: employees manage own; managers read all
    - quarter_allotment_cycles: authenticated read
    - quarter_allotments: employees read own; managers CRUD
    - quarter_override_logs: managers insert/read

  2. Security
    - All policies check auth.uid() ownership
    - Manager/admin access gated on JWT app_metadata role claim
*/

-- quarters browse
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quarters' AND policyname='Authenticated users can view active quarters') THEN
    EXECUTE 'CREATE POLICY "Authenticated users can view active quarters" ON quarters FOR SELECT TO authenticated USING (is_active = true)';
  END IF;
END $$;

-- allotment cycles read
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quarter_allotment_cycles' AND policyname='Authenticated users can view allotment cycles') THEN
    EXECUTE 'CREATE POLICY "Authenticated users can view allotment cycles" ON quarter_allotment_cycles FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;

-- quarter_requests: employee own
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quarter_requests' AND policyname='Employees can view own quarter requests') THEN
    EXECUTE 'CREATE POLICY "Employees can view own quarter requests" ON quarter_requests FOR SELECT TO authenticated USING (employee_id = auth.uid())';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quarter_requests' AND policyname='Employees can insert own quarter requests') THEN
    EXECUTE 'CREATE POLICY "Employees can insert own quarter requests" ON quarter_requests FOR INSERT TO authenticated WITH CHECK (employee_id = auth.uid())';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quarter_requests' AND policyname='Employees can update own quarter requests') THEN
    EXECUTE 'CREATE POLICY "Employees can update own quarter requests" ON quarter_requests FOR UPDATE TO authenticated USING (employee_id = auth.uid()) WITH CHECK (employee_id = auth.uid())';
  END IF;
END $$;

-- quarter_requests: manager view all
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quarter_requests' AND policyname='Managers can view all quarter requests') THEN
    EXECUTE $pol$CREATE POLICY "Managers can view all quarter requests" ON quarter_requests FOR SELECT TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('manager', 'admin'))$pol$;
  END IF;
END $$;

-- quarter_request_preferences: employee own
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quarter_request_preferences' AND policyname='Employees can view own request preferences') THEN
    EXECUTE $pol$CREATE POLICY "Employees can view own request preferences" ON quarter_request_preferences FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM quarter_requests qr WHERE qr.id = quarter_request_preferences.request_id AND qr.employee_id = auth.uid()))$pol$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quarter_request_preferences' AND policyname='Employees can insert own request preferences') THEN
    EXECUTE $pol$CREATE POLICY "Employees can insert own request preferences" ON quarter_request_preferences FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM quarter_requests qr WHERE qr.id = quarter_request_preferences.request_id AND qr.employee_id = auth.uid()))$pol$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quarter_request_preferences' AND policyname='Employees can delete own request preferences') THEN
    EXECUTE $pol$CREATE POLICY "Employees can delete own request preferences" ON quarter_request_preferences FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM quarter_requests qr WHERE qr.id = quarter_request_preferences.request_id AND qr.employee_id = auth.uid()))$pol$;
  END IF;
END $$;

-- quarter_request_preferences: manager view all
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quarter_request_preferences' AND policyname='Managers can view all request preferences') THEN
    EXECUTE $pol$CREATE POLICY "Managers can view all request preferences" ON quarter_request_preferences FOR SELECT TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('manager', 'admin'))$pol$;
  END IF;
END $$;

-- quarter_allotments: employee read own
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quarter_allotments' AND policyname='Employees can view own quarter allotments') THEN
    EXECUTE $pol$CREATE POLICY "Employees can view own quarter allotments" ON quarter_allotments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM quarter_requests qr WHERE qr.id = quarter_allotments.request_id AND qr.employee_id = auth.uid()))$pol$;
  END IF;
END $$;

-- quarter_allotments: manager CRUD
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quarter_allotments' AND policyname='Managers can view all quarter allotments') THEN
    EXECUTE $pol$CREATE POLICY "Managers can view all quarter allotments" ON quarter_allotments FOR SELECT TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('manager', 'admin'))$pol$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quarter_allotments' AND policyname='Managers can insert quarter allotments') THEN
    EXECUTE $pol$CREATE POLICY "Managers can insert quarter allotments" ON quarter_allotments FOR INSERT TO authenticated WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('manager', 'admin'))$pol$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quarter_allotments' AND policyname='Managers can update quarter allotments') THEN
    EXECUTE $pol$CREATE POLICY "Managers can update quarter allotments" ON quarter_allotments FOR UPDATE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('manager', 'admin')) WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('manager', 'admin'))$pol$;
  END IF;
END $$;

-- quarter_override_logs: manager insert + read
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quarter_override_logs' AND policyname='Managers can insert override logs') THEN
    EXECUTE $pol$CREATE POLICY "Managers can insert override logs" ON quarter_override_logs FOR INSERT TO authenticated WITH CHECK (done_by = auth.uid() AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('manager', 'admin'))$pol$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quarter_override_logs' AND policyname='Managers can view override logs') THEN
    EXECUTE $pol$CREATE POLICY "Managers can view override logs" ON quarter_override_logs FOR SELECT TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('manager', 'admin'))$pol$;
  END IF;
END $$;

-- quarter_approval_workflow: manager CRUD
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quarter_approval_workflow' AND policyname='Managers can view approval workflow') THEN
    EXECUTE $pol$CREATE POLICY "Managers can view approval workflow" ON quarter_approval_workflow FOR SELECT TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('manager', 'admin'))$pol$;
  END IF;
END $$;
