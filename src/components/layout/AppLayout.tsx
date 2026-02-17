import { useEffect, ReactNode } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBrands } from "@/hooks/useBrands";
import { sidebarItems } from "./sidebarItems";
import creatorberryLogo from "@/assets/creatorberry-logo.png";
import {
  Plus,
  LogOut,
  ChevronDown,
  Shield,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppLayoutProps {
  children: ReactNode;
  /** Page title shown in the header */
  title: string;
  /** Page subtitle shown below the title */
  subtitle?: string;
  /** Optional actions rendered on the right side of the header */
  headerActions?: ReactNode;
  /** If true, the header is not rendered (page manages its own header) */
  hideHeader?: boolean;
}

export function AppLayout({ children, title, subtitle, headerActions, hideHeader }: AppLayoutProps) {
  const { user, profile, isAdmin, isLoading, signOut } = useAuth();
  const { brands, currentBrand, selectBrand } = useBrands();
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

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + "/");

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
                  {currentBrand?.logo_url ? (
                    <img
                      src={currentBrand.logo_url}
                      alt={currentBrand.name}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm text-primary-foreground"
                      style={{ backgroundColor: currentBrand?.primary_color || "hsl(var(--primary))" }}
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
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {sidebarItems.map((item) => (
              <li key={item.href}>
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
        {!hideHeader && (
          <header className="p-6 bg-card border-b border-border flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{title}</h1>
              {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
            </div>
            {headerActions}
          </header>
        )}
        {children}
      </main>
    </div>
  );
}
