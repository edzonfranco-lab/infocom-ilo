ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS por_cobrar boolean NOT NULL DEFAULT false;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS cobrado_en timestamptz;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS tipo_cliente text;
CREATE INDEX IF NOT EXISTS idx_transactions_por_cobrar ON public.transactions(por_cobrar) WHERE por_cobrar = true;