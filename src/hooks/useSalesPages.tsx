import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/components/ui/sonner";

export interface SalesPageSection {
  type: string;
  title: string;
  content: string;
  order: number;
}

export interface SalesPage {
  id: string;
  user_id: string;
  brand_id: string;
  product_outline_id: string | null;
  framework: string;
  headline: string;
  subheadline: string | null;
  sections: SalesPageSection[];
  cta_text: string | null;
  cta_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useSalesPages(brandId: string | null) {
  const { user } = useAuth();
  const [salesPages, setSalesPages] = useState<SalesPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSalesPages = async () => {
    if (!user || !brandId) {
      setSalesPages([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from("sales_pages")
      .select("*")
      .eq("brand_id", brandId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching sales pages:", error);
    } else {
      setSalesPages(
        (data || []).map((d: any) => ({
          ...d,
          sections: (d.sections || []) as SalesPageSection[],
        }))
      );
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSalesPages();
  }, [user, brandId]);

  const generateSalesPage = async (params: {
    framework: string;
    productTitle: string;
    productDescription: string;
    targetAudience: string;
    productOutlineId?: string;
    brandContext: {
      name: string;
      tone?: string;
      about?: string;
      offers_services?: string;
    };
    customInstructions?: string;
  }) => {
    if (!user || !brandId) return null;

    const { data: fnData, error: fnError } = await supabase.functions.invoke(
      "generate-sales-page",
      { body: params }
    );

    if (fnError) {
      toast.error("Failed to generate sales page");
      console.error(fnError);
      return null;
    }

    const result = fnData;

    const { data, error } = await supabase
      .from("sales_pages")
      .insert({
        user_id: user.id,
        brand_id: brandId,
        product_outline_id: params.productOutlineId || null,
        framework: params.framework,
        headline: result.headline || "",
        subheadline: result.subheadline || null,
        sections: result.sections || [],
        cta_text: result.ctaText || null,
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to save sales page");
      console.error(error);
      return null;
    }

    toast.success("Sales page generated!");
    await fetchSalesPages();
    return data;
  };

  const updateSalesPage = async (id: string, updates: Partial<SalesPage>) => {
    const { sections, ...rest } = updates;
    const updatePayload: any = { ...rest };
    if (sections !== undefined) {
      updatePayload.sections = sections as any;
    }
    const { error } = await supabase
      .from("sales_pages")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      toast.error("Failed to update sales page");
      console.error(error);
      return;
    }

    toast.success("Sales page updated");
    await fetchSalesPages();
  };

  const deleteSalesPage = async (id: string) => {
    const { error } = await supabase
      .from("sales_pages")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete sales page");
      console.error(error);
      return;
    }

    toast.success("Sales page deleted");
    await fetchSalesPages();
  };

  return {
    salesPages,
    isLoading,
    generateSalesPage,
    updateSalesPage,
    deleteSalesPage,
    refetch: fetchSalesPages,
  };
}
