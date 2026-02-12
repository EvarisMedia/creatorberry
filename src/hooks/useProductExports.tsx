import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface ProductExport {
  id: string;
  user_id: string;
  product_outline_id: string;
  brand_id: string;
  format: string;
  file_url: string | null;
  file_size: number | null;
  title: string;
  status: string;
  error: string | null;
  export_settings: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export function useProductExports(brandId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: exports = [], isLoading } = useQuery({
    queryKey: ["product-exports", brandId],
    queryFn: async () => {
      if (!brandId || !user) return [];
      const { data, error } = await supabase
        .from("product_exports")
        .select("*")
        .eq("brand_id", brandId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProductExport[];
    },
    enabled: !!brandId && !!user,
  });

  const exportProduct = useMutation({
    mutationFn: async ({
      outlineId,
      format,
      settings,
    }: {
      outlineId: string;
      format: string;
      settings?: Record<string, unknown>;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-product`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ outlineId, format, settings }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Export failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["product-exports", brandId] });
      
      // Trigger download
      let blob: Blob;
      if (data.encoding === "base64") {
        const binaryString = atob(data.content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        blob = new Blob([bytes], { type: data.mimeType });
      } else if (data.extension === "pdf") {
        // PDF via print-styled HTML: open in new window for print-to-PDF
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(data.content);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
        }
        toast.success("PDF print dialog opened!");
        return;
      } else {
        blob = new Blob([data.content], { type: data.mimeType });
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.title.replace(/[^a-zA-Z0-9]/g, "_")}.${data.extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported as ${data.extension.toUpperCase()} successfully!`);
    },
    onError: (error) => {
      toast.error("Export failed: " + error.message);
    },
  });

  const deleteExport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("product_exports")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-exports", brandId] });
      toast.success("Export record deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete: " + error.message);
    },
  });

  return { exports, isLoading, exportProduct, deleteExport };
}
