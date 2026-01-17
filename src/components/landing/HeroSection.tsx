import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Eye, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-accent/30 via-background to-background" />
      <div className="absolute top-32 left-[5%] w-32 h-48 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 transform -rotate-12 animate-float opacity-60" />
      <div className="absolute bottom-32 right-[10%] w-28 h-42 rounded-2xl bg-gradient-to-br from-accent to-accent/50 transform rotate-6 animate-float opacity-60" style={{ animationDelay: "0.5s" }} />
      
      <div className="container px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-primary/20 mb-8">
            <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
            </svg>
            <span className="text-sm font-medium text-foreground">Pinterest Pin Generator</span>
            <Zap className="w-4 h-4 text-primary" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Turn Content Into<br /><span className="text-pinterest-gradient">Pinterest Traffic</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Transform blogs, products, and ideas into scroll-stopping pins. Generate SEO-optimized copy, stunning images, and drive evergreen traffic.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/auth">
              <Button size="lg" className="group text-lg px-8 py-6 bg-pinterest-gradient hover:opacity-90 shadow-lg">
                Start Creating Pins <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">See How It Works</Button>
            </a>
          </div>
          
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <Eye className="w-5 h-5 mx-auto text-primary mb-2" />
              <div className="text-2xl md:text-3xl font-bold">50M+</div>
              <div className="text-sm text-muted-foreground">Pin Impressions</div>
            </div>
            <div className="text-center">
              <TrendingUp className="w-5 h-5 mx-auto text-primary mb-2" />
              <div className="text-2xl md:text-3xl font-bold">1,200+</div>
              <div className="text-sm text-muted-foreground">Brands Scaled</div>
            </div>
            <div className="text-center">
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