
-- Create product_outlines table
CREATE TABLE public.product_outlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_idea_id uuid NOT NULL REFERENCES public.product_ideas(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  structure jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_word_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create outline_sections table
CREATE TABLE public.outline_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outline_id uuid NOT NULL REFERENCES public.product_outlines(id) ON DELETE CASCADE,
  section_number integer NOT NULL DEFAULT 0,
  title text NOT NULL,
  description text,
  subsections jsonb DEFAULT '[]'::jsonb,
  word_count_target integer DEFAULT 500,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_outlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outline_sections ENABLE ROW LEVEL SECURITY;

-- RLS for product_outlines
CREATE POLICY "Users can view their own outlines"
  ON public.product_outlines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own outlines"
  ON public.product_outlines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own outlines"
  ON public.product_outlines FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own outlines"
  ON public.product_outlines FOR DELETE
  USING (auth.uid() = user_id);

-- RLS for outline_sections (based on parent outline ownership)
CREATE POLICY "Users can view their own outline sections"
  ON public.outline_sections FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.product_outlines
    WHERE product_outlines.id = outline_sections.outline_id
      AND product_outlines.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own outline sections"
  ON public.outline_sections FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.product_outlines
    WHERE product_outlines.id = outline_sections.outline_id
      AND product_outlines.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own outline sections"
  ON public.outline_sections FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.product_outlines
    WHERE product_outlines.id = outline_sections.outline_id
      AND product_outlines.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own outline sections"
  ON public.outline_sections FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.product_outlines
    WHERE product_outlines.id = outline_sections.outline_id
      AND product_outlines.user_id = auth.uid()
  ));

-- Timestamps trigger for product_outlines
CREATE TRIGGER update_product_outlines_updated_at
  BEFORE UPDATE ON public.product_outlines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Timestamps trigger for outline_sections
CREATE TRIGGER update_outline_sections_updated_at
  BEFORE UPDATE ON public.outline_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
