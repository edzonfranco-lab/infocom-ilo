
-- Create a public storage bucket for receipt logos
INSERT INTO storage.buckets (id, name, public) VALUES ('receipt-assets', 'receipt-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to receipt-assets
CREATE POLICY "Authenticated users can upload receipt assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'receipt-assets');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update receipt assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'receipt-assets');

-- Allow anyone to view receipt assets (public bucket)
CREATE POLICY "Anyone can view receipt assets"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'receipt-assets');

-- Allow authenticated users to delete receipt assets
CREATE POLICY "Authenticated users can delete receipt assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'receipt-assets');
