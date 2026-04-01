
ALTER TABLE public.categories ADD COLUMN catalog_url TEXT DEFAULT NULL;

INSERT INTO storage.buckets (id, name, public) VALUES ('category-catalogs', 'category-catalogs', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view category catalogs" ON storage.objects FOR SELECT USING (bucket_id = 'category-catalogs');
CREATE POLICY "Auth users can upload category catalogs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'category-catalogs' AND auth.role() = 'authenticated');
CREATE POLICY "Auth users can update category catalogs" ON storage.objects FOR UPDATE USING (bucket_id = 'category-catalogs' AND auth.role() = 'authenticated');
CREATE POLICY "Auth users can delete category catalogs" ON storage.objects FOR DELETE USING (bucket_id = 'category-catalogs' AND auth.role() = 'authenticated');
