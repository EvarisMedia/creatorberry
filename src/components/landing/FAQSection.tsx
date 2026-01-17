import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Do I need to be tech-savvy to use Creator OS?",
    answer: "Not at all! Creator OS is designed for non-technical creators. If you can write an email, you can create a digital product. The AI handles all the complex stuff—formatting, design, structure—so you can focus on your expertise."
  },
  {
    question: "What is the API key I need?",
    answer: "Creator OS uses Google's Gemini AI for content generation. You'll need a free Gemini API key from Google AI Studio (takes 2 minutes to get). This means zero AI costs for us, which is why we can offer lifetime pricing instead of expensive subscriptions."
  },
  {
    question: "Can I upgrade my plan later?",
    answer: "Absolutely! You can upgrade at any time and just pay the difference between your current plan and the new one. For example, upgrading from Starter ($49) to Pro ($149) costs only $100."
  },
  {
    question: "What formats can I export my products in?",
    answer: "Starter plan includes PDF export. Pro and Unlimited plans add DOCX (Word), PPTX (PowerPoint/Slides), and Markdown exports. All exports are professionally formatted and ready to sell."
  },
  {
    question: "How long does it take to create a product?",
    answer: "Most creators finish their first product in 2-4 hours instead of weeks or months. The AI generates content, images, and launch assets—you just guide it and make edits. Some users have launched products in under 10 minutes!"
  },
  {
    question: "Is there a refund policy?",
    answer: "Yes! We offer a 30-day money-back guarantee. If Creator OS doesn't help you create better products faster, just email us for a full refund. No questions asked."
  },
  {
    question: "What kind of products can I create?",
    answer: "Ebooks, guides, workbooks, slide decks, template packs, checklists, and more. If it's a digital product that teaches or helps people, Creator OS can help you build it."
  },
  {
    question: "Do you offer team or agency plans?",
    answer: "The Unlimited plan works great for agencies managing multiple brands. If you need custom enterprise features or have specific requirements, contact us and we'll work something out."
  }
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-24 bg-muted/30">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Frequently Asked <span className="text-creator-gradient">Questions</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about Creator OS
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-card border border-border rounded-xl px-6 data-[state=open]:border-primary/30"
              >
                <AccordionTrigger className="text-left hover:no-underline py-5">
                  <span className="font-medium">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
