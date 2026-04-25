-- Tabla de combos/promociones
CREATE TABLE public.combos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  combo_type TEXT NOT NULL DEFAULT 'virtual' CHECK (combo_type IN ('virtual', 'stock')),
  -- virtual: descuenta stock de cada componente al vender
  -- stock: tiene su propio stock independiente (armado físicamente)
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER DEFAULT 1,
  promo_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_from DATE,
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de items del combo (productos componentes)
CREATE TABLE public.combo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id UUID NOT NULL REFERENCES public.combos(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  -- precio individual real (antes del combo)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_combo_items_combo ON public.combo_items(combo_id);
CREATE INDEX idx_combo_items_product ON public.combo_items(product_id);

-- RLS
ALTER TABLE public.combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Combos public read" ON public.combos FOR SELECT USING (true);
CREATE POLICY "Admins manage combos" ON public.combos FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Mods view combos" ON public.combos FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Combo items public read" ON public.combo_items FOR SELECT USING (true);
CREATE POLICY "Admins manage combo items" ON public.combo_items FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Mods view combo items" ON public.combo_items FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'moderator'::app_role));

CREATE TRIGGER trg_combos_updated BEFORE UPDATE ON public.combos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Permitir referenciar combos en transaction_items
ALTER TABLE public.transaction_items ADD COLUMN IF NOT EXISTS combo_id UUID REFERENCES public.combos(id) ON DELETE SET NULL;
ALTER TABLE public.transaction_items ADD COLUMN IF NOT EXISTS combo_parent_item_id UUID REFERENCES public.transaction_items(id) ON DELETE CASCADE;
-- combo_parent_item_id: si está seteado, este item es un componente desglosado de un combo

-- Configuración del ticket (claves usadas dentro de store_settings)
INSERT INTO public.store_settings (key, value)
VALUES ('ticket_template', jsonb_build_object(
  'header_title', 'BOLETA DE VENTA',
  'header_subtitle', 'Comprobante interno',
  'show_logo', true,
  'show_ruc', true,
  'show_address', true,
  'show_phone', true,
  'show_website', true,
  'thanks_message', '¡Gracias por su compra!',
  'farewell_message', 'Vuelva pronto',
  'footer_note', 'Conserve este comprobante para cualquier reclamo.',
  'support_label', 'Soporte / Reclamos:',
  'support_contact', '',
  'website_label', 'www.infocomilo.com',
  'show_qr', false,
  'qr_url', '',
  'extra_legal', ''
))
ON CONFLICT (key) DO NOTHING;