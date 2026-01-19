import { Brain, FileText, Lightbulb, List, Expand, Image, Download, FileCheck, Rocket, Bot, CheckCircle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
    gradient: "from-purple-500/20 to-pink-500/20"
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
    gradient: "from-blue-500/20 to-cyan-500/20"
  },
  {
    id: "product-validation",
    icon: Lightbulb,
    headline: "Never Wonder What to Create — And Know It'll Sell",
    description: "AI analyzes your content sources and audience to generate profitable product ideas, then helps you validate them before you invest time building.",
    capabilities: [
      "AI-generated product ideas from your content",
      "Product-Market Fit (PMF) scoring with 4 dimensions:",
      "→ Demand Score: Is there proven interest?",
      "→ Fit Score: Does it match your expertise?",
      "→ Gap Score: Is the market underserved?",
      "→ Urgency Score: Do people need this now?",
      "Pre-validation toolkit: waitlist pages, social posts, surveys",
      "Mini-version outline (lead magnet) creator"
    ],
    badge: null,
    gradient: "from-yellow-500/20 to-orange-500/20"
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
    gradient: "from-green-500/20 to-emerald-500/20"
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
    gradient: "from-indigo-500/20 to-purple-500/20"
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
    gradient: "from-pink-500/20 to-rose-500/20"
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
    gradient: "from-teal-500/20 to-cyan-500/20"
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
    gradient: "from-amber-500/20 to-yellow-500/20"
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
    gradient: "from-red-500/20 to-orange-500/20"
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
    gradient: "from-violet-500/20 to-purple-500/20"
  }
];

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
