
-- Create product_exports table for tracking exported files
CREATE TABLE public.product_exports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_outline_id UUID NOT NULL REFERENCES public.product_outlines(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  format TEXT NOT NULL,
  file_url TEXT,
  file_size INTEGER,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  export_settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_exports ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own exports"
  ON public.product_exports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exports"
  ON public.product_exports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exports"
  ON public.product_exports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exports"
  ON public.product_exports FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_product_exports_user_id ON public.product_exports(user_id);
CREATE INDEX idx_product_exports_outline_id ON public.product_exports(product_outline_id);

-- Trigger for updated_at
CREATE TRIGGER update_product_exports_updated_at
  BEFORE UPDATE ON public.product_exports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
