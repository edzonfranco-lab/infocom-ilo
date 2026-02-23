
-- Create the update_updated_at function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Service orders for reception/technical service module
CREATE TABLE public.service_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number SERIAL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  device_type TEXT NOT NULL,
  device_brand TEXT,
  device_model TEXT,
  accessories TEXT,
  reported_issue TEXT NOT NULL,
  diagnosis TEXT,
  estimated_cost NUMERIC(10,2),
  final_cost NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','waiting_parts','completed','delivered','cancelled')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  assigned_technician_id UUID REFERENCES auth.users(id),
  received_by_id UUID REFERENCES auth.users(id),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and mods can manage service orders"
ON public.service_orders FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE TRIGGER update_service_orders_updated_at
BEFORE UPDATE ON public.service_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Theme settings table
CREATE TABLE public.theme_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read theme settings"
ON public.theme_settings FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can manage theme settings"
ON public.theme_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.theme_settings (key, value, is_active) VALUES
('default', '{"name":"Default","primary_hue":142,"accent_hue":142}', true),
('san_valentin', '{"name":"San Valentín","primary_hue":340,"accent_hue":350,"particles":"hearts"}', false),
('halloween', '{"name":"Halloween","primary_hue":30,"accent_hue":15,"particles":"pumpkins"}', false),
('navidad', '{"name":"Navidad","primary_hue":0,"accent_hue":120,"particles":"snowflakes"}', false),
('dia_madre', '{"name":"Día de la Madre","primary_hue":320,"accent_hue":300,"particles":"flowers"}', false),
('dia_padre', '{"name":"Día del Padre","primary_hue":210,"accent_hue":220,"particles":"stars"}', false),
('año_nuevo', '{"name":"Año Nuevo","primary_hue":45,"accent_hue":50,"particles":"fireworks"}', false),
('dia_niño', '{"name":"Día del Niño","primary_hue":200,"accent_hue":280,"particles":"balloons"}', false),
('custom', '{"name":"Personalizado","primary_hue":142,"accent_hue":142}', false);
