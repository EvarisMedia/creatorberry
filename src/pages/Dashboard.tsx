import { useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useBrands } from "@/hooks/useBrands";
import { useProductIdeas } from "@/hooks/useProductIdeas";
import { useProductOutlines } from "@/hooks/useProductOutlines";
import { useContentSources } from "@/hooks/useContentSources";
import { 
  LayoutDashboard, 
  Rss, 
  Settings,
  Plus,
  LogOut,
  ChevronDown,
  Shield,
  Loader2,
  Lightbulb,
  FileText,
  Sparkles,
  Palette,
  Download,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Lightbulb, label: "Product Ideas", href: "/product-ideas" },
  { icon: FileText, label: "Outlines", href: "/outlines" },
  { icon: Palette, label: "Image Studio", href: "/image-studio" },
  { icon: Download, label: "Export Center", href: "/export-center" },
  { icon: Rss, label: "Sources", href: "/sources" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

const Dashboard = () => {
  const { user, profile, isAdmin, isLoading, signOut } = useAuth();
  const { brands, currentBrand, isLoading: brandsLoading, selectBrand } = useBrands();
  const { ideas } = useProductIdeas(currentBrand?.id || null);
  const { outlines } = useProductOutlines(currentBrand?.id || null);
  const { sources } = useContentSources(currentBrand?.id || null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
    if (!isLoading && user && !profile?.is_approved) {
      navigate("/pending-approval");
    }
  }, [user, profile, isLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (href: string) => location.pathname === href;

  // Stats
  const totalIdeas = ideas.length;
  const topIdeas = ideas
    .filter((i) => i.pmf_score)
    .sort((a, b) => (b.pmf_score?.combined_score || 0) - (a.pmf_score?.combined_score || 0))
    .slice(0, 3);
  const totalOutlines = outlines.length;

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
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">Creator OS</span>
          </Link>
        </div>
        
        {/* Brand Selector */}
        <div className="p-4 border-b border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-background hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  {currentBrand?.logo_url ? (
                    <img 
                      src={currentBrand.logo_url} 
                      alt={currentBrand.name}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                  ) : (
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm text-primary-foreground"
                      style={{ backgroundColor: currentBrand?.primary_color || 'hsl(var(--primary))' }}
                    >
                      {currentBrand?.name?.charAt(0) || "?"}
                    </div>
                  )}
                  <div className="text-left">
                    <div className="font-medium text-sm truncate max-w-[120px]">
                      {currentBrand?.name || "No Brand"}
                    </div>
                    <div className="text-xs text-muted-foreground">Brand</div>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {brands.map((brand) => (
                <DropdownMenuItem 
                  key={brand.id}
                  onClick={() => selectBrand(brand.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {brand.logo_url ? (
                      <img 
                        src={brand.logo_url} 
                        alt={brand.name}
                        className="w-6 h-6 rounded-md object-cover"
                      />
                    ) : (
                      <div 
                        className="w-6 h-6 rounded-md flex items-center justify-center font-semibold text-xs text-primary-foreground"
                        style={{ backgroundColor: brand.primary_color || 'hsl(var(--primary))' }}
                      >
                        {brand.name.charAt(0)}
                      </div>
                    )}
                    <span className="truncate">{brand.name}</span>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/channels/new" className="cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Brand
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {sidebarItems.map((item, index) => (
              <li key={index}>
                <Link
                  to={item.href}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          
          {isAdmin && (
            <div className="mt-6 pt-6 border-t border-border">
              <Link
                to="/admin/users"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  location.pathname.startsWith('/admin')
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </Link>
            </div>
          )}
        </nav>
        
        {/* User */}
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
            <button 
              onClick={handleSignOut} 
              className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="p-6 bg-card border-b border-border flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {profile?.full_name?.split(" ")[0] || "there"}</p>
          </div>
          <Link to="/product-ideas">
            <Button>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Ideas
            </Button>
          </Link>
        </header>
        
        <div className="p-6">
          {/* No Brands CTA */}
          {!brandsLoading && brands.length === 0 && (
            <Card className="mb-8 overflow-hidden">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Create Your First Brand</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Set up your brand profile to start generating validated product ideas and outlines.
                </p>
                <Link to="/channels/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Brand
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
          
          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wide font-medium">Product Ideas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalIdeas}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wide font-medium">Outlines</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalOutlines}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wide font-medium">Content Sources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{sources.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wide font-medium">Brands</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{brands.length}</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Quick Actions */}
          {currentBrand && (
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <Link to="/product-ideas">
                <Card className="cursor-pointer group hover:shadow-lg transition-all">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-all">
                      <Lightbulb className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Generate Ideas</CardTitle>
                      <CardDescription>AI-powered product ideas with PMF scoring</CardDescription>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/outlines">
                <Card className="cursor-pointer group hover:shadow-lg transition-all">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-all">
                      <FileText className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Create Outline</CardTitle>
                      <CardDescription>Structure your product with AI</CardDescription>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/sources">
                <Card className="cursor-pointer group hover:shadow-lg transition-all">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-all">
                      <Rss className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Add Source</CardTitle>
                      <CardDescription>Connect blog or RSS feed</CardDescription>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/image-studio">
                <Card className="cursor-pointer group hover:shadow-lg transition-all">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-all">
                      <Palette className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Image Studio</CardTitle>
                      <CardDescription>Generate book covers, illustrations & more</CardDescription>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          )}

          {/* Top Product Ideas */}
          {topIdeas.length > 0 && (
            <Card className="mb-8">
              <CardHeader className="border-b border-border flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Top Product Ideas</CardTitle>
                  <CardDescription>Highest PMF-scoring ideas</CardDescription>
                </div>
                <Link to="/product-ideas">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {topIdeas.map((idea, i) => (
                  <div key={idea.id} className={`p-4 flex items-center gap-4 ${i < topIdeas.length - 1 ? "border-b border-border" : ""}`}>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {idea.pmf_score?.combined_score || 0}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{idea.title}</div>
                      <div className="text-sm text-muted-foreground truncate">{idea.description}</div>
                    </div>
                    <span className="text-xs bg-secondary px-2 py-1 rounded">{idea.format}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          
          {/* Getting Started */}
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle>Get Started</CardTitle>
              <CardDescription>Complete these steps to create your first digital product</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Link 
                to="/channels/new"
                className={`block p-4 border-b border-border hover:bg-accent/50 transition-colors ${brands.length > 0 ? "opacity-50" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-medium text-sm ${brands.length > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {brands.length > 0 ? "✓" : "1"}
                  </div>
                  <div>
                    <div className="font-medium">Set up your brand profile</div>
                    <div className="text-sm text-muted-foreground">Define your niche, audience, and voice</div>
                  </div>
                </div>
              </Link>
              <Link 
                to="/sources"
                className={`block p-4 border-b border-border hover:bg-accent/50 transition-colors ${sources.length > 0 ? "opacity-50" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-medium text-sm ${sources.length > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {sources.length > 0 ? "✓" : "2"}
                  </div>
                  <div>
                    <div className="font-medium">Add a content source</div>
                    <div className="text-sm text-muted-foreground">Connect your blog, RSS, or add ideas manually</div>
                  </div>
                </div>
              </Link>
              <Link to="/product-ideas" className={`block p-4 border-b border-border hover:bg-accent/50 transition-colors ${totalIdeas > 0 ? "opacity-50" : ""}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-medium text-sm ${totalIdeas > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {totalIdeas > 0 ? "✓" : "3"}
                  </div>
                  <div>
                    <div className="font-medium">Generate product ideas</div>
                    <div className="text-sm text-muted-foreground">AI validates and scores ideas with PMF metrics</div>
                  </div>
                </div>
              </Link>
              <Link to="/outlines" className={`block p-4 hover:bg-accent/50 transition-colors ${totalOutlines > 0 ? "opacity-50" : ""}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-medium text-sm ${totalOutlines > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {totalOutlines > 0 ? "✓" : "4"}
                  </div>
                  <div>
                    <div className="font-medium">Create your first outline</div>
                    <div className="text-sm text-muted-foreground">Structure your product into chapters and sections</div>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
