import { useEffect, useState } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useBrands } from "@/hooks/useBrands";
import { useProductOutlines, OutlineSection } from "@/hooks/useProductOutlines";
import { useProductIdeas } from "@/hooks/useProductIdeas";
import OutlineSectionCard from "@/components/outlines/OutlineSectionCard";
import OutlineCard from "@/components/outlines/OutlineCard";
import GenerateOutlineDialog from "@/components/outlines/GenerateOutlineDialog";
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
  BookOpen,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import creatorberryLogo from "@/assets/creatorberry-logo.png";
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
  { icon: BookOpen, label: "Content", href: "/content-editor" },
  { icon: Rss, label: "Sources", href: "/sources" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

const ProductOutlinePage = () => {
  const { outlineId } = useParams();
  const { user, profile, isAdmin, isLoading, signOut } = useAuth();
  const { brands, currentBrand, selectBrand } = useBrands();
  const { outlines, isLoading: outlinesLoading, isGenerating, generateOutline, fetchOutlineWithSections, updateSection, deleteOutline } = useProductOutlines(currentBrand?.id || null);
  const { ideas } = useProductIdeas(currentBrand?.id || null);
  const navigate = useNavigate();
  const location = useLocation();

  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [activeOutline, setActiveOutline] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) navigate("/auth");
    if (!isLoading && user && !profile?.is_approved) navigate("/pending-approval");
  }, [user, profile, isLoading, navigate]);

  // Load specific outline when outlineId is in URL
  useEffect(() => {
    if (outlineId) {
      setLoadingDetail(true);
      fetchOutlineWithSections(outlineId).then((data) => {
        setActiveOutline(data);
        setLoadingDetail(false);
      });
    } else {
      setActiveOutline(null);
    }
  }, [outlineId]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (href: string) => location.pathname.startsWith(href);

  const handleViewOutline = (id: string) => {
    navigate(`/outlines/${id}`);
  };

  const handleDeleteOutline = async (id: string) => {
    await deleteOutline(id);
    if (outlineId === id) navigate("/outlines");
  };

  const handleSectionUpdate = async (sectionId: string, updates: Partial<OutlineSection>) => {
    const success = await updateSection(sectionId, updates);
    if (success && activeOutline) {
      // Refresh detail
      const updated = await fetchOutlineWithSections(activeOutline.id);
      setActiveOutline(updated);
    }
    return success;
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
        <div className="p-3 border-b border-border">
          <Link to="/" className="flex items-center gap-3">
            <img src={creatorberryLogo} alt="CreatorBerry" className="w-40 h-auto object-contain" />
          </Link>
        </div>

        {/* Brand Selector */}
        <div className="p-4 border-b border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-background hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm text-primary-foreground"
                    style={{ backgroundColor: currentBrand?.primary_color || "hsl(var(--primary))" }}
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
                  {brand.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/channels/new" className="cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" /> Add New Brand
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {sidebarItems.map((item, i) => (
              <li key={i}>
                <Link
                  to={item.href}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive(item.href) ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-foreground"
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
              <Link to="/admin/users" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
                <Shield className="w-4 h-4" /> Admin Panel
              </Link>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center font-semibold text-sm text-primary">
                {profile?.full_name?.charAt(0) || "U"}
              </div>
              <div className="text-sm">
                <div className="font-medium">{profile?.full_name || "User"}</div>
              </div>
            </div>
            <button onClick={handleSignOut} className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <header className="p-6 bg-card border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            {outlineId && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/outlines")}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-semibold">
                {outlineId ? activeOutline?.title || "Outline" : "Product Outlines"}
              </h1>
              <p className="text-muted-foreground">
                {outlineId ? "Edit sections and structure" : "Structure your digital products"}
              </p>
            </div>
          </div>
          {!outlineId && (
            <Button onClick={() => setShowGenerateDialog(true)} disabled={!currentBrand}>
              <Sparkles className="w-4 h-4 mr-2" /> Generate Outline
            </Button>
          )}
        </header>

        <div className="p-6">
          {/* Detail View */}
          {outlineId ? (
            loadingDetail ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : activeOutline ? (
              <div className="max-w-3xl mx-auto space-y-3">
                {/* Summary */}
                <Card className="mb-6">
                  <CardContent className="p-4 flex items-center gap-4">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <span className="text-sm text-muted-foreground">
                        {activeOutline.sections?.length || 0} sections · {activeOutline.total_word_count?.toLocaleString() || 0} words target
                      </span>
                    </div>
                    <Badge variant="secondary">{activeOutline.status}</Badge>
                  </CardContent>
                </Card>

                {/* Sections */}
                {(activeOutline.sections || []).map((section: OutlineSection, i: number) => (
                  <OutlineSectionCard
                    key={section.id}
                    section={section}
                    index={i}
                    onUpdate={handleSectionUpdate}
                    outlineId={activeOutline.id}
                  />
                ))}

                {(!activeOutline.sections || activeOutline.sections.length === 0) && (
                  <div className="text-center py-12 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No sections found for this outline.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">Outline not found.</div>
            )
          ) : (
            /* List View */
            <>
              {outlinesLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : outlines.length === 0 ? (
                <div className="text-center py-16">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                  <h3 className="text-xl font-semibold mb-2">No outlines yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Generate an outline from one of your product ideas to get started.
                  </p>
                  <Button onClick={() => setShowGenerateDialog(true)} disabled={!currentBrand}>
                    <Sparkles className="w-4 h-4 mr-2" /> Generate Your First Outline
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {outlines.map((outline) => (
                    <OutlineCard
                      key={outline.id}
                      outline={outline}
                      onView={handleViewOutline}
                      onDelete={handleDeleteOutline}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Generate Dialog */}
        <GenerateOutlineDialog
          open={showGenerateDialog}
          onOpenChange={setShowGenerateDialog}
          ideas={ideas}
          brand={currentBrand}
          onGenerate={generateOutline}
          isGenerating={isGenerating}
        />
      </main>
    </div>
  );
};

export default ProductOutlinePage;
