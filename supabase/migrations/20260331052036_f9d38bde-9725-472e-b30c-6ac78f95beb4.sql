
-- Staff work schedules table
CREATE TABLE public.staff_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  shift_name text NOT NULL DEFAULT 'Turno 1',
  start_time time NOT NULL DEFAULT '09:00',
  end_time time NOT NULL DEFAULT '18:00',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(staff_id, day_of_week, shift_name)
);

ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage schedules" ON public.staff_schedules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated view schedules" ON public.staff_schedules FOR SELECT TO authenticated
  USING (true);

-- Allow moderators to insert attendance (for self check-in)
CREATE POLICY "Moderators insert attendance" ON public.attendance_records FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Staff view own attendance" ON public.attendance_records FOR SELECT TO authenticated
  USING (staff_id IN (SELECT id FROM public.staff_members WHERE user_id = auth.uid()));
