import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
import { useLaunchAssets } from "@/hooks/useLaunchAssets";
import {
  LayoutDashboard, Rss, Settings, Sparkles, Lightbulb, FileText, Palette,
  Download, BookOpen, ShoppingCart, Rocket, Library, Plus, Loader2, Trash2, Copy,
  Mail, MessageSquare, Globe, Mic, ChevronDown, LogOut, Shield, Check,
} from "lucide-react";
import creatorberryLogo from "@/assets/creatorberry-logo.png";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";

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

const assetTypes = [
  { id: "email_sequence", name: "Email Sequence", icon: Mail, description: "5-email launch sequence with welcome, value, social proof, urgency & CTA" },
  { id: "social_posts", name: "Social Posts", icon: MessageSquare, description: "Platform-specific posts for Twitter, LinkedIn, Instagram & TikTok" },
  { id: "waitlist_copy", name: "Waitlist Page", icon: Globe, description: "Landing page copy with headline, benefits, urgency & CTA" },
  { id: "podcast_questions", name: "Podcast Kit", icon: Mic, description: "Elevator pitch, interview questions & talking points" },
];

const LaunchToolkit = () => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { brands, currentBrand, selectBrand } = useBrands();
  const { outlines } = useProductOutlines(currentBrand?.id || null);
  const { assets, isLoading, generateAsset, deleteAsset } = useLaunchAssets(currentBrand?.id || null);
  const location = useLocation();
  const navigate = useNavigate();

  const [generateOpen, setGenerateOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState("email_sequence");
  const [productTitle, setProductTitle] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [selectedOutlineId, setSelectedOutlineId] = useState("");
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);

  const isActive = (href: string) => location.pathname === href;

  const handleGenerate = async () => {
    if (!productTitle.trim()) return;
    setIsGenerating(true);
    try {
      await generateAsset({
        assetType: selectedType,
        productTitle,
        productDescription,
        targetAudience,
        productOutlineId: selectedOutlineId || undefined,
        brandContext: {
          name: currentBrand?.name || "",
          tone: currentBrand?.tone || undefined,
          about: currentBrand?.about || undefined,
        },
      });
      setGenerateOpen(false);
      setProductTitle("");
      setProductDescription("");
      setTargetAudience("");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOutlineSelect = (id: string) => {
    setSelectedOutlineId(id);
    const outline = outlines.find((o) => o.id === id);
    if (outline) setProductTitle(outline.title);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const renderAssetContent = (asset: any) => {
    const content = asset.content;
    switch (asset.asset_type) {
      case "email_sequence":
        return (
          <div className="space-y-4">
            {(content.emails || []).map((email: any, i: number) => (
              <div key={i} className="border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Day {email.sendDay || i + 1}</Badge>
                    <Badge variant="secondary">{email.purpose}</Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`Subject: ${email.subject}\n\n${email.body}`)}>
                    <Copy className="w-3 h-3 mr-1" />Copy
                  </Button>
                </div>
                <h4 className="font-semibold text-sm">{email.subject}</h4>
                {email.previewText && <p className="text-xs text-muted-foreground mt-1">{email.previewText}</p>}
                <div className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">{email.body}</div>
              </div>
            ))}
          </div>
        );
      case "social_posts":
        return (
          <div className="space-y-3">
            {(content.posts || []).map((post: any, i: number) => (
              <div key={i} className="border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{post.platform}</Badge>
                    <Badge variant="outline">{post.postType}</Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(post.content + (post.hashtags?.length ? "\n\n" + post.hashtags.map((h: string) => `#${h}`).join(" ") : ""))}>
                    <Copy className="w-3 h-3 mr-1" />Copy
                  </Button>
                </div>
                <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                {post.hashtags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {post.hashtags.map((h: string, j: number) => (
                      <span key={j} className="text-xs text-primary">#{h}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Button variant="outline" className="w-full" onClick={() => {
              const all = (content.posts || []).map((p: any) => `[${p.platform.toUpperCase()}]\n${p.content}${p.hashtags?.length ? "\n" + p.hashtags.map((h: string) => `#${h}`).join(" ") : ""}`).join("\n\n---\n\n");
              copyToClipboard(all);
            }}>
              <Copy className="w-4 h-4 mr-2" />Copy All Posts
            </Button>
          </div>
        );
      case "waitlist_copy":
        return (
          <div className="space-y-4">
            <div className="border border-border rounded-xl p-6 text-center">
              <h3 className="text-xl font-bold mb-2">{content.headline}</h3>
              <p className="text-muted-foreground mb-4">{content.subheadline}</p>
              <ul className="text-left max-w-md mx-auto space-y-2 mb-4">
                {(content.benefits || []).map((b: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
              {content.urgencyText && <p className="text-sm text-destructive font-medium mb-4">{content.urgencyText}</p>}
              <Button>{content.ctaText || "Join Waitlist"}</Button>
              {content.thankYouMessage && <p className="text-xs text-muted-foreground mt-4">After signup: "{content.thankYouMessage}"</p>}
            </div>
            <Button variant="outline" className="w-full" onClick={() => copyToClipboard(JSON.stringify(content, null, 2))}>
              <Copy className="w-4 h-4 mr-2" />Copy as JSON
            </Button>
          </div>
        );
      case "podcast_questions":
        return (
          <div className="space-y-4">
            {content.elevatorPitch && (
              <div className="border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">60-Second Elevator Pitch</h4>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(content.elevatorPitch)}><Copy className="w-3 h-3" /></Button>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{content.elevatorPitch}</p>
              </div>
            )}
            {(content.questions || []).map((q: any, i: number) => (
              <div key={i} className="border border-border rounded-xl p-4">
                <h4 className="font-medium text-sm mb-2">Q{i + 1}: {q.question}</h4>
                <ul className="space-y-1">
                  {(q.talkingPoints || []).map((tp: string, j: number) => (
                    <li key={j} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">•</span>{tp}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {content.closingCta && (
              <div className="border border-primary/30 rounded-xl p-4 bg-primary/5">
                <h4 className="font-semibold text-sm mb-1">Closing CTA</h4>
                <p className="text-sm text-muted-foreground">{content.closingCta}</p>
              </div>
            )}
          </div>
        );
      default:
        return <pre className="text-xs overflow-auto">{JSON.stringify(content, null, 2)}</pre>;
    }
  };

  const getAssetIcon = (type: string) => {
    const found = assetTypes.find((a) => a.id === type);
    return found ? found.icon : FileText;
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
            <h1 className="text-2xl font-semibold">Launch Toolkit</h1>
            <p className="text-muted-foreground">Generate marketing materials for your product launch</p>
          </div>
          <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
            <DialogTrigger asChild>
              <Button disabled={!currentBrand}><Plus className="w-4 h-4 mr-2" />Generate Asset</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Generate Launch Asset</DialogTitle>
                <DialogDescription>Choose an asset type and provide product details</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Asset Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {assetTypes.map((at) => (
                      <button key={at.id} onClick={() => setSelectedType(at.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${selectedType === at.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <at.icon className="w-4 h-4" />
                          <span className="font-semibold text-sm">{at.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{at.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
                {outlines.length > 0 && (
                  <div className="space-y-2">
                    <Label>Link to Product Outline (optional)</Label>
                    <Select value={selectedOutlineId} onValueChange={handleOutlineSelect}>
                      <SelectTrigger><SelectValue placeholder="Select an outline..." /></SelectTrigger>
                      <SelectContent>{outlines.map((o) => <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Product Title *</Label>
                  <Input value={productTitle} onChange={(e) => setProductTitle(e.target.value)} placeholder="e.g. The Creator's Guide to Passive Income" />
                </div>
                <div className="space-y-2">
                  <Label>Product Description</Label>
                  <Textarea value={productDescription} onChange={(e) => setProductDescription(e.target.value)} placeholder="What does this product do?" rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="e.g. Aspiring content creators" />
                </div>
                <Button onClick={handleGenerate} disabled={isGenerating || !productTitle.trim()} className="w-full">
                  {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate {assetTypes.find((a) => a.id === selectedType)?.name}</>}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        <div className="p-6">
          {!currentBrand ? (
            <Card><CardContent className="p-8 text-center"><p className="text-muted-foreground">Create a brand first.</p><Link to="/channels/new"><Button className="mt-4"><Plus className="w-4 h-4 mr-2" />Create Brand</Button></Link></CardContent></Card>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : assets.length === 0 ? (
            <div className="space-y-6">
              <Card><CardContent className="p-12 text-center">
                <Rocket className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Launch Toolkit</h3>
                <p className="text-muted-foreground mb-4">Generate email sequences, social posts, waitlist copy, and podcast kits.</p>
                <Button onClick={() => setGenerateOpen(true)}><Plus className="w-4 h-4 mr-2" />Generate First Asset</Button>
              </CardContent></Card>
              <div className="grid md:grid-cols-2 gap-4">
                {assetTypes.map((at) => (
                  <Card key={at.id} className="cursor-pointer hover:shadow-lg transition-all" onClick={() => { setSelectedType(at.id); setGenerateOpen(true); }}>
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <at.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div><CardTitle className="text-base">{at.name}</CardTitle><CardDescription className="text-xs">{at.description}</CardDescription></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {assets.map((asset) => {
                const AssetIcon = getAssetIcon(asset.asset_type);
                const isExpanded = expandedAsset === asset.id;
                return (
                  <Card key={asset.id}>
                    <CardContent className="p-0">
                      <button className="w-full p-5 flex items-center justify-between text-left" onClick={() => setExpandedAsset(isExpanded ? null : asset.id)}>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <AssetIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{assetTypes.find((a) => a.id === asset.asset_type)?.name || asset.asset_type}</Badge>
                            </div>
                            <h3 className="font-medium text-sm mt-1">{asset.title}</h3>
                            <p className="text-xs text-muted-foreground">{new Date(asset.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteAsset(asset.id); }}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="px-5 pb-5 border-t border-border pt-4">
                          {renderAssetContent(asset)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LaunchToolkit;
