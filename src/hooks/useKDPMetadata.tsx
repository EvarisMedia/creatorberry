import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface KDPMetadata {
  id: string;
  user_id: string;
  product_outline_id: string;
  brand_id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  keywords: string[];
  categories: string[];
  royalty_tier: string;
  ebook_price: number | null;
  print_price: number | null;
  asin: string | null;
  status: string;
  pricing_analysis: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export function useKDPMetadata(brandId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: kdpItems = [], isLoading } = useQuery({
    queryKey: ["kdp-metadata", brandId],
    queryFn: async () => {
      if (!brandId || !user) return [];
      const { data, error } = await supabase
        .from("kdp_metadata")
        .select("*")
        .eq("brand_id", brandId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as KDPMetadata[];
    },
    enabled: !!brandId && !!user,
  });

  const generateMetadata = useMutation({
    mutationFn: async ({ outlineId, brandId: bId }: { outlineId: string; brandId: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-kdp-metadata`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ outlineId, brandId: bId, action: "generate_metadata" }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Generation failed");
      }
      return response.json();
    },
    onError: (error) => {
      toast.error("Failed to generate metadata: " + error.message);
    },
  });

  const saveMetadata = useMutation({
    mutationFn: async (metadata: {
      product_outline_id: string;
      brand_id: string;
      title: string;
      subtitle?: string | null;
      description?: string | null;
      keywords?: string[];
      categories?: string[];
      royalty_tier?: string;
      ebook_price?: number;
      print_price?: number;
      status?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Check if metadata already exists for this outline
      const { data: existing } = await supabase
        .from("kdp_metadata")
        .select("id")
        .eq("product_outline_id", metadata.product_outline_id)
        .eq("user_id", user.id)
        .maybeSingle();

      const payload = {
        product_outline_id: metadata.product_outline_id,
        brand_id: metadata.brand_id,
        title: metadata.title,
        subtitle: metadata.subtitle,
        description: metadata.description,
        keywords: metadata.keywords,
        categories: metadata.categories,
        royalty_tier: metadata.royalty_tier,
        ebook_price: metadata.ebook_price,
        print_price: metadata.print_price,
        status: metadata.status,
      };

      if (existing) {
        const { data, error } = await supabase
          .from("kdp_metadata")
          .update(payload)
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("kdp_metadata")
          .insert({ ...payload, user_id: user.id })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kdp-metadata", brandId] });
      toast.success("KDP metadata saved!");
    },
    onError: (error) => {
      toast.error("Failed to save: " + error.message);
    },
  });

  const deleteMetadata = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kdp_metadata").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kdp-metadata", brandId] });
      toast.success("KDP metadata deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete: " + error.message);
    },
  });

  return { kdpItems, isLoading, generateMetadata, saveMetadata, deleteMetadata };
}
