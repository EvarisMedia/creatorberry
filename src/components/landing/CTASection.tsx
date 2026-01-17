import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-24 bg-pinterest-gradient relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-primary-foreground/10 blur-2xl" />
      <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-primary-foreground/10 blur-3xl" />
      
      <div className="container px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-primary-foreground">
            Ready to Drive
            <br />
            Pinterest Traffic?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
            Join thousands of brands, creators, and agencies who are scaling their Pinterest presence with AI-powered pin generation.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button 
                size="lg" 
                className="group text-lg px-8 py-6 bg-background text-foreground hover:bg-background/90 shadow-lg"
              >
                Start Your Free Trial
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6 border-primary-foreground text-primary-foreground bg-transparent hover:bg-primary-foreground/10"
            >
              Book a Demo
            </Button>
          </div>
          
          <p className="text-sm text-primary-foreground/60 mt-8">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
