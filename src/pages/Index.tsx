import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import SocialProofSection from "@/components/landing/SocialProofSection";
import ProblemSolutionSection from "@/components/landing/ProblemSolutionSection";
import UseCasesSection from "@/components/landing/UseCasesSection";
import DetailedModulesSection from "@/components/landing/DetailedModulesSection";
import ProductTypesSection from "@/components/landing/ProductTypesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import CreatorsSection from "@/components/landing/CreatorsSection";
import PricingSection from "@/components/landing/PricingSection";
import FAQSection from "@/components/landing/FAQSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <HeroSection />
        <SocialProofSection />
        <ProblemSolutionSection />
        <section id="use-cases">
          <UseCasesSection />
        </section>
        <section id="features">
          <DetailedModulesSection />
        </section>
        <ProductTypesSection />
        <section id="how-it-works">
          <HowItWorksSection />
        </section>
        <CreatorsSection />
        <section id="pricing">
          <PricingSection />
        </section>
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
