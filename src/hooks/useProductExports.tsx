import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { generatePDFFromPages, generatePDFFromMarkdown } from "@/lib/generatePDF";
import { EbookPageData } from "@/components/content/ebookLayouts";
import { PDFStyleConfig, DEFAULT_PDF_STYLE_CONFIG } from "@/components/content/PDFStyleSettings";

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
      // For PDF, try client-side generation first
      if (format === "pdf") {
        return await generatePDFClientSide(outlineId, settings);
      }

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
      
      if (data._pdfBlob) {
        // Direct PDF blob download
        const url = URL.createObjectURL(data._pdfBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${data.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("PDF downloaded successfully!");
        return;
      }

      let blob: Blob;
      if (data.encoding === "base64") {
        const binaryString = atob(data.content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        blob = new Blob([bytes], { type: data.mimeType });
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

  const downloadExport = useMutation({
    mutationFn: async (exp: ProductExport) => {
      if (!exp.file_url) {
        throw new Error("NO_FILE");
      }
      const { data, error } = await supabase.storage
        .from("product-exports")
        .createSignedUrl(exp.file_url, 3600);
      if (error) throw error;
      return { url: data.signedUrl, title: exp.title, format: exp.format };
    },
    onSuccess: async (data) => {
      if (data.format === "pdf") {
        // For PDF, fetch the HTML and re-generate as real PDF client-side
        try {
          const response = await fetch(data.url);
          const html = await response.text();
          
          // Try to extract page data from the HTML to rebuild, 
          // but for simplicity just download the HTML as-is with a .pdf-like approach
          // Actually, generate a simple PDF from the text content
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = html;
          const textContent = tempDiv.textContent || tempDiv.innerText || "";
          
          const pdfBlob = await generatePDFFromMarkdown(
            textContent,
            DEFAULT_PDF_STYLE_CONFIG,
            data.title
          );
          
          const url = URL.createObjectURL(pdfBlob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${data.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success("PDF downloaded!");
        } catch (err) {
          console.error("PDF re-generation failed, falling back:", err);
          // Fallback: download the HTML file
          const a = document.createElement("a");
          a.href = data.url;
          a.download = `${data.title.replace(/[^a-zA-Z0-9]/g, "_")}.html`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          toast.success("Downloaded as HTML (PDF generation failed)");
        }
      } else {
        const a = document.createElement("a");
        a.href = data.url;
        a.download = `${data.title.replace(/[^a-zA-Z0-9]/g, "_")}.${data.format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("Download started!");
      }
    },
    onError: (error: Error, exp: ProductExport) => {
      if (error.message === "NO_FILE") {
        exportProduct.mutate({
          outlineId: exp.product_outline_id,
          format: exp.format,
          settings: (exp.export_settings as Record<string, unknown>) || {},
        });
      } else {
        toast.error("Download failed: " + error.message);
      }
    },
  });

  return { exports, isLoading, exportProduct, deleteExport, downloadExport };
}

/**
 * Client-side PDF generation: fetches page layouts from DB and uses jsPDF.
 */
async function generatePDFClientSide(
  outlineId: string,
  settings?: Record<string, unknown>
): Promise<any> {
  // Fetch outline with pdf_style_config
  const { data: outline, error: outlineErr } = await supabase
    .from("product_outlines")
    .select("*, outline_sections(*)")
    .eq("id", outlineId)
    .single();

  if (outlineErr || !outline) throw new Error("Outline not found");

  const pdfStyle: PDFStyleConfig = {
    ...DEFAULT_PDF_STYLE_CONFIG,
    ...(outline.pdf_style_config as Partial<PDFStyleConfig> || {}),
  };

  const sections = (outline as any).outline_sections || [];
  const sectionIds = sections.map((s: any) => s.id);

  // Fetch expanded content with page_layouts
  let allPages: EbookPageData[] = [];
  if (sectionIds.length > 0) {
    const { data: expandedContent } = await supabase
      .from("expanded_content")
      .select("*")
      .in("outline_section_id", sectionIds)
      .order("version", { ascending: false });

    const contentMap: Record<string, any> = {};
    for (const ec of (expandedContent || [])) {
      if (!contentMap[ec.outline_section_id]) {
        contentMap[ec.outline_section_id] = ec;
      }
    }

    // Collect page layouts from all sections
    for (const section of sections.sort((a: any, b: any) => a.sort_order - b.sort_order)) {
      const ec = contentMap[section.id];
      if (ec?.page_layouts && Array.isArray(ec.page_layouts) && ec.page_layouts.length > 0) {
        allPages.push(...(ec.page_layouts as EbookPageData[]));
      }
    }
  }

  let pdfBlob: Blob;
  if (allPages.length > 0) {
    pdfBlob = await generatePDFFromPages(allPages, pdfStyle, outline.title);
  } else {
    // Fallback: also call edge function for markdown then convert
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
        body: JSON.stringify({ outlineId, format: "markdown", settings }),
      }
    );
    if (!response.ok) throw new Error("Export failed");
    const data = await response.json();
    pdfBlob = await generatePDFFromMarkdown(data.content, pdfStyle, outline.title);
  }

  return {
    _pdfBlob: pdfBlob,
    title: outline.title,
    extension: "pdf",
  };
}
