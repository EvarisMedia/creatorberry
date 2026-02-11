
-- Plans table
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  description text,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage plans" ON public.plans
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can read active plans" ON public.plans
  FOR SELECT USING (is_active = true AND auth.role() = 'authenticated');

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add plan_id to profiles
ALTER TABLE public.profiles ADD COLUMN plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL;

-- Seed default plans
INSERT INTO public.plans (name, price, description, features, sort_order) VALUES
('Starter', 49, 'Essential tools to get started', '{"max_products": 3, "max_outlines": 5, "max_exports": 10, "max_images": 20, "copilot": false, "sales_pages": false, "kdp": false, "launch_toolkit": false}'::jsonb, 1),
('Pro', 149, 'Full toolkit for serious creators', '{"max_products": 15, "max_outlines": 30, "max_exports": 50, "max_images": 100, "copilot": true, "sales_pages": true, "kdp": true, "launch_toolkit": false}'::jsonb, 2),
('Unlimited', 299, 'No limits, lifetime access to everything', '{"max_products": -1, "max_outlines": -1, "max_exports": -1, "max_images": -1, "copilot": true, "sales_pages": true, "kdp": true, "launch_toolkit": true}'::jsonb, 3);
