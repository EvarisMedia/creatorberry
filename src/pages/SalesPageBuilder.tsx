import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useBrands } from "@/hooks/useBrands";
import { useProductOutlines } from "@/hooks/useProductOutlines";
import { useSalesPages, SalesPage, SalesPageSection } from "@/hooks/useSalesPages";
import {
  LayoutDashboard, Settings, Sparkles, Lightbulb, FileText, Palette,
  Download, BookOpen, ShoppingCart, Rocket, Library, HelpCircle, Plus, Loader2, Trash2, Eye, Edit, Copy,
  ChevronDown, LogOut, Shield,
} from "lucide-react";
import creatorberryLogo from "@/assets/creatorberry-logo.png";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

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

const frameworks = [
  {
    id: "pas",
    name: "PAS",
    label: "Problem → Agitate → Solution",
    description: "Best for products solving a clear pain point. Hooks the reader by identifying their struggle.",
  },
  {
    id: "aida",
    name: "AIDA",
    label: "Attention → Interest → Desire → Action",
    description: "Classic funnel approach. Great for products with strong visual or emotional appeal.",
  },
  {
    id: "custom",
    name: "Custom",
    label: "Hybrid & Storytelling",
    description: "Blends multiple frameworks. Best for unique or complex products.",
  },
];

