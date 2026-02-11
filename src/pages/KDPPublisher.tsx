import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useBrands } from "@/hooks/useBrands";
import { useProductOutlines } from "@/hooks/useProductOutlines";
import { useKDPMetadata } from "@/hooks/useKDPMetadata";
import {
  LayoutDashboard, Rss, Settings, Lightbulb, FileText, Palette,
  Download, LogOut, ChevronDown, Shield, Loader2, Plus, BookOpen,
  DollarSign, Tag, Layers, ExternalLink, Save, Wand2, Trash2,
} from "lucide-react";
import creatorberryLogo from "@/assets/creatorberry-logo.png";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Lightbulb, label: "Product Ideas", href: "/product-ideas" },
  { icon: FileText, label: "Outlines", href: "/outlines" },
  { icon: Palette, label: "Image Studio", href: "/image-studio" },
  { icon: Download, label: "Export Center", href: "/export-center" },
  { icon: BookOpen, label: "KDP Publisher", href: "/kdp" },
  { icon: Rss, label: "Sources", href: "/sources" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

function RoyaltyCalculator({ ebookPrice, printPrice, royaltyTier }: { ebookPrice: number; printPrice: number | null; royaltyTier: string }) {
  const tierPercent = royaltyTier === "70" ? 0.7 : 0.35;
  const deliveryCost = royaltyTier === "70" ? 0.15 : 0; // approximate
  const ebookRoyalty = Math.max(0, (ebookPrice * tierPercent) - deliveryCost);
  const printRoyalty = printPrice ? printPrice * 0.4 - 2.5 : 0; // rough estimate

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          Royalty Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="text-xs text-muted-foreground mb-1">Ebook Royalty ({royaltyTier}%)</div>
            <div className="text-2xl font-bold text-primary">${ebookRoyalty.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">per sale at ${ebookPrice.toFixed(2)}</div>
          </div>
          {printPrice && printPrice > 0 && (
            <div className="p-4 rounded-xl bg-secondary/50 border border-border">
              <div className="text-xs text-muted-foreground mb-1">Print Royalty (est.)</div>
              <div className="text-2xl font-bold">${Math.max(0, printRoyalty).toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">per sale at ${printPrice.toFixed(2)}</div>
            </div>
          )}
        </div>
        <div className="p-3 rounded-lg bg-muted text-xs text-muted-foreground">
          <strong>Tip:</strong> The 70% tier requires pricing between $2.99–$9.99 and enrollment in KDP Select. The 35% tier has no price restrictions.
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 rounded-lg border border-border">
            <div className="text-xs text-muted-foreground">100 Sales</div>
            <div className="font-semibold">${(ebookRoyalty * 100).toFixed(0)}</div>
          </div>
          <div className="text-center p-3 rounded-lg border border-border">
            <div className="text-xs text-muted-foreground">1,000 Sales</div>
            <div className="font-semibold">${(ebookRoyalty * 1000).toFixed(0)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function KDPPublisher() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isAdmin, isLoading, signOut } = useAuth();
  const { brands, currentBrand, isLoading: brandsLoading, selectBrand } = useBrands();
  const { outlines } = useProductOutlines(currentBrand?.id || null);
  const { kdpItems, isLoading: kdpLoading, generateMetadata, saveMetadata, deleteMetadata } = useKDPMetadata(currentBrand?.id);

  const [selectedOutline, setSelectedOutline] = useState("");
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [royaltyTier, setRoyaltyTier] = useState("70");
  const [ebookPrice, setEbookPrice] = useState(9.99);
  const [printPrice, setPrintPrice] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) navigate("/auth");
    if (!isLoading && user && !profile?.is_approved) navigate("/pending-approval");
  }, [user, profile, isLoading, navigate]);

  const handleSignOut = async () => { await signOut(); navigate("/"); };
  const isActive = (href: string) => location.pathname === href;

  const handleGenerate = async () => {
    if (!selectedOutline || !currentBrand) return;
    setIsGenerating(true);
    try {
      const result = await generateMetadata.mutateAsync({
        outlineId: selectedOutline,
        brandId: currentBrand.id,
      });
      const m = result.metadata;
      setTitle(m.title || "");
      setSubtitle(m.subtitle || "");
      setDescription(m.description || "");
      setKeywords(m.keywords || []);
      setCategories(m.categories || []);
      setRoyaltyTier(m.royalty_tier || "70");
      setEbookPrice(m.ebook_price || 9.99);
      setPrintPrice(m.print_price || null);
      setStep(2);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!currentBrand) return;
    saveMetadata.mutate({
      product_outline_id: selectedOutline,
      brand_id: currentBrand.id,
      title,
      subtitle,
      description,
      keywords,
      categories,
      royalty_tier: royaltyTier,
      ebook_price: ebookPrice,
      print_price: printPrice || undefined,
      status: "ready",
    });
  };

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && keywords.length < 7 && !keywords.includes(kw)) {
      setKeywords([...keywords, kw]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const loadExisting = (item: any) => {
    setSelectedOutline(item.product_outline_id);
    setTitle(item.title);
    setSubtitle(item.subtitle || "");
    setDescription(item.description || "");
    setKeywords(item.keywords || []);
    setCategories(item.categories || []);
    setRoyaltyTier(item.royalty_tier || "70");
    setEbookPrice(item.ebook_price || 9.99);
    setPrintPrice(item.print_price);
    setStep(2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col shadow-sm">
        <div className="p-5 border-b border-border">
          <Link to="/" className="flex items-center gap-3">
            <img src={creatorberryLogo} alt="CreatorBerry" className="w-9 h-9 rounded-xl object-contain" />
            <span className="font-semibold text-lg">CreatorBerry</span>
          </Link>
        </div>
        <div className="p-4 border-b border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-background hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm text-primary-foreground"
                    style={{ backgroundColor: currentBrand?.primary_color || "hsl(var(--primary))" }}>
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
                <DropdownMenuItem key={brand.id} onClick={() => selectBrand(brand.id)} className="cursor-pointer">
                  <span className="truncate">{brand.name}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/channels/new" className="cursor-pointer"><Plus className="w-4 h-4 mr-2" />Add New Brand</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {sidebarItems.map((item, index) => (
              <li key={index}>
                <Link to={item.href}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive(item.href) ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}>
                  <item.icon className="w-4 h-4" />{item.label}
                </Link>
              </li>
            ))}
          </ul>
          {isAdmin && (
            <div className="mt-6 pt-6 border-t border-border">
              <Link to="/admin/users" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all">
                <Shield className="w-4 h-4" />Admin Panel
              </Link>
            </div>
          )}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center font-semibold text-sm text-primary">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="text-sm">
                <div className="font-medium">{profile?.full_name || "User"}</div>
                <div className="text-xs text-muted-foreground">Creator</div>
              </div>
            </div>
            <button onClick={handleSignOut} className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="p-6 bg-card border-b border-border">
          <h1 className="text-2xl font-semibold">Amazon KDP Publisher</h1>
          <p className="text-muted-foreground">Optimize metadata & prepare your book for Kindle Direct Publishing</p>
        </header>

        <div className="p-6 space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center gap-4">
            {[
              { num: 1, label: "Select & Generate" },
              { num: 2, label: "Edit Metadata" },
              { num: 3, label: "Review & Publish" },
            ].map((s) => (
              <button key={s.num} onClick={() => s.num <= step && setStep(s.num)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  step === s.num ? "bg-primary text-primary-foreground" : step > s.num ? "bg-primary/10 text-primary cursor-pointer" : "bg-muted text-muted-foreground"
                }`}>
                <span className="w-6 h-6 rounded-full bg-background/20 flex items-center justify-center text-xs font-bold">
                  {step > s.num ? "✓" : s.num}
                </span>
                {s.label}
              </button>
            ))}
          </div>

          {/* Step 1: Select Outline */}
          {step === 1 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generate KDP Metadata</CardTitle>
                  <CardDescription>Select a product outline to generate optimized Amazon metadata</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Product Outline</Label>
                    <Select value={selectedOutline} onValueChange={setSelectedOutline}>
                      <SelectTrigger><SelectValue placeholder="Select an outline..." /></SelectTrigger>
                      <SelectContent>
                        {outlines.map((o) => (
                          <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>
                        ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleGenerate} disabled={!selectedOutline || isGenerating} className="w-full" size="lg">
                    {isGenerating ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating Optimized Metadata...</>
                    ) : (
                      <><Wand2 className="w-4 h-4 mr-2" />Generate KDP Metadata with AI</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Existing KDP Items */}
              {kdpItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Saved KDP Projects</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {kdpItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-accent/50 transition-colors">
                        <button onClick={() => loadExisting(item)} className="flex items-center gap-3 flex-1 text-left">
                          <BookOpen className="w-5 h-5 text-primary" />
                          <div>
                            <div className="font-medium text-sm">{item.title}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{item.royalty_tier}% tier</Badge>
                              <span>${item.ebook_price}</span>
                              <Badge variant={item.status === "ready" ? "default" : "secondary"} className="text-xs">{item.status}</Badge>
                            </div>
                          </div>
                        </button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMetadata.mutate(item.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 2: Edit Metadata */}
          {step === 2 && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Tag className="w-5 h-5" />Title & Subtitle</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Book Title</Label>
                      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Your book title" />
                      <p className="text-xs text-muted-foreground">{title.length}/200 characters</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Subtitle</Label>
                      <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Keyword-rich subtitle" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Book Description</CardTitle>
                    <CardDescription>HTML formatting supported for Amazon listing</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={8} placeholder="Compelling book description..." />
                    <p className="text-xs text-muted-foreground mt-2">{description.length}/4000 characters</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Tag className="w-5 h-5" />Backend Keywords</CardTitle>
                    <CardDescription>Up to 7 keywords (no commas within each keyword)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {keywords.map((kw, i) => (
                        <Badge key={i} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                          {kw}
                          <button onClick={() => removeKeyword(i)} className="ml-1 hover:text-destructive">×</button>
                        </Badge>
                      ))}
                    </div>
                    {keywords.length < 7 && (
                      <div className="flex gap-2">
                        <Input value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)}
                          placeholder="Add keyword..." onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())} />
                        <Button variant="outline" onClick={addKeyword}>Add</Button>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">{keywords.length}/7 keywords used</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Layers className="w-5 h-5" />Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat, i) => (
                        <Badge key={i} variant="outline" className="px-3 py-1">{cat}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pricing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Royalty Tier</Label>
                      <Select value={royaltyTier} onValueChange={setRoyaltyTier}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="70">70% (KDP Select, $2.99–$9.99)</SelectItem>
                          <SelectItem value="35">35% (Any price)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Ebook Price ($)</Label>
                      <Input type="number" step="0.01" value={ebookPrice} onChange={(e) => setEbookPrice(parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Print Price ($) <span className="text-muted-foreground">(optional)</span></Label>
                      <Input type="number" step="0.01" value={printPrice || ""} onChange={(e) => setPrintPrice(e.target.value ? parseFloat(e.target.value) : null)} />
                    </div>
                  </CardContent>
                </Card>

                <RoyaltyCalculator ebookPrice={ebookPrice} printPrice={printPrice} royaltyTier={royaltyTier} />

                <div className="space-y-2">
                  <Button onClick={() => setStep(3)} className="w-full" size="lg">
                    Continue to Review
                  </Button>
                  <Button variant="outline" onClick={handleSave} className="w-full" disabled={saveMetadata.isPending}>
                    <Save className="w-4 h-4 mr-2" />Save Progress
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review & Publish */}
          {step === 3 && (
            <div className="max-w-2xl mx-auto space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Review Your KDP Listing</CardTitle>
                  <CardDescription>Review everything before uploading to Amazon KDP</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Title</Label>
                    <p className="font-semibold text-lg">{title}</p>
                    {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <p className="text-sm whitespace-pre-wrap">{description}</p>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-xs text-muted-foreground">Keywords ({keywords.length}/7)</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {keywords.map((kw, i) => <Badge key={i} variant="secondary">{kw}</Badge>)}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-xs text-muted-foreground">Categories</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {categories.map((c, i) => <Badge key={i} variant="outline">{c}</Badge>)}
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Royalty Tier</Label>
                      <p className="font-semibold">{royaltyTier}%</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Ebook Price</Label>
                      <p className="font-semibold">${ebookPrice.toFixed(2)}</p>
                    </div>
                    {printPrice && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Print Price</Label>
                        <p className="font-semibold">${printPrice.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back to Edit
                </Button>
                <Button onClick={() => { handleSave(); }} className="flex-1" disabled={saveMetadata.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  {saveMetadata.isPending ? "Saving..." : "Save & Finalize"}
                </Button>
              </div>

              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-6 text-center space-y-3">
                  <BookOpen className="w-10 h-10 mx-auto text-primary" />
                  <h3 className="font-semibold text-lg">Ready to Publish on Amazon?</h3>
                  <p className="text-sm text-muted-foreground">
                    Save your metadata, then export your book from the Export Center. Upload both to Amazon KDP.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Link to="/export-center">
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />Export Book
                      </Button>
                    </Link>
                    <a href="https://kdp.amazon.com" target="_blank" rel="noopener noreferrer">
                      <Button>
                        <ExternalLink className="w-4 h-4 mr-2" />Open Amazon KDP
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
