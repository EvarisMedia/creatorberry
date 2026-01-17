import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export type PinStatus = "draft" | "approved" | "published";
export type PinType = "blog" | "product" | "idea" | "infographic" | "listicle" | "comparison";
export type CtaType = "save" | "click" | "shop" | "learn";

export interface Pin {
  id: string;
  user_id: string;
  brand_id: string;
  board_id: string | null;
  source_id: string | null;
  title: string;
  description: string | null;
  destination_url: string | null;
  keywords: string[] | null;
  seo_score: number | null;
  pin_type: string | null;
  status: string | null;
  cta_type: string | null;
  source_context: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface PinVariation {
  id: string;
  user_id: string;
  pin_id: string;
  image_url: string | null;
  headline: string | null;
  description_variation: string | null;
  layout_style: string | null;
  color_emphasis: string | null;
  is_selected: boolean | null;
  created_at: string;
}

export interface CreatePinInput {
  brand_id: string;
  board_id?: string;
  source_id?: string;
  title: string;
  description?: string;
  destination_url?: string;
  keywords?: string[];
  seo_score?: number;
  pin_type?: string;
  cta_type?: string;
  source_context?: string;
}

export interface CreatePinVariationInput {
  pin_id: string;
  headline?: string;
  description_variation?: string;
  layout_style?: string;
  color_emphasis?: string;
  image_url?: string;
}

export interface GeneratePinsInput {
  sourceContent: string;
  sourceName: string;
  sourceUrl?: string;
  pinType: string;
  brandContext: {
    name: string;
    niche?: string;
    primaryKeywords?: string[];
    pinDesignStyle?: string;
    targetAudience?: string;
  };
  boardKeywords?: string[];
  numberOfVariations: number;
}

export interface GeneratedPin {
  title: string;
  description: string;
  keywords: string[];
  ctaType: string;
  headline: string;
  layoutStyle: string;
  seoScore: number;
}

export function usePins(brandId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const pinsQuery = useQuery({
    queryKey: ["pins", brandId],
    queryFn: async () => {
      if (!brandId) return [];

      const { data, error } = await supabase
        .from("pins")
        .select("*")
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Pin[];
    },
    enabled: !!brandId && !!user,
  });

  const createPin = useMutation({
    mutationFn: async (input: CreatePinInput) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("pins")
        .insert({
          ...input,
          user_id: user.id,
          status: "draft",
        })
        .select()
        .single();

      if (error) throw error;
      return data as Pin;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pins", brandId] });
    },
    onError: (error) => {
      toast.error("Failed to create pin: " + error.message);
    },
  });

