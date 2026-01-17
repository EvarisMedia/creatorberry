import { User, Lightbulb, Layers, Rocket } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Set Up Your Brand",
    description: "Tell us about your audience, expertise, and unique voice. AI remembers everything.",
    icon: User,
  },
  {
    number: "02",
    title: "Generate Product Ideas",
    description: "AI analyzes your content sources and suggests profitable digital products with PMF scores.",
    icon: Lightbulb,
  },
  {
    number: "03",
    title: "Build Your Product",
    description: "Expand outlines into full chapters, generate images, and preview your product.",
    icon: Layers,
  },
  {
    number: "04",
    title: "Export & Launch",
    description: "Download print-ready files and get complete sales pages, emails, and social posts.",
    icon: Rocket,
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 bg-background">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-lg text-muted-foreground">
            From idea to launch-ready product in four simple steps
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Desktop Layout */}
          <div className="hidden md:grid md:grid-cols-4 gap-6 relative">
            {/* Connecting Line */}
            <div className="absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-creator-coral via-creator-magenta to-creator-purple" />
            
            {steps.map((step, index) => (
              <div key={index} className="relative flex flex-col items-center text-center">
                {/* Step Number with Icon */}
                <div className="relative z-10 w-32 h-32 rounded-2xl bg-creator-gradient flex flex-col items-center justify-center shadow-lg mb-6">
                  <step.icon className="w-10 h-10 text-primary-foreground mb-1" />
                  <span className="text-2xl font-bold text-primary-foreground">{step.number}</span>
                </div>
                
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="relative flex gap-5">
                {/* Vertical Line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-10 top-24 bottom-0 w-0.5 bg-gradient-to-b from-creator-coral to-creator-magenta" />
                )}
                
                {/* Step Number with Icon */}
                <div className="relative z-10 w-20 h-20 rounded-xl bg-creator-gradient flex flex-col items-center justify-center shadow-lg flex-shrink-0">
                  <step.icon className="w-6 h-6 text-primary-foreground" />
                  <span className="text-lg font-bold text-primary-foreground">{step.number}</span>
                </div>
                
                <div className="pt-2">
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
