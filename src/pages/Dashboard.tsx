import { useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useBrands } from "@/hooks/useBrands";
import { usePins } from "@/hooks/usePins";
import { useBoards } from "@/hooks/useBoards";
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
  LayoutGrid,
  Pin,
  Image,
  Sparkles,
  Lightbulb
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
  { icon: Pin, label: "Pins", href: "/pins" },
  { icon: LayoutGrid, label: "Boards", href: "/boards" },
  { icon: Rss, label: "Sources", href: "/sources" },
  { icon: Image, label: "Images", href: "/images" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

const Dashboard = () => {
  const { user, profile, isAdmin, isLoading, signOut } = useAuth();
  const { brands, currentBrand, isLoading: brandsLoading, selectBrand } = useBrands();
  const { pins } = usePins(currentBrand?.id || null);
  const { boards } = useBoards(currentBrand?.id || null);
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
  const draftPins = pins.filter(p => p.status === "draft").length;
  const approvedPins = pins.filter(p => p.status === "approved").length;
  const publishedPins = pins.filter(p => p.status === "published").length;

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
        {/* Logo */}
        <div className="p-5 border-b border-border">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pinterest-gradient flex items-center justify-center">
              <Pin className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg">Pinterest Traffic OS</span>
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
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm text-white"
                      style={{ background: currentBrand?.primary_color ? `linear-gradient(135deg, ${currentBrand.primary_color}, ${currentBrand.secondary_color || currentBrand.primary_color})` : 'linear-gradient(135deg, hsl(350, 100%, 45%), hsl(350, 80%, 35%))' }}
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
                        className="w-6 h-6 rounded-md flex items-center justify-center font-semibold text-xs text-white"
                        style={{ background: brand.primary_color ? `linear-gradient(135deg, ${brand.primary_color}, ${brand.secondary_color || brand.primary_color})` : 'linear-gradient(135deg, hsl(350, 100%, 45%), hsl(350, 80%, 35%))' }}
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
                      ? "bg-pinterest-gradient text-white shadow-sm" 
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          
          {/* Admin Link */}
          {isAdmin && (
            <div className="mt-6 pt-6 border-t border-border">
              <Link
                to="/admin/users"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  location.pathname.startsWith('/admin')
                    ? "bg-pinterest-gradient text-white shadow-sm"
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
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center font-semibold text-sm text-primary">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="text-sm">
                <div className="font-medium">{profile?.full_name || "User"}</div>
                <div className="text-xs text-muted-foreground">Pro Plan</div>
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
        {/* Header */}
        <header className="p-6 bg-card border-b border-border flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {profile?.full_name?.split(" ")[0] || "there"}</p>
          </div>
          <Link to="/pins">
            <Button>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Pins
            </Button>
          </Link>
        </header>
        
        {/* Dashboard Content */}
        <div className="p-6">
          {/* No Brands CTA */}
          {!brandsLoading && brands.length === 0 && (
            <Card className="mb-8 overflow-hidden">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-pinterest-gradient flex items-center justify-center">
                  <Pin className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Create Your First Brand</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Set up your brand profile to start generating SEO-optimized Pinterest pins that drive traffic.
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
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wide font-medium">Total Pins</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-pinterest-gradient">{pins.length}</div>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wide font-medium">Draft Pins</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-pinterest-gradient">{draftPins}</div>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wide font-medium">Active Boards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-pinterest-gradient">{boards.length}</div>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wide font-medium">Content Sources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-pinterest-gradient">{sources.length}</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Quick Actions */}
          {currentBrand && (
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <Link to="/pins">
                <Card className="cursor-pointer group hover:shadow-lg transition-all">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent flex items-center justify-center group-hover:bg-pinterest-gradient transition-all">
                      <Pin className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Generate Pins</CardTitle>
                      <CardDescription>Create SEO-optimized pins</CardDescription>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/boards">
                <Card className="cursor-pointer group hover:shadow-lg transition-all">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent flex items-center justify-center group-hover:bg-pinterest-gradient transition-all">
                      <LayoutGrid className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Manage Boards</CardTitle>
                      <CardDescription>Organize by keywords</CardDescription>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/sources">
                <Card className="cursor-pointer group hover:shadow-lg transition-all">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent flex items-center justify-center group-hover:bg-pinterest-gradient transition-all">
                      <Rss className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Add Source</CardTitle>
                      <CardDescription>Connect blog or RSS</CardDescription>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          )}

          {/* Recent Pins Preview */}
          {currentBrand && pins.length > 0 && (
            <Card className="mb-8">
              <CardHeader className="border-b border-border flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Pins</CardTitle>
                  <CardDescription>Your latest generated pins</CardDescription>
                </div>
                <Link to="/pins">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {pins.slice(0, 6).map((pin) => (
                    <div key={pin.id} className="aspect-[2/3] rounded-lg bg-muted overflow-hidden group relative">
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
                        <Pin className="w-6 h-6 text-muted-foreground/50 mb-2" />
                        <p className="text-[10px] text-muted-foreground line-clamp-3">{pin.title}</p>
                      </div>
                      <div className="absolute top-1 right-1">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                          pin.status === 'approved' ? 'bg-green-500/20 text-green-600' :
                          pin.status === 'published' ? 'bg-primary/20 text-primary' :
                          'bg-muted-foreground/20 text-muted-foreground'
                        }`}>
                          {pin.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Getting Started */}
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle>Get Started</CardTitle>
              <CardDescription>Complete these steps to start driving Pinterest traffic</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Link 
                to="/channels/new"
                className={`block p-4 border-b border-border hover:bg-accent/50 transition-colors ${brands.length > 0 ? "opacity-50" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-medium text-sm ${brands.length > 0 ? "bg-pinterest-gradient text-white" : "bg-muted text-muted-foreground"}`}>
                    {brands.length > 0 ? "✓" : "1"}
                  </div>
                  <div>
                    <div className="font-medium">Set up your brand profile</div>
                    <div className="text-sm text-muted-foreground">Define your niche, colors, and pin style</div>
                  </div>
                </div>
              </Link>
              <Link 
                to="/boards"
                className={`block p-4 border-b border-border hover:bg-accent/50 transition-colors ${boards.length > 0 ? "opacity-50" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-medium text-sm ${boards.length > 0 ? "bg-pinterest-gradient text-white" : "bg-muted text-muted-foreground"}`}>
                    {boards.length > 0 ? "✓" : "2"}
                  </div>
                  <div>
                    <div className="font-medium">Create your first board</div>
                    <div className="text-sm text-muted-foreground">Organize pins by topic and keywords</div>
                  </div>
                </div>
              </Link>
              <Link 
                to="/sources"
                className={`block p-4 border-b border-border hover:bg-accent/50 transition-colors ${sources.length > 0 ? "opacity-50" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-medium text-sm ${sources.length > 0 ? "bg-pinterest-gradient text-white" : "bg-muted text-muted-foreground"}`}>
                    {sources.length > 0 ? "✓" : "3"}
                  </div>
                  <div>
                    <div className="font-medium">Add a content source</div>
                    <div className="text-sm text-muted-foreground">Connect your blog or RSS feed</div>
                  </div>
                </div>
              </Link>
              <Link to="/pins" className="block p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-medium text-sm ${pins.length > 0 ? "bg-pinterest-gradient text-white" : "bg-muted text-muted-foreground"}`}>
                    {pins.length > 0 ? "✓" : "4"}
                  </div>
                  <div>
                    <div className="font-medium">Generate your first pins</div>
                    <div className="text-sm text-muted-foreground">Let AI create SEO-optimized Pinterest pins</div>
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
