import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import creatorberryLogo from "@/assets/creatorberry-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { useBrands } from "@/hooks/useBrands";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LayoutDashboard,
  FileText,
  Settings,
  Plus,
  LogOut,
  ChevronDown,
  Shield,
  Loader2,
  TrendingUp,
  Lightbulb,
  Palette,
  Download,
  BookOpen,
  ShoppingCart,
  Rocket,
  Library,
  HelpCircle,
  Image,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts";

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

const chartConfig = {
  count: {
    label: "Count",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const formatPostType = (type: string) => {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatStatus = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export default function Analytics() {
  const navigate = useNavigate();
  const { user, profile, isAdmin, isLoading, signOut } = useAuth();
  const { brands, currentBrand, isLoading: brandsLoading, selectBrand } = useBrands();
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics(currentBrand?.id);

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

  if (isLoading || brandsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const statusData = analytics?.postsByStatus
    ? Object.entries(analytics.postsByStatus).map(([status, count]) => ({
        name: formatStatus(status),
        count,
      }))
    : [];

  const typeData = analytics?.postsByType
    ? Object.entries(analytics.postsByType).map(([type, count]) => ({
        name: formatPostType(type),
        count,
      }))
    : [];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r-2 border-foreground bg-background flex flex-col">
        <div className="p-4 border-b-2 border-foreground">
          <Link to="/" className="flex items-center gap-2">
            <img src={creatorberryLogo} alt="CreatorBerry" className="w-40 h-auto object-contain" />
          </Link>
        </div>

        <div className="p-4 border-b-2 border-foreground">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-between p-3 border-2 border-foreground hover:bg-secondary transition-colors">
                <div className="flex items-center gap-3">
                  {currentBrand?.logo_url ? (
                    <img
                      src={currentBrand.logo_url}
                      alt={currentBrand.name}
                      className="w-8 h-8 object-cover border border-foreground"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 flex items-center justify-center font-bold text-sm border border-foreground"
                      style={{ backgroundColor: currentBrand?.primary_color || "#000" }}
                    >
                      <span style={{ color: currentBrand?.secondary_color || "#FFF" }}>
                        {currentBrand?.name?.charAt(0) || "?"}
                      </span>
                    </div>
                  )}
                  <div className="text-left">
                    <div className="font-medium text-sm truncate max-w-[120px]">
                      {currentBrand?.name || "No Brand"}
                    </div>
                    <div className="text-xs text-muted-foreground">Workspace</div>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4" />
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
                      <img src={brand.logo_url} alt={brand.name} className="w-6 h-6 object-cover" />
                    ) : (
                      <div
                        className="w-6 h-6 flex items-center justify-center font-bold text-xs"
                        style={{ backgroundColor: brand.primary_color }}
                      >
                        <span style={{ color: brand.secondary_color }}>{brand.name.charAt(0)}</span>
                      </div>
                    )}
                    <span className="truncate">{brand.name}</span>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/brands/new" className="cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Brand
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
                    location.pathname === item.href ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-foreground"
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
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium hover:bg-secondary transition-colors"
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </Link>
            </div>
          )}
        </nav>

        <div className="p-4 border-t-2 border-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-secondary border-2 border-foreground flex items-center justify-center font-bold text-sm">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="text-sm">
                <div className="font-medium">{profile?.full_name || "User"}</div>
                <div className="text-xs text-muted-foreground">Pro Plan</div>
              </div>
            </div>
            <button onClick={handleSignOut} className="p-2 hover:bg-secondary transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="p-6 border-b-2 border-foreground flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Content performance metrics for {currentBrand?.name || "your brand"}</p>
          </div>
        </header>

        <div className="p-6">
          {!currentBrand ? (
            <Card className="border-2 border-foreground">
              <CardContent className="p-8 text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">No Brand Selected</h3>
                <p className="text-muted-foreground mb-4">Select a brand to view analytics</p>
                <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
              </CardContent>
            </Card>
          ) : analyticsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid md:grid-cols-4 gap-4 mb-8">
                <Card className="border-2 border-foreground shadow-xs">
                  <CardHeader className="pb-2">
                    <CardDescription className="font-mono text-xs uppercase">Total Posts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold font-mono">{analytics?.totalPosts || 0}</div>
                  </CardContent>
                </Card>
                <Card className="border-2 border-foreground shadow-xs">
                  <CardHeader className="pb-2">
                    <CardDescription className="font-mono text-xs uppercase">Total Images</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold font-mono">{analytics?.totalImages || 0}</div>
                  </CardContent>
                </Card>
                <Card className="border-2 border-foreground shadow-xs">
                  <CardHeader className="pb-2">
                    <CardDescription className="font-mono text-xs uppercase">Active Sources</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold font-mono">{analytics?.totalSources || 0}</div>
                  </CardContent>
                </Card>
                <Card className="border-2 border-foreground shadow-xs">
                  <CardHeader className="pb-2">
                    <CardDescription className="font-mono text-xs uppercase">Scheduled</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold font-mono">{analytics?.scheduledPosts || 0}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Posts Over Time */}
                <Card className="border-2 border-foreground">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Posts Over Time
                    </CardTitle>
                    <CardDescription>Last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[200px] w-full">
                      <LineChart data={analytics?.postsOverTime || []}>
                        <XAxis
                          dataKey="date"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tickFormatter={(value) => value.slice(0, 6)}
                        />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="hsl(var(--foreground))"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Images Over Time */}
                <Card className="border-2 border-foreground">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Image className="w-5 h-5" />
                      Images Over Time
                    </CardTitle>
                    <CardDescription>Last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[200px] w-full">
                      <LineChart data={analytics?.imagesOverTime || []}>
                        <XAxis
                          dataKey="date"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tickFormatter={(value) => value.slice(0, 6)}
                        />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="hsl(var(--foreground))"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Breakdown Charts */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Posts by Status */}
                <Card className="border-2 border-foreground">
                  <CardHeader>
                    <CardTitle>Posts by Status</CardTitle>
                    <CardDescription>Distribution of post statuses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {statusData.length > 0 ? (
                      <ChartContainer config={chartConfig} className="h-[200px] w-full">
                        <BarChart data={statusData} layout="vertical">
                          <XAxis type="number" tickLine={false} axisLine={false} />
                          <YAxis
                            type="category"
                            dataKey="name"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            width={80}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="count" fill="hsl(var(--foreground))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                        No posts yet
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Posts by Type */}
                <Card className="border-2 border-foreground">
                  <CardHeader>
                    <CardTitle>Posts by Type</CardTitle>
                    <CardDescription>Distribution of post types</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {typeData.length > 0 ? (
                      <ChartContainer config={chartConfig} className="h-[200px] w-full">
                        <BarChart data={typeData} layout="vertical">
                          <XAxis type="number" tickLine={false} axisLine={false} />
                          <YAxis
                            type="category"
                            dataKey="name"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            width={120}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="count" fill="hsl(var(--foreground))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                        No posts yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
