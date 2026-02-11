import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface OutlineSection {
  id: string;
  outline_id: string;
  section_number: number;
  title: string;
  description: string | null;
  subsections: string[];
  word_count_target: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductOutline {
  id: string;
  product_idea_id: string;
  brand_id: string;
  user_id: string;
  title: string;
  structure: any;
  total_word_count: number;
  status: string;
  created_at: string;
  updated_at: string;
  sections?: OutlineSection[];
}

export function useProductOutlines(brandId: string | null) {
  const { user } = useAuth();
  const [outlines, setOutlines] = useState<ProductOutline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchOutlines = useCallback(async () => {
    if (!user || !brandId) {
      setOutlines([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from("product_outlines")
      .select("*")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching outlines:", error);
      setIsLoading(false);
      return;
    }

    setOutlines((data || []) as ProductOutline[]);
    setIsLoading(false);
  }, [user, brandId]);

  useEffect(() => {
    fetchOutlines();
  }, [fetchOutlines]);

  const fetchOutlineWithSections = async (outlineId: string): Promise<ProductOutline | null> => {
    const { data: outline, error: outlineError } = await supabase
      .from("product_outlines")
      .select("*")
      .eq("id", outlineId)
      .single();

    if (outlineError || !outline) return null;

    const { data: sections } = await supabase
      .from("outline_sections")
      .select("*")
      .eq("outline_id", outlineId)
      .order("sort_order", { ascending: true });

    return {
      ...(outline as ProductOutline),
      sections: (sections || []) as OutlineSection[],
    };
  };

  const generateOutline = async (productIdea: any, brand: any) => {
    setIsGenerating(true);
    try {
      const response = await supabase.functions.invoke("generate-outline", {
        body: { productIdea, brand },
      });

      if (response.error) throw response.error;

      toast({
        title: "Outline Generated!",
        description: `"${response.data.outline.title}" outline created with ${response.data.sections?.length || 0} sections.`,
      });

      await fetchOutlines();
      return response.data.outline;
    } catch (error: any) {
      console.error("Error generating outline:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate outline.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const updateSection = async (sectionId: string, updates: Partial<OutlineSection>) => {
    const { error } = await supabase
      .from("outline_sections")
      .update(updates)
      .eq("id", sectionId);

    if (error) {
      toast({ title: "Error", description: "Failed to update section.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const reorderSections = async (sections: { id: string; sort_order: number }[]) => {
    for (const s of sections) {
      await supabase
        .from("outline_sections")
        .update({ sort_order: s.sort_order })
        .eq("id", s.id);
    }
  };

  const deleteOutline = async (outlineId: string) => {
    const { error } = await supabase
      .from("product_outlines")
      .delete()
      .eq("id", outlineId);

    if (error) {
      toast({ title: "Error", description: "Failed to delete outline.", variant: "destructive" });
      return;
    }

    setOutlines((prev) => prev.filter((o) => o.id !== outlineId));
    toast({ title: "Deleted", description: "Outline removed." });
  };

  const updateOutline = async (outlineId: string, updates: Partial<ProductOutline>) => {
    const { error } = await supabase
      .from("product_outlines")
      .update(updates)
      .eq("id", outlineId);

    if (error) {
      toast({ title: "Error", description: "Failed to update outline.", variant: "destructive" });
      return false;
    }
    await fetchOutlines();
    return true;
  };

  return {
    outlines,
    isLoading,
    isGenerating,
    generateOutline,
    fetchOutlineWithSections,
    updateSection,
    reorderSections,
    deleteOutline,
    updateOutline,
    refetch: fetchOutlines,
  };
}
