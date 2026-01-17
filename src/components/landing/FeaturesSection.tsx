import { 
  Brain, 
  FileText, 
  Mic, 
  Image, 
  Download, 
  Rocket 
} from "lucide-react";

const features = [
  { 
    icon: Brain, 
    title: "Brand Memory AI", 
    description: "Your AI remembers your voice, audience, and style. Every piece of content sounds authentically you.",
    gradient: "bg-creator-gradient"
  },
  { 
    icon: FileText, 
    title: "Content to Product Pipeline", 
    description: "Turn blogs, videos, and ideas into structured product outlines in seconds.",
    gradient: "bg-purple-gradient"
  },
  { 
    icon: Mic, 
    title: "AI Writing That Sounds Like You", 
    description: "Full chapters, not just outlines. AI matches your unique voice and style.",
    gradient: "bg-creator-gradient"
  },
  { 
    icon: Image, 
    title: "Professional Image Generation", 
    description: "Covers, visuals, and worksheets. On-brand, every time. No design skills needed.",
    gradient: "bg-purple-gradient"
  },
  { 
    icon: Download, 
    title: "One-Click Export", 
    description: "PDF, DOCX, slides. Ready to sell in seconds. Professional formatting included.",
    gradient: "bg-creator-gradient"
  },
  { 
    icon: Rocket, 
    title: "Complete Sales & Launch Kit", 
    description: "Sales pages, email sequences, social posts. Everything you need to launch.",
    gradient: "bg-purple-gradient"
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Everything You Need to <span className="text-creator-gradient">Create & Launch</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From idea to income. The complete toolkit for digital product creators.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="group p-6 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
