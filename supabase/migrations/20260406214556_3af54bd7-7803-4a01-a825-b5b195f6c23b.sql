
-- 1. Add 'devuelto' to transaction_status enum
ALTER TYPE public.transaction_status ADD VALUE IF NOT EXISTS 'devuelto';

-- 2. Add devuelto fields to transactions
ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS devuelto_en timestamptz,
  ADD COLUMN IF NOT EXISTS devuelto_por text,
  ADD COLUMN IF NOT EXISTS motivo_devolucion text;

-- 3. Add 'modelo' field to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS modelo text;

-- 4. Create suppliers table
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company text,
  ruc text,
  phone text,
  email text,
  address text,
  contact_person text,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage suppliers" ON public.suppliers FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Mods view suppliers" ON public.suppliers FOR SELECT TO authenticated USING (has_role(auth.uid(), 'moderator'::app_role));

-- 5. Create purchases table
CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  arrival_date date,
  status text NOT NULL DEFAULT 'pendiente',
  notes text,
  total numeric(12,2) DEFAULT 0,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage purchases" ON public.purchases FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Mods view purchases" ON public.purchases FOR SELECT TO authenticated USING (has_role(auth.uid(), 'moderator'::app_role));

-- 6. Create purchase_items table
CREATE TABLE public.purchase_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_cost numeric(12,2) NOT NULL DEFAULT 0,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage purchase_items" ON public.purchase_items FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Mods view purchase_items" ON public.purchase_items FOR SELECT TO authenticated USING (has_role(auth.uid(), 'moderator'::app_role));

-- 7. Create inventory_movements (Kardex) table
CREATE TABLE public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  movement_type text NOT NULL, -- 'entrada', 'salida', 'anulacion', 'devolucion'
  quantity integer NOT NULL,
  reference_type text, -- 'compra', 'venta', 'anulacion', 'devolucion'
  reference_id uuid,
  stock_before integer,
  stock_after integer,
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage movements" ON public.inventory_movements FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Mods view movements" ON public.inventory_movements FOR SELECT TO authenticated USING (has_role(auth.uid(), 'moderator'::app_role));
CREATE POLICY "Mods insert movements" ON public.inventory_movements FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'moderator'::app_role));

-- Update trigger for suppliers/purchases
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON public.purchases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
