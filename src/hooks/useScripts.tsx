import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface Script {
  id: string;
  user_id: string;
  brand_id: string;
  spark_id: string | null;
  template_id: string | null;
  title: string;
  hook: string | null;
  sections: Json;
  full_script: string | null;
  target_length_minutes: number;
  estimated_word_count: number | null;
  research_context: string | null;
  b_roll_notes: string | null;
  status: "draft" | "in_progress" | "review" | "completed" | "published";
  seo_title: string | null;
  seo_description: string | null;
  seo_tags: string[] | null;
  chapter_markers: Json | null;
  thumbnail_brief: Json | null;
  created_at: string;
  updated_at: string;
}

export interface ScriptTemplate {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  template_type: "documentary" | "tutorial" | "storytime" | "listicle" | "reaction" | "custom";
  structure: Json;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useScripts(brandId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: scripts = [], isLoading } = useQuery({
    queryKey: ["scripts", brandId],
    queryFn: async () => {
      if (!brandId || !user) return [];
      
      const { data, error } = await supabase
        .from("scripts")
        .select("*")
        .eq("brand_id", brandId)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as Script[];
    },
    enabled: !!brandId && !!user,
  });

  const createScript = useMutation({
    mutationFn: async (script: { title: string; template_id?: string; spark_id?: string }) => {
      if (!user || !brandId) throw new Error("No user or brand");
      
      const { data, error } = await supabase
        .from("scripts")
        .insert({
          title: script.title,
          template_id: script.template_id,
          spark_id: script.spark_id,
          user_id: user.id,
          brand_id: brandId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scripts", brandId] });
      toast.success("Script created!");
    },
    onError: (error) => {
      toast.error("Failed to create script: " + error.message);
    },
  });

  const updateScript = useMutation({
    mutationFn: async ({ id, title, hook, full_script, status }: { id: string; title?: string; hook?: string; full_script?: string; status?: "draft" | "in_progress" | "review" | "completed" | "published" }) => {
      const { data, error } = await supabase
        .from("scripts")
        .update({ title, hook, full_script, status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scripts", brandId] });
      toast.success("Script updated!");
    },
    onError: (error) => {
      toast.error("Failed to update script: " + error.message);
    },
  });

  const deleteScript = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("scripts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scripts", brandId] });
      toast.success("Script deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete script: " + error.message);
    },
  });

  return {
    scripts,
    isLoading,
    createScript,
    updateScript,
    deleteScript,
  };
}

export function useScriptTemplates() {
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["script-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("script_templates")
        .select("*")
        .eq("is_active", true)
        .order("is_system", { ascending: false });

      if (error) throw error;
      return data as ScriptTemplate[];
    },
  });

  return { templates, isLoading };
}

export function useScript(scriptId: string | undefined) {
  const { data: script, isLoading } = useQuery({
    queryKey: ["script", scriptId],
    queryFn: async () => {
      if (!scriptId) return null;
      
      const { data, error } = await supabase
        .from("scripts")
        .select("*")
        .eq("id", scriptId)
        .single();

      if (error) throw error;
      return data as Script;
    },
    enabled: !!scriptId,
  });

  return { script, isLoading };
}
