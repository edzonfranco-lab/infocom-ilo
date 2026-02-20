
-- Company info sections managed from admin
CREATE TABLE public.company_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE, -- 'mission', 'vision', 'description', 'years_experience', 'certifications'
  title text NOT NULL,
  content text,
  is_visible boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Company locations/branches
CREATE TABLE public.company_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  city text,
  department text,
  gmaps_url text,
  phone text,
  is_main boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Company certifications
CREATE TABLE public.company_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  issued_by text,
  year integer,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Company team members
CREATE TABLE public.company_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  role text NOT NULL,
  bio text,
  photo_url text,
  is_visible boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_team ENABLE ROW LEVEL SECURITY;

-- Public read for all
CREATE POLICY "Public can read company info" ON public.company_info FOR SELECT USING (is_visible = true);
CREATE POLICY "Public can read locations" ON public.company_locations FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read certifications" ON public.company_certifications FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read team" ON public.company_team FOR SELECT USING (is_visible = true);

-- Admin CRUD
CREATE POLICY "Admin manage company info" ON public.company_info FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage locations" ON public.company_locations FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage certifications" ON public.company_certifications FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage team" ON public.company_team FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Seed initial company info
INSERT INTO public.company_info (section_key, title, content, sort_order) VALUES
('description', 'Descripción', 'Empresa ileña brindando soluciones en equipos de Cómputo en general, equipos de Seguridad y de Telecomunicaciones, atendiendo a clientes hogar, pymes y corporativos, además de servicios especializados y un Soporte Técnico excepcional.', 0),
('mission', 'Misión', 'Cubrir las necesidades en equipos de cómputo, suministros y reparaciones para nuestros clientes generando confianza, otorgándole un valor agregado al servicio teniendo la calidad y la atención personalizada que usted se merece.', 1),
('vision', 'Visión', 'En INFOCOM, visualizamos un futuro donde la tecnología empodera a cada hogar, empresa e institución en Ilo. Con 11 años de trayectoria, nos consolidamos como el socio tecnológico preferido, reconocido por nuestra capacidad de innovar y adaptarnos a las necesidades cambiantes de nuestros clientes.', 2),
('years_experience', 'Años de Experiencia', '11', 3);

-- Seed main location
INSERT INTO public.company_locations (name, address, city, department, is_main, gmaps_url) VALUES
('Sede Principal', '24 de Octubre Mz 53 Lt 03, casa, 18601', 'Ilo', 'Moquegua', true, 'https://maps.google.com/?q=Ilo+Moquegua+Peru');
