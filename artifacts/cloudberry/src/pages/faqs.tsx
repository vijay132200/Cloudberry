import { MarketingLayout } from "@/components/layout/marketing-layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function FaqsPage() {
  const faqGroups = [
    {
      category: "About Cloudberry",
      questions: [
        { q: "What makes Cloudberry different from diet apps?", a: "Cloudberry is a medical platform, not a diet app. We combine physician oversight, clinical protocols, and human coaching to address metabolic health holistically. We focus on long-term sustainability rather than quick fixes." },
        { q: "Do I have to take medication?", a: "No. Medication is an option for some patients if clinically indicated and prescribed by our physicians, but many patients achieve their goals through our structured lifestyle, nutrition, and accountability protocols alone." }
      ]
    },
    {
      category: "How the Program Works",
      questions: [
        { q: "How much time will this take every day?", a: "The daily check-in takes less than 60 seconds on our app. Implementing the lifestyle changes varies, but we design them to fit seamlessly into your existing routine rather than requiring hours of extra effort." },
        { q: "Can I use Cloudberry if I have a pre-existing condition?", a: "Yes, our programs are specifically designed for individuals managing obesity, diabetes, insulin resistance, and PCOS. However, during your initial consultation, our doctors will assess if our digital care model is safe and appropriate for your specific medical history." }
      ]
    },
    {
      category: "Pricing & Refunds",
      questions: [
        { q: "Is there a minimum commitment?", a: "No. You pay month-to-month and can cancel anytime. We believe we should earn your trust and business every single month." },
        { q: "How does the Results Guarantee work?", a: "If you follow your personalized plan (maintaining 80%+ adherence on your daily check-ins and attending scheduled consultations) and do not achieve at least 10% weight loss within the timeframe outlined in your initial medical plan, we will refund your program fees." },
        { q: "Are lab tests included in the price?", a: "Basic program fees cover the platform, coaching, and medical consultations. Lab tests, if required or requested, are billed separately or can be done through your existing healthcare provider." }
      ]
    }
  ];

  return (
    <MarketingLayout>
      <div className="bg-muted/30 py-16 border-b">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">Frequently Asked Questions</h1>
          <p className="text-lg text-muted-foreground">Everything you need to know about our metabolic health programs and medical protocols.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 max-w-3xl py-16">
        {faqGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-foreground border-b pb-2">{group.category}</h2>
            <Accordion type="multiple" className="w-full space-y-4">
              {group.questions.map((faq, i) => {
                const isGuarantee = faq.q.includes("Results Guarantee");
                const isCancel = faq.q.includes("cancel anytime") || faq.q.includes("minimum commitment");
                
                return (
                  <AccordionItem 
                    key={i} 
                    value={`item-${groupIdx}-${i}`} 
                    className={`border rounded-xl px-6 ${isGuarantee ? 'border-primary/50 bg-primary/5' : isCancel ? 'border-blue-500/30 bg-blue-50/50 dark:bg-blue-900/10' : 'bg-card'}`}
                  >
                    <AccordionTrigger className="text-lg font-medium hover:no-underline py-5 text-left">
                      {faq.q}
                      {isGuarantee && <span className="ml-3 inline-block bg-primary text-primary-foreground text-xs px-2 py-1 rounded font-bold uppercase tracking-wider shrink-0">Guarantee</span>}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6 border-t pt-4">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        ))}

        <div className="mt-16 bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-serif font-bold mb-4">Still have questions?</h3>
          <p className="text-muted-foreground mb-6">Book a free 20-minute consultation with our care team to see if Cloudberry is the right fit for your health goals.</p>
          <Button asChild size="lg" className="rounded-full">
            <Link href="/patient/signup">Book Free Consultation</Link>
          </Button>
        </div>
      </div>
    </MarketingLayout>
  );
}
