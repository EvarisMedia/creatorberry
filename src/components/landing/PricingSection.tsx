import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  { name: "Starter", price: "$19", description: "For individual creators", features: ["1 Brand", "5 Boards", "100 Pins/month", "50 AI Image Credits", "Basic SEO"], popular: false },
  { name: "Pro", price: "$49", description: "For serious marketers", features: ["3 Brands", "Unlimited Boards", "500 Pins/month", "200 AI Image Credits", "Advanced SEO", "Bulk export", "Priority support"], popular: true },
  { name: "Agency", price: "$149", description: "For teams & agencies", features: ["Unlimited Brands", "Unlimited Boards", "Unlimited Pins", "1000 AI Image Credits", "White-label", "Team collaboration", "API access"], popular: false },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 bg-muted/30">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-lg text-muted-foreground">Start free, upgrade when you need more.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div key={index} className={`relative p-8 bg-card rounded-2xl border-2 ${plan.popular ? "border-primary shadow-xl scale-105" : "border-border"}`}>
              {plan.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-pinterest-gradient text-primary-foreground text-sm font-medium rounded-full">Most Popular</div>}
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold mb-2">{plan.price}<span className="text-base font-normal text-muted-foreground">/mo</span></div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f, i) => <li key={i} className="flex items-center gap-3 text-sm"><Check className="w-4 h-4 text-primary" />{f}</li>)}
              </ul>
              <Link to="/auth"><Button className={`w-full ${plan.popular ? "bg-pinterest-gradient hover:opacity-90" : ""}`} variant={plan.popular ? "default" : "outline"}>Get Started</Button></Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;