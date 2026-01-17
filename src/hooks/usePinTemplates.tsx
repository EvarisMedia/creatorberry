import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface PinTemplate {
  id: string;
  user_id: string;
  brand_id: string | null;
  name: string;
  description: string | null;
  pin_type: string | null;
  title_template: string | null;
  description_template: string | null;
  headline_template: string | null;
  cta_type: string | null;
  layout_style: string | null;
  color_emphasis: string | null;
  keywords: string[] | null;
  is_default: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePinTemplateInput {
  brand_id?: string;
  name: string;
  description?: string;
  pin_type?: string;
  title_template?: string;
  description_template?: string;
  headline_template?: string;
  cta_type?: string;
  layout_style?: string;
  color_emphasis?: string;
  keywords?: string[];
  is_default?: boolean;
}

export interface UpdatePinTemplateInput extends Partial<CreatePinTemplateInput> {
  id: string;
}

export function usePinTemplates(brandId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ["pin-templates", brandId],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("pin_templates")
        .select("*")
        .order("created_at", { ascending: false });

      // Get templates for this brand OR global templates (no brand)
      if (brandId) {
        query = query.or(`brand_id.eq.${brandId},brand_id.is.null`);
      } else {
        query = query.is("brand_id", null);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PinTemplate[];
    },
    enabled: !!user,
  });

  const createTemplate = useMutation({
    mutationFn: async (input: CreatePinTemplateInput) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("pin_templates")
        .insert({
          ...input,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as PinTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pin-templates"] });
      toast.success("Template saved!");
    },
    onError: (error) => {
      toast.error("Failed to save template: " + error.message);
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: UpdatePinTemplateInput) => {
      const { data, error } = await supabase
        .from("pin_templates")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as PinTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pin-templates"] });
      toast.success("Template updated!");
    },
    onError: (error) => {
      toast.error("Failed to update template: " + error.message);
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pin_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pin-templates"] });
      toast.success("Template deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete template: " + error.message);
    },
  });

  const setDefaultTemplate = useMutation({
    mutationFn: async ({ templateId, brandId }: { templateId: string; brandId: string | null }) => {
      // First, unset all defaults for this brand
      if (brandId) {
        await supabase
          .from("pin_templates")
          .update({ is_default: false })
          .eq("brand_id", brandId);
      } else {
        await supabase
          .from("pin_templates")
          .update({ is_default: false })
          .is("brand_id", null);
      }

      // Set the new default
      const { data, error } = await supabase
        .from("pin_templates")
        .update({ is_default: true })
        .eq("id", templateId)
        .select()
        .single();

      if (error) throw error;
      return data as PinTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pin-templates"] });
      toast.success("Default template updated!");
    },
    onError: (error) => {
      toast.error("Failed to set default: " + error.message);
    },
  });

  return {
    templates: templatesQuery.data || [],
    isLoading: templatesQuery.isLoading,
    error: templatesQuery.error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setDefaultTemplate,
  };
}