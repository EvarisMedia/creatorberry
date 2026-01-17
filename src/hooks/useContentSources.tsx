import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export type SourceType = "rss_feed" | "blog_url" | "manual_idea";
export type FunnelStage = "awareness" | "authority" | "conversion";
export type PriorityLevel = "low" | "medium" | "high";

export interface ContentSource {
  id: string;
  brand_id: string;
  user_id: string;
  source_type: SourceType;
  name: string;
  url: string | null;
  content: string | null;
  topic: string | null;
  funnel_stage: FunnelStage;
  priority: PriorityLevel;
  is_active: boolean;
  last_fetched_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSourceInput {
  brand_id: string;
  source_type: SourceType;
  name: string;
  url?: string;
  content?: string;
  topic?: string;
  funnel_stage: FunnelStage;
  priority: PriorityLevel;
}

export function useContentSources(brandId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const sourcesQuery = useQuery({
    queryKey: ["content-sources", brandId],
    queryFn: async () => {
      if (!brandId) return [];
      
      const { data, error } = await supabase
        .from("content_sources")
        .select("*")
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ContentSource[];
    },
    enabled: !!brandId && !!user,
  });

  const createSource = useMutation({
    mutationFn: async (input: CreateSourceInput) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("content_sources")
        .insert({
          ...input,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-sources", brandId] });
      toast.success("Source added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add source: " + error.message);
    },
  });

  const updateSource = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<ContentSource> & { id: string }) => {
      const { data, error } = await supabase
        .from("content_sources")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-sources", brandId] });
      toast.success("Source updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update source: " + error.message);
    },
  });

  const deleteSource = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("content_sources")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-sources", brandId] });
      toast.success("Source deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete source: " + error.message);
    },
  });

  const toggleSourceActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from("content_sources")
        .update({ is_active })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-sources", brandId] });
    },
  });

  return {
    sources: sourcesQuery.data || [],
    isLoading: sourcesQuery.isLoading,
    error: sourcesQuery.error,
    createSource,
    updateSource,
    deleteSource,
    toggleSourceActive,
  };
}
