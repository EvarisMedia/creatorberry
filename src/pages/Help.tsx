import { useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/hooks/useAuth";
import { useBrands } from "@/hooks/useBrands";
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
  BookOpen,
  ShoppingCart,
  Rocket,
  Library,
  HelpCircle,
  User,
  Layers,
  Zap,
  Target,
  BarChart3,
  Image,
  PenTool,
  Globe,
  Key,
  Keyboard,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import creatorberryLogo from "@/assets/creatorberry-logo.png";

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
  { icon: HelpCircle, label: "Help & Resources", href: "/help" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

const Help = () => {
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

  const isActive = (href: string) => location.pathname === href;

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
            <img src={creatorberryLogo} alt="CreatorBerry" className="w-14 h-14 rounded-xl object-contain" />
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
                      style={{ backgroundColor: currentBrand?.primary_color || 'hsl(var(--primary))' }}
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
        <nav className="flex-1 p-4 overflow-y-auto">
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
            <button onClick={handleSignOut} className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="p-6 bg-card border-b border-border">
          <div className="flex items-center gap-3 mb-1">
            <HelpCircle className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-semibold">Help & Resources</h1>
          </div>
          <p className="text-muted-foreground">Complete guide to building and launching digital products with CreatorBerry</p>
        </header>

        <div className="p-6 max-w-4xl space-y-6">

          {/* Getting Started */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Getting Started</CardTitle>
                  <CardDescription>Set up your account and understand the basics</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="space-y-2">
                <AccordionItem value="account-setup" className="border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline">Account Setup</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-2">
                    <p>After signing up, your account will be reviewed by an admin. Once approved, you'll have full access to CreatorBerry.</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Sign up with your email and password</li>
                      <li>Wait for admin approval (you'll see a pending screen)</li>
                      <li>Once approved, you'll land on the Dashboard</li>
                      <li>Go to <strong>Settings → API Keys</strong> and enter your Gemini API key for AI features</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="first-brand" className="border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline">Creating Your First Brand</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-2">
                    <p>Brands are the foundation of CreatorBerry. Each brand represents a distinct audience, voice, and content niche.</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Click <strong>"Add New Brand"</strong> in the sidebar brand selector</li>
                      <li>Fill in your brand name, niche, and target audience</li>
                      <li>Define your tone (professional, casual, bold, etc.)</li>
                      <li>Add your core beliefs, offers/services, and content goals</li>
                      <li>Optionally upload a logo and set brand colors</li>
                    </ol>
                    <p>The AI uses all of this context to generate content that sounds like <em>you</em>.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="dashboard-overview" className="border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline">Understanding the Dashboard</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-2">
                    <p>The Dashboard gives you an at-a-glance view of your progress:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>Stats cards</strong> — Total product ideas, outlines, content sources, and brands</li>
                      <li><strong>Quick actions</strong> — One-click access to Generate Ideas, Create Outline, Add Source, and Image Studio</li>
                      <li><strong>Top Product Ideas</strong> — Your highest PMF-scoring ideas</li>
                      <li><strong>Getting Started checklist</strong> — Track your progress through the core workflow</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Step-by-Step Workflow */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Step-by-Step Workflow</CardTitle>
                  <CardDescription>The 4-step process from idea to launched product</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="space-y-2">
                <AccordionItem value="step-1" className="border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-primary/10 text-primary border-0">Step 1</Badge>
                      <span>Set Up Your Brand</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-3">
                    <p>Your brand profile is the AI's foundation. The more detail you provide, the better your generated content will be.</p>
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">What to configure:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>Voice & Tone</strong> — Professional, casual, bold, witty, or inspirational</li>
                        <li><strong>Writing Style</strong> — Storytelling, educational, conversational, or analytical</li>
                        <li><strong>Target Audience</strong> — Who you're creating products for</li>
                        <li><strong>Core Beliefs</strong> — Your unique perspective and worldview</li>
                        <li><strong>Offers & Services</strong> — What you sell or plan to sell</li>
                        <li><strong>Content Goals</strong> — What you want your content to achieve</li>
                        <li><strong>Signature Frameworks</strong> — Your proprietary methods or systems</li>
                        <li><strong>Catchphrases</strong> — Recurring phrases that define your voice</li>
                      </ul>
                    </div>
                    <p className="text-sm">💡 <em>Tip: You can create multiple brands for different niches or audiences.</em></p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="step-2" className="border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-primary/10 text-primary border-0">Step 2</Badge>
                      <span>Generate Product Ideas</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-3">
                    <p>Use AI to brainstorm validated digital product ideas based on your brand context and content sources.</p>
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">How it works:</h4>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Navigate to <strong>Product Ideas</strong></li>
                        <li>Click <strong>"Generate Ideas"</strong></li>
                        <li>Choose the number of ideas and preferred format (ebook, course, workbook, etc.)</li>
                        <li>Optionally select content sources for context</li>
                        <li>AI generates ideas with titles, descriptions, and target audiences</li>
                      </ol>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">PMF Score Explained:</h4>
                      <p>Each idea gets a Product-Market Fit score (0–100) based on four factors:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>Demand</strong> — How much does the market want this?</li>
                        <li><strong>Fit</strong> — How well does it match your brand expertise?</li>
                        <li><strong>Gap</strong> — Is there a gap in the market?</li>
                        <li><strong>Urgency</strong> — How urgently does the audience need this?</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="step-3" className="border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-primary/10 text-primary border-0">Step 3</Badge>
                      <span>Build Your Product</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-3">
                    <p>Turn your chosen idea into a fully structured, content-rich digital product.</p>
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">Sub-steps:</h4>
                      <ol className="list-decimal list-inside space-y-2">
                        <li><strong>Generate an Outline</strong> — AI creates a detailed chapter/section structure from your product idea. Customize sections, reorder, and set word count targets.</li>
                        <li><strong>Expand Content</strong> — Click into any section and use AI to generate full-length content. Choose expansion mode (detailed, concise, storytelling) and tone.</li>
                        <li><strong>Use Templates</strong> — Browse pre-built product structures (ebooks, workbooks, guides) and fork them into your own outlines.</li>
                        <li><strong>Image Studio</strong> — Generate book covers, illustrations, chapter images, and promotional graphics using AI.</li>
                      </ol>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="step-4" className="border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-primary/10 text-primary border-0">Step 4</Badge>
                      <span>Export & Launch</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-3">
                    <p>Package your product and generate everything you need for a successful launch.</p>
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">Export Options:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>PDF</strong> — Print-ready formatted document (all plans)</li>
                        <li><strong>DOCX</strong> — Microsoft Word format (Pro & Unlimited)</li>
                        <li><strong>PPTX</strong> — PowerPoint/Slides format (Pro & Unlimited)</li>
                        <li><strong>Markdown</strong> — Plain text with formatting (Pro & Unlimited)</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">Launch Tools:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>KDP Publisher</strong> — Generate Amazon KDP metadata (title, subtitle, description, keywords, categories, pricing)</li>
                        <li><strong>Sales Pages</strong> — AI-generated sales copy using proven frameworks (PAS, AIDA, StoryBrand)</li>
                        <li><strong>Launch Toolkit</strong> — Email sequences, social media posts, and promotional assets</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Modules Reference */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Modules Reference</CardTitle>
                  <CardDescription>Detailed documentation for every module</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="space-y-2">
                <AccordionItem value="mod-dashboard" className="border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4 text-primary" />
                      <span>Dashboard</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-2">
                    <p>Your command center. View stats, quick actions, top product ideas, and a getting-started checklist. Switch between brands using the sidebar selector.</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="mod-ideas" className="border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-primary" />
                      <span>Product Ideas</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-2">
                    <p>Generate AI-powered product ideas with PMF (Product-Market Fit) scoring. Each idea includes a title, description, format, and target audience.</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Generate multiple ideas at once</li>
                      <li>Filter by format (ebook, course, workbook, etc.)</li>
                      <li>View PMF scores with demand, fit, gap, and urgency breakdowns</li>
                      <li>Convert ideas into outlines with one click</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="mod-outlines" className="border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span>Outlines</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-2">
                    <p>Create and manage detailed product outlines. Each outline contains sections with titles, descriptions, subsections, and word count targets.</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>AI generates structured outlines from product ideas</li>
                      <li>Drag and reorder sections</li>
                      <li>Edit section titles and descriptions inline</li>
                      <li>Set word count targets per section</li>
                      <li>Click into any section to expand content using the Content Editor</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="mod-templates" className="border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Library className="w-4 h-4 text-primary" />
                      <span>Templates</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-2">
                    <p>Browse a library of pre-built product structures created by admins. Fork any template to create your own outline instantly.</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Browse by category (ebook, workbook, course, etc.)</li>
                      <li>Preview template structure before forking</li>
                      <li>One-click fork creates a new outline in your account</li>
                      <li>Filter by niche or tags</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="mod-content-editor" className="border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <PenTool className="w-4 h-4 text-primary" />
                      <span>Content Editor</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-2">
                    <p>Write and expand content for each section of your outline. Use AI to generate full chapters or write manually.</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Choose expansion mode: detailed, concise, or storytelling</li>
                      <li>Set tone and style per section</li>
                      <li>AI generates content that matches your brand voice</li>
                      <li>Edit generated content freely</li>
                      <li>Track word count vs. target</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="mod-image-studio" className="border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-primary" />
                      <span>Image Studio</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-2">
                    <p>Generate AI-powered images for your products. Create book covers, chapter illustrations, promotional graphics, and more.</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Enter a text prompt describing the image you want</li>
                      <li>Choose from different styles (realistic, illustrated, minimalist, etc.)</li>
                      <li>Select image type (cover, illustration, promotional, etc.)</li>
                      <li>All generated images are saved to your library</li>
                      <li>Download or attach images to your products</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="mod-export" className="border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-primary" />
                      <span>Export Center</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-2">
                    <p>Export your completed products in multiple formats. View export history and re-download previous exports.</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Select a product outline to export</li>
                      <li>Choose format: PDF, DOCX, PPTX, or Markdown</li>
                      <li>Configure export settings (include images, table of contents, etc.)</li>
                      <li>Track export status (processing, completed, failed)</li>
                      <li>Download completed exports anytime</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="mod-kdp" className="border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <span>KDP Publisher</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-2">
                    <p>Generate optimized metadata for Amazon Kindle Direct Publishing. AI creates everything you need to list your product on Amazon.</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>AI-generated title and subtitle optimized for Amazon search</li>
                      <li>Full product description with HTML formatting</li>
                      <li>7 backend keywords for maximum discoverability</li>
                      <li>Category suggestions (BISAC codes)</li>
                      <li>Pricing recommendations with royalty analysis</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="mod-sales" className="border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-primary" />
                      <span>Sales Pages</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-2">
                    <p>Create high-converting sales pages using proven copywriting frameworks.</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>PAS</strong> — Problem, Agitation, Solution</li>
                      <li><strong>AIDA</strong> — Attention, Interest, Desire, Action</li>
                      <li><strong>StoryBrand</strong> — Hero's journey narrative framework</li>
                      <li>AI generates headline, subheadline, sections, and CTA</li>
                      <li>Edit and customize every section</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="mod-launch" className="border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Rocket className="w-4 h-4 text-primary" />
                      <span>Launch Toolkit</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-2">
                    <p>Generate complete launch assets for your product including email sequences, social posts, and promotional content.</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Email launch sequence (announcement, value, urgency, last chance)</li>
                      <li>Social media posts for multiple platforms</li>
                      <li>Promotional graphics suggestions</li>
                      <li>All content matches your brand voice</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="mod-sources" className="border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Rss className="w-4 h-4 text-primary" />
                      <span>Sources</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-2">
                    <p>Connect content sources that the AI uses as context when generating ideas and content.</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Add RSS feeds, blog URLs, or paste text content</li>
                      <li>Set priority levels (high, medium, low)</li>
                      <li>Assign funnel stages (awareness, consideration, decision)</li>
                      <li>Sources feed into product idea generation for more relevant results</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="mod-settings" className="border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-primary" />
                      <span>Settings</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-2">
                    <p>Configure your account, API keys, and content generation preferences.</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>API Keys</strong> — Enter your Gemini API key for AI features</li>
                      <li><strong>Preferred Models</strong> — Choose default text and image generation models</li>
                      <li><strong>Content Defaults</strong> — Set default post type, length, and media format</li>
                      <li><strong>Notifications</strong> — Configure email and in-app notification preferences</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                  <CardDescription>Common questions about CreatorBerry</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="space-y-2">
                <AccordionItem value="faq-1" className="border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline">What API key do I need?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    CreatorBerry uses Google's Gemini AI for content generation. You'll need a free Gemini API key from Google AI Studio. Go to <strong>Settings → API Keys</strong> to enter it. Without this key, AI features like idea generation and content expansion won't work.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-2" className="border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline">Can I create multiple brands?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes! You can create as many brands as your plan allows. Each brand has its own voice, audience, sources, and content. Switch between brands using the dropdown in the sidebar.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-3" className="border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline">What product formats are supported?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    CreatorBerry supports ebooks, guides, workbooks, slide decks, template packs, checklists, courses, and more. You can select the format when generating ideas or creating outlines.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-4" className="border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline">How does PMF scoring work?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    PMF (Product-Market Fit) scores are AI-generated ratings from 0–100 based on four dimensions: Demand (market interest), Fit (alignment with your brand), Gap (market opportunity), and Urgency (buyer motivation). Higher scores indicate stronger product-market fit.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-5" className="border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline">What export formats are available?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Starter plans include PDF export. Pro and Unlimited plans unlock DOCX (Word), PPTX (PowerPoint), and Markdown exports. All exports are professionally formatted and ready to publish or sell.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-6" className="border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline">Can I edit AI-generated content?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Absolutely. All AI-generated content — ideas, outlines, expanded chapters, sales copy, and launch assets — is fully editable. The AI gives you a strong starting point; you refine it to perfection.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Tips & Shortcuts */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Tips & Best Practices</CardTitle>
                  <CardDescription>Get the most out of CreatorBerry</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 rounded-xl border border-border bg-background space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Be Specific with Your Brand
                  </h4>
                  <p className="text-sm text-muted-foreground">The more detail you add to your brand profile (beliefs, frameworks, catchphrases), the more personalized and on-brand your generated content will be.</p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-background space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Rss className="w-4 h-4 text-primary" />
                    Add Multiple Sources
                  </h4>
                  <p className="text-sm text-muted-foreground">Connect several content sources (blogs, RSS feeds, notes) to give the AI richer context for generating relevant product ideas.</p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-background space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    Use PMF Scores
                  </h4>
                  <p className="text-sm text-muted-foreground">Don't just pick the first idea — compare PMF scores. Ideas scoring 70+ have the strongest product-market fit potential.</p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-background space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Library className="w-4 h-4 text-primary" />
                    Start with Templates
                  </h4>
                  <p className="text-sm text-muted-foreground">If you're unsure how to structure a product, browse the Template Library first. Fork a proven structure and customize it.</p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-background space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary" />
                    Generate Images Early
                  </h4>
                  <p className="text-sm text-muted-foreground">Create your book cover and key images in Image Studio before exporting. This makes your final product look more professional.</p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-background space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-primary" />
                    Use the Full Launch Toolkit
                  </h4>
                  <p className="text-sm text-muted-foreground">Don't just export — generate your KDP metadata, sales page, and launch emails. A complete launch package dramatically increases your chances of success.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Help;