const SalesPageBuilder = () => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { brands, currentBrand, selectBrand } = useBrands();
  const { outlines } = useProductOutlines(currentBrand?.id || null);
  const { salesPages, isLoading, generateSalesPage, updateSalesPage, deleteSalesPage } = useSalesPages(currentBrand?.id || null);
  const navigate = useNavigate();
  const location = useLocation();

  const [isGenerating, setIsGenerating] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState("pas");
  const [productTitle, setProductTitle] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [selectedOutlineId, setSelectedOutlineId] = useState<string>("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [previewPage, setPreviewPage] = useState<SalesPage | null>(null);
  const [editingPage, setEditingPage] = useState<SalesPage | null>(null);

  const isActive = (href: string) => location.pathname === href;

  const handleGenerate = async () => {
    if (!productTitle.trim()) return;
    setIsGenerating(true);
    try {
      const result = await generateSalesPage({
        framework: selectedFramework,
        productTitle,
        productDescription,
        targetAudience,
        productOutlineId: selectedOutlineId || undefined,
        brandContext: {
          name: currentBrand?.name || "",
          tone: currentBrand?.tone || undefined,
          about: currentBrand?.about || undefined,
          offers_services: currentBrand?.offers_services || undefined,
        },
        customInstructions: selectedFramework === "custom" ? customInstructions : undefined,
      });
      if (result) {
        setGenerateOpen(false);
        setProductTitle("");
        setProductDescription("");
        setTargetAudience("");
        setCustomInstructions("");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOutlineSelect = (outlineId: string) => {
    setSelectedOutlineId(outlineId);
    const outline = outlines.find((o) => o.id === outlineId);
    if (outline) {
      setProductTitle(outline.title);
    }
  };

  const handleCopyHtml = (page: SalesPage) => {
    const html = generateHtml(page);
    navigator.clipboard.writeText(html);
    import("@/components/ui/sonner").then(({ toast }) => toast.success("HTML copied to clipboard"));
  };

  const generateHtml = (page: SalesPage) => {
    const sectionColors = [
      { bg: "#ffffff", text: "#1a1a2e" },
      { bg: "#f8f9fc", text: "#1a1a2e" },
      { bg: "#ffffff", text: "#1a1a2e" },
      { bg: "#f1f3f9", text: "#1a1a2e" },
    ];
    
    let sectionsHtml = "";
    page.sections.forEach((section, i) => {
      const colors = sectionColors[i % sectionColors.length];
      const sectionType = (section as any).type || "";
      let extraClass = "";
      if (sectionType === "testimonials" || sectionType === "social_proof") extraClass = "testimonials";
      if (sectionType === "benefits" || sectionType === "features") extraClass = "benefits";
      
      sectionsHtml += `<section class="sp-section ${extraClass}" style="background:${colors.bg};color:${colors.text}">
  <div class="sp-container">
    <h2 class="sp-section-title">${section.title}</h2>
    <div class="sp-section-body">${section.content.replace(/\n/g, "<br>")}</div>
  </div>
</section>`;
    });

    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${page.headline}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',system-ui,-apple-system,sans-serif;line-height:1.7;color:#1a1a2e;-webkit-font-smoothing:antialiased}
.sp-container{max-width:720px;margin:0 auto;padding:0 2rem}
.sp-hero{text-align:center;padding:5rem 2rem 4rem;background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#a855f7 100%);color:white;position:relative;overflow:hidden}
.sp-hero::after{content:'';position:absolute;bottom:0;left:0;right:0;height:60px;background:linear-gradient(to top,rgba(255,255,255,0.08),transparent)}
.sp-hero h1{font-size:clamp(2rem,5vw,3rem);font-weight:800;margin-bottom:1rem;letter-spacing:-0.02em;line-height:1.15}
.sp-hero p{font-size:1.15rem;opacity:0.92;max-width:600px;margin:0 auto;line-height:1.6}
.sp-section{padding:4rem 2rem}
.sp-section-title{font-size:1.75rem;font-weight:700;margin-bottom:1.25rem;letter-spacing:-0.01em;line-height:1.3}
.sp-section-body{font-size:1.05rem;color:#4a4a6a;line-height:1.8}
.sp-section.benefits .sp-section-body{columns:2;column-gap:2rem}
.sp-section.testimonials{background:#f8f7ff !important}
.sp-cta{text-align:center;padding:4rem 2rem;background:linear-gradient(135deg,#f8f9fc,#eef0f7)}
.sp-cta-btn{display:inline-block;padding:1rem 3rem;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;text-decoration:none;border-radius:12px;font-size:1.1rem;font-weight:700;letter-spacing:0.01em;transition:all 0.3s ease;box-shadow:0 4px 14px rgba(79,70,229,0.35)}
.sp-cta-btn:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(79,70,229,0.45)}
@media(max-width:640px){.sp-section.benefits .sp-section-body{columns:1}.sp-hero{padding:3rem 1.5rem 2.5rem}.sp-section{padding:2.5rem 1.5rem}}
</style></head><body>
<div class="sp-hero"><div class="sp-container"><h1>${page.headline}</h1>${page.subheadline ? `<p>${page.subheadline}</p>` : ""}</div></div>
${sectionsHtml}
${page.cta_text ? `<div class="sp-cta"><a href="${page.cta_url || "#"}" class="sp-cta-btn">${page.cta_text}</a></div>` : ""}
</body></html>`;
  };

  const handleSaveEdit = async () => {
    if (!editingPage) return;
    await updateSalesPage(editingPage.id, {
      headline: editingPage.headline,
      subheadline: editingPage.subheadline,
      sections: editingPage.sections as any,
      cta_text: editingPage.cta_text,
      cta_url: editingPage.cta_url,
    });
    setEditingPage(null);
  };

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
                <DropdownMenuItem key={brand.id} onClick={() => selectBrand(brand.id)}>
                  {brand.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/channels/new"><Plus className="w-4 h-4 mr-2" />Add New Brand</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {sidebarItems.map((item) => (
              <li key={item.href}>
                <Link to={item.href} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive(item.href) ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
                  <item.icon className="w-4 h-4" />{item.label}
                </Link>
              </li>
            ))}
          </ul>
          {isAdmin && (
            <div className="mt-6 pt-6 border-t border-border">
              <Link to="/admin/users" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
                <Shield className="w-4 h-4" />Admin Panel
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
            <button onClick={() => { signOut(); navigate("/"); }} className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="p-6 bg-card border-b border-border flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Sales Page Builder</h1>
            <p className="text-muted-foreground">Generate conversion-focused sales pages with proven frameworks</p>
          </div>
          <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
            <DialogTrigger asChild>
              <Button disabled={!currentBrand}><Plus className="w-4 h-4 mr-2" />New Sales Page</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Generate Sales Page</DialogTitle>
                <DialogDescription>Choose a copywriting framework and provide product details</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                {/* Framework Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Copywriting Framework</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {frameworks.map((fw) => (
                      <button
                        key={fw.id}
                        onClick={() => setSelectedFramework(fw.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${selectedFramework === fw.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                      >
                        <div className="font-semibold text-sm">{fw.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{fw.label}</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{frameworks.find((f) => f.id === selectedFramework)?.description}</p>
                </div>

                {/* Outline Selection */}
                {outlines.length > 0 && (
                  <div className="space-y-2">
                    <Label>Link to Product Outline (optional)</Label>
                    <Select value={selectedOutlineId} onValueChange={handleOutlineSelect}>
                      <SelectTrigger><SelectValue placeholder="Select an outline..." /></SelectTrigger>
                      <SelectContent>
                        {outlines.map((o) => (
                          <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Product Title *</Label>
                  <Input value={productTitle} onChange={(e) => setProductTitle(e.target.value)} placeholder="e.g. The Creator's Guide to Passive Income" />
                </div>
                <div className="space-y-2">
                  <Label>Product Description</Label>
                  <Textarea value={productDescription} onChange={(e) => setProductDescription(e.target.value)} placeholder="What does this product help people achieve?" rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="e.g. Aspiring content creators who want to monetize" />
                </div>
                {selectedFramework === "custom" && (
                  <div className="space-y-2">
                    <Label>Custom Instructions</Label>
                    <Textarea value={customInstructions} onChange={(e) => setCustomInstructions(e.target.value)} placeholder="Any specific instructions for the copy..." rows={2} />
                  </div>
                )}
                <Button onClick={handleGenerate} disabled={isGenerating || !productTitle.trim()} className="w-full">
                  {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate Sales Page</>}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        <div className="p-6">
          {!currentBrand ? (
            <Card><CardContent className="p-8 text-center"><p className="text-muted-foreground">Create a brand first to generate sales pages.</p><Link to="/channels/new"><Button className="mt-4"><Plus className="w-4 h-4 mr-2" />Create Brand</Button></Link></CardContent></Card>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : salesPages.length === 0 ? (
            <Card><CardContent className="p-12 text-center">
              <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Sales Pages Yet</h3>
              <p className="text-muted-foreground mb-4">Generate your first sales page using proven copywriting frameworks.</p>
              <Button onClick={() => setGenerateOpen(true)}><Plus className="w-4 h-4 mr-2" />Create Sales Page</Button>
            </CardContent></Card>
          ) : (
            <div className="grid gap-4">
              {salesPages.map((page) => (
                <Card key={page.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{page.framework.toUpperCase()}</Badge>
                          <Badge variant="outline">{page.sections.length} sections</Badge>
                        </div>
                        <h3 className="text-lg font-semibold line-clamp-1">{page.headline || "Untitled"}</h3>
                        {page.subheadline && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{page.subheadline}</p>}
                        <p className="text-xs text-muted-foreground mt-2">Created {new Date(page.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" onClick={() => setPreviewPage(page)}><Eye className="w-4 h-4 mr-1" />Preview</Button>
                        <Button variant="outline" size="sm" onClick={() => setEditingPage({ ...page })}><Edit className="w-4 h-4 mr-1" />Edit</Button>
                        <Button variant="outline" size="sm" onClick={() => handleCopyHtml(page)}><Copy className="w-4 h-4 mr-1" />HTML</Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteSalesPage(page.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Preview Dialog */}
        <Dialog open={!!previewPage} onOpenChange={() => setPreviewPage(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Sales Page Preview</DialogTitle>
              <DialogDescription>{previewPage?.framework.toUpperCase()} Framework</DialogDescription>
            </DialogHeader>
            {previewPage && (
              <Tabs defaultValue="desktop">
                <TabsList><TabsTrigger value="desktop">Desktop</TabsTrigger><TabsTrigger value="content">Content</TabsTrigger></TabsList>
                <TabsContent value="desktop">
                  <div className="border border-border rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-br from-[#4f46e5] to-[#a855f7] text-white p-10 text-center">
                      <h1 className="text-3xl font-extrabold mb-3 tracking-tight">{previewPage.headline}</h1>
                      {previewPage.subheadline && <p className="text-white/85 text-lg max-w-lg mx-auto">{previewPage.subheadline}</p>}
                    </div>
                    <div className="divide-y divide-border">
                      {previewPage.sections.map((section, i) => (
                        <div key={i} className={`p-8 ${i % 2 === 1 ? "bg-muted/30" : "bg-background"}`}>
                          <h2 className="text-xl font-bold mb-3 tracking-tight">{section.title}</h2>
                          <div className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed">{section.content}</div>
                        </div>
                      ))}
                    </div>
                    {previewPage.cta_text && (
                      <div className="text-center py-10 bg-muted/20">
                        <Button size="lg" className="px-8 text-base font-bold">{previewPage.cta_text}</Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="content">
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-xl">
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">Headline</h3>
                      <p className="font-semibold">{previewPage.headline}</p>
                    </div>
                    {previewPage.subheadline && (
                      <div className="p-4 bg-muted/50 rounded-xl">
                        <h3 className="font-medium text-sm text-muted-foreground mb-1">Subheadline</h3>
                        <p>{previewPage.subheadline}</p>
                      </div>
                    )}
                    {previewPage.sections.map((section, i) => (
                      <div key={i} className="p-4 border border-border rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">{section.type}</Badge>
                          <span className="font-medium">{section.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{section.content}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editingPage} onOpenChange={() => setEditingPage(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Sales Page</DialogTitle>
            </DialogHeader>
            {editingPage && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Headline</Label>
                  <Input value={editingPage.headline} onChange={(e) => setEditingPage({ ...editingPage, headline: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Subheadline</Label>
                  <Input value={editingPage.subheadline || ""} onChange={(e) => setEditingPage({ ...editingPage, subheadline: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>CTA Button Text</Label>
                  <Input value={editingPage.cta_text || ""} onChange={(e) => setEditingPage({ ...editingPage, cta_text: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>CTA URL</Label>
                  <Input value={editingPage.cta_url || ""} onChange={(e) => setEditingPage({ ...editingPage, cta_url: e.target.value })} placeholder="https://..." />
                </div>
                <div className="space-y-3">
                  <Label>Sections</Label>
                  {editingPage.sections.map((section, i) => (
                    <div key={i} className="border border-border rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{section.type}</Badge>
                        <Input value={section.title} onChange={(e) => {
                          const updated = [...editingPage.sections];
                          updated[i] = { ...updated[i], title: e.target.value };
                          setEditingPage({ ...editingPage, sections: updated });
                        }} className="flex-1" />
                      </div>
                      <Textarea value={section.content} onChange={(e) => {
                        const updated = [...editingPage.sections];
                        updated[i] = { ...updated[i], content: e.target.value };
                        setEditingPage({ ...editingPage, sections: updated });
                      }} rows={4} />
                    </div>
                  ))}
                </div>
                <Button onClick={handleSaveEdit} className="w-full">Save Changes</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default SalesPageBuilder;
