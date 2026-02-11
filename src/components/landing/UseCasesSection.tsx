import { Users, GraduationCap, PenTool, Briefcase, Mic, Podcast, Award, Building, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const useCases = [
  {
    icon: Users,
    title: "Coaches & Consultants",
    description: "Package your methodology into client workbooks, certification materials, and implementation guides.",
    products: ["Client Workbooks", "Methodology Guides", "Certification Materials", "Onboarding Kits"],
    example: "\"I created a 12-week transformation workbook for my coaching clients in one afternoon.\"",
    gradient: "from-purple-500/20 to-pink-500/20"
  },
  {
    icon: GraduationCap,
    title: "Course Creators & Educators",
    description: "Turn your knowledge into complete course packages with slides, workbooks, and bonus materials.",
    products: ["Course Slide Decks", "Student Workbooks", "Bonus Materials", "Resource Guides"],
    example: "\"Marcus turned his YouTube tutorials into a complete course package with worksheets.\"",
    gradient: "from-blue-500/20 to-cyan-500/20"
  },
  {
    icon: PenTool,
    title: "Bloggers & Writers",
    description: "Transform your best articles into ebooks, guides, and content bundles your readers will pay for.",
    products: ["Ebooks", "Comprehensive Guides", "Content Bundles", "Newsletter Archives"],
    example: "\"Elena compiled her best finance articles into a bestselling ebook in hours.\"",
    gradient: "from-green-500/20 to-emerald-500/20"
  },
  {
    icon: Briefcase,
    title: "Freelancers & Service Providers",
    description: "Productize your expertise with process templates, client kits, and SOP bundles.",
    products: ["Process Templates", "Client Onboarding Kits", "SOP Bundles", "Proposal Templates"],
    example: "\"James packaged his design process into a template toolkit that sells on autopilot.\"",
    gradient: "from-orange-500/20 to-amber-500/20"
  },
  {
    icon: Mic,
    title: "Speakers & Workshop Leaders",
    description: "Create professional presentation decks, attendee workbooks, and follow-up resources.",
    products: ["Presentation Decks", "Attendee Workbooks", "Workshop Handouts", "Follow-up Guides"],
    example: "\"Created workshop materials and handouts in hours instead of weeks.\"",
    gradient: "from-indigo-500/20 to-purple-500/20"
  },
  {
    icon: Podcast,
    title: "Podcasters & Content Creators",
    description: "Turn episodes into guides, topic deep-dives, and resource compilations for your audience.",
    products: ["Episode Guides", "Topic Deep-Dives", "Resource Compilations", "Show Notes Bundles"],
    example: "\"Turned 50 podcast episodes into a comprehensive industry guide.\"",
    gradient: "from-pink-500/20 to-rose-500/20"
  },
  {
    icon: Award,
    title: "Experts & Thought Leaders",
    description: "Document your frameworks and methodologies into premium toolkits and certification programs.",
    products: ["Framework Guides", "Methodology Toolkits", "Certification Programs", "Signature Systems"],
    example: "\"Documented my proprietary framework into a premium toolkit.\"",
    gradient: "from-teal-500/20 to-cyan-500/20"
  },
  {
    icon: Building,
    title: "Small Business Owners",
    description: "Build training materials, employee handbooks, and client resources that scale your operations.",
    products: ["Training Materials", "Employee Handbooks", "Client Resources", "Standard Procedures"],
    example: "\"Created onboarding materials and training guides for my team.\"",
    gradient: "from-yellow-500/20 to-orange-500/20"
  }
];

const UseCasesSection = () => {
  return (
    <section id="use-cases" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
            <Sparkles className="w-3 h-3 mr-1" />
            Use Cases
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">
            Built for Creators Like You
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            See how different creators use CreatorBerry to monetize their expertise and build products their audience loves.
          </p>
        </div>

        {/* Use Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {useCases.map((useCase) => {
            const Icon = useCase.icon;
            
            return (
              <div
                key={useCase.title}
                className="group relative bg-card rounded-2xl border border-border/50 p-6 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${useCase.gradient} flex items-center justify-center mb-4`}>
                  <Icon className="w-7 h-7 text-primary" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {useCase.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {useCase.description}
                </p>

                {/* Products They Create */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Products They Create
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {useCase.products.slice(0, 3).map((product, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="text-xs font-normal"
                      >
                        {product}
                      </Badge>
                    ))}
                    {useCase.products.length > 3 && (
                      <Badge 
                        variant="secondary" 
                        className="text-xs font-normal"
                      >
                        +{useCase.products.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Example Quote */}
                <div className="pt-4 border-t border-border/50">
                  <p className="text-xs italic text-muted-foreground">
                    {useCase.example}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
