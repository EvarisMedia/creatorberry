import { Rss, Image, FileText, Layers, Sparkles, Search, Palette, LayoutGrid } from "lucide-react";

const features = [
  { icon: Rss, title: "Multi-Source Import", description: "Connect RSS feeds, blog URLs, product pages, or add manual ideas." },
  { icon: Sparkles, title: "AI Pin Generation", description: "Generate SEO-optimized pin titles, descriptions, and keywords." },
  { icon: Image, title: "Image Variations", description: "Create 3-20 stunning image variations per idea with different layouts." },
  { icon: Search, title: "SEO Optimization", description: "Built-in keyword suggestions and Pinterest search optimization." },
  { icon: LayoutGrid, title: "Board Management", description: "Organize pins into boards with custom themes and keywords." },
  { icon: Palette, title: "Brand Consistency", description: "Maintain your visual identity with custom colors and fonts." },
  { icon: Layers, title: "Pin Types", description: "Blog pins, product pins, idea pins, infographics, and more." },
  { icon: FileText, title: "Export Ready", description: "Download Pinterest-optimized 2:3 ratio images with copy." },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything You Need to <span className="text-pinterest-gradient">Dominate Pinterest</span></h2>
          <p className="text-lg text-muted-foreground">From content import to pin export, the complete toolkit for Pinterest success.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="group p-6 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-pinterest-gradient flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;