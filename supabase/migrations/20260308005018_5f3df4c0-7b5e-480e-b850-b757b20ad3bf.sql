ALTER TABLE public.transaction_items 
ADD COLUMN IF NOT EXISTS responsable text,
ADD COLUMN IF NOT EXISTS tipo_equipo text,
ADD COLUMN IF NOT EXISTS diagnostico text;