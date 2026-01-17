import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AISetting {
  id: string;
  setting_key: string;
  setting_value: string;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

export const AI_MODELS = {
  text_generation: [
    { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash Preview", description: "Fast, balanced - recommended for posts" },
    { value: "google/gemini-3-pro-preview", label: "Gemini 3 Pro Preview", description: "Next-gen, most capable" },
    { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", description: "Top-tier reasoning" },
    { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", description: "Balanced cost/performance" },
    { value: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", description: "Fastest, cheapest" },
    { value: "openai/gpt-5", label: "GPT-5", description: "Powerful, expensive" },
    { value: "openai/gpt-5-mini", label: "GPT-5 Mini", description: "Good balance of cost/quality" },
    { value: "openai/gpt-5-nano", label: "GPT-5 Nano", description: "Speed optimized" },
    { value: "openai/gpt-5.2", label: "GPT-5.2", description: "Latest with enhanced reasoning" },
  ],
  image_generation: [
    { value: "google/gemini-2.5-flash-image-preview", label: "Gemini 2.5 Flash Image", description: "Current default" },
    { value: "google/gemini-3-pro-image-preview", label: "Gemini 3 Pro Image", description: "Next-gen images" },
  ],
  embeddings: [
    { value: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", description: "Fastest, cheapest - recommended" },
    { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", description: "More accurate" },
    { value: "openai/gpt-5-nano", label: "GPT-5 Nano", description: "Speed optimized" },
  ],
};

export const SETTING_KEYS = {
  POST_GENERATION: "model_post_generation",
  IMAGE_GENERATION: "model_image_generation",
  EMBEDDINGS: "model_embeddings",
  DOCUMENT_PROCESSING: "model_document_processing",
} as const;

export function useAISettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["ai-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_settings")
        .select("*");

      if (error) throw error;
      return data as AISetting[];
    },
  });

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from("ai_settings")
        .update({ setting_value: value })
        .eq("setting_key", key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-settings"] });
      toast.success("Setting updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update setting: " + error.message);
    },
  });

  const getSettingValue = (key: string): string | undefined => {
    return settings?.find((s) => s.setting_key === key)?.setting_value;
  };

  const getSetting = (key: string): AISetting | undefined => {
    return settings?.find((s) => s.setting_key === key);
  };

  return {
    settings,
    isLoading,
    updateSetting,
    getSettingValue,
    getSetting,
  };
}
