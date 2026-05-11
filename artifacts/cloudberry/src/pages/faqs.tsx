import { MarketingLayout } from "@/components/layout/marketing-layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function FaqsPage() {
  const faqs = [
    {
      q: "What makes Cloudberry different?",
      a: "Cloudberry combines medical care, nutrition, movement, and ongoing coaching into one coordinated program focused on sustainable metabolic health improvement.",
    },
    {
      q: "Is this only for weight loss?",
      a: "No. Cloudberry supports patients managing obesity, diabetes, insulin resistance, and lifestyle-related metabolic conditions.",
    },
    {
      q: "Will I still see my doctor?",
      a: "Yes. Your doctor remains central to all medical decisions and treatment plans.",
    },
    {
      q: "Can I cancel anytime?",
      a: "Yes. Plans can be cancelled anytime with pro-rated refunds.",
    },
    {
      q: "How does Cloudberry track progress?",
      a: "We use habit tracking, regular check-ins, progress reviews, and optional glucose logging to help patients stay accountable.",
    },
    {
      q: "Is the program fully online?",
      a: "Most support is provided digitally through WhatsApp, calls, and online coordination.",
    },
    {
      q: "Is Cloudberry available outside Indore?",
      a: "Currently we are beginning in Indore and plan to expand gradually.",
    },
  ];

  return (
    <MarketingLayout>
      <div className="bg-gradient-to-b from-muted/50 to-blue-soft/20 py-16 border-b">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-muted-foreground">Everything you need to know about Cloudberry's metabolic care programs.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 max-w-3xl py-16">
        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="bg-card border rounded-xl px-6"
            >
              <AccordionTrigger className="text-lg font-semibold hover:no-underline py-5 text-left">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6 border-t pt-4">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-14 bg-gradient-to-br from-primary/8 to-blue-soft/40 border border-primary/20 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold mb-3">Still have questions?</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">Book a free 20-minute consultation with our care team to see if Cloudberry is the right fit for your health goals.</p>
          <Button asChild size="lg" className="rounded-full">
            <Link href="/patient/signup">Book Free Consultation</Link>
          </Button>
          <p className="text-xs text-muted-foreground mt-3">Currently available in Indore. Expansion to additional cities planned gradually.</p>
        </div>
      </div>
    </MarketingLayout>
  );
}
