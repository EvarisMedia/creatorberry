import { BookOpen, FileText, Presentation, Package, BookMarked, Wrench } from "lucide-react";

const products = [
  {
    type: "Ebook",
    title: "The Ultimate Guide to Building Your Personal Brand",
    icon: BookOpen,
    gradient: "from-creator-coral to-creator-magenta",
    formats: ["PDF", "EPUB"],
  },
  {
    type: "Workbook",
    title: "90-Day Business Transformation Workbook",
    icon: FileText,
    gradient: "from-creator-purple to-creator-magenta",
    formats: ["PDF", "DOCX"],
  },
  {
    type: "Slide Deck",
    title: "Masterclass Presentation Template",
    icon: Presentation,
    gradient: "from-creator-orange to-creator-coral",
    formats: ["PPTX", "PDF"],
  },
  {
    type: "Template Pack",
    title: "Complete Business Templates Bundle",
    icon: Package,
    gradient: "from-creator-magenta to-creator-purple",
    formats: ["DOCX", "PDF"],
  },
  {
    type: "Guide",
    title: "Step-by-Step Implementation Guide",
    icon: BookMarked,
    gradient: "from-creator-purple to-creator-coral",
    formats: ["PDF"],
  },
  {
    type: "Toolkit",
    title: "Creator Starter Toolkit",
    icon: Wrench,
    gradient: "from-creator-coral to-creator-orange",
    formats: ["PDF", "DOCX", "PPTX"],
  },
];

const ProductShowcaseSection = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            See What Creators Are Building
          </h2>
          <p className="text-lg text-muted-foreground">
            Beautiful, professional digital products — all created with Creator OS
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {products.map((product, index) => (
            <div
              key={index}
              className="group relative bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Product Cover Mockup */}
              <div className={`h-48 bg-gradient-to-br ${product.gradient} p-6 flex flex-col justify-between`}>
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-background/20 backdrop-blur-sm rounded-full text-sm font-medium text-primary-foreground">
                    {product.type}
                  </span>
                  <product.icon className="w-8 h-8 text-primary-foreground/80" />
                </div>
                <div className="space-y-2">
                  <div className="w-3/4 h-2 bg-primary-foreground/30 rounded" />
                  <div className="w-1/2 h-2 bg-primary-foreground/20 rounded" />
                </div>
              </div>

              {/* Product Info */}
              <div className="p-5">
                <h3 className="font-semibold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                  {product.title}
                </h3>
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {product.formats.map((format) => (
                      <span
                        key={format}
                        className="px-2 py-1 bg-muted rounded text-xs font-medium text-muted-foreground"
                      >
                        {format}
                      </span>
                    ))}
                  </div>
                  <span className="text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Create yours →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductShowcaseSection;
