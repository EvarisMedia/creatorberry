import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Users, Zap, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-mesh-gradient">
      {/* Animated gradient blobs */}
      <div className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-primary/20 blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-20 right-[10%] w-96 h-96 rounded-full bg-secondary/20 blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 blur-3xl" />
      
      {/* Floating product mockups */}
      <div className="absolute top-32 left-[5%] w-28 h-40 rounded-2xl bg-card border border-border shadow-xl transform -rotate-12 animate-float hidden lg:block">
        <div className="p-3 h-full flex flex-col">
          <div className="w-full h-16 rounded-lg bg-creator-gradient mb-2" />
          <div className="space-y-1.5">
            <div className="h-2 w-full rounded bg-muted" />
            <div className="h-2 w-3/4 rounded bg-muted" />
            <div className="h-2 w-1/2 rounded bg-muted" />
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-24 right-[8%] w-32 h-44 rounded-2xl bg-card border border-border shadow-xl transform rotate-6 animate-float-delayed hidden lg:block">
        <div className="p-3 h-full flex flex-col">
          <div className="w-full h-20 rounded-lg bg-purple-gradient mb-2" />
          <div className="space-y-1.5">
            <div className="h-2 w-full rounded bg-muted" />
            <div className="h-2 w-2/3 rounded bg-muted" />
          </div>
        </div>
      </div>
      
      <div className="container px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-sm mb-8 animate-slide-up">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">AI-Powered Digital Product Creation</span>
            <Zap className="w-4 h-4 text-secondary" />
          </div>
          
          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 animate-slide-up stagger-1">
            Turn Your Ideas Into<br />
            <span className="text-creator-gradient">Profitable Products</span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-slide-up stagger-2">
            From blank page to launch-ready ebooks, courses, and guides. 
            <span className="text-foreground font-medium"> No tech skills needed.</span> Just your expertise and 10 minutes.
          </p>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-slide-up stagger-3">
            <Link to="/auth">
              <Button size="lg" className="group text-lg px-8 py-6 bg-creator-gradient hover:opacity-90 shadow-lg glow-primary">
                Start Creating For Free 
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 group">
              <Play className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
              Watch Demo
            </Button>
          </div>
          
          {/* Trust line */}
          <p className="text-sm text-muted-foreground mb-12 animate-slide-up stagger-4">
            No credit card required • Lifetime access • 30-day money back guarantee
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-xl mx-auto animate-slide-up stagger-5">
            <div className="text-center p-4 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <Users className="w-5 h-5 mx-auto text-primary mb-2" />
              <div className="text-2xl md:text-3xl font-bold">2,000+</div>
              <div className="text-sm text-muted-foreground">Creators</div>
            </div>
            <div className="text-center p-4 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <Sparkles className="w-5 h-5 mx-auto text-secondary mb-2" />
              <div className="text-2xl md:text-3xl font-bold">15,000+</div>
              <div className="text-sm text-muted-foreground">Products Made</div>
            </div>
            <div className="text-center p-4 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <Zap className="w-5 h-5 mx-auto text-primary mb-2" />
              <div className="text-2xl md:text-3xl font-bold">10x</div>
              <div className="text-sm text-muted-foreground">Faster Creation</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
