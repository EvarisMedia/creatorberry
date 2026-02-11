
CREATE TABLE public.launch_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  product_outline_id uuid REFERENCES public.product_outlines(id) ON DELETE SET NULL,
  asset_type text NOT NULL DEFAULT 'email_sequence',
  title text NOT NULL DEFAULT '',
  content jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.launch_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own launch assets" ON public.launch_assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own launch assets" ON public.launch_assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own launch assets" ON public.launch_assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own launch assets" ON public.launch_assets FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_launch_assets_updated_at BEFORE UPDATE ON public.launch_assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
