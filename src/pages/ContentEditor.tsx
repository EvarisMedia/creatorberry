import { useEffect, useState } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useBrands } from "@/hooks/useBrands";
import { useProductOutlines, OutlineSection } from "@/hooks/useProductOutlines";
import { useContentExpansion, EXPANSION_MODES, ExpansionMode, ExpandedContent } from "@/hooks/useContentExpansion";
import {
  LayoutDashboard, Rss, Settings, Plus, LogOut, ChevronDown, Shield, Loader2,
  Lightbulb, FileText, BookOpen, ArrowLeft, Sparkles, PenTool, Check, Trash2, RefreshCw,
} from "lucide-react";
import creatorberryLogo from "@/assets/creatorberry-logo.png";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Lightbulb, label: "Product Ideas", href: "/product-ideas" },
  { icon: FileText, label: "Outlines", href: "/outlines" },
  { icon: PenTool, label: "Content", href: "/content-editor" },
  { icon: Rss, label: "Sources", href: "/sources" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

const ContentEditorPage = () => {
  const { sectionId } = useParams();
  const { user, profile, isAdmin, isLoading, signOut } = useAuth();
  const { brands, currentBrand, selectBrand } = useBrands();
  const { fetchOutlineWithSections } = useProductOutlines(currentBrand?.id || null);
  const { contents, isLoading: contentsLoading, isGenerating, expandSection, updateContent, deleteContent, getContentByMode } = useContentExpansion(sectionId || null);
  const navigate = useNavigate();
  const location = useLocation();

  const [section, setSection] = useState<OutlineSection | null>(null);
  const [outlineTitle, setOutlineTitle] = useState("");
  const [activeMode, setActiveMode] = useState<ExpansionMode>("expansion");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [loadingSection, setLoadingSection] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) navigate("/auth");
    if (!isLoading && user && !profile?.is_approved) navigate("/pending-approval");
  }, [user, profile, isLoading, navigate]);

  // Fetch section details from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const outlineId = params.get("outlineId");
    if (sectionId && outlineId) {
      fetchOutlineWithSections(outlineId).then((outline) => {
        if (outline) {
          setOutlineTitle(outline.title);
          const sec = outline.sections?.find((s) => s.id === sectionId);
          if (sec) setSection(sec);
        }
        setLoadingSection(false);
      });
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

  const currentModeContents = getContentByMode(activeMode);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col shadow-sm">
        <div className="p-5 border-b border-border">
          <Link to="/" className="flex items-center gap-3">
            <img src={creatorberryLogo} alt="CreatorBerry" className="w-24 h-24 rounded-xl object-contain" />
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
        <nav className="flex-1 p-4">
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

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <header className="p-6 bg-card border-b border-border">
          <div className="flex items-center gap-3">
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

              {/* Generated Content */}
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
                                <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
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
                          <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={20} className="font-mono text-sm" />
                        ) : (
                          <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap text-sm">
                            {item.content}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ContentEditorPage;
