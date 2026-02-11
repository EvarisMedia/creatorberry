import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export type ExpansionMode = "expansion" | "story" | "deep_dive" | "workbook";

export interface ExpandedContent {
  id: string;
  outline_section_id: string;
  brand_id: string;
  user_id: string;
  mode: ExpansionMode;
  content: string;
  word_count: number;
  tone: string | null;
  style: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export const EXPANSION_MODES: { mode: ExpansionMode; label: string; description: string; icon: string }[] = [
  { mode: "expansion", label: "Expand", description: "1.5-2x longer with examples and clear explanations", icon: "📝" },
  { mode: "story", label: "Story-Driven", description: "Narrative format with case studies and anecdotes", icon: "📖" },
  { mode: "deep_dive", label: "Deep Dive", description: "Technical depth with research and expert insights", icon: "🔬" },
  { mode: "workbook", label: "Workbook", description: "Exercises, worksheets, templates and checklists", icon: "📋" },
];

export function useContentExpansion(sectionId: string | null) {
  const { user } = useAuth();
  const [contents, setContents] = useState<ExpandedContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchContents = useCallback(async () => {
    if (!user || !sectionId) { setContents([]); return; }

    setIsLoading(true);
    const { data, error } = await supabase
      .from("expanded_content")
      .select("*")
      .eq("outline_section_id", sectionId)
      .order("created_at", { ascending: false });

    if (!error) setContents((data || []) as ExpandedContent[]);
    setIsLoading(false);
  }, [user, sectionId]);

  useEffect(() => { fetchContents(); }, [fetchContents]);

  const expandSection = async (
    mode: ExpansionMode,
    section: { id: string; title: string; description: string | null; subsections: string[]; word_count_target: number },
    brandId: string,
    brandContext: any
  ) => {
    setIsGenerating(true);
    try {
      const response = await supabase.functions.invoke("expand-content", {
        body: {
          sectionId: section.id,
          mode,
          brandId,
          sectionTitle: section.title,
          sectionDescription: section.description,
          subsections: section.subsections,
          wordCountTarget: section.word_count_target,
          brandContext,
        },
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      toast({ title: "Content Generated!", description: `${EXPANSION_MODES.find(m => m.mode === mode)?.label} mode content created.` });
      await fetchContents();
      return response.data.content as ExpandedContent;
    } catch (error: any) {
      console.error("Expansion error:", error);
      toast({ title: "Generation Failed", description: error.message || "Failed to expand content.", variant: "destructive" });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const updateContent = async (contentId: string, updates: { content: string }) => {
    const wordCount = updates.content.split(/\s+/).filter(Boolean).length;
    const { error } = await supabase
      .from("expanded_content")
      .update({ content: updates.content, word_count: wordCount })
      .eq("id", contentId);

    if (error) {
      toast({ title: "Error", description: "Failed to update content.", variant: "destructive" });
      return false;
    }
    await fetchContents();
    return true;
  };

  const deleteContent = async (contentId: string) => {
    const { error } = await supabase
      .from("expanded_content")
      .delete()
      .eq("id", contentId);

    if (error) {
      toast({ title: "Error", description: "Failed to delete content.", variant: "destructive" });
      return false;
    }
    setContents(prev => prev.filter(c => c.id !== contentId));
    toast({ title: "Deleted", description: "Content removed." });
    return true;
  };

  const getContentByMode = (mode: ExpansionMode) =>
    contents.filter(c => c.mode === mode).sort((a, b) => b.version - a.version);

  return {
    contents,
    isLoading,
    isGenerating,
    expandSection,
    updateContent,
    deleteContent,
    getContentByMode,
    refetch: fetchContents,
  };
}
