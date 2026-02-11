
-- Templates table: reusable product templates (admin-created or user-created)
CREATE TABLE public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'ebook',
  niche TEXT,
  description TEXT,
  sample_outline JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  usage_count INTEGER DEFAULT 0,
  created_by_admin BOOLEAN DEFAULT false,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view templates (admin templates are public, user templates are private)
CREATE POLICY "Users can view admin templates" ON public.templates
  FOR SELECT USING (created_by_admin = true);

CREATE POLICY "Users can view their own templates" ON public.templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates" ON public.templates
  FOR INSERT WITH CHECK (auth.uid() = user_id AND created_by_admin = false);

CREATE POLICY "Users can update their own templates" ON public.templates
  FOR UPDATE USING (auth.uid() = user_id AND created_by_admin = false);

CREATE POLICY "Users can delete their own templates" ON public.templates
  FOR DELETE USING (auth.uid() = user_id AND created_by_admin = false);

CREATE POLICY "Admins can manage all templates" ON public.templates
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- User template library: tracks which templates a user has forked
CREATE TABLE public.user_template_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  forked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  product_outline_id UUID REFERENCES public.product_outlines(id) ON DELETE SET NULL,
  UNIQUE(user_id, template_id)
);

ALTER TABLE public.user_template_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own library" ON public.user_template_library
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can fork templates" ON public.user_template_library
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from library" ON public.user_template_library
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at on templates
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed some starter templates
INSERT INTO public.templates (name, category, niche, description, sample_outline, tags, created_by_admin) VALUES
('Ultimate Ebook Blueprint', 'ebook', 'general', 'A comprehensive ebook template with introduction, 5 core chapters, and conclusion. Perfect for thought leadership or how-to guides.', '[{"title":"Introduction","description":"Hook the reader and set expectations","subsections":["The Problem","Why This Book","What You''ll Learn"]},{"title":"Chapter 1: Foundation","description":"Core concepts and fundamentals","subsections":["Key Concept 1","Key Concept 2","Exercise"]},{"title":"Chapter 2: Strategy","description":"Strategic framework and planning","subsections":["Framework Overview","Step-by-Step Process","Case Study"]},{"title":"Chapter 3: Implementation","description":"Practical application and tools","subsections":["Getting Started","Tools & Resources","Common Mistakes"]},{"title":"Chapter 4: Advanced Tactics","description":"Next-level strategies","subsections":["Advanced Technique 1","Advanced Technique 2","Pro Tips"]},{"title":"Chapter 5: Scaling","description":"Growing and optimizing results","subsections":["Measuring Success","Optimization","Long-term Strategy"]},{"title":"Conclusion","description":"Wrap up and next steps","subsections":["Key Takeaways","Action Plan","Resources"]}]', ARRAY['ebook','guide','how-to'], true),

('Mini-Course Outline', 'course', 'education', 'A 5-module mini-course template with lessons, exercises, and assessments. Ideal for Teachable, Podia, or Gumroad.', '[{"title":"Module 1: Welcome & Foundations","description":"Set the stage and cover basics","subsections":["Welcome Video Script","Lesson 1: Core Concepts","Worksheet: Self-Assessment"]},{"title":"Module 2: Core Skills","description":"Build essential skills","subsections":["Lesson 2: Skill Building","Practice Exercise","Quiz"]},{"title":"Module 3: Application","description":"Apply what you''ve learned","subsections":["Lesson 3: Real-World Application","Case Study Analysis","Action Item"]},{"title":"Module 4: Advanced Strategies","description":"Level up your knowledge","subsections":["Lesson 4: Advanced Techniques","Group Exercise","Reflection"]},{"title":"Module 5: Launch & Next Steps","description":"Put it all together","subsections":["Lesson 5: Implementation Plan","Final Project","Certificate & Resources"]}]', ARRAY['course','education','mini-course'], true),

('Lead Magnet Checklist', 'lead_magnet', 'marketing', 'A quick-win checklist or cheat sheet template. Great for email opt-ins and lead generation.', '[{"title":"Introduction","description":"What this checklist covers and who it''s for","subsections":["The Problem It Solves","How To Use This"]},{"title":"Phase 1: Preparation","description":"Getting ready steps","subsections":["Step 1","Step 2","Step 3"]},{"title":"Phase 2: Execution","description":"Core action steps","subsections":["Step 4","Step 5","Step 6","Step 7"]},{"title":"Phase 3: Optimization","description":"Fine-tuning and improvement","subsections":["Step 8","Step 9","Step 10"]},{"title":"Bonus Tips","description":"Extra resources and recommendations","subsections":["Pro Tip 1","Pro Tip 2","Recommended Tools"]}]', ARRAY['checklist','lead-magnet','opt-in'], true),

('Workshop Workbook', 'workbook', 'coaching', 'An interactive workbook template with exercises, reflection prompts, and action plans. Perfect for coaches and consultants.', '[{"title":"Welcome & Goals","description":"Set intentions and define success","subsections":["My Goals","Current Situation Assessment","Success Metrics"]},{"title":"Session 1: Discovery","description":"Uncover insights and patterns","subsections":["Reflection Questions","Exercise: Mind Map","Key Insights"]},{"title":"Session 2: Strategy","description":"Develop your personal strategy","subsections":["Framework Application","Planning Template","Priority Matrix"]},{"title":"Session 3: Action","description":"Create your action plan","subsections":["30-Day Plan","Weekly Milestones","Accountability Setup"]},{"title":"Session 4: Review & Iterate","description":"Assess progress and adjust","subsections":["Progress Check-In","Lessons Learned","Next Steps"]}]', ARRAY['workbook','coaching','exercises'], true),

('Newsletter Series', 'newsletter', 'content', 'A 4-week newsletter series template. Build audience trust and deliver consistent value via email.', '[{"title":"Week 1: The Hook","description":"Introduce the topic and build curiosity","subsections":["Compelling Opening","Core Insight","Teaser for Next Week"]},{"title":"Week 2: Deep Dive","description":"Provide substantial value","subsections":["Detailed Breakdown","Examples & Data","Practical Takeaway"]},{"title":"Week 3: Case Study","description":"Show real-world results","subsections":["Background","Process","Results & Lessons"]},{"title":"Week 4: Call to Action","description":"Drive engagement or conversion","subsections":["Recap of Series","Exclusive Offer","Community Invitation"]}]', ARRAY['newsletter','email','series'], true);
