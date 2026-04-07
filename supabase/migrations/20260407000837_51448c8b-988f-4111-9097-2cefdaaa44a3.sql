
-- Users with 'user' role can view staff to find their own record
CREATE POLICY "Users view own staff record"
  ON public.staff_members FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users with 'user' role can insert attendance for themselves
CREATE POLICY "Users insert own attendance"
  ON public.attendance_records FOR INSERT TO authenticated
  WITH CHECK (
    staff_id IN (
      SELECT id FROM public.staff_members WHERE user_id = auth.uid()
    )
  );

-- Users with 'user' role can view own attendance  
CREATE POLICY "Users view own attendance"
  ON public.attendance_records FOR SELECT TO authenticated
  USING (
    staff_id IN (
      SELECT id FROM public.staff_members WHERE user_id = auth.uid()
    )
  );

-- Users can update own attendance (check-out)
CREATE POLICY "Users update own attendance"
  ON public.attendance_records FOR UPDATE TO authenticated
  USING (
    staff_id IN (
      SELECT id FROM public.staff_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    staff_id IN (
      SELECT id FROM public.staff_members WHERE user_id = auth.uid()
    )
  );
