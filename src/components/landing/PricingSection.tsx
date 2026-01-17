import { Button } from "@/components/ui/button";
import { Check, X, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  { 
    name: "Starter", 
    price: "$49", 
    description: "Perfect for getting started", 
    features: [
      { name: "1 Brand", included: true },
      { name: "5 Products", included: true },
      { name: "10 Content Sources", included: true },
      { name: "PDF Export", included: true },
      { name: "DOCX/PPTX Export", included: false },
      { name: "Sales Page Generator", included: false },
      { name: "Launch Assets", included: false },
      { name: "AI Copilot", included: false },
    ],
    popular: false 
  },
  { 
    name: "Pro", 
    price: "$149", 
    description: "For serious creators", 
    features: [
      { name: "5 Brands", included: true },
      { name: "25 Products", included: true },
      { name: "50 Content Sources", included: true },
      { name: "PDF Export", included: true },
      { name: "DOCX/PPTX Export", included: true },
      { name: "Sales Page Generator", included: true },
      { name: "Launch Assets", included: true },
      { name: "AI Copilot", included: false },
    ],
    popular: true 
  },
  { 
    name: "Unlimited", 
    price: "$299", 
    description: "For power creators", 
    features: [
      { name: "Unlimited Brands", included: true },
      { name: "Unlimited Products", included: true },
      { name: "Unlimited Sources", included: true },
      { name: "PDF Export", included: true },
      { name: "DOCX/PPTX Export", included: true },
      { name: "Sales Page Generator", included: true },
      { name: "Launch Assets", included: true },
      { name: "AI Copilot", included: true },
    ],
    popular: false 
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Lifetime Access
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            One-Time Payment, <span className="text-creator-gradient">Forever Yours</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            No subscriptions. No hidden fees. Pay once, create forever.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`relative p-8 bg-card rounded-2xl border-2 transition-all ${
                plan.popular 
                  ? "border-primary shadow-xl scale-105 z-10" 
                  : "border-border hover:border-primary/30"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-creator-gradient text-primary-foreground text-sm font-medium rounded-full shadow-md">
                  Most Popular
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold mb-2">
                  {plan.price}
                  <span className="text-base font-normal text-muted-foreground ml-1">one-time</span>
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    {feature.included ? (
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                    )}
                    <span className={feature.included ? "" : "text-muted-foreground/50"}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
              
              <Link to="/auth">
                <Button 
                  className={`w-full ${plan.popular ? "bg-creator-gradient hover:opacity-90" : ""}`} 
                  variant={plan.popular ? "default" : "outline"}
                >
                  Get {plan.name}
                </Button>
              </Link>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Upgrade anytime</span> — just pay the difference between plans
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            30-day money-back guarantee • Bring your own API key (zero AI costs for us)
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
