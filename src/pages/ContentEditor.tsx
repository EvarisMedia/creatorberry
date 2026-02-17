import { useEffect, useState } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useBrands } from "@/hooks/useBrands";
import { useProductOutlines, OutlineSection } from "@/hooks/useProductOutlines";
import { useContentExpansion, EXPANSION_MODES, ExpansionMode, ExpandedContent } from "@/hooks/useContentExpansion";
import { useGeneratedImages, GeneratedImage } from "@/hooks/useGeneratedImages";
import { GenerateSectionImageDialog } from "@/components/content/GenerateSectionImageDialog";
import { RichContentRenderer } from "@/components/content/RichContentRenderer";
import { PDFStyleSettings, DEFAULT_PDF_STYLE_CONFIG, PDFStyleConfig } from "@/components/content/PDFStyleSettings";
import { ContentToolbar } from "@/components/content/ContentToolbar";
import { EbookPageDesigner } from "@/components/content/EbookPageDesigner";
import { PageSizeKey, EbookPageData } from "@/components/content/ebookLayouts";
import { AIEditToolbar } from "@/components/content/AIEditToolbar";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Loader2,
  BookOpen,
  ArrowLeft,
  Sparkles,
  PenTool,
  Check,
  Trash2,
  RefreshCw,
  ImageIcon,
  ImagePlus,
  CheckCircle2,
  Circle,
  Upload,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { downloadImageBlob } from "@/lib/downloadImage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRef, useCallback } from "react";

