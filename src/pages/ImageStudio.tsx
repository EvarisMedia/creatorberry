import { useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useBrands } from "@/hooks/useBrands";
import { useGeneratedImages } from "@/hooks/useGeneratedImages";
import { ImageCard } from "@/components/images/ImageCard";
import { GenerateStudioImageDialog } from "@/components/images/GenerateStudioImageDialog";
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
  Image,
  ImagePlus,
  Palette,
} from "lucide-react";
import creatorberryLogo from "@/assets/creatorberry-logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Lightbulb, label: "Product Ideas", href: "/product-ideas" },
  { icon: FileText, label: "Outlines", href: "/outlines" },
  { icon: Palette, label: "Image Studio", href: "/image-studio" },
  { icon: Rss, label: "Sources", href: "/sources" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

const IMAGE_CATEGORIES = [
  { value: "all", label: "All Images" },
  { value: "book_cover", label: "Book Covers" },
  { value: "chapter_illustration", label: "Chapter Illustrations" },
  { value: "worksheet_bg", label: "Worksheet Backgrounds" },
  { value: "social_promo", label: "Social Promos" },
  { value: "quote_card", label: "Quote Cards" },
  { value: "visual", label: "Visuals" },
  { value: "banner", label: "Banners" },
];

const ImageStudio = () => {
  const { user, profile, isAdmin, isLoading, signOut } = useAuth();
  const { brands, currentBrand, isLoading: brandsLoading, selectBrand } = useBrands();
  const { images, isLoading: imagesLoading, fetchImages, deleteImage } = useGeneratedImages(currentBrand?.id);
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

  useEffect(() => {
    if (currentBrand?.id) {
      fetchImages();
    }
  }, [currentBrand?.id]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (href: string) => location.pathname === href;

  const getFilteredImages = (category: string) => {
    if (category === "all") return images;
    return images.filter((img) => img.image_type === category);
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

        {/* Brand Selector */}
        <div className="p-4 border-b border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-background hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  {currentBrand?.logo_url ? (
                    <img src={currentBrand.logo_url} alt={currentBrand.name} className="w-8 h-8 rounded-lg object-cover" />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm text-primary-foreground"
                      style={{ backgroundColor: currentBrand?.primary_color || "hsl(var(--primary))" }}
                    >
                      {currentBrand?.name?.charAt(0) || "?"}
                    </div>
                  )}
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
                  <div className="flex items-center gap-3">
                    {brand.logo_url ? (
                      <img src={brand.logo_url} alt={brand.name} className="w-6 h-6 rounded-md object-cover" />
                    ) : (
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center font-semibold text-xs text-primary-foreground"
                        style={{ backgroundColor: brand.primary_color || "hsl(var(--primary))" }}
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
                  location.pathname.startsWith("/admin")
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
            <h1 className="text-2xl font-semibold">Image Studio</h1>
            <p className="text-muted-foreground">Generate branded visuals for your digital products</p>
          </div>
          {currentBrand && <GenerateStudioImageDialog brand={currentBrand} onGenerated={fetchImages} />}
        </header>

        <div className="p-6">
          {!brandsLoading && !currentBrand && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Palette className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Select a Brand</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Create or select a brand to start generating images with your brand colors and style.
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

          {currentBrand && (
            <>
              {/* Image Type Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { type: "book_cover", icon: Image, title: "Book Cover", desc: "Professional ebook covers" },
                  { type: "chapter_illustration", icon: ImagePlus, title: "Chapter Art", desc: "Section header illustrations" },
                  { type: "worksheet_bg", icon: FileText, title: "Worksheet BG", desc: "Subtle background patterns" },
                  { type: "social_promo", icon: Sparkles, title: "Social Promo", desc: "Product promotion graphics" },
                ].map((item) => (
                  <Card key={item.type} className="group hover:shadow-lg transition-all cursor-pointer">
                    <CardContent className="p-5 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-all">
                        <item.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                      </div>
                      <CardTitle className="text-sm mb-1">{item.title}</CardTitle>
                      <CardDescription className="text-xs">{item.desc}</CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Gallery with Tabs */}
              <Tabs defaultValue="all">
                <div className="flex items-center justify-between mb-4">
                  <TabsList>
                    {IMAGE_CATEGORIES.map((cat) => (
                      <TabsTrigger key={cat.value} value={cat.value} className="text-xs">
                        {cat.label}
                        {cat.value !== "all" && (
                          <span className="ml-1.5 text-muted-foreground">
                            ({getFilteredImages(cat.value).length})
                          </span>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {IMAGE_CATEGORIES.map((cat) => (
                  <TabsContent key={cat.value} value={cat.value}>
                    {imagesLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : getFilteredImages(cat.value).length === 0 ? (
                      <Card>
                        <CardContent className="p-12 text-center">
                          <Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                          <h3 className="text-lg font-semibold mb-2">
                            {cat.value === "all" ? "No images yet" : `No ${cat.label.toLowerCase()} yet`}
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            Generate your first {cat.value === "all" ? "image" : cat.label.toLowerCase()} using your brand style.
                          </p>
                          <GenerateStudioImageDialog brand={currentBrand} onGenerated={fetchImages} defaultType={cat.value !== "all" ? cat.value : undefined} />
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {getFilteredImages(cat.value).map((image) => (
                          <ImageCard key={image.id} image={image} onDelete={deleteImage} />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ImageStudio;
