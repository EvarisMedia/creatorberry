import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useBrands } from "@/hooks/useBrands";
import { useProductOutlines } from "@/hooks/useProductOutlines";
import { useProductExports } from "@/hooks/useProductExports";
import {
  LayoutDashboard,
  Rss,
  Settings,
  Sparkles,
  Lightbulb,
  FileText,
  Palette,
  Download,
  LogOut,
  ChevronDown,
  Shield,
  Loader2,
  Plus,
  FileDown,
  FileCode,
  FileType,
  Braces,
  Trash2,
  Clock,
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
  { icon: Palette, label: "Image Studio", href: "/image-studio" },
  { icon: Download, label: "Export Center", href: "/export-center" },
  { icon: Rss, label: "Sources", href: "/sources" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

const formatOptions = [
  {
    value: "markdown",
    label: "Markdown",
    description: "Universal format, great for blogs and documentation",
    icon: FileDown,
    badge: "Popular",
  },
  {
    value: "html",
    label: "HTML",
    description: "Styled web page with professional formatting",
    icon: FileCode,
    badge: "Web",
  },
  {
    value: "txt",
    label: "Plain Text",
    description: "Simple text format, compatible with any editor",
    icon: FileType,
    badge: null,
  },
  {
    value: "json",
    label: "JSON",
    description: "Structured data format for developers",
    icon: Braces,
    badge: "Dev",
  },
];

function formatFileSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ExportCenter() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isAdmin, isLoading, signOut } = useAuth();
  const { brands, currentBrand, isLoading: brandsLoading, selectBrand } = useBrands();
  const { outlines } = useProductOutlines(currentBrand?.id || null);
  const { exports, isLoading: exportsLoading, exportProduct, deleteExport } = useProductExports(currentBrand?.id);

  const [selectedOutline, setSelectedOutline] = useState<string>("");
  const [selectedFormat, setSelectedFormat] = useState<string>("markdown");
  const [includeToc, setIncludeToc] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) navigate("/auth");
    if (!isLoading && user && !profile?.is_approved) navigate("/pending-approval");
  }, [user, profile, isLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (href: string) => location.pathname === href;

  const handleExport = () => {
    if (!selectedOutline) return;
    exportProduct.mutate({
      outlineId: selectedOutline,
      format: selectedFormat,
      settings: { includeToc },
    });
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
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm text-primary-foreground"
                    style={{ backgroundColor: currentBrand?.primary_color || "hsl(var(--primary))" }}
                  >
                    {currentBrand?.name?.charAt(0) || "?"}
                  </div>
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

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <header className="p-6 bg-card border-b border-border">
          <h1 className="text-2xl font-semibold">Export Center</h1>
          <p className="text-muted-foreground">Export your products in multiple formats</p>
        </header>

        <div className="p-6 space-y-6">
          {/* New Export */}
          <Card>
            <CardHeader>
              <CardTitle>Create Export</CardTitle>
              <CardDescription>Select a product outline and format to export</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Outline Selector */}
              <div className="space-y-2">
                <Label>Product Outline</Label>
                <Select value={selectedOutline} onValueChange={setSelectedOutline}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an outline to export..." />
                  </SelectTrigger>
                  <SelectContent>
                    {outlines.map((outline) => (
                      <SelectItem key={outline.id} value={outline.id}>
                        {outline.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {outlines.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No outlines yet.{" "}
                    <Link to="/outlines" className="text-primary hover:underline">
                      Create one first
                    </Link>
                  </p>
                )}
              </div>

              {/* Format Cards */}
              <div className="space-y-2">
                <Label>Export Format</Label>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {formatOptions.map((fmt) => (
                    <button
                      key={fmt.value}
                      onClick={() => setSelectedFormat(fmt.value)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedFormat === fmt.value
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/50 hover:bg-accent/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <fmt.icon className="w-5 h-5 text-primary" />
                        <span className="font-medium text-sm">{fmt.label}</span>
                        {fmt.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {fmt.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{fmt.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Settings */}
              <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-background">
                <Switch id="toc" checked={includeToc} onCheckedChange={setIncludeToc} />
                <Label htmlFor="toc" className="cursor-pointer">Include Table of Contents</Label>
              </div>

              {/* Export Button */}
              <Button
                onClick={handleExport}
                disabled={!selectedOutline || exportProduct.isPending}
                className="w-full"
                size="lg"
              >
                {exportProduct.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Export...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export as {formatOptions.find((f) => f.value === selectedFormat)?.label}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Export History */}
          <Card>
            <CardHeader>
              <CardTitle>Export History</CardTitle>
              <CardDescription>Your recent exports</CardDescription>
            </CardHeader>
            <CardContent>
              {exportsLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : exports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileDown className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>No exports yet. Create your first export above.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {exports.map((exp) => (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileDown className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{exp.title}</div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {exp.format.toUpperCase()}
                            </Badge>
                            <span>{formatFileSize(exp.file_size)}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(exp.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteExport.mutate(exp.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
