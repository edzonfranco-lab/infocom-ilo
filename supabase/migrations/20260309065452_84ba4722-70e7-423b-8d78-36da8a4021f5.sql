
-- Storage bucket for brand logos
INSERT INTO storage.buckets (id, name, public) VALUES ('brand-logos', 'brand-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read
CREATE POLICY "Public can view brand logos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'brand-logos');
-- Admin can upload
CREATE POLICY "Admin can upload brand logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'brand-logos' AND public.has_role(auth.uid(), 'admin'));
-- Admin can delete
CREATE POLICY "Admin can delete brand logos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'brand-logos' AND public.has_role(auth.uid(), 'admin'));

-- Add check_in/check_out to attendance
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS check_in_time time DEFAULT NULL;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS check_out_time time DEFAULT NULL;

-- Allow admin to delete orders
CREATE POLICY "Admins can delete orders" ON public.orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
-- Allow admin to delete order items
CREATE POLICY "Admins can delete order items" ON public.order_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
