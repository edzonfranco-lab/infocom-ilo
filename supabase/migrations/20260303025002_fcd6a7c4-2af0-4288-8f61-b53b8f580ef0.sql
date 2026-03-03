
-- =============================================
-- UNIFIED TRANSACTIONS ARCHITECTURE
-- =============================================

-- Transaction status enum
CREATE TYPE public.transaction_status AS ENUM ('borrador', 'emitido', 'anulado');

-- Transaction general type (auto-calculated)
CREATE TYPE public.transaction_type AS ENUM ('venta', 'servicio', 'mixto');

-- Item type
CREATE TYPE public.item_type AS ENUM ('producto', 'servicio');

-- Main transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  cliente_nombre TEXT,
  cliente_telefono TEXT,
  estado public.transaction_status NOT NULL DEFAULT 'borrador',
  tipo_general public.transaction_type NOT NULL DEFAULT 'venta',
  subtotal_productos NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal_servicios NUMERIC(12,2) NOT NULL DEFAULT 0,
  impuestos NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  notas TEXT,
  emitido_por TEXT,
  emitido_en TIMESTAMPTZ,
  anulado_en TIMESTAMPTZ,
  anulado_por TEXT,
  motivo_anulacion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Transaction items table
CREATE TABLE public.transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  item_type public.item_type NOT NULL,
  referencia_id UUID,
  descripcion TEXT NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transaction history/audit trail
CREATE TABLE public.transaction_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  accion TEXT NOT NULL,
  detalles JSONB,
  usuario_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
CREATE POLICY "Authenticated users can view transactions"
  ON public.transactions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert transactions"
  ON public.transactions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update transactions"
  ON public.transactions FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Only admins can delete transactions"
  ON public.transactions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for transaction_items
CREATE POLICY "Authenticated users can view transaction_items"
  ON public.transaction_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert transaction_items"
  ON public.transaction_items FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update transaction_items"
  ON public.transaction_items FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete transaction_items"
  ON public.transaction_items FOR DELETE TO authenticated USING (true);

-- RLS Policies for transaction_history
CREATE POLICY "Authenticated users can view transaction_history"
  ON public.transaction_history FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert transaction_history"
  ON public.transaction_history FOR INSERT TO authenticated WITH CHECK (true);

-- Auto-update updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to recalculate transaction totals and type
CREATE OR REPLACE FUNCTION public.recalculate_transaction()
RETURNS TRIGGER AS $$
DECLARE
  has_productos BOOLEAN;
  has_servicios BOOLEAN;
  sum_productos NUMERIC(12,2);
  sum_servicios NUMERIC(12,2);
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN item_type = 'producto' THEN subtotal ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN item_type = 'servicio' THEN subtotal ELSE 0 END), 0),
    EXISTS(SELECT 1 FROM public.transaction_items WHERE transaction_id = COALESCE(NEW.transaction_id, OLD.transaction_id) AND item_type = 'producto'),
    EXISTS(SELECT 1 FROM public.transaction_items WHERE transaction_id = COALESCE(NEW.transaction_id, OLD.transaction_id) AND item_type = 'servicio')
  INTO sum_productos, sum_servicios, has_productos, has_servicios
  FROM public.transaction_items
  WHERE transaction_id = COALESCE(NEW.transaction_id, OLD.transaction_id);

  UPDATE public.transactions SET
    subtotal_productos = sum_productos,
    subtotal_servicios = sum_servicios,
    total = sum_productos + sum_servicios,
    tipo_general = CASE
      WHEN has_productos AND has_servicios THEN 'mixto'::public.transaction_type
      WHEN has_servicios THEN 'servicio'::public.transaction_type
      ELSE 'venta'::public.transaction_type
    END
  WHERE id = COALESCE(NEW.transaction_id, OLD.transaction_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-recalculate on item changes
CREATE TRIGGER recalculate_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON public.transaction_items
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_transaction();

-- Index for performance
CREATE INDEX idx_transactions_fecha ON public.transactions(fecha);
CREATE INDEX idx_transactions_estado ON public.transactions(estado);
CREATE INDEX idx_transactions_tipo ON public.transactions(tipo_general);
CREATE INDEX idx_transaction_items_transaction ON public.transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_type ON public.transaction_items(item_type);
