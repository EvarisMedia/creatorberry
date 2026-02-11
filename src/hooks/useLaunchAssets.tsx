import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/components/ui/sonner";

export interface LaunchAsset {
  id: string;
  user_id: string;
  brand_id: string;
  product_outline_id: string | null;
  asset_type: string;
  title: string;
  content: any;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useLaunchAssets(brandId: string | null) {
  const { user } = useAuth();
  const [assets, setAssets] = useState<LaunchAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAssets = async () => {
    if (!user || !brandId) { setAssets([]); setIsLoading(false); return; }
    setIsLoading(true);
    const { data, error } = await supabase
      .from("launch_assets")
      .select("*")
      .eq("brand_id", brandId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) console.error("Error fetching launch assets:", error);
    else setAssets((data || []) as LaunchAsset[]);
    setIsLoading(false);
  };

  useEffect(() => { fetchAssets(); }, [user, brandId]);

  const generateAsset = async (params: {
    assetType: string;
    productTitle: string;
    productDescription: string;
    targetAudience: string;
    productOutlineId?: string;
    brandContext: { name: string; tone?: string; about?: string };
    customInstructions?: string;
  }) => {
    if (!user || !brandId) return null;

    const { data: fnData, error: fnError } = await supabase.functions.invoke(
      "generate-launch-assets",
      { body: params }
    );

    if (fnError) { toast.error("Failed to generate asset"); return null; }

    const typeLabels: Record<string, string> = {
      email_sequence: "Email Launch Sequence",
      social_posts: "Social Media Posts",
      waitlist_copy: "Waitlist Page Copy",
      podcast_questions: "Podcast Interview Kit",
    };

    const { error } = await supabase.from("launch_assets").insert({
      user_id: user.id,
      brand_id: brandId,
      product_outline_id: params.productOutlineId || null,
      asset_type: params.assetType,
      title: `${typeLabels[params.assetType] || params.assetType} - ${params.productTitle}`,
      content: fnData,
      status: "draft",
    });

    if (error) { toast.error("Failed to save asset"); return null; }
    toast.success("Launch asset generated!");
    await fetchAssets();
    return fnData;
  };

  const deleteAsset = async (id: string) => {
    const { error } = await supabase.from("launch_assets").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Asset deleted");
    await fetchAssets();
  };

  return { assets, isLoading, generateAsset, deleteAsset, refetch: fetchAssets };
}
