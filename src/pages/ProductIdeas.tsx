import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useBrands } from "@/hooks/useBrands";
import { useProductIdeas } from "@/hooks/useProductIdeas";
import { ProductIdeaCard } from "@/components/product-ideas/ProductIdeaCard";
import { GenerateIdeasDialog } from "@/components/product-ideas/GenerateIdeasDialog";
import { AddIdeaDialog } from "@/components/product-ideas/AddIdeaDialog";
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
  Lightbulb,
  Filter,
} from "lucide-react";
import creatorberryLogo from "@/assets/creatorberry-logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Lightbulb, label: "Product Ideas", href: "/product-ideas" },
  { icon: Pin, label: "Pins", href: "/pins" },
  { icon: LayoutGrid, label: "Boards", href: "/boards" },
  
  { icon: Image, label: "Images", href: "/images" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

const ProductIdeas = () => {
  const { user, profile, isAdmin, isLoading, signOut } = useAuth();
  const { brands, currentBrand, isLoading: brandsLoading, selectBrand } = useBrands();
  const { ideas, isLoading: ideasLoading, isGenerating, generateIdeas, createIdea, updateIdeaStatus, deleteIdea } = useProductIdeas(currentBrand?.id || null);
  const navigate = useNavigate();
  const location = useLocation();

  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [sortBy, setSortBy] = useState("score");

  useEffect(() => {
    if (!isLoading && !user) navigate("/auth");
    if (!isLoading && user && !profile?.is_approved) navigate("/pending-approval");
  }, [user, profile, isLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (href: string) => location.pathname === href;

  const handleGenerate = async (numberOfIdeas: number, seedPrompt?: string) => {
    if (!currentBrand) return;
    await generateIdeas(currentBrand, numberOfIdeas, seedPrompt);
  };

  const handleAddIdea = async (idea: { title: string; description: string; format: string; target_audience: string }) => {
    setIsAdding(true);
    await createIdea(idea);
    setIsAdding(false);
  };

  // Filter and sort ideas
  const filteredIdeas = ideas
    .filter((idea) => statusFilter === "all" || idea.status === statusFilter)
    .filter((idea) => formatFilter === "all" || idea.format === formatFilter)
    .sort((a, b) => {
      if (sortBy === "score") {
        return (b.pmf_score?.combined_score || 0) - (a.pmf_score?.combined_score || 0);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const uniqueFormats = [...new Set(ideas.map((i) => i.format))];

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
            <img src={creatorberryLogo} alt="CreatorBerry" className="w-24 h-24 rounded-xl object-contain" />
          </Link>
        </div>

        {/* Brand Selector */}
        <div className="p-4 border-b border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-background hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm text-white"
                    style={{
                      background: currentBrand?.primary_color
                        ? `linear-gradient(135deg, ${currentBrand.primary_color}, ${currentBrand.secondary_color || currentBrand.primary_color})`
                        : "linear-gradient(135deg, hsl(350, 100%, 45%), hsl(350, 80%, 35%))",
                    }}
                  >
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
                <Link to="/channels/new" className="cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Brand
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

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
          {isAdmin && (
            <div className="mt-6 pt-6 border-t border-border">
              <Link
                to="/admin/users"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </Link>
            </div>
          )}
        </nav>

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
            <button onClick={handleSignOut} className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="p-6 bg-card border-b border-border flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Product Ideas</h1>
            <p className="text-muted-foreground">Generate and validate digital product ideas with PMF scoring</p>
          </div>
          <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setAddDialogOpen(true)} disabled={!currentBrand}>
            <Plus className="w-4 h-4 mr-2" />
            Add Manually
          </Button>
          <Button onClick={() => setGenerateDialogOpen(true)} disabled={!currentBrand || isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Ideas
              </>
            )}
          </Button>
          </div>
        </header>

        <div className="p-6">
          {/* No Brand State */}
          {!brandsLoading && brands.length === 0 && (
            <Card className="mb-8">
              <CardContent className="p-8 text-center">
                <Lightbulb className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Create a Brand First</h3>
                <p className="text-muted-foreground mb-4">You need a brand profile before generating product ideas.</p>
                <Link to="/channels/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Brand
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          {ideas.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="saved">Saved</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select value={formatFilter} onValueChange={setFormatFilter}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formats</SelectItem>
                  {uniqueFormats.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">Highest PMF Score</SelectItem>
                  <SelectItem value="date">Most Recent</SelectItem>
                </SelectContent>
              </Select>

              <Badge variant="outline" className="ml-auto">
                {filteredIdeas.length} idea{filteredIdeas.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          )}

          {/* Ideas Grid */}
          {ideasLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredIdeas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIdeas.map((idea) => (
                <ProductIdeaCard
                  key={idea.id}
                  idea={idea}
                  onStatusChange={updateIdeaStatus}
                  onDelete={deleteIdea}
                />
              ))}
            </div>
          ) : ideas.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Lightbulb className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
                <h3 className="text-xl font-semibold mb-2">No Product Ideas Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Generate AI-powered product ideas based on your brand profile and content sources. Each idea comes with a Product-Market Fit score.
                </p>
                <Button onClick={() => setGenerateDialogOpen(true)} disabled={!currentBrand}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Your First Ideas
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No ideas match your filters.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <GenerateIdeasDialog
        open={generateDialogOpen}
        onOpenChange={setGenerateDialogOpen}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
      />
      <AddIdeaDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddIdea}
        isAdding={isAdding}
      />
    </div>
  );
};

export default ProductIdeas;