const ContentEditorPage = () => {
  const { sectionId } = useParams();
  const { user, profile } = useAuth();
  const { currentBrand } = useBrands();
  const { fetchOutlineWithSections } = useProductOutlines(currentBrand?.id || null);
  const { contents, isLoading: contentsLoading, isGenerating, expandSection, updateContent, deleteContent, getContentByMode } = useContentExpansion(sectionId || null);
  const { fetchImagesForSection, deleteImage } = useGeneratedImages(currentBrand?.id || undefined);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [section, setSection] = useState<OutlineSection | null>(null);
  const [outlineTitle, setOutlineTitle] = useState("");
  const [outlineId, setOutlineId] = useState<string | null>(null);
  const [allSections, setAllSections] = useState<OutlineSection[]>([]);
  const [sectionContentStatus, setSectionContentStatus] = useState<Record<string, boolean>>({});
  const [activeMode, setActiveMode] = useState<ExpansionMode>("expansion");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [loadingSection, setLoadingSection] = useState(true);
  const [sectionImages, setSectionImages] = useState<GeneratedImage[]>([]);
  const [pdfStyleConfig, setPdfStyleConfig] = useState<PDFStyleConfig>(DEFAULT_PDF_STYLE_CONFIG);
  const [editorTab, setEditorTab] = useState("edit");
  const [designedPages, setDesignedPages] = useState<EbookPageData[]>([]);
  const [isDesignerFullscreen, setIsDesignerFullscreen] = useState(false);
  const [sectionSidebarCollapsed, setSectionSidebarCollapsed] = useState(false);
  const [pdfStyleConfigLoaded, setPdfStyleConfigLoaded] = useState(false);
  const pdfStyleSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedText, setSelectedText] = useState("");
  const [showAIEdit, setShowAIEdit] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const cursorPosRef = useRef<number | null>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const designerInsertImageRef = useRef<((url: string) => void) | null>(null);
  const [showGallery, setShowGallery] = useState(false);

  const loadSectionImages = async () => {
    if (sectionId) {
      const imgs = await fetchImagesForSection(sectionId);
      setSectionImages(imgs);
    }
  };

  // Fetch section details and all sections for nav
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oid = params.get("outlineId");
    if (sectionId && oid) {
      setOutlineId(oid);
      fetchOutlineWithSections(oid).then(async (outline) => {
        if (outline) {
          setOutlineTitle(outline.title);
          setAllSections(outline.sections || []);
          const sec = outline.sections?.find((s) => s.id === sectionId);
          if (sec) setSection(sec);

          if (outline.sections) {
            const statusMap: Record<string, boolean> = {};
            const { data } = await supabase
              .from("expanded_content")
              .select("outline_section_id")
              .in("outline_section_id", outline.sections.map(s => s.id));
            const sectionIdsWithContent = new Set((data || []).map(d => d.outline_section_id));
            outline.sections.forEach(s => {
              statusMap[s.id] = sectionIdsWithContent.has(s.id);
            });
            setSectionContentStatus(statusMap);
          }
        }
        setLoadingSection(false);
      });
      loadSectionImages();
    } else {
      setLoadingSection(false);
    }
  }, [sectionId, location.search]);

  const handleExpand = async (mode: ExpansionMode) => {
    if (!section || !currentBrand) return;
    await expandSection(mode, section, currentBrand.id, {
      name: currentBrand.name,
      tone: currentBrand.tone,
      writing_style: currentBrand.writing_style,
      about: currentBrand.about,
      target_audience: currentBrand.target_audience,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const success = await updateContent(editingId, { content: editContent });
    if (success) setEditingId(null);
  };

  const handleInsertImage = async (imageUrl: string, altText?: string) => {
    const imageMarkdown = `\n\n![${altText || "Section Image"}](${imageUrl})\n`;

    if (editingId && editTextareaRef.current) {
      const pos = cursorPosRef.current ?? editContent.length;
      const before = editContent.slice(0, pos);
      const after = editContent.slice(pos);
      const newContent = before + imageMarkdown + after;
      setEditContent(newContent);
      await updateContent(editingId, { content: newContent });
      return;
    }

    const modeContents = getContentByMode(activeMode);
    if (modeContents.length === 0) {
      const allModes: ExpansionMode[] = ["expansion", "story", "deep_dive", "workbook"];
      for (const mode of allModes) {
        const mc = getContentByMode(mode);
        if (mc.length > 0) {
          const latest = mc[0];
          await updateContent(latest.id, { content: latest.content + imageMarkdown });
          return;
        }
      }
      return;
    }
    const latest = modeContents[0];
    const newContent = latest.content + imageMarkdown;
    await updateContent(latest.id, { content: newContent });
    if (editingId === latest.id) {
      setEditContent(newContent);
    }
  };

  const handleFormat = (format: string) => {
    if (!editingId || !editTextareaRef.current) return;
    const ta = editTextareaRef.current;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = editContent.slice(start, end);
    let replacement = "";

    switch (format) {
      case "bold": replacement = `**${selected || "bold text"}**`; break;
      case "italic": replacement = `*${selected || "italic text"}*`; break;
      case "h1": replacement = `\n# ${selected || "Heading 1"}\n`; break;
      case "h2": replacement = `\n## ${selected || "Heading 2"}\n`; break;
      case "h3": replacement = `\n### ${selected || "Heading 3"}\n`; break;
      case "ul": replacement = `\n- ${selected || "List item"}\n`; break;
      case "ol": replacement = `\n1. ${selected || "List item"}\n`; break;
      case "quote": replacement = `\n> ${selected || "Quote"}\n`; break;
      case "hr": replacement = "\n---\n"; break;
      default: return;
    }

    const newContent = editContent.slice(0, start) + replacement + editContent.slice(end);
    setEditContent(newContent);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 0);
  };

  const handleTextareaSelect = () => {
    if (editTextareaRef.current) {
      const pos = editTextareaRef.current.selectionStart;
      setCursorPosition(pos);
      cursorPosRef.current = pos;
      const ta = editTextareaRef.current;
      const sel = editContent.slice(ta.selectionStart, ta.selectionEnd);
      setSelectedText(sel);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!user || !currentBrand || !section) return;
    const ext = file.name.split(".").pop() || "png";
    const path = `${user.id}/${section.id}/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from("generated-images").upload(path, file);
    if (error) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
      return;
    }
    const { data: urlData } = supabase.storage.from("generated-images").getPublicUrl(path);
    if (urlData?.publicUrl) {
      handleInsertImage(urlData.publicUrl, file.name);
      toast({ title: "Image Uploaded", description: "Inserted into content." });
    }
  };

  const handleApplyAIEdit = (newText: string) => {
    if (!editingId || !selectedText) return;
    const idx = editContent.indexOf(selectedText);
    if (idx === -1) return;
    const newContent = editContent.slice(0, idx) + newText + editContent.slice(idx + selectedText.length);
    setEditContent(newContent);
    setSelectedText("");
  };

  const handleSectionNav = (sec: OutlineSection) => {
    if (outlineId) {
      navigate(`/content-editor/${sec.id}?outlineId=${outlineId}`);
    }
  };

  const currentModeContents = getContentByMode(activeMode);

  useEffect(() => {
    const loadPageLayouts = async () => {
      if (!currentModeContents[0]?.id) return;
      const { data } = await supabase
        .from("expanded_content")
        .select("page_layouts")
        .eq("id", currentModeContents[0].id)
        .single();
      if (data?.page_layouts && Array.isArray(data.page_layouts) && (data.page_layouts as any[]).length > 0) {
        setDesignedPages(data.page_layouts as unknown as EbookPageData[]);
      }
    };
    loadPageLayouts();
  }, [currentModeContents[0]?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDesignerFullscreen) setIsDesignerFullscreen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDesignerFullscreen]);

  useEffect(() => {
    if (editorTab === "design") {
      setSectionSidebarCollapsed(true);
    }
  }, [editorTab]);

  useEffect(() => {
    if (!outlineId) return;
    supabase
      .from("product_outlines")
      .select("pdf_style_config")
      .eq("id", outlineId)
      .single()
      .then(({ data }) => {
        if (data?.pdf_style_config && typeof data.pdf_style_config === "object" && Object.keys(data.pdf_style_config as object).length > 0) {
          setPdfStyleConfig({ ...DEFAULT_PDF_STYLE_CONFIG, ...(data.pdf_style_config as Partial<PDFStyleConfig>) });
        }
        setPdfStyleConfigLoaded(true);
      });
  }, [outlineId]);

  useEffect(() => {
    if (!outlineId || !pdfStyleConfigLoaded) return;
    if (pdfStyleSaveTimeoutRef.current) clearTimeout(pdfStyleSaveTimeoutRef.current);
    pdfStyleSaveTimeoutRef.current = setTimeout(() => {
      supabase
        .from("product_outlines")
        .update({ pdf_style_config: pdfStyleConfig as any })
        .eq("id", outlineId)
        .then(() => {});
    }, 500);
    return () => {
      if (pdfStyleSaveTimeoutRef.current) clearTimeout(pdfStyleSaveTimeoutRef.current);
    };
  }, [pdfStyleConfig, outlineId, pdfStyleConfigLoaded]);

  const handleImageInsertRouted = (imageUrl: string, altText?: string) => {
    if (editorTab === "design" && designerInsertImageRef.current) {
      designerInsertImageRef.current(imageUrl);
    } else {
      handleInsertImage(imageUrl, altText);
    }
  };

  return (
    <AppLayout
      title={section?.title || "Content Editor"}
      subtitle={outlineTitle ? `${outlineTitle}` : "Write and design your content"}
      hideHeader
    >
      {/* Custom header with back button */}
      <header className="p-4 bg-card border-b border-border flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {outlineId && (
            <Button variant="ghost" size="sm" onClick={() => navigate(`/outlines/${outlineId}`)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div className="min-w-0">
            <h1 className="text-lg font-semibold truncate">{section?.title || "Content Editor"}</h1>
            {outlineTitle && <p className="text-xs text-muted-foreground truncate">{outlineTitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {section && currentBrand && (
            <>
              <GenerateSectionImageDialog
                section={section}
                brand={currentBrand}
                onImageGenerated={() => loadSectionImages()}
                onInsertImage={(url) => handleImageInsertRouted(url)}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                  e.target.value = "";
                }}
              />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-1" /> Upload
              </Button>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 65px)" }}>
        {/* Section sidebar */}
        {outlineId && allSections.length > 0 && (
          <div className={`border-r border-border bg-card flex flex-col transition-all ${sectionSidebarCollapsed ? "w-10" : "w-56"}`}>
            <div className="p-2 border-b border-border flex items-center justify-between">
              {!sectionSidebarCollapsed && <span className="text-xs font-medium text-muted-foreground px-1">Sections</span>}
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSectionSidebarCollapsed(!sectionSidebarCollapsed)}>
                {sectionSidebarCollapsed ? <PanelLeftOpen className="w-3 h-3" /> : <PanelLeftClose className="w-3 h-3" />}
              </Button>
            </div>
            {!sectionSidebarCollapsed && (
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-0.5">
                  {allSections.map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => handleSectionNav(sec)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-all flex items-center gap-2 ${
                        sec.id === sectionId
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      {sectionContentStatus[sec.id] ? (
                        <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
                      ) : (
                        <Circle className="w-3 h-3 flex-shrink-0" />
                      )}
                      <span className="truncate">{sec.title}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        {/* Main editor area */}
        <div className="flex-1 overflow-auto p-6">
          {loadingSection ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !section ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a section or navigate here from an outline.</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Section info */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">Section {section.section_number}</Badge>
                    <span className="text-sm text-muted-foreground">{section.word_count_target?.toLocaleString() || "—"} words target</span>
                  </div>
                  {section.description && (
                    <p className="mt-2 text-sm text-muted-foreground">{section.description}</p>
                  )}
                </CardContent>
              </Card>

              {/* Gallery popover */}
              {sectionImages.length > 0 && (
                <Popover open={showGallery} onOpenChange={setShowGallery}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <ImageIcon className="w-4 h-4 mr-1" /> Gallery ({sectionImages.length})
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-2" align="start">
                    <div className="grid grid-cols-3 gap-2">
                      {sectionImages.map((img) => (
                        <button
                          key={img.id}
                          className="relative aspect-square rounded-md overflow-hidden border border-border hover:ring-2 ring-primary transition-all"
                          onClick={() => {
                            handleImageInsertRouted(img.image_url, img.prompt);
                            setShowGallery(false);
                          }}
                        >
                          <img src={img.image_url} alt={img.prompt} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Content modes */}
              <Tabs value={editorTab} onValueChange={setEditorTab}>
                <TabsList>
                  <TabsTrigger value="edit">Write</TabsTrigger>
                  <TabsTrigger value="design">Design & Preview</TabsTrigger>
                  <TabsTrigger value="style">Page Style</TabsTrigger>
                </TabsList>

                <TabsContent value="edit" className="space-y-4 mt-4">
                  {/* Expansion mode buttons */}
                  <div className="flex flex-wrap gap-2">
                  {EXPANSION_MODES.map((m) => (
                      <Button
                        key={m.mode}
                        variant={activeMode === m.mode ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveMode(m.mode)}
                      >
                        {m.label}
                        {getContentByMode(m.mode).length > 0 && (
                          <Badge variant="secondary" className="ml-1.5 text-xs">{getContentByMode(m.mode).length}</Badge>
                        )}
                      </Button>
                    ))}
                  </div>

                  {/* Generate button */}
                  {currentModeContents.length === 0 && (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
                        <h3 className="text-lg font-semibold mb-2">Generate {EXPANSION_MODES.find(m => m.mode === activeMode)?.label} Content</h3>
                        <p className="text-muted-foreground mb-4 text-sm">
                          AI will write content for this section using your brand voice.
                        </p>
                        <Button onClick={() => handleExpand(activeMode)} disabled={isGenerating}>
                          {isGenerating ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                          ) : (
                            <><Sparkles className="w-4 h-4 mr-2" /> Generate</>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Content items */}
                  {currentModeContents.map((content) => (
                    <Card key={content.id}>
                      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">v{content.version}</Badge>
                          <span className="text-xs text-muted-foreground">{content.word_count?.toLocaleString() || 0} words</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {editingId === content.id ? (
                            <>
                              <Button size="sm" variant="ghost" onClick={handleSaveEdit}><Check className="w-4 h-4" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => { setEditingId(content.id); setEditContent(content.content); }}>
                                <PenTool className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleExpand(activeMode)}>
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => deleteContent(content.id)} className="text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-4">
                        {editingId === content.id ? (
                          <div className="space-y-2">
                            <ContentToolbar
                              onFormat={handleFormat}
                              onInsertImage={() => document.getElementById("generate-section-image-trigger")?.click()}
                              onUploadImage={() => fileInputRef.current?.click()}
                              onGalleryImage={() => setShowGallery(true)}
                              onAIEdit={() => setShowAIEdit(!showAIEdit)}
                              hasSelection={selectedText.length > 0}
                            />
                            {showAIEdit && selectedText && (
                              <AIEditToolbar
                                selectedText={selectedText}
                                fullContent={editContent}
                                brandContext={{
                                  name: currentBrand?.name,
                                  tone: currentBrand?.tone,
                                  writing_style: currentBrand?.writing_style,
                                  about: currentBrand?.about,
                                  target_audience: currentBrand?.target_audience,
                                }}
                                onApplyEdit={handleApplyAIEdit}
                                onClose={() => setShowAIEdit(false)}
                              />
                            )}
                            <textarea
                              ref={editTextareaRef}
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              onSelect={handleTextareaSelect}
                              onClick={handleTextareaSelect}
                              onKeyUp={handleTextareaSelect}
                              className="w-full min-h-[400px] p-4 rounded-lg border border-border bg-background font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          </div>
                        ) : (
                          <div className="prose prose-sm max-w-none">
                            <RichContentRenderer content={content.content} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="design" className="mt-4">
                  {currentModeContents.length > 0 ? (
                    <EbookPageDesigner
                      content={currentModeContents[0].content}
                      contentId={currentModeContents[0].id}
                      pdfStyle={pdfStyleConfig}
                      sectionTitle={section.title}
                      pageSize={pdfStyleConfig.pageSize as PageSizeKey}
                      brand={currentBrand}
                      section={section}
                      isFullscreen={isDesignerFullscreen}
                      onToggleFullscreen={() => setIsDesignerFullscreen(!isDesignerFullscreen)}
                      onPagesChange={setDesignedPages}
                      onRegisterInsertImage={(fn) => { designerInsertImageRef.current = fn; }}
                    />
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <PenTool className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
                        <h3 className="text-lg font-semibold mb-2">No Content to Design</h3>
                        <p className="text-muted-foreground text-sm">Generate content in the Write tab first, then come back to design your pages.</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="style" className="mt-4">
                  <PDFStyleSettings config={pdfStyleConfig} onChange={setPdfStyleConfig} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default ContentEditorPage;
