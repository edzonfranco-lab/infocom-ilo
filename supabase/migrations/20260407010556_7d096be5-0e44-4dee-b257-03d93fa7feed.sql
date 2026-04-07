
CREATE SEQUENCE IF NOT EXISTS public.ticket_number_seq START 1;

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS ticket_number text;

CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := LPAD(nextval('public.ticket_number_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ticket_number ON public.transactions;
CREATE TRIGGER trg_ticket_number
  BEFORE INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_ticket_number();
