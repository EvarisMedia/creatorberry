import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { generatePDFFromPages, generatePDFFromMarkdown } from "@/lib/generatePDF";
import { EbookPageData } from "@/components/content/ebookLayouts";
import { PDFStyleConfig, DEFAULT_PDF_STYLE_CONFIG } from "@/components/content/PDFStyleSettings";
import { renderPagesToDataURLs } from "@/lib/fabricOffscreenRenderer";

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
        try {
          const response = await fetch(data.url);
          const html = await response.text();
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

  /**
   * Generate a PDF blob for preview (no download).
   */
  const previewPDF = async (outlineId: string): Promise<Blob> => {
    const result = await generatePDFClientSide(outlineId);
    return result._pdfBlob;
  };

  return { exports, isLoading, exportProduct, deleteExport, downloadExport, previewPDF };
}

/**
 * Generate fallback pages for sections that have expanded content but no page_layouts.
 * Fixed: skip opener snippet from full-text chunking to avoid duplicate content.
 */
function generateFallbackPages(sectionTitle: string, content: string, startOrder: number): EbookPageData[] {
  const pages: EbookPageData[] = [];
  
  // Chapter opener page with a short snippet
  const OPENER_CHARS = 200;
  const openerSnippet = content.substring(0, OPENER_CHARS).trim();
  pages.push({
    id: crypto.randomUUID(),
    layout: "chapter-opener",
    content: {
      heading: sectionTitle,
      body: openerSnippet + (content.length > OPENER_CHARS ? "..." : ""),
    },
    order: startOrder + pages.length,
  });

  // Split remaining content (skip the opener snippet) into ~200-word chunks
  const remainingContent = content.length > OPENER_CHARS ? content.substring(OPENER_CHARS).trim() : "";
  if (remainingContent) {
    const words = remainingContent.split(/\s+/);
    const WORDS_PER_PAGE = 200;
    for (let i = 0; i < words.length; i += WORDS_PER_PAGE) {
      const chunk = words.slice(i, i + WORDS_PER_PAGE).join(" ");
      if (chunk.trim()) {
        pages.push({
          id: crypto.randomUUID(),
          layout: "full-text",
          content: {
            heading: i === 0 ? sectionTitle : undefined,
            body: chunk,
          },
          order: startOrder + pages.length,
        });
      }
    }
  }

  return pages;
}

/**
 * Client-side PDF generation: fetches page layouts from DB and uses jsPDF.
 */
async function generatePDFClientSide(
  outlineId: string,
  settings?: Record<string, unknown>
): Promise<any> {
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
  const sortedSections = sections.sort((a: any, b: any) => a.sort_order - b.sort_order);
  const sectionTitles = sortedSections.map((s: any) => s.title);

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

    for (const section of sortedSections) {
      const ec = contentMap[section.id];
      if (ec?.page_layouts && Array.isArray(ec.page_layouts) && ec.page_layouts.length > 0) {
        allPages.push(...(ec.page_layouts as EbookPageData[]));
      } else if (ec?.content) {
        const fallbackPages = generateFallbackPages(section.title, ec.content, allPages.length);
        allPages.push(...fallbackPages);
      }
    }
  }

  let pdfBlob: Blob;
  if (allPages.length > 0) {
    const canvasDataURLs = await renderPagesToDataURLs(allPages, pdfStyle);
    pdfBlob = await generatePDFFromPages(allPages, pdfStyle, outline.title, canvasDataURLs, {
      includeCoverPage: true,
      includeToc: true,
      sectionTitles,
    });
  } else {
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
