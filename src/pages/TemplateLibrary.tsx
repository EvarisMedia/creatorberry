import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useBrands } from "@/hooks/useBrands";
import { useTemplates, TemplateSection } from "@/hooks/useTemplates";
import {
  LayoutDashboard, Rss, Settings, Sparkles, Lightbulb, FileText, Palette,
  Download, BookOpen, ShoppingCart, Rocket, Library, Plus, Loader2, Trash2,
  Search, ChevronDown, LogOut, Shield, Copy, Eye, ArrowRight, X,
} from "lucide-react";
import creatorberryLogo from "@/assets/creatorberry-logo.png";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  { icon: Rss, label: "Sources", href: "/sources" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

const categoryLabels: Record<string, string> = {
  ebook: "Ebook",
  course: "Course",
  lead_magnet: "Lead Magnet",
  workbook: "Workbook",
  newsletter: "Newsletter",
  other: "Other",
};

const TemplateLibrary = () => {
  const { profile, isAdmin, signOut } = useAuth();
  const { brands, currentBrand, selectBrand } = useBrands();
  const { templates, isLoading, forkTemplate, createTemplate, deleteTemplate, isInLibrary } = useTemplates();
  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [isForking, setIsForking] = useState<string | null>(null);

  // Create template form
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("ebook");
  const [newNiche, setNewNiche] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTags, setNewTags] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const isActive = (href: string) => location.pathname === href;

  const filtered = templates.filter((t) => {
    const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase()) ||
      t.tags?.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(templates.map((t) => t.category))];

  const handleFork = async (templateId: string) => {
    if (!currentBrand) return;
    setIsForking(templateId);
    const outlineId = await forkTemplate(templateId, currentBrand.id);
    setIsForking(null);
    if (outlineId) {
      navigate(`/outlines/${outlineId}`);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    const defaultSections: TemplateSection[] = [
      { title: "Introduction", description: "Set the stage", subsections: ["Overview", "Goals"] },
      { title: "Chapter 1", description: "Core content", subsections: ["Topic 1", "Topic 2"] },
      { title: "Conclusion", description: "Wrap up", subsections: ["Summary", "Next Steps"] },
    ];
    await createTemplate({
      name: newName,
      category: newCategory,
      niche: newNiche || undefined,
      description: newDescription || undefined,
      sample_outline: defaultSections,
      tags: newTags ? newTags.split(",").map((t) => t.trim()) : [],
    });
    setCreateOpen(false);
    setNewName("");
    setNewCategory("ebook");
    setNewNiche("");
    setNewDescription("");
    setNewTags("");
    setIsCreating(false);
  };

  const previewedTemplate = templates.find((t) => t.id === previewTemplate);

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col shadow-sm">
        <div className="p-5 border-b border-border">
          <Link to="/" className="flex items-center gap-3">
            <img src={creatorberryLogo} alt="CreatorBerry" className="w-14 h-14 rounded-xl object-contain" />
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
                <DropdownMenuItem key={brand.id} onClick={() => selectBrand(brand.id)}>{brand.name}</DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link to="/channels/new"><Plus className="w-4 h-4 mr-2" />Add New Brand</Link></DropdownMenuItem>
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

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <header className="p-6 bg-card border-b border-border flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Template Library</h1>
            <p className="text-muted-foreground">Browse and fork templates to kickstart your next product</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Create Template</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Your Own Template</DialogTitle>
                <DialogDescription>Save a reusable template for future products</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Template Name *</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. My Coaching Workbook" />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Niche (optional)</Label>
                  <Input value={newNiche} onChange={(e) => setNewNiche(e.target.value)} placeholder="e.g. fitness, marketing" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="What is this template for?" rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Tags (comma-separated)</Label>
                  <Input value={newTags} onChange={(e) => setNewTags(e.target.value)} placeholder="e.g. coaching, workbook, exercises" />
                </div>
                <Button onClick={handleCreate} disabled={isCreating || !newName.trim()} className="w-full">
                  {isCreating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : "Create Template"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        <div className="p-6">
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates..." className="pl-10" />
            </div>
            <div className="flex items-center gap-2">
              <Button variant={categoryFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setCategoryFilter("all")}>All</Button>
              {categories.map((cat) => (
                <Button key={cat} variant={categoryFilter === cat ? "default" : "outline"} size="sm" onClick={() => setCategoryFilter(cat)}>
                  {categoryLabels[cat] || cat}
                </Button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Library className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No templates found</h3>
              <p className="text-muted-foreground">Try adjusting your search or create your own template.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((template) => (
                <Card key={template.id} className="group hover:shadow-lg transition-all flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{template.name}</CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">{template.description}</CardDescription>
                      </div>
                      {template.created_by_admin && (
                        <Badge variant="secondary" className="ml-2 flex-shrink-0">Official</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <Badge variant="outline">{categoryLabels[template.category] || template.category}</Badge>
                      {template.niche && <Badge variant="outline">{template.niche}</Badge>}
                      {template.tags?.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>

                    {/* Outline preview */}
                    <div className="flex-1 mb-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">{template.sample_outline.length} sections</p>
                      <div className="space-y-1">
                        {template.sample_outline.slice(0, 4).map((section, i) => (
                          <div key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-muted flex items-center justify-center font-medium text-foreground">{i + 1}</span>
                            <span className="truncate">{section.title}</span>
                          </div>
                        ))}
                        {template.sample_outline.length > 4 && (
                          <p className="text-xs text-muted-foreground pl-7">+{template.sample_outline.length - 4} more</p>
                        )}
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="text-xs text-muted-foreground">
                        <Copy className="w-3 h-3 inline mr-1" />{template.usage_count} uses
                      </span>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setPreviewTemplate(template.id)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {!template.created_by_admin && template.user_id && (
                          <Button variant="ghost" size="sm" onClick={() => deleteTemplate(template.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                        <Button size="sm" onClick={() => handleFork(template.id)} disabled={!currentBrand || isForking === template.id}>
                          {isForking === template.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <ArrowRight className="w-4 h-4 mr-1" />
                              Use
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Preview Dialog */}
        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            {previewedTemplate && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {previewedTemplate.name}
                    {previewedTemplate.created_by_admin && <Badge variant="secondary">Official</Badge>}
                  </DialogTitle>
                  <DialogDescription>{previewedTemplate.description}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{categoryLabels[previewedTemplate.category] || previewedTemplate.category}</Badge>
                    {previewedTemplate.niche && <Badge variant="outline">{previewedTemplate.niche}</Badge>}
                    {previewedTemplate.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">Outline Structure</h3>
                    {previewedTemplate.sample_outline.map((section, i) => (
                      <div key={i} className="border border-border rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-sm text-primary">{i + 1}</span>
                          <div>
                            <h4 className="font-medium text-sm">{section.title}</h4>
                            <p className="text-xs text-muted-foreground">{section.description}</p>
                          </div>
                        </div>
                        {section.subsections?.length > 0 && (
                          <div className="ml-10 space-y-1">
                            {section.subsections.map((sub, j) => (
                              <div key={j} className="text-xs text-muted-foreground flex items-center gap-2">
                                <span className="text-primary">•</span>{sub}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button className="w-full" onClick={() => { setPreviewTemplate(null); handleFork(previewedTemplate.id); }} disabled={!currentBrand || isForking === previewedTemplate.id}>
                    {isForking === previewedTemplate.id ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Forking...</>
                    ) : (
                      <><ArrowRight className="w-4 h-4 mr-2" />Use This Template</>
                    )}
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default TemplateLibrary;
