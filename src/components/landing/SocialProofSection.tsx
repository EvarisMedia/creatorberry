const creatorTypes = [
  "Coaches",
  "Writers", 
  "Consultants",
  "Course Creators",
  "Educators",
  "Designers",
  "Marketers",
  "Entrepreneurs"
];

const SocialProofSection = () => {
  return (
    <section className="py-12 bg-muted/30 border-y border-border">
      <div className="container px-4">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
          <p className="text-sm text-muted-foreground font-medium">Trusted by creators:</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {creatorTypes.map((type, index) => (
              <span 
                key={index} 
                className="px-4 py-2 rounded-full bg-card border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors cursor-default"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;
