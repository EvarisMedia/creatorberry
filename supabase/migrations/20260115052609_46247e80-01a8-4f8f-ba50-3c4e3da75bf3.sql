-- Pinterest Traffic OS Database Schema

-- Add Pinterest-specific fields to brands table
ALTER TABLE public.brands 
ADD COLUMN IF NOT EXISTS pin_design_style TEXT DEFAULT 'minimal' CHECK (pin_design_style IN ('minimal', 'bold_text', 'lifestyle', 'product', 'infographic')),
ADD COLUMN IF NOT EXISTS content_goals TEXT[] DEFAULT ARRAY['traffic'],
ADD COLUMN IF NOT EXISTS primary_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS logo_watermark_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS layout_rules JSONB DEFAULT '{}';

-- Create boards table
CREATE TABLE IF NOT EXISTS public.boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  content_themes TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT true,
  pin_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on boards
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for boards
CREATE POLICY "Users can view their own boards" 
ON public.boards FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own boards" 
ON public.boards FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own boards" 
ON public.boards FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own boards" 
ON public.boards FOR DELETE 
USING (auth.uid() = user_id);

-- Add funnel_stage to content_sources if not exists (already exists in enum)
-- Modify content_sources to add board mapping
ALTER TABLE public.content_sources 
ADD COLUMN IF NOT EXISTS board_id UUID REFERENCES public.boards(id) ON DELETE SET NULL;

-- Create pins table
CREATE TABLE IF NOT EXISTS public.pins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  board_id UUID REFERENCES public.boards(id) ON DELETE SET NULL,
  source_id UUID REFERENCES public.content_sources(id) ON DELETE SET NULL,
  
  -- Pin content
  title TEXT NOT NULL,
  description TEXT,
  destination_url TEXT,
  
  -- SEO
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  seo_score INTEGER DEFAULT 0,
  
  -- Pin type
  pin_type TEXT DEFAULT 'blog' CHECK (pin_type IN ('blog', 'product', 'idea', 'infographic', 'listicle', 'comparison')),
  
  -- Status workflow
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'published')),
  
  -- Metadata
  cta_type TEXT DEFAULT 'save' CHECK (cta_type IN ('save', 'click', 'shop')),
  source_context TEXT,
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on pins
ALTER TABLE public.pins ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pins
CREATE POLICY "Users can view their own pins" 
ON public.pins FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pins" 
ON public.pins FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pins" 
ON public.pins FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pins" 
ON public.pins FOR DELETE 
USING (auth.uid() = user_id);

-- Create pin_variations table for multiple image/copy variations per pin
CREATE TABLE IF NOT EXISTS public.pin_variations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pin_id UUID NOT NULL REFERENCES public.pins(id) ON DELETE CASCADE,
  
  -- Variation content
  image_url TEXT,
  headline TEXT,
  description_variation TEXT,
  
  -- Style info
  layout_style TEXT,
  color_emphasis TEXT,
  
  -- Selection
  is_selected BOOLEAN DEFAULT false,
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on pin_variations
ALTER TABLE public.pin_variations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pin_variations
CREATE POLICY "Users can view their own pin variations" 
ON public.pin_variations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pin variations" 
ON public.pin_variations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pin variations" 
ON public.pin_variations FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pin variations" 
ON public.pin_variations FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger to update boards pin_count
CREATE OR REPLACE FUNCTION update_board_pin_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.boards SET pin_count = pin_count + 1 WHERE id = NEW.board_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.boards SET pin_count = pin_count - 1 WHERE id = OLD.board_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.board_id IS DISTINCT FROM NEW.board_id THEN
    IF OLD.board_id IS NOT NULL THEN
      UPDATE public.boards SET pin_count = pin_count - 1 WHERE id = OLD.board_id;
    END IF;
    IF NEW.board_id IS NOT NULL THEN
      UPDATE public.boards SET pin_count = pin_count + 1 WHERE id = NEW.board_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_board_pin_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.pins
FOR EACH ROW EXECUTE FUNCTION update_board_pin_count();

-- Create updated_at trigger for new tables
CREATE TRIGGER update_boards_updated_at
BEFORE UPDATE ON public.boards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pins_updated_at
BEFORE UPDATE ON public.pins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();