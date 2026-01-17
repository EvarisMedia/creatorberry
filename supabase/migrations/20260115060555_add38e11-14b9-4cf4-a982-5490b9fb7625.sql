-- Create storage bucket for generated pin images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated-images',
  'generated-images',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Create policy for public read access
CREATE POLICY "Generated images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'generated-images');

-- Create policy for authenticated users to upload
CREATE POLICY "Authenticated users can upload generated images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'generated-images' AND auth.role() = 'authenticated');

-- Create policy for users to delete their own images
CREATE POLICY "Users can delete generated images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'generated-images' AND auth.role() = 'authenticated');