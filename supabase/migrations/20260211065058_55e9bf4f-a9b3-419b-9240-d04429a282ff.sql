
-- Product Ideas table
CREATE TABLE public.product_ideas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  format text NOT NULL DEFAULT 'ebook',
  target_audience text,
  source_context text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'saved', 'in_progress', 'completed', 'dismissed')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.product_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own product ideas" ON public.product_ideas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own product ideas" ON public.product_ideas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own product ideas" ON public.product_ideas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own product ideas" ON public.product_ideas FOR DELETE USING (auth.uid() = user_id);

-- PMF Scores table
CREATE TABLE public.pmf_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_idea_id uuid NOT NULL REFERENCES public.product_ideas(id) ON DELETE CASCADE,
  demand_score integer NOT NULL DEFAULT 0 CHECK (demand_score >= 0 AND demand_score <= 100),
  fit_score integer NOT NULL DEFAULT 0 CHECK (fit_score >= 0 AND fit_score <= 100),
  gap_score integer NOT NULL DEFAULT 0 CHECK (gap_score >= 0 AND gap_score <= 100),
  urgency_score integer NOT NULL DEFAULT 0 CHECK (urgency_score >= 0 AND urgency_score <= 100),
  combined_score integer NOT NULL DEFAULT 0 CHECK (combined_score >= 0 AND combined_score <= 100),
  reasoning jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pmf_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view PMF scores for their ideas" ON public.pmf_scores FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.product_ideas WHERE product_ideas.id = pmf_scores.product_idea_id AND product_ideas.user_id = auth.uid()));
CREATE POLICY "Users can create PMF scores for their ideas" ON public.pmf_scores FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.product_ideas WHERE product_ideas.id = pmf_scores.product_idea_id AND product_ideas.user_id = auth.uid()));
CREATE POLICY "Users can update PMF scores for their ideas" ON public.pmf_scores FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.product_ideas WHERE product_ideas.id = pmf_scores.product_idea_id AND product_ideas.user_id = auth.uid()));
CREATE POLICY "Users can delete PMF scores for their ideas" ON public.pmf_scores FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.product_ideas WHERE product_ideas.id = pmf_scores.product_idea_id AND product_ideas.user_id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_product_ideas_updated_at
  BEFORE UPDATE ON public.product_ideas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
