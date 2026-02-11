import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface PmfScore {
  id: string;
  product_idea_id: string;
  demand_score: number;
  fit_score: number;
  gap_score: number;
  urgency_score: number;
  combined_score: number;
  reasoning: Record<string, string> | null;
  created_at: string;
}

export interface ProductIdea {
  id: string;
  user_id: string;
  brand_id: string;
  title: string;
  description: string;
  format: string;
  target_audience: string | null;
  source_context: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  pmf_score?: PmfScore | null;
}

export function useProductIdeas(brandId: string | null) {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<ProductIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchIdeas = useCallback(async () => {
    if (!user || !brandId) {
      setIdeas([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data: ideasData, error } = await supabase
      .from("product_ideas")
      .select("*")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching product ideas:", error);
      setIsLoading(false);
      return;
    }

    // Fetch PMF scores for all ideas
    const ideaIds = (ideasData || []).map((i: any) => i.id);
    let scoresMap: Record<string, PmfScore> = {};

    if (ideaIds.length > 0) {
      const { data: scoresData } = await supabase
        .from("pmf_scores")
        .select("*")
        .in("product_idea_id", ideaIds);

      if (scoresData) {
        for (const score of scoresData) {
          scoresMap[score.product_idea_id] = score as PmfScore;
        }
      }
    }

    const ideasWithScores: ProductIdea[] = (ideasData || []).map((idea: any) => ({
      ...idea,
      pmf_score: scoresMap[idea.id] || null,
    }));

    setIdeas(ideasWithScores);
    setIsLoading(false);
  }, [user, brandId]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const createIdea = async (idea: { title: string; description: string; format: string; target_audience: string }) => {
    if (!user || !brandId) return;
    const { error } = await supabase
      .from("product_ideas")
      .insert({
        user_id: user.id,
        brand_id: brandId,
        title: idea.title,
        description: idea.description,
        format: idea.format,
        target_audience: idea.target_audience || null,
        status: "new",
      });

    if (error) {
      console.error("Error creating idea:", error);
      toast({ title: "Error", description: "Failed to add idea.", variant: "destructive" });
      return;
    }

    toast({ title: "Idea Added", description: "Your product idea has been saved." });
    await fetchIdeas();
  };

  const generateIdeas = async (brand: any, numberOfIdeas = 5, seedPrompt?: string) => {
    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("generate-product-ideas", {
        body: { brand, numberOfIdeas, seedPrompt },
      });

      if (response.error) throw response.error;

      toast({
        title: "Ideas Generated!",
        description: `${response.data.ideas.length} product ideas created with PMF scores.`,
      });

      await fetchIdeas();
      return response.data.ideas;
    } catch (error: any) {
      console.error("Error generating ideas:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate product ideas.",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsGenerating(false);
    }
  };

  const updateIdeaStatus = async (ideaId: string, status: string) => {
    const { error } = await supabase
      .from("product_ideas")
      .update({ status })
      .eq("id", ideaId);

    if (error) {
      console.error("Error updating idea status:", error);
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
      return;
    }

    setIdeas((prev) =>
      prev.map((i) => (i.id === ideaId ? { ...i, status } : i))
    );
  };

  const deleteIdea = async (ideaId: string) => {
    const { error } = await supabase
      .from("product_ideas")
      .delete()
      .eq("id", ideaId);

    if (error) {
      console.error("Error deleting idea:", error);
      toast({ title: "Error", description: "Failed to delete idea.", variant: "destructive" });
      return;
    }

    setIdeas((prev) => prev.filter((i) => i.id !== ideaId));
    toast({ title: "Deleted", description: "Product idea removed." });
  };

  return {
    ideas,
    isLoading,
    isGenerating,
    createIdea,
    generateIdeas,
    updateIdeaStatus,
    deleteIdea,
    refetch: fetchIdeas,
  };
}
