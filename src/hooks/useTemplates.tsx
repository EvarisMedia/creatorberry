import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/components/ui/sonner";

export interface TemplateSection {
  title: string;
  description: string;
  subsections: string[];
}

export interface Template {
  id: string;
  name: string;
  category: string;
  niche: string | null;
  description: string | null;
  sample_outline: TemplateSection[];
  tags: string[];
  usage_count: number;
  created_by_admin: boolean;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserTemplateEntry {
  id: string;
  user_id: string;
  template_id: string;
  forked_at: string;
  product_outline_id: string | null;
}

export function useTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [userLibrary, setUserLibrary] = useState<UserTemplateEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTemplates = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .order("usage_count", { ascending: false });

    if (error) {
      console.error("Error fetching templates:", error);
    } else {
      setTemplates(
        (data || []).map((d: any) => ({
          ...d,
          sample_outline: (d.sample_outline || []) as TemplateSection[],
          tags: d.tags || [],
        }))
      );
    }
    setIsLoading(false);
  };

  const fetchUserLibrary = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("user_template_library")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching user library:", error);
    } else {
      setUserLibrary(data || []);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (user) fetchUserLibrary();
  }, [user]);

  const forkTemplate = async (
    templateId: string,
    brandId: string
  ): Promise<string | null> => {
    if (!user) return null;

    const template = templates.find((t) => t.id === templateId);
    if (!template) return null;

    // Create product outline from template
    // First we need a product idea to link to — create a placeholder
    const { data: idea, error: ideaErr } = await supabase
      .from("product_ideas")
      .insert({
        user_id: user.id,
        brand_id: brandId,
        title: template.name,
        description: template.description || `Created from template: ${template.name}`,
        format: template.category,
        status: "in_progress",
      })
      .select()
      .single();

    if (ideaErr || !idea) {
      toast.error("Failed to create product idea from template");
      console.error(ideaErr);
      return null;
    }

    // Create outline
    const { data: outline, error: outlineErr } = await supabase
      .from("product_outlines")
      .insert({
        user_id: user.id,
        brand_id: brandId,
        product_idea_id: idea.id,
        title: template.name,
        structure: template.sample_outline as any,
        status: "draft",
      })
      .select()
      .single();

    if (outlineErr || !outline) {
      toast.error("Failed to create outline from template");
      console.error(outlineErr);
      return null;
    }

    // Create outline sections
    const sections = template.sample_outline.map((s, i) => ({
      outline_id: outline.id,
      section_number: i + 1,
      sort_order: i,
      title: s.title,
      description: s.description,
      subsections: s.subsections as any,
      word_count_target: 500,
    }));

    if (sections.length > 0) {
      const { error: secErr } = await supabase
        .from("outline_sections")
        .insert(sections);
      if (secErr) console.error("Error creating sections:", secErr);
    }

    // Track in user library
    await supabase.from("user_template_library").insert({
      user_id: user.id,
      template_id: templateId,
      product_outline_id: outline.id,
    });

    // Increment usage count
    await supabase
      .from("templates")
      .update({ usage_count: (template.usage_count || 0) + 1 })
      .eq("id", templateId);

    toast.success("Template forked! Outline created.");
    await fetchUserLibrary();
    await fetchTemplates();
    return outline.id;
  };

  const createTemplate = async (params: {
    name: string;
    category: string;
    niche?: string;
    description?: string;
    sample_outline: TemplateSection[];
    tags?: string[];
  }) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from("templates")
      .insert({
        user_id: user.id,
        name: params.name,
        category: params.category,
        niche: params.niche || null,
        description: params.description || null,
        sample_outline: params.sample_outline as any,
        tags: params.tags || [],
        created_by_admin: false,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create template");
      console.error(error);
      return null;
    }

    toast.success("Template created!");
    await fetchTemplates();
    return data;
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await supabase.from("templates").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete template");
      console.error(error);
      return;
    }
    toast.success("Template deleted");
    await fetchTemplates();
  };

  const isInLibrary = (templateId: string) =>
    userLibrary.some((e) => e.template_id === templateId);

  return {
    templates,
    userLibrary,
    isLoading,
    forkTemplate,
    createTemplate,
    deleteTemplate,
    isInLibrary,
    refetch: fetchTemplates,
  };
}
