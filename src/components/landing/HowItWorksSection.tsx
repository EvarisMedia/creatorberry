const steps = [
  { number: "01", title: "Add Your Sources", description: "Connect blog RSS feeds, paste product URLs, or add manual ideas." },
  { number: "02", title: "Generate Pins", description: "Our AI creates SEO-optimized pin titles, descriptions, and keywords." },
  { number: "03", title: "Create Variations", description: "Generate multiple image variations with different layouts and styles." },
  { number: "04", title: "Export & Publish", description: "Download Pinterest-ready 2:3 images with copy for publishing." },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 bg-background">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-lg text-muted-foreground">From content to Pinterest-ready pins in four simple steps</p>
        </div>
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative p-8 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-xl bg-pinterest-gradient flex items-center justify-center font-bold text-primary-foreground shadow-lg">{step.number}</div>
              <div className="pt-4">
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;