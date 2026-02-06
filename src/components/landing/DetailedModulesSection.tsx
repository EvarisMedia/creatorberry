import { Brain, FileText, Lightbulb, List, Expand, Image, Download, FileCheck, Rocket, Bot, CheckCircle, Sparkles, TrendingUp, Target, Puzzle, Clock, FileEdit, MessageSquare, ClipboardList, Gift, BookMarked, Globe, DollarSign, FileType, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// PMF Score dimensions for the Product Validation module
const pmfScores = [
  {
    id: "demand",
    icon: TrendingUp,
    title: "Demand Score",
    question: "Is there proven interest?",
    description: "Analyzes search trends, social mentions, and competitor products to gauge market demand."
  },
  {
    id: "fit",
    icon: Target,
    title: "Fit Score",
    question: "Does it match your expertise?",
    description: "Compares against your brand profile, content history, and audience alignment."
  },
  {
    id: "gap",
    icon: Puzzle,
    title: "Gap Score",
    question: "Is the market underserved?",
    description: "Identifies unmet needs and gaps in existing competitor products."
  },
  {
    id: "urgency",
    icon: Clock,
    title: "Urgency Score",
    question: "Do people need this now?",
    description: "Measures time-sensitivity, current relevance, and trending topics."
  }
];

// Pre-validation tools for the Product Validation module
const validationTools = [
  {
    id: "waitlist",
    icon: FileEdit,
    title: "Waitlist Page Generator",
    description: "Complete landing page copy with headline, benefits, and CTA to capture early interest."
  },
  {
    id: "social",
    icon: MessageSquare,
    title: "\"Coming Soon\" Social Posts",
    description: "Platform-specific posts for Twitter, LinkedIn, and Instagram to build anticipation."
  },
  {
    id: "survey",
    icon: ClipboardList,
    title: "Interest Survey Builder",
    description: "5-10 targeted questions to validate demand and discover ideal pricing."
  },
  {
    id: "mini",
    icon: Gift,
    title: "Mini-Version Creator",
    description: "Outline for a free sample (checklist, guide, chapter) to test engagement."
  }
];

const modules = [
  {
    id: "brand-memory",
    icon: Brain,
    headline: "Your AI That Remembers Everything About Your Brand",
    description: "Set up your brand once, and AI learns your voice, audience, and style. Every piece of content it creates will sound authentically you.",
    capabilities: [
      "Brand profile setup (name, niche, tagline, mission)",
      "Voice & tone training (POV statements, beliefs, signature phrases)",
      "Audience mapping (demographics, pain points, desires, language)",
      "Expertise definition (topics, frameworks, methodologies)",
      "Automatic context injection into all AI prompts"
    ],
    badge: null,
    gradient: "from-purple-500/20 to-pink-500/20",
    isExpanded: false
  },
  {
    id: "content-ingestion",
    icon: FileText,
    headline: "Turn Your Existing Content Into Product Fuel",
    description: "Import content from anywhere — blogs, videos, notes — and let AI extract the insights, topics, and themes that become your products.",
    capabilities: [
      "Blog/Article URL import with automatic extraction",
      "YouTube video transcript extraction",
      "RSS feed monitoring for ongoing content",
      "Manual text/notes input for ideas",
      "AI-powered topic, theme, and insight extraction",
      "Pain point and desire identification"
    ],
    badge: null,
    gradient: "from-blue-500/20 to-cyan-500/20",
    isExpanded: false
  },
  {
    id: "product-validation",
    icon: Lightbulb,
    headline: "Never Wonder What to Create — And Know It'll Sell",
    description: "AI analyzes your content sources and audience to generate profitable product ideas, then helps you validate them before you invest time building.",
    capabilities: [],
    badge: null,
    gradient: "from-yellow-500/20 to-orange-500/20",
    isExpanded: true // This module gets special treatment
  },
  {
    id: "outline-generator",
    icon: List,
    headline: "From Blank Page to Complete Structure in Minutes",
    description: "AI creates smart, logical outlines for your products — chapters, modules, sections — all organized for maximum learner transformation.",
    capabilities: [
      "Smart outline generation based on product type",
      "Logical flow with exercises and action items",
      "Drag-and-drop outline editor",
      "Add, remove, or regenerate sections",
      "Multiple structure templates (linear, modular, workshop-style)",
      "Outline export and sharing"
    ],
    badge: null,
    gradient: "from-green-500/20 to-emerald-500/20",
    isExpanded: false
  },
  {
    id: "content-expansion",
    icon: Expand,
    headline: "Full Chapters, Not Just Outlines",
    description: "Expand any outline section into complete, polished content. Choose your style — beginner-friendly, advanced, action-oriented, or story-driven.",
    capabilities: [
      "Section-by-section content generation",
      "4 Expansion Modes:",
      "→ Beginner-friendly: Clear explanations, no jargon",
      "→ Advanced: Deep dives for experienced audiences",
      "→ Action-oriented: Heavy on exercises and implementation",
      "→ Story-driven: Narrative-based with examples",
      "Exercises, examples, and case studies included",
      "Consistent voice throughout (uses Brand Memory)"
    ],
    badge: null,
    gradient: "from-indigo-500/20 to-purple-500/20",
    isExpanded: false
  },
  {
    id: "image-studio",
    icon: Image,
    headline: "Professional Visuals Without Design Skills",
    description: "AI generates on-brand covers, graphics, worksheets, and slides. Your brand colors and style are automatically applied.",
    capabilities: [
      "Book/ebook cover generation",
      "Workbook pages and worksheet templates",
      "Presentation slide designs",
      "Social media graphics",
      "Infographics and diagrams",
      "Automatic brand color & style consistency",
      "Multiple style variations to choose from"
    ],
    badge: null,
    gradient: "from-pink-500/20 to-rose-500/20",
    isExpanded: false
  },
  {
    id: "export-engine",
    icon: Download,
    headline: "One Click to Sell-Ready Files",
    description: "Export your products in any format, professionally formatted with your brand styling. Ready to upload to Gumroad, Teachable, or any platform.",
    capabilities: [
      "PDF export (all plans) - Print-ready quality",
      "DOCX export (Pro+) - Editable Word documents",
      "PPTX/Slides export (Pro+) - Presentation files",
      "Markdown export (Pro+) - For Notion, Ghost, etc.",
      "ZIP bundle with all assets included",
      "Brand styling applied automatically"
    ],
    badge: null,
    gradient: "from-teal-500/20 to-cyan-500/20",
    isExpanded: false
  },
  {
    id: "sales-page",
    icon: FileCheck,
    headline: "Complete Sales Pages That Convert",
    description: "AI generates complete, high-converting sales page copy using proven frameworks. Every section designed to move visitors from curious to customer.",
    capabilities: [
      "Complete sales page sections: Hero, Problem, Solution, Features, Social Proof, Pricing, FAQ, CTA",
      "3 Sales Page Frameworks:",
      "→ PAS (Problem-Agitate-Solution)",
      "→ AIDA (Attention-Interest-Desire-Action)",
      "→ Story-Based (Transformation narrative)",
      "Risk reversal & guarantee copy",
      "Export as HTML, Markdown, or copy-paste text"
    ],
    badge: "Pro & Unlimited",
    gradient: "from-amber-500/20 to-yellow-500/20",
    isExpanded: false
  },
  {
    id: "launch-assets",
    icon: Rocket,
    headline: "Everything You Need for a Successful Launch",
    description: "AI creates your complete launch toolkit — emails, social posts, and a day-by-day launch plan. Go from product to launch in hours.",
    capabilities: [
      "Launch Timeline Generator: Day-by-day launch plan",
      "Email Sequence Generator:",
      "→ Pre-launch teaser & announcement emails",
      "→ Cart open/reminder & urgency emails",
      "→ Post-purchase follow-up sequence",
      "Social Media Post Drafts (Twitter, LinkedIn, Instagram)",
      "Offer & Pricing Recommendations"
    ],
    badge: "Pro & Unlimited",
    gradient: "from-red-500/20 to-orange-500/20",
    isExpanded: false
  },
  {
    id: "ai-copilot",
    icon: Bot,
    headline: "Your Personal Product Strategy Advisor",
    description: "An intelligent AI assistant that knows your brand, products, and goals. Ask anything — get personalized recommendations, next steps, and strategic guidance.",
    capabilities: [
      "Contextual Assistance:",
      "→ \"What product should I create next?\"",
      "→ \"Is this idea worth building?\"",
      "→ \"How should I price this?\"",
      "Personalized Recommendations based on your brand & audience",
      "Strategic Guidance: Product roadmap, launch timing, pricing strategy",
      "Always available chat interface from any page",
      "Remembers previous conversations"
    ],
    badge: "Unlimited Only",
    gradient: "from-violet-500/20 to-purple-500/20",
    isExpanded: false
  },
  {
    id: "amazon-kdp",
    icon: BookMarked,
    headline: "Publish to Amazon Kindle & Reach Millions of Readers",
    description: "Export your ebooks and print books in KDP-ready format. Upload directly to Amazon Kindle Direct Publishing and start selling on the world's largest bookstore in 72 hours.",
    capabilities: [
      "Kindle eBook export (.epub) with proper metadata",
      "Print-ready PDF formatting (paperback & hardcover)",
      "KDP-compliant cover generation with spine calculator",
      "Book description & A+ content generator",
      "7 backend keyword suggestions for discoverability",
      "Category recommendations for Amazon search",
      "Royalty calculator (70% vs 35% tier optimization)",
      "Global marketplace publishing guidance"
    ],
    badge: "Pro & Unlimited",
    gradient: "from-orange-500/20 to-amber-500/20",
    isExpanded: true // This module gets special treatment
  }
];

// KDP Stats for the Amazon module
const kdpStats = [
  { value: "70%", label: "eBook Royalty", icon: DollarSign },
  { value: "60%", label: "Print Royalty", icon: DollarSign },
  { value: "10+", label: "Countries", icon: Globe },
  { value: "72hrs", label: "To Go Live", icon: Clock }
];

// KDP Features breakdown
const kdpFeatures = [
  {
    id: "formatting",
    icon: FileType,
    title: "KDP-Ready Formatting",
    items: [
      "Kindle eBook format (.epub, .mobi) with proper metadata",
      "Paperback interior PDF (6x9, 5.5x8.5, custom sizes)",
      "Hardcover interior PDF with bleed settings"
    ]
  },
  {
    id: "covers",
    icon: Layers,
    title: "Cover Generation",
    items: [
      "KDP-compliant cover dimensions",
      "Spine calculator for print books",
      "Back cover copy generator"
    ]
  },
  {
    id: "metadata",
    icon: FileText,
    title: "Metadata & Listing",
    items: [
      "Book description generator (A+ content ready)",
      "Keyword research suggestions (7 backend keywords)",
      "Category recommendations for discoverability"
    ]
  },
  {
    id: "royalty",
    icon: DollarSign,
    title: "Royalty Optimization",
    items: [
      "Pricing calculator for 70% vs 35% royalty tiers",
      "Kindle Unlimited enrollment guidance",
      "Global marketplace recommendations"
    ]
  }
];

// Component for rendering the expanded Amazon KDP section
const AmazonKDPExpanded = () => {
  return (
    <div className="space-y-12">
      {/* Intro */}
      <div className="text-center max-w-3xl mx-auto">
        <p className="text-lg text-muted-foreground">
          Turn your digital products into <span className="text-primary font-semibold">passive income on Amazon</span>. Our KDP integration handles formatting, covers, and metadata — you just upload and start earning.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kdpStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/20">
              <CardContent className="p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Feature Breakdown */}
      <div className="space-y-6">
        <div className="text-center">
          <Badge variant="outline" className="mb-3 border-orange-500/30 text-orange-600 dark:text-orange-400">
            Complete KDP Toolkit
          </Badge>
          <h4 className="text-2xl font-bold text-foreground">
            Everything You Need to Publish on Amazon
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {kdpFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.id} className="bg-card/50 border-border/50 hover:border-orange-500/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-foreground mb-2">{feature.title}</h5>
                      <ul className="space-y-1">
                        {feature.items.map((item, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/20">
        <CardContent className="p-8 text-center">
          <BookMarked className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h4 className="text-xl font-semibold text-foreground mb-2">
            Ready to Become a Published Author?
          </h4>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Join thousands of creators who've published their expertise on Amazon and built passive income streams with KDP.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

// Component for rendering the expanded Product Validation section
const ProductValidationExpanded = () => {
  return (
    <div className="space-y-12">
      {/* Intro */}
      <div className="text-center max-w-3xl mx-auto">
        <p className="text-lg text-muted-foreground">
          Stop guessing which products to build. Our AI-powered validation engine analyzes your content, audience, and market to surface ideas that are <span className="text-primary font-semibold">proven to sell</span>.
        </p>
      </div>

      {/* How It Works Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-primary">1</span>
            </div>
            <h4 className="font-semibold text-foreground mb-2">AI Scans Your Content</h4>
            <p className="text-sm text-muted-foreground">
              Analyzes your blogs, videos, notes, and audience data to identify recurring themes and opportunities.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-primary">2</span>
            </div>
            <h4 className="font-semibold text-foreground mb-2">Generates Product Ideas</h4>
            <p className="text-sm text-muted-foreground">
              Creates 5-10 tailored product ideas with titles, descriptions, formats, and target audience recommendations.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-primary">3</span>
            </div>
            <h4 className="font-semibold text-foreground mb-2">Scores & Validates</h4>
            <p className="text-sm text-muted-foreground">
              Rates each idea with PMF scoring and provides tools to validate demand before you build.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* PMF Scoring System */}
      <div className="space-y-6">
        <div className="text-center">
          <Badge variant="outline" className="mb-3 border-primary/30 text-primary">
            Product-Market Fit Scoring
          </Badge>
          <h4 className="text-2xl font-bold text-foreground">
            Know Your Idea's Potential Before Building
          </h4>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Each product idea receives a 0-100 PMF score based on four key dimensions. Focus on ideas scoring 70+ for the best chance of success.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pmfScores.map((score) => {
            const Icon = score.icon;
            return (
              <Card key={score.id} className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h5 className="font-semibold text-foreground">{score.title}</h5>
                  </div>
                  <p className="text-sm font-medium text-primary mb-2">{score.question}</p>
                  <p className="text-sm text-muted-foreground">{score.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Visual PMF Score Example */}
        <Card className="bg-card/50 border-border/50 overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Score Gauges */}
              <div className="flex-1 grid grid-cols-2 gap-6">
                {pmfScores.map((score, index) => {
                  const exampleScores = [85, 92, 78, 88];
                  const percentage = exampleScores[index];
                  return (
                    <div key={score.id} className="text-center">
                      <div className="relative w-20 h-20 mx-auto mb-2">
                        <svg className="w-20 h-20 transform -rotate-90">
                          <circle
                            cx="40"
                            cy="40"
                            r="35"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            className="text-muted/20"
                          />
                          <circle
                            cx="40"
                            cy="40"
                            r="35"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray={`${percentage * 2.2} 220`}
                            className="text-primary"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground">
                          {percentage}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{score.title.split(' ')[0]}</p>
                    </div>
                  );
                })}
              </div>

              {/* Combined Score */}
              <div className="text-center md:border-l md:border-border md:pl-8">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-muted/20"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray="308 352"
                      className="text-primary"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-foreground">
                    86
                  </span>
                </div>
                <Badge className="bg-primary/20 text-primary border-primary/30 mb-2">
                  Strong Opportunity
                </Badge>
                <p className="text-sm text-muted-foreground">Combined PMF Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pre-Validation Toolkit */}
      <div className="space-y-6">
        <div className="text-center">
          <Badge variant="outline" className="mb-3 border-primary/30 text-primary">
            Pre-Validation Toolkit
          </Badge>
          <h4 className="text-2xl font-bold text-foreground">
            Validate Demand Before You Build
          </h4>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Don't waste weeks creating a product nobody wants. Use these AI-generated tools to test interest and gather feedback first.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {validationTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card key={tool.id} className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-foreground mb-1">{tool.title}</h5>
                      <p className="text-sm text-muted-foreground">{tool.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/20 inline-block">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3 justify-center mb-2">
              <Lightbulb className="w-6 h-6 text-primary" />
              <span className="font-semibold text-foreground">One-Click Workflow</span>
            </div>
            <p className="text-muted-foreground max-w-md">
              Found a winning idea? Click "Build This Product" to instantly start creating with all context pre-loaded.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const DetailedModulesSection = () => {
  return (
    <section id="modules" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
            <Sparkles className="w-3 h-3 mr-1" />
            Complete Feature Suite
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">
            Everything You Need to Create & Sell
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            From brand setup to product launch — Creator OS handles every step of turning your expertise into profitable digital products.
          </p>
        </div>

        {/* Modules */}
        <div className="space-y-16 md:space-y-24">
          {modules.map((module, index) => {
            const Icon = module.icon;
            const isReversed = index % 2 === 1;
            
            // Special expanded treatment for product-validation
            if (module.isExpanded) {
              return (
                <div key={module.id} className="space-y-12">
                  {/* Module Header */}
                  <div className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 lg:gap-16 items-center`}>
                    {/* Visual Side */}
                    <div className="w-full lg:w-1/2">
                      <div className={`relative rounded-3xl bg-gradient-to-br ${module.gradient} p-8 md:p-12 border border-border/50`}>
                        <div className="flex items-center justify-center h-48 md:h-64">
                          <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl" />
                            <Icon className="w-24 h-24 md:w-32 md:h-32 text-primary relative z-10" strokeWidth={1} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content Side */}
                    <div className="w-full lg:w-1/2 space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <Badge variant="outline" className="border-yellow-500/30 text-yellow-600 bg-yellow-500/10">
                          Key Feature
                        </Badge>
                      </div>
                      
                      <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                        {module.headline}
                      </h3>
                      
                      <p className="text-muted-foreground text-lg">
                        {module.description}
                      </p>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {module.id === "product-validation" && <ProductValidationExpanded />}
                  {module.id === "amazon-kdp" && <AmazonKDPExpanded />}
                </div>
              );
            }
            
            return (
              <div 
                key={module.id}
                className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 lg:gap-16 items-center`}
              >
                {/* Visual Side */}
                <div className="w-full lg:w-1/2">
                  <div className={`relative rounded-3xl bg-gradient-to-br ${module.gradient} p-8 md:p-12 border border-border/50`}>
                    <div className="absolute top-4 right-4">
                      {module.badge && (
                        <Badge className="bg-primary text-primary-foreground">
                          {module.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-center h-48 md:h-64">
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl" />
                        <Icon className="w-24 h-24 md:w-32 md:h-32 text-primary relative z-10" strokeWidth={1} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Side */}
                <div className="w-full lg:w-1/2 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    {module.badge && (
                      <Badge variant="outline" className="border-primary/30 text-primary text-xs">
                        {module.badge}
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                    {module.headline}
                  </h3>
                  
                  <p className="text-muted-foreground text-lg">
                    {module.description}
                  </p>
                  
                  <ul className="space-y-3">
                    {module.capabilities.map((capability, capIndex) => (
                      <li 
                        key={capIndex}
                        className={`flex items-start gap-3 text-muted-foreground ${
                          capability.startsWith('→') ? 'ml-6' : ''
                        }`}
                      >
                        {!capability.startsWith('→') && (
                          <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        )}
                        <span className={capability.startsWith('→') ? 'text-sm' : ''}>
                          {capability.startsWith('→') ? capability.substring(2) : capability}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default DetailedModulesSection;
