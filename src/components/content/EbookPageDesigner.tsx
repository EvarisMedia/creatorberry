import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, RefreshCw, LayoutGrid, Maximize2, Minimize2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EbookPage } from "./EbookPage";
import { PageLayoutPicker } from "./PageLayoutPicker";
import { EbookPageData, LayoutType, PageSizeKey, PAGE_SIZES, LayoutWireframe } from "./ebookLayouts";
import { PDFStyleConfig } from "./PDFStyleSettings";
import { GenerateSectionImageDialog } from "./GenerateSectionImageDialog";

interface Props {
  content: string;
  sectionTitle: string;
  brandContext?: {
    name?: string;
    tone?: string;
    about?: string;
    target_audience?: string;
  };
  pageSize: PageSizeKey;
  pdfStyle: PDFStyleConfig;
  contentId: string;
  brand?: any;
  section?: any;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onPagesChange?: (pages: EbookPageData[]) => void;
  onInsertImageToPage?: (imageUrl: string) => void;
}

export function EbookPageDesigner({
  content, sectionTitle, brandContext, pageSize, pdfStyle, contentId,
  brand, section, isFullscreen, onToggleFullscreen, onPagesChange, onInsertImageToPage,
}: Props) {
  const [pages, setPages] = useState<EbookPageData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mainScale, setMainScale] = useState(0.6);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  // Calculate scale based on container width
  useEffect(() => {
    const updateScale = () => {
      if (mainRef.current) {
        const containerWidth = mainRef.current.clientWidth - 48;
        const pageWidth = PAGE_SIZES[pageSize].width;
        const scale = Math.min(containerWidth / pageWidth, 1);
        setMainScale(scale);
      }
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [pageSize, isFullscreen]);

  // Load saved layouts or generate
  useEffect(() => {
    if (hasLoaded) return;
    loadSavedLayouts();
  }, [contentId]);

  const loadSavedLayouts = async () => {
    const { data } = await supabase
      .from("expanded_content")
      .select("page_layouts")
      .eq("id", contentId)
      .single();

    if (data?.page_layouts && Array.isArray(data.page_layouts) && (data.page_layouts as any[]).length > 0) {
      const loadedPages = data.page_layouts as unknown as EbookPageData[];
      setPages(loadedPages);
      setHasLoaded(true);
      onPagesChange?.(loadedPages);
    } else {
      generateLayouts();
    }
  };

  const generateLayouts = async () => {
    if (!content.trim()) {
      toast({ title: "No content", description: "Generate content first before designing pages.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("auto-layout-ebook", {
        body: { content, pageSize, brandContext: brandContext || {}, sectionTitle },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const generatedPages: EbookPageData[] = (data.pages || []).map((p: any, i: number) => ({
        id: crypto.randomUUID(),
        layout: p.layout || "full-text",
        content: {
          heading: p.heading,
          subheading: p.subheading,
          body: p.body,
          image: p.image,
          items: p.items,
          quote: p.quote,
          attribution: p.attribution,
        },
        order: i,
      }));

      setPages(generatedPages);
      setSelectedPageIndex(0);
      setHasLoaded(true);
      await saveLayouts(generatedPages);
      onPagesChange?.(generatedPages);
      toast({ title: "Pages designed!", description: `${generatedPages.length} pages created by AI.` });
    } catch (err: any) {
      console.error("Auto-layout error:", err);
      toast({ title: "Layout generation failed", description: err.message || "Try again.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveLayouts = async (pagesToSave: EbookPageData[]) => {
    await supabase
      .from("expanded_content")
      .update({ page_layouts: pagesToSave as any })
      .eq("id", contentId);
  };

  // Debounced save
  const debouncedSave = useCallback((updatedPages: EbookPageData[]) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveLayouts(updatedPages);
    }, 500);
  }, [contentId]);

  const updatePageContent = (pageIndex: number, field: string, value: string) => {
    const updated = pages.map((p, i) =>
      i === pageIndex ? { ...p, content: { ...p.content, [field]: value } } : p
    );
    setPages(updated);
    onPagesChange?.(updated);
    debouncedSave(updated);
  };

  const updatePageItem = (pageIndex: number, itemIndex: number, value: string) => {
    const updated = pages.map((p, i) => {
      if (i !== pageIndex) return p;
      const items = [...(p.content.items || [])];
      items[itemIndex] = value;
      return { ...p, content: { ...p.content, items } };
    });
    setPages(updated);
    onPagesChange?.(updated);
    debouncedSave(updated);
  };

  const handleLayoutChange = (layout: LayoutType) => {
    const updated = pages.map((p, i) =>
      i === selectedPageIndex ? { ...p, layout } : p
    );
    setPages(updated);
    onPagesChange?.(updated);
    saveLayouts(updated);
  };

  const handleImageAction = (action: "generate" | "upload" | "remove") => {
    if (action === "generate") {
      setShowImageDialog(true);
    } else if (action === "upload") {
      fileInputRef.current?.click();
    } else if (action === "remove") {
      updatePageContent(selectedPageIndex, "image", "");
    }
  };

  const handleImageGenerated = (imageUrl: string) => {
    updatePageContent(selectedPageIndex, "image", imageUrl);
    setShowImageDialog(false);
  };

  // Expose image insertion for parent component
  const insertImageToCurrentPage = useCallback((imageUrl: string) => {
    if (pages.length > 0) {
      updatePageContent(selectedPageIndex, "image", imageUrl);
    }
  }, [pages, selectedPageIndex]);

  // Wire up onInsertImageToPage callback
  useEffect(() => {
    if (onInsertImageToPage) {
      // This is handled via the parent passing the callback
    }
  }, [onInsertImageToPage]);

  const handleFileUpload = async (file: File) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    const ext = file.name.split(".").pop() || "png";
    const path = `${user.id}/pages/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("generated-images").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      return;
    }
    const { data: urlData } = supabase.storage.from("generated-images").getPublicUrl(path);
    if (urlData?.publicUrl) {
      updatePageContent(selectedPageIndex, "image", urlData.publicUrl);
      toast({ title: "Image uploaded" });
    }
  };

  const thumbnailScale = 0.15;
  const selectedPage = pages[selectedPageIndex] || null;

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <div className="text-center">
          <h3 className="font-semibold text-lg">Designing your pages...</h3>
          <p className="text-sm text-muted-foreground mt-1">AI is analyzing your content and choosing the best layouts</p>
        </div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <LayoutGrid className="w-12 h-12 text-muted-foreground/30" />
        <h3 className="font-semibold">No pages yet</h3>
        <p className="text-sm text-muted-foreground">Generate content first, then design your pages.</p>
        <Button onClick={generateLayouts} disabled={!content.trim()}>
          <RefreshCw className="w-4 h-4 mr-2" /> Generate Page Layouts
        </Button>
      </div>
    );
  }

  const thumbnailWidth = isFullscreen ? "w-36" : "w-32";

  return (
    <div className={`flex flex-col ${isFullscreen ? "absolute inset-0 z-40 bg-background" : ""}`}>
      {/* Designer toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{pages.length} pages</span>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={generateLayouts} title="Regenerate all layouts">
            <RefreshCw className="w-3 h-3" />
          </Button>
          {selectedPage && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowLayoutPicker(true)}>
              <LayoutGrid className="w-3 h-3 mr-1" /> Change Layout
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            Page {selectedPageIndex + 1} of {pages.length} — Click text to edit
          </span>
        </div>
        {onToggleFullscreen && (
          <Button size="sm" variant="ghost" className="h-7" onClick={onToggleFullscreen}>
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 mr-1" /> : <Maximize2 className="w-3.5 h-3.5 mr-1" />}
            <span className="text-xs">{isFullscreen ? "Exit" : "Fullscreen"}</span>
          </Button>
        )}
      </div>

      {/* Main content */}
      <div className={`flex gap-4 ${isFullscreen ? "flex-1 overflow-hidden p-4" : "h-[calc(100vh-340px)]"}`}>
        {/* Thumbnail sidebar */}
        <div className={`${thumbnailWidth} shrink-0 flex flex-col gap-2`}>
          <ScrollArea className="flex-1">
            <div className="space-y-2 pr-2">
              {pages.map((page, i) => (
                <button
                  key={page.id}
                  onClick={() => setSelectedPageIndex(i)}
                  className={`w-full transition-all rounded-md overflow-hidden ${
                    i === selectedPageIndex ? "ring-2 ring-primary" : "ring-1 ring-border hover:ring-primary/50"
                  }`}
                >
                  <div className="relative">
                    <EbookPage page={page} pageSize={pageSize} pdfStyle={pdfStyle} scale={thumbnailScale} />
                    <div className="absolute bottom-0 left-0 right-0 bg-background/80 text-[9px] text-center py-0.5 font-medium">
                      {i + 1}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main page view */}
        <div ref={mainRef} className="flex-1 flex flex-col items-center overflow-auto">
          {selectedPage && (
            <EbookPage
              page={selectedPage}
              pageSize={pageSize}
              pdfStyle={pdfStyle}
              scale={mainScale}
              isSelected
              editable
              onFieldChange={(field, value) => updatePageContent(selectedPageIndex, field, value)}
              onItemChange={(idx, value) => updatePageItem(selectedPageIndex, idx, value)}
              onImageAction={handleImageAction}
            />
          )}
        </div>
      </div>

      {/* Layout picker dialog */}
      {selectedPage && (
        <PageLayoutPicker
          open={showLayoutPicker}
          onClose={() => setShowLayoutPicker(false)}
          currentLayout={selectedPage.layout}
          onSelect={handleLayoutChange}
        />
      )}

      {/* Image generate dialog */}
      {showImageDialog && section && brand && (
        <GenerateSectionImageDialog
          section={section}
          brand={brand}
          onImageGenerated={async () => {}}
          onInsertImage={(url) => handleImageGenerated(url)}
        />
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
