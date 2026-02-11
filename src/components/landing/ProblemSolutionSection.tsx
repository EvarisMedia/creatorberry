import { X, CheckCircle, ArrowRight } from "lucide-react";

const problems = [
  "Staring at blank pages for hours",
  "Struggling with design and formatting",
  "Not knowing what to create or price",
  "Losing momentum before launch"
];

const solutions = [
  "AI generates outlines and full content",
  "Professional templates and exports",
  "Product ideas with validation scores",
  "Complete launch assets included"
];

const ProblemSolutionSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Creating Digital Products <span className="text-creator-gradient">Shouldn't Take Months</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Most creators never finish their first product. We're here to change that.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Problems */}
          <div className="p-8 rounded-2xl bg-destructive/5 border border-destructive/20">
            <h3 className="text-xl font-semibold mb-6 text-destructive">The Old Way</h3>
            <ul className="space-y-4">
              {problems.map((problem, index) => (
                <li key={index} className="flex items-start gap-3">
                  <X className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{problem}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Solutions */}
          <div className="p-8 rounded-2xl bg-primary/5 border border-primary/20">
            <h3 className="text-xl font-semibold mb-6 text-primary">With CreatorBerry</h3>
            <ul className="space-y-4">
              {solutions.map((solution, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">{solution}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-secondary/10 text-secondary font-medium">
            <span>CreatorBerry handles the hard parts</span>
            <ArrowRight className="w-4 h-4" />
            <span>You focus on your expertise</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolutionSection;
