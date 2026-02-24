
-- Staff members table (workers, interns, etc.)
CREATE TABLE public.staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  position TEXT NOT NULL DEFAULT 'Practicante',
  phone TEXT,
  email TEXT,
  document_number TEXT,
  start_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage staff" ON public.staff_members
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Moderators view staff" ON public.staff_members
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'moderator'));

-- Attendance records
CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'A' CHECK (status IN ('A','F','T','J')),
  notes TEXT,
  marked_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(staff_id, date)
);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage attendance" ON public.attendance_records
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Moderators view attendance" ON public.attendance_records
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'moderator'));

-- Accounting: Sales records
CREATE TABLE public.accounting_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  product_description TEXT NOT NULL,
  seller TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.accounting_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage sales" ON public.accounting_sales
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Moderators insert sales" ON public.accounting_sales
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Moderators view sales" ON public.accounting_sales
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'moderator'));

-- Accounting: Service records
CREATE TABLE public.accounting_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  responsible TEXT NOT NULL,
  device_type TEXT,
  diagnosis TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.accounting_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage services accounting" ON public.accounting_services
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Moderators insert services" ON public.accounting_services
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Moderators view services" ON public.accounting_services
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'moderator'));

-- Triggers for updated_at
CREATE TRIGGER update_staff_members_updated_at
  BEFORE UPDATE ON public.staff_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
