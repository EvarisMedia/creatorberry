
-- Create private storage bucket for product exports
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-exports', 'product-exports', false)
ON CONFLICT (id) DO NOTHING;

-- Users can read their own exports
CREATE POLICY "Users can read own exports"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-exports' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Service role will handle uploads, but add INSERT policy for completeness
CREATE POLICY "Users can upload own exports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-exports' AND (storage.foldername(name))[1] = auth.uid()::text);
