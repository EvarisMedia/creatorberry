import { useEffect, useState, useRef, useCallback } from "react";
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
// EbookPage import removed - now only used inside EbookPageDesigner
import { PageSizeKey, EbookPageData } from "@/components/content/ebookLayouts";
import { AIEditToolbar } from "@/components/content/AIEditToolbar";
import {
  LayoutDashboard, Settings, Plus, LogOut, ChevronDown, Shield, Loader2,
  Lightbulb, FileText, BookOpen, ArrowLeft, Sparkles, PenTool, Check, Trash2, RefreshCw,
  Palette, Download, ShoppingCart, Rocket, Library, HelpCircle, ImageIcon, ImagePlus,
  CheckCircle2, Circle, Upload, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { downloadImageBlob } from "@/lib/downloadImage";
import creatorberryLogo from "@/assets/creatorberry-logo.png";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Lightbulb, label: "Product Ideas", href: "/product-ideas" },
  { icon: FileText, label: "Outlines", href: "/outlines" },
  { icon: Library, label: "Templates", href: "/templates" },
  { icon: Palette, label: "Image Studio", href: "/image-studio" },
  { icon: Download, label: "Export Center", href: "/export-center" },
  { icon: BookOpen, label: "KDP Publisher", href: "/kdp" },
  { icon: ShoppingCart, label: "Sales Pages", href: "/sales-pages" },
  { icon: Rocket, label: "Launch Toolkit", href: "/launch-toolkit" },
  { icon: HelpCircle, label: "Help & Resources", href: "/help" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

const ContentEditorPage = () => {
  const { sectionId } = useParams();
  const { user, profile, isAdmin, isLoading, signOut } = useAuth();
  const { brands, currentBrand, selectBrand } = useBrands();
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

  // AI Edit state
  const [selectedText, setSelectedText] = useState("");
  const [showAIEdit, setShowAIEdit] = useState(false);

  // Cursor position for image insertion
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const cursorPosRef = useRef<number | null>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const designerInsertImageRef = useRef<((url: string) => void) | null>(null);

  // Gallery popover
  const [showGallery, setShowGallery] = useState(false);

  const loadSectionImages = async () => {
    if (sectionId) {
      const imgs = await fetchImagesForSection(sectionId);
      setSectionImages(imgs);
    }
  };


  useEffect(() => {
    if (!isLoading && !user) navigate("/auth");
    if (!isLoading && user && !profile?.is_approved) navigate("/pending-approval");
  }, [user, profile, isLoading, navigate]);

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

          // Check content status for all sections
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

  const handleSignOut = async () => { await signOut(); navigate("/"); };
  const isActive = (href: string) => location.pathname.startsWith(href);

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

    // If editing, insert at cursor position (use ref which survives dialog focus steal)
    if (editingId && editTextareaRef.current) {
      const pos = cursorPosRef.current ?? editContent.length;
      const before = editContent.slice(0, pos);
      const after = editContent.slice(pos);
      const newContent = before + imageMarkdown + after;
      setEditContent(newContent);
      await updateContent(editingId, { content: newContent });
      return;
    }

    // Otherwise append to latest content
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

  // Format handling for toolbar
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
    // Focus back
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 0);
  };

  // Track cursor position - save in both state and ref so it survives dialog focus steal
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

  // Handle image upload
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

  // AI Edit: apply edited text back into content
  const handleApplyAIEdit = (newText: string) => {
    if (!editingId || !selectedText) return;
    const idx = editContent.indexOf(selectedText);
    if (idx === -1) return;
    const newContent = editContent.slice(0, idx) + newText + editContent.slice(idx + selectedText.length);
    setEditContent(newContent);
    setSelectedText("");
  };

  // Navigate to another section
  const handleSectionNav = (sec: OutlineSection) => {
    if (outlineId) {
      navigate(`/content-editor/${sec.id}?outlineId=${outlineId}`);
    }
  };

  const currentModeContents = getContentByMode(activeMode);

  // Load saved page layouts for preview
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

  // Escape key exits fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDesignerFullscreen) setIsDesignerFullscreen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDesignerFullscreen]);

  // Auto-collapse section sidebar in design tab
  useEffect(() => {
    if (editorTab === "design") {
      setSectionSidebarCollapsed(true);
    }
  }, [editorTab]);

  // Load PDF style config from database
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

  // Debounced save PDF style config to database
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

  // Handle image insertion routing based on active tab
  const handleImageInsertRouted = (imageUrl: string, altText?: string) => {
    if (editorTab === "design" && designerInsertImageRef.current) {
      // Insert into the designer's selected page image slot
      designerInsertImageRef.current(imageUrl);
    } else {
      handleInsertImage(imageUrl, altText);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col shadow-sm">
        <div className="p-3 border-b border-border">
          <Link to="/" className="flex items-center gap-3">
            <img src={creatorberryLogo} alt="CreatorBerry" className="w-40 h-auto object-contain" />
          </Link>
        </div>
        <div className="p-4 border-b border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-background hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm text-primary-foreground" style={{ backgroundColor: currentBrand?.primary_color || "hsl(var(--primary))" }}>
                    {currentBrand?.name?.charAt(0) || "?"}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm truncate max-w-[120px]">{currentBrand?.name || "No Brand"}</div>
                    <div className="text-xs text-muted-foreground">Brand</div>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {brands.map((brand) => (
                <DropdownMenuItem key={brand.id} onClick={() => selectBrand(brand.id)} className="cursor-pointer">{brand.name}</DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/channels/new" className="cursor-pointer"><Plus className="w-4 h-4 mr-2" /> Add New Brand</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <nav className="flex-1 p-4 overflow-hidden flex flex-col">
          <ul className="space-y-1">
            {sidebarItems.map((item, i) => (
              <li key={i}>
                <Link to={item.href} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive(item.href) ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
                  <item.icon className="w-4 h-4" /> {item.label}
                </Link>
              </li>
            ))}
          </ul>
          {isAdmin && (
            <div className="mt-6 pt-6 border-t border-border">
              <Link to="/admin/users" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
                <Shield className="w-4 h-4" /> Admin Panel
              </Link>
            </div>
          )}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center font-semibold text-sm text-primary">{profile?.full_name?.charAt(0) || "U"}</div>
              <div className="text-sm"><div className="font-medium">{profile?.full_name || "User"}</div></div>
            </div>
            <button onClick={handleSignOut} className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </aside>

      {/* Main content area with section sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Section Navigation Sidebar - collapsible */}
        {allSections.length > 0 && !sectionSidebarCollapsed && (
          <aside className="w-60 bg-card border-r border-border flex flex-col">
            <div className="p-3 border-b border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sections</h3>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{outlineTitle}</p>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-0.5">
                {allSections.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => handleSectionNav(sec)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 ${
                      sec.id === sectionId
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    {sectionContentStatus[sec.id] ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                    )}
                    <span className="truncate">Ch {sec.section_number}: {sec.title}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
            <div className="p-3 border-t border-border">
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs"
                onClick={async () => {
                  if (!currentBrand) return;
                  for (const sec of allSections) {
                    if (!sectionContentStatus[sec.id]) {
                      await expandSection("expansion", sec, currentBrand.id, {
                        name: currentBrand.name,
                        tone: currentBrand.tone,
                        writing_style: currentBrand.writing_style,
                        about: currentBrand.about,
                        target_audience: currentBrand.target_audience,
                      });
                    }
                  }
                  toast({ title: "Done", description: "All sections generated." });
                }}
                disabled={isGenerating}
              >
                {isGenerating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                Generate All
              </Button>
            </div>
          </aside>
        )}

        {/* Editor area */}
        <main className="flex-1 overflow-auto relative">
          <header className="p-6 bg-card border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Section sidebar toggle */}
                {allSections.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setSectionSidebarCollapsed(!sectionSidebarCollapsed)} title={sectionSidebarCollapsed ? "Show sections" : "Hide sections"}>
                    {sectionSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h1 className="text-2xl font-semibold">{section?.title || "Content Editor"}</h1>
                  <p className="text-muted-foreground text-sm">
                    {outlineTitle && `From: ${outlineTitle}`}
                    {section && ` · Target: ${section.word_count_target.toLocaleString()} words`}
                  </p>
                </div>
              </div>
            </div>
          </header>

          <div className="p-6">
            {loadingSection ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : !section ? (
              <div className="text-center py-16">
                <PenTool className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-xl font-semibold mb-2">No section selected</h3>
                <p className="text-muted-foreground mb-6">Go to an outline and click "Expand" on a section to start generating content.</p>
                <Button onClick={() => navigate("/outlines")}><FileText className="w-4 h-4 mr-2" /> Browse Outlines</Button>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Section Info */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <BookOpen className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">{section.description || "No description"}</p>
                        {section.subsections?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {section.subsections.map((sub, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{sub}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Expansion Mode Selector */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {EXPANSION_MODES.map((m) => {
                    const modeContents = getContentByMode(m.mode);
                    return (
                      <Card
                        key={m.mode}
                        className={`cursor-pointer transition-all hover:shadow-md ${activeMode === m.mode ? "ring-2 ring-primary" : ""}`}
                        onClick={() => setActiveMode(m.mode)}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl mb-2">{m.icon}</div>
                          <h4 className="font-medium text-sm">{m.label}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.description}</p>
                          {modeContents.length > 0 && (
                            <Badge variant="secondary" className="mt-2 text-xs">{modeContents.length} version{modeContents.length > 1 ? "s" : ""}</Badge>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Generate Button */}
                <div className="flex justify-center">
                  <Button onClick={() => handleExpand(activeMode)} disabled={isGenerating || !currentBrand} size="lg">
                    {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    {isGenerating ? "Generating..." : `Generate ${EXPANSION_MODES.find(m => m.mode === activeMode)?.label} Content`}
                  </Button>
                </div>

                {/* Generated Content with Tabs */}
                {contentsLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : currentModeContents.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      <p>No content generated for {EXPANSION_MODES.find(m => m.mode === activeMode)?.label} mode yet.</p>
                      <p className="text-sm mt-1">Click the generate button above to create content.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Tabs value={editorTab} onValueChange={setEditorTab}>
                    {/* Compact style toolbar above tabs */}
                    <div className="border border-border rounded-lg mb-3 bg-card">
                      <PDFStyleSettings config={pdfStyleConfig} onChange={setPdfStyleConfig} variant="compact" />
                    </div>

                    <TabsList>
                      <TabsTrigger value="edit">
                        <PenTool className="w-3 h-3 mr-1" /> Write
                      </TabsTrigger>
                      <TabsTrigger value="design">
                        <Palette className="w-3 h-3 mr-1" /> Design & Preview
                      </TabsTrigger>
                    </TabsList>
                    <p className="text-xs text-muted-foreground mt-1">
                      {editorTab === "edit" && "Write and edit your raw content"}
                      {editorTab === "design" && "Design your pages visually — this is your final preview"}
                    </p>

                    <TabsContent value="edit">
                      <div className="space-y-4">
                        {currentModeContents.map((item) => (
                          <Card key={item.id}>
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">v{item.version}</Badge>
                                  <span className="text-sm text-muted-foreground">{item.word_count.toLocaleString()} words</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button size="sm" variant="ghost" onClick={() => handleExpand(activeMode)} title="Regenerate">
                                    <RefreshCw className="w-3 h-3" />
                                  </Button>
                                  {editingId === item.id ? (
                                    <>
                                      <Button size="sm" onClick={handleSaveEdit}><Check className="w-3 h-3 mr-1" /> Save</Button>
                                      <Button size="sm" variant="outline" onClick={() => { setEditingId(null); setShowAIEdit(false); }}>Cancel</Button>
                                    </>
                                  ) : (
                                    <Button size="sm" variant="ghost" onClick={() => { setEditingId(item.id); setEditContent(item.content); }}>
                                      <PenTool className="w-3 h-3" />
                                    </Button>
                                  )}
                                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteContent(item.id)}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              {editingId === item.id ? (
                                <div className="space-y-3">
                                  {/* Formatting Toolbar */}
                                  <ContentToolbar
                                    onFormat={handleFormat}
                    onInsertImage={() => {
                      // Save cursor position before dialog steals focus
                      if (editTextareaRef.current) {
                        cursorPosRef.current = editTextareaRef.current.selectionStart;
                      }
                      const trigger = document.getElementById("generate-image-trigger");
                      trigger?.click();
                    }}
                                    onUploadImage={() => fileInputRef.current?.click()}
                                    onGalleryImage={() => setShowGallery(true)}
                                    onAIEdit={() => {
                                      if (selectedText) setShowAIEdit(true);
                                      else toast({ title: "Select Text", description: "Select some text first, then click AI Edit." });
                                    }}
                                    hasSelection={selectedText.length > 0}
                                  />

                                  {/* AI Edit Panel */}
                                  {showAIEdit && selectedText && (
                                    <AIEditToolbar
                                      selectedText={selectedText}
                                      fullContent={editContent}
                                      brandContext={currentBrand ? {
                                        name: currentBrand.name,
                                        tone: currentBrand.tone || undefined,
                                        writing_style: currentBrand.writing_style || undefined,
                                        about: currentBrand.about || undefined,
                                        target_audience: currentBrand.target_audience || undefined,
                                      } : undefined}
                                      onApplyEdit={handleApplyAIEdit}
                                      onClose={() => setShowAIEdit(false)}
                                    />
                                  )}

                                  {/* Editor textarea */}
                                  <textarea
                                    ref={editTextareaRef}
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    onSelect={handleTextareaSelect}
                                    onClick={handleTextareaSelect}
                                    rows={20}
                                    className="w-full rounded-lg border border-border bg-background p-4 font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                                  />

                                  {/* Gallery popover */}
                                  {showGallery && sectionImages.length > 0 && (
                                    <Card>
                                      <CardContent className="p-3">
                                        <div className="flex items-center justify-between mb-2">
                                          <h4 className="text-xs font-semibold">Section Images</h4>
                                          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setShowGallery(false)}>Close</Button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                          {sectionImages.map((img) => (
                                            <button
                                              key={img.id}
                              onClick={() => {
                                handleImageInsertRouted(img.image_url, img.quote_text || section?.title);
                                setShowGallery(false);
                              }}
                                              className="relative aspect-video rounded border border-border overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                                            >
                                              <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                                            </button>
                                          ))}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  )}

                                  {/* Live preview */}
                                  <div className="border border-border rounded-lg p-4 bg-background">
                                    <p className="text-xs text-muted-foreground mb-2 font-medium">Live Preview</p>
                                    <RichContentRenderer content={editContent} />
                                  </div>
                                </div>
                              ) : (
                                <RichContentRenderer content={item.content} />
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="design">
                      {currentModeContents[0] ? (
                        <EbookPageDesigner
                          content={currentModeContents[0].content}
                          sectionTitle={section?.title || ""}
                          brandContext={currentBrand ? {
                            name: currentBrand.name,
                            tone: currentBrand.tone || undefined,
                            about: currentBrand.about || undefined,
                            target_audience: currentBrand.target_audience || undefined,
                          } : undefined}
                          pageSize={(pdfStyleConfig.pageSize || "6x9") as PageSizeKey}
                          pdfStyle={pdfStyleConfig}
                          contentId={currentModeContents[0].id}
                          brand={currentBrand}
                          section={section}
                          isFullscreen={isDesignerFullscreen}
                          onToggleFullscreen={() => setIsDesignerFullscreen(!isDesignerFullscreen)}
                          onPagesChange={(p) => setDesignedPages(p)}
                          onRegisterInsertImage={(fn) => { designerInsertImageRef.current = fn; }}
                        />
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <p>Generate content first before designing pages.</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                )}

                {/* Hidden Generate Image Dialog trigger */}
                {section && currentBrand && (
                  <div className="hidden">
                     <GenerateSectionImageDialog
                       section={section}
                       brand={currentBrand}
                       onImageGenerated={loadSectionImages}
                       onInsertImage={handleImageInsertRouted}
                       triggerId="generate-image-trigger"
                     />
                  </div>
                )}

                {/* Visible generate image button - only on Write tab */}
                {section && currentBrand && !editingId && editorTab === "edit" && (
                  <GenerateSectionImageDialog
                    section={section}
                    brand={currentBrand}
                    onImageGenerated={loadSectionImages}
                    onInsertImage={handleImageInsertRouted}
                  />
                )}

                {/* Hidden file input for image upload */}
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

                {/* Section Images Gallery */}
                {sectionImages.length > 0 && !editingId && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-primary" /> Section Images
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {sectionImages.map((img) => (
                        <Card key={img.id} className="overflow-hidden">
                          <div className="aspect-video relative">
                            <img src={img.image_url} alt={img.prompt} className="w-full h-full object-cover" />
                          </div>
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs">{img.image_type}</Badge>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" title="Insert into content" onClick={() => handleImageInsertRouted(img.image_url, img.quote_text || section?.title)}>
                                  <ImagePlus className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="ghost" title="Download" onClick={() => downloadImageBlob(img.image_url, `${(img.quote_text || "image").replace(/\s+/g, "-")}.png`)}>
                                  <Download className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="text-destructive" onClick={async () => {
                                  const success = await deleteImage(img.id);
                                  if (success) setSectionImages((prev) => prev.filter((i) => i.id !== img.id));
                                }}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ContentEditorPage;
