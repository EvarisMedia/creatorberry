import { BookOpen, FileText, ClipboardList, Presentation, FolderOpen, Package, GraduationCap, CheckSquare, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const productTypes = [
  {
    icon: BookOpen,
    name: "Ebook",
    description: "Full-length books with chapters, images, and professional formatting. Perfect for sharing deep knowledge and building authority.",
    bestFor: ["Deep knowledge sharing", "Authority building", "Comprehensive guides"],
    formats: ["PDF", "EPUB"],
    gradient: "from-purple-500/20 to-pink-500/20"
  },
  {
    icon: FileText,
    name: "Guide",
    description: "Step-by-step implementation guides with actionable steps. Help your audience achieve specific outcomes quickly.",
    bestFor: ["How-to content", "Tutorials", "Implementation blueprints"],
    formats: ["PDF", "DOCX"],
    gradient: "from-blue-500/20 to-cyan-500/20"
  },
  {
    icon: ClipboardList,
    name: "Workbook",
    description: "Interactive worksheets with exercises, prompts, and fill-in sections. Transform readers through hands-on learning.",
    bestFor: ["Transformation programs", "Self-paced learning", "Coaching support"],
    formats: ["PDF", "DOCX"],
    gradient: "from-green-500/20 to-emerald-500/20"
  },
  {
    icon: Presentation,
    name: "Slide Deck",
    description: "Presentation-ready slides for courses, webinars, or talks. Professional designs that engage your audience.",
    bestFor: ["Course creators", "Speakers", "Workshop facilitators"],
    formats: ["PPTX", "PDF"],
    gradient: "from-orange-500/20 to-amber-500/20"
  },
  {
    icon: FolderOpen,
    name: "Template Pack",
    description: "Ready-to-use templates, checklists, and frameworks. Give your audience tools they can use immediately.",
    bestFor: ["Business resources", "Productivity tools", "SOP collections"],
    formats: ["DOCX", "PDF"],
    gradient: "from-indigo-500/20 to-purple-500/20"
  },
  {
    icon: Package,
    name: "Toolkit",
    description: "Comprehensive resource bundles with multiple asset types. The ultimate starter kit for your audience.",
    bestFor: ["Starter kits", "Resource libraries", "Multi-format bundles"],
    formats: ["ZIP Bundle"],
    gradient: "from-pink-500/20 to-rose-500/20"
  },
  {
    icon: GraduationCap,
    name: "Mini-Course",
    description: "Short, focused learning modules with lessons and exercises. Perfect for teaching specific skills quickly.",
    bestFor: ["Quick wins", "Specific skill training", "Lead magnets"],
    formats: ["PDF", "PPTX"],
    gradient: "from-teal-500/20 to-cyan-500/20"
  },
  {
    icon: CheckSquare,
    name: "Checklist",
    description: "Step-by-step checklists for processes and procedures. The simplest way to guide your audience to success.",
    bestFor: ["Quick reference", "SOPs", "How-to lists"],
    formats: ["PDF"],
    gradient: "from-yellow-500/20 to-orange-500/20"
  }
];

const ProductTypesSection = () => {
  return (
    <section id="products" className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
            <Sparkles className="w-3 h-3 mr-1" />
            Digital Products
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">
            Create Any Digital Product You Can Imagine
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            From quick lead magnets to premium courses — Creator OS handles them all. Choose your format and start creating.
          </p>
        </div>

        {/* Product Type Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {productTypes.map((product) => {
            const Icon = product.icon;
            
            return (
              <div
                key={product.name}
                className="group relative bg-card rounded-2xl border border-border/50 p-6 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${product.gradient} flex items-center justify-center mb-4`}>
                  <Icon className="w-7 h-7 text-primary" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {product.name}
                </h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                  {product.description}
                </p>

                {/* Best For */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Best For
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {product.bestFor.map((use, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="text-xs font-normal"
                      >
                        {use}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Export Formats */}
                <div className="pt-4 border-t border-border/50">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Export Formats
                  </p>
                  <div className="flex gap-2">
                    {product.formats.map((format, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="text-xs border-primary/30 text-primary"
                      >
                        {format}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            Don't see your product type?{" "}
            <span className="text-primary font-medium">
              Creator OS is flexible — create custom formats that fit your needs.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProductTypesSection;
