
-- Create vitrinas (showcases) table
CREATE TABLE public.vitrinas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  description text,
  location text,
  floors integer NOT NULL DEFAULT 1,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vitrinas ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins manage vitrinas" ON public.vitrinas FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view vitrinas" ON public.vitrinas FOR SELECT TO authenticated
  USING (true);

-- Add vitrina fields to products
ALTER TABLE public.products ADD COLUMN vitrina_id uuid REFERENCES public.vitrinas(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN vitrina_floor integer;

-- Trigger for updated_at
CREATE TRIGGER update_vitrinas_updated_at BEFORE UPDATE ON public.vitrinas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
