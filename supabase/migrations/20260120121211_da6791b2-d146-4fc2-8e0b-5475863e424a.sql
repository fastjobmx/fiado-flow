-- Add branding columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN logo_url TEXT,
ADD COLUMN primary_color TEXT DEFAULT '#10B981',
ADD COLUMN secondary_color TEXT DEFAULT '#059669',
ADD COLUMN background_color TEXT DEFAULT '#F0FDF4',
ADD COLUMN text_color TEXT DEFAULT '#1F2937';

-- Create storage bucket for store logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-logos', 'store-logos', true);

-- Allow authenticated users to upload their own logos
CREATE POLICY "Users can upload own logo"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'store-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own logos
CREATE POLICY "Users can update own logo"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'store-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own logos
CREATE POLICY "Users can delete own logo"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'store-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to logos
CREATE POLICY "Public can view logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'store-logos');