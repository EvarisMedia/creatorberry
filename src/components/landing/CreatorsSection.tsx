const creators = [
  {
    name: "Sarah Mitchell",
    role: "Wellness Coach",
    quote: "I launched my first ebook in 2 days instead of 2 months!",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face"
  },
  {
    name: "Marcus Chen",
    role: "Tech Blogger",
    quote: "The AI actually sounds like me, not generic at all.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face"
  },
  {
    name: "Elena Rodriguez",
    role: "Business Consultant",
    quote: "Finally, a tool that gets solo creators!",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face"
  },
  {
    name: "James Thompson",
    role: "Finance Educator",
    quote: "Created 3 courses in the time it used to take for one.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face"
  }
];

const CreatorsSection = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Meet the <span className="text-creator-gradient">Creators</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Real people turning their expertise into profitable digital products
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {creators.map((creator, index) => (
            <div 
              key={index}
              className="group p-6 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all text-center"
            >
              <div className="relative mb-4 inline-block">
                <img 
                  src={creator.image} 
                  alt={creator.name}
                  className="w-20 h-20 rounded-full object-cover mx-auto ring-4 ring-background shadow-lg group-hover:ring-primary/20 transition-all"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-creator-gradient flex items-center justify-center">
                  <span className="text-xs text-primary-foreground">✓</span>
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-1">{creator.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{creator.role}</p>
              <p className="text-sm italic text-foreground">"{creator.quote}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CreatorsSection;
