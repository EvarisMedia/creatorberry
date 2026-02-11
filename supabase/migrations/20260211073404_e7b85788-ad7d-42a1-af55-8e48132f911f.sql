
-- Create expanded_content table for Phase 3: Content Expansion Engine
CREATE TABLE public.expanded_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  outline_section_id UUID NOT NULL REFERENCES public.outline_sections(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('expansion', 'story', 'deep_dive', 'workbook')),
  content TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  tone TEXT,
  style TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expanded_content ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own expanded content"
ON public.expanded_content FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expanded content"
ON public.expanded_content FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expanded content"
ON public.expanded_content FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expanded content"
ON public.expanded_content FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_expanded_content_updated_at
BEFORE UPDATE ON public.expanded_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast lookups
CREATE INDEX idx_expanded_content_section ON public.expanded_content(outline_section_id);
CREATE INDEX idx_expanded_content_user_brand ON public.expanded_content(user_id, brand_id);
