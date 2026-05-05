
-- 1. Add 'asistente' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'asistente';

-- 2. Add extra_punches column to attendance_records
ALTER TABLE public.attendance_records
  ADD COLUMN IF NOT EXISTS extra_punches JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 3. Create staff_positions table
CREATE TABLE IF NOT EXISTS public.staff_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  base_role public.app_role NOT NULL DEFAULT 'user',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can read positions" ON public.staff_positions;
CREATE POLICY "Anyone authenticated can read positions"
  ON public.staff_positions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage positions" ON public.staff_positions;
CREATE POLICY "Admins manage positions"
  ON public.staff_positions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
