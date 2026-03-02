import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Brand {
  id: string;
  user_id: string;
  name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  timezone: string;
  tone: "professional" | "conversational" | "bold" | "opinionated";
  emoji_usage: "none" | "minimal" | "moderate";
  writing_style: "short_punchy" | "long_form" | "story_driven";
  about: string | null;
  core_beliefs: string | null;
  opinions: string | null;
  signature_frameworks: string | null;
  offers_services: string | null;
  target_audience: string | null;
  created_at: string;
  updated_at: string;
}

export function useBrands() {
  const { user } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBrands = async () => {
    if (!user) {
      setBrands([]);
      setCurrentBrand(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching brands:", error);
    } else {
      const typedData = data as Brand[];
      setBrands(typedData);
      if (typedData.length > 0 && !currentBrand) {
        setCurrentBrand(typedData[0]);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBrands();
  }, [user]);

  const selectBrand = (brandId: string) => {
    const brand = brands.find((b) => b.id === brandId);
    if (brand) {
      setCurrentBrand(brand);
    }
  };

  const updateBrand = async (brandId: string, updates: Partial<Brand>) => {
    const { error } = await supabase
      .from("brands")
      .update(updates)
      .eq("id", brandId);
    if (error) {
      console.error("Error updating brand:", error);
      return false;
    }
    await fetchBrands();
    // Update currentBrand if it was the one updated
    if (currentBrand?.id === brandId) {
      setCurrentBrand((prev) => prev ? { ...prev, ...updates } : prev);
    }
    return true;
  };

  const deleteBrand = async (brandId: string) => {
    const { error } = await supabase
      .from("brands")
      .delete()
      .eq("id", brandId);
    if (error) {
      console.error("Error deleting brand:", error);
      return false;
    }
    if (currentBrand?.id === brandId) {
      setCurrentBrand(null);
    }
    await fetchBrands();
    return true;
  };

  return {
    brands,
    currentBrand,
    isLoading,
    selectBrand,
    updateBrand,
    deleteBrand,
    refetch: fetchBrands,
  };
}
