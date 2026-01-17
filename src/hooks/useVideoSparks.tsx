import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface VideoSpark {
  id: string;
  user_id: string;
  brand_id: string;
  source_id: string | null;
  title: string;
  suggested_angle: string | null;
  source_excerpt: string | null;
  source_url: string | null;
  velocity_score: number;
  outlier_score: number;
  combined_score: number;
  competition_level: "low" | "medium" | "high" | null;
  status: "new" | "saved" | "scripting" | "completed" | "dismissed";
  ai_analysis: Json | null;
  created_at: string;
  updated_at: string;
}

export function useVideoSparks(brandId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: sparks = [], isLoading } = useQuery({
    queryKey: ["video-sparks", brandId],
    queryFn: async () => {
      if (!brandId || !user) return [];
      
      const { data, error } = await supabase
        .from("video_sparks")
        .select("*")
        .eq("brand_id", brandId)
        .eq("user_id", user.id)
        .order("combined_score", { ascending: false });

      if (error) throw error;
      return data as VideoSpark[];
    },
    enabled: !!brandId && !!user,
  });

  const createSpark = useMutation({
    mutationFn: async (spark: { title: string; suggested_angle?: string; source_url?: string; velocity_score?: number; outlier_score?: number }) => {
      if (!user || !brandId) throw new Error("No user or brand");
      
      const { data, error } = await supabase
        .from("video_sparks")
        .insert({
          title: spark.title,
          suggested_angle: spark.suggested_angle,
          source_url: spark.source_url,
          velocity_score: spark.velocity_score ?? 0,
          outlier_score: spark.outlier_score ?? 0,
          user_id: user.id,
          brand_id: brandId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-sparks", brandId] });
      toast.success("Spark created!");
    },
    onError: (error) => {
      toast.error("Failed to create spark: " + error.message);
    },
  });

  const updateSpark = useMutation({
    mutationFn: async ({ id, status }: { id: string; status?: "new" | "saved" | "scripting" | "completed" | "dismissed" }) => {
      const { data, error } = await supabase
        .from("video_sparks")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-sparks", brandId] });
    },
    onError: (error) => {
      toast.error("Failed to update spark: " + error.message);
    },
  });

  const deleteSpark = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("video_sparks")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-sparks", brandId] });
      toast.success("Spark dismissed");
    },
    onError: (error) => {
      toast.error("Failed to dismiss spark: " + error.message);
    },
  });

  return {
    sparks,
    isLoading,
    createSpark,
    updateSpark,
    deleteSpark,
  };
}
