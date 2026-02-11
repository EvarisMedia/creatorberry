
-- Create kdp_metadata table for KDP publishing workflow
CREATE TABLE public.kdp_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_outline_id UUID NOT NULL REFERENCES public.product_outlines(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  royalty_tier TEXT DEFAULT '70',
  ebook_price NUMERIC(10,2) DEFAULT 9.99,
  print_price NUMERIC(10,2),
  asin TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  pricing_analysis JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kdp_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own KDP metadata"
  ON public.kdp_metadata FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own KDP metadata"
  ON public.kdp_metadata FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own KDP metadata"
  ON public.kdp_metadata FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own KDP metadata"
  ON public.kdp_metadata FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_kdp_metadata_user_id ON public.kdp_metadata(user_id);
CREATE INDEX idx_kdp_metadata_outline_id ON public.kdp_metadata(product_outline_id);

CREATE TRIGGER update_kdp_metadata_updated_at
  BEFORE UPDATE ON public.kdp_metadata
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