  const createPinWithVariations = useMutation({
    mutationFn: async ({
      pin,
      variations,
    }: {
      pin: CreatePinInput;
      variations: Omit<CreatePinVariationInput, "pin_id">[];
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Create the pin first
      const { data: pinData, error: pinError } = await supabase
        .from("pins")
        .insert({
          ...pin,
          user_id: user.id,
          status: "draft",
        })
        .select()
        .single();

      if (pinError) throw pinError;

      // Create variations
      if (variations.length > 0) {
        const variationsWithPinId = variations.map((v, index) => ({
          ...v,
          pin_id: pinData.id,
          user_id: user.id,
          is_selected: index === 0, // First variation is selected by default
        }));

        const { error: varError } = await supabase
          .from("pin_variations")
          .insert(variationsWithPinId);

        if (varError) throw varError;
      }

      return pinData as Pin;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pins", brandId] });
      toast.success("Pin created with variations");
    },
    onError: (error) => {
      toast.error("Failed to create pin: " + error.message);
    },
  });

  const updatePin = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Pin> & { id: string }) => {
      const { data, error } = await supabase
        .from("pins")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Pin;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pins", brandId] });
      toast.success("Pin updated");
    },
    onError: (error) => {
      toast.error("Failed to update pin: " + error.message);
    },
  });

  const deletePin = useMutation({
    mutationFn: async (id: string) => {
      // Delete variations first
      await supabase.from("pin_variations").delete().eq("pin_id", id);
      
      const { error } = await supabase.from("pins").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pins", brandId] });
      toast.success("Pin deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete pin: " + error.message);
    },
  });

  const approvePin = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("pins")
        .update({ status: "approved" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Pin;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pins", brandId] });
      toast.success("Pin approved");
    },
  });

  const bulkApprove = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("pins")
        .update({ status: "approved" })
        .in("id", ids);

      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["pins", brandId] });
      toast.success(`${ids.length} pins approved`);
    },
    onError: (error) => {
      toast.error("Failed to approve pins: " + error.message);
    },
  });

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      // Delete variations first
      await supabase.from("pin_variations").delete().in("pin_id", ids);
      
      const { error } = await supabase.from("pins").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["pins", brandId] });
      queryClient.invalidateQueries({ queryKey: ["all-pin-variations", brandId] });
      toast.success(`${ids.length} pins deleted`);
    },
    onError: (error) => {
      toast.error("Failed to delete pins: " + error.message);
    },
  });

  const bulkMove = useMutation({
    mutationFn: async ({ ids, boardId }: { ids: string[]; boardId: string | null }) => {
      const { error } = await supabase
        .from("pins")
        .update({ board_id: boardId })
        .in("id", ids);

      if (error) throw error;
    },
    onSuccess: (_, { ids, boardId }) => {
      queryClient.invalidateQueries({ queryKey: ["pins", brandId] });
      const message = boardId 
        ? `${ids.length} pins moved to board`
        : `${ids.length} pins removed from board`;
      toast.success(message);
    },
    onError: (error) => {
      toast.error("Failed to move pins: " + error.message);
    },
  });

  const generatePins = useMutation({
    mutationFn: async (input: GeneratePinsInput): Promise<GeneratedPin[]> => {
      const { data, error } = await supabase.functions.invoke("generate-pins", {
        body: input,
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return data.pins as GeneratedPin[];
    },
    onError: (error) => {
      toast.error("Failed to generate pins: " + error.message);
    },
  });

  return {
    pins: pinsQuery.data || [],
    isLoading: pinsQuery.isLoading,
    error: pinsQuery.error,
    createPin,
    createPinWithVariations,
    updatePin,
    deletePin,
    approvePin,
    bulkApprove,
    bulkDelete,
    bulkMove,
    generatePins,
  };
}

export function usePinVariations(pinId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const variationsQuery = useQuery({
    queryKey: ["pin-variations", pinId],
    queryFn: async () => {
      if (!pinId) return [];

      const { data, error } = await supabase
        .from("pin_variations")
        .select("*")
        .eq("pin_id", pinId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as PinVariation[];
    },
    enabled: !!pinId && !!user,
  });

  const selectVariation = useMutation({
    mutationFn: async (variationId: string) => {
      if (!pinId) throw new Error("No pin selected");

      // Deselect all variations for this pin
      await supabase
        .from("pin_variations")
        .update({ is_selected: false })
        .eq("pin_id", pinId);

      // Select the chosen one
      const { data, error } = await supabase
        .from("pin_variations")
        .update({ is_selected: true })
        .eq("id", variationId)
        .select()
        .single();

      if (error) throw error;
      return data as PinVariation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pin-variations", pinId] });
    },
  });

  const updateVariation = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<PinVariation> & { id: string }) => {
      const { data, error } = await supabase
        .from("pin_variations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as PinVariation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pin-variations", pinId] });
      toast.success("Variation updated");
    },
    onError: (error) => {
      toast.error("Failed to update variation: " + error.message);
    },
  });

  const createVariation = useMutation({
    mutationFn: async (input: CreatePinVariationInput) => {
      if (!user) throw new Error("Not authenticated");

      // If this will be the first variation, make it selected
      const existingCount = variationsQuery.data?.length || 0;

      const { data, error } = await supabase
        .from("pin_variations")
        .insert({
          ...input,
          user_id: user.id,
          is_selected: existingCount === 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data as PinVariation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pin-variations", pinId] });
      toast.success("Variation created");
    },
    onError: (error) => {
      toast.error("Failed to create variation: " + error.message);
    },
  });

  return {
    variations: variationsQuery.data || [],
    isLoading: variationsQuery.isLoading,
    selectVariation,
    updateVariation,
    createVariation,
  };
}

export function useAllPinVariations(brandId: string | null) {
  const { user } = useAuth();

  const variationsQuery = useQuery({
    queryKey: ["all-pin-variations", brandId],
    queryFn: async () => {
      if (!brandId) return [];

      const { data, error } = await supabase
        .from("pin_variations")
        .select("*, pins!inner(brand_id)")
        .eq("pins.brand_id", brandId);

      if (error) throw error;
      return data as PinVariation[];
    },
    enabled: !!brandId && !!user,
  });

  return {
    variations: variationsQuery.data || [],
    isLoading: variationsQuery.isLoading,
  };
}
