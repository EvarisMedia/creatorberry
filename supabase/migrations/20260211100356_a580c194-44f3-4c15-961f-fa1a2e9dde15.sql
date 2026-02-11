
CREATE TABLE public.sales_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  product_outline_id uuid REFERENCES public.product_outlines(id) ON DELETE SET NULL,
  framework text NOT NULL DEFAULT 'pas',
  headline text NOT NULL DEFAULT '',
  subheadline text,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  cta_text text,
  cta_url text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sales pages" ON public.sales_pages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own sales pages" ON public.sales_pages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sales pages" ON public.sales_pages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sales pages" ON public.sales_pages FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_sales_pages_updated_at BEFORE UPDATE ON public.sales_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
