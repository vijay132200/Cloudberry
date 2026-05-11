import { MarketingLayout } from "@/components/layout/marketing-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function AboutPage() {
  return (
    <MarketingLayout>
      <div className="bg-background py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground mb-6">A new standard for metabolic care.</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              We started Cloudberry because the current approach to managing obesity and diabetes is broken. Quick-fix diets fail, and 15-minute doctor visits aren't enough to build lasting lifestyle changes.
            </p>
          </div>

          <div className="aspect-video w-full rounded-3xl overflow-hidden bg-muted mb-16 border relative">
            <img src="/images/hero-1-doctor.png" alt="Cloudberry Care" className="w-full h-full object-cover" />
          </div>

          <div className="space-y-16">
            <div className="grid md:grid-cols-12 gap-8 items-start">
              <div className="md:col-span-4">
                <h2 className="text-2xl font-serif font-bold text-foreground">Our Mission</h2>
              </div>
              <div className="md:col-span-8 text-lg text-muted-foreground space-y-4 leading-relaxed">
                <p>
                  Our mission is to make medical-grade metabolic care accessible, continuous, and effective for everyone struggling with weight management and insulin resistance.
                </p>
                <p>
                  We believe that sustainable health isn't about willpower or eating less. It's about understanding your unique biology, having access to expert medical guidance, and receiving the daily support needed to build habits that last a lifetime.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-12 gap-8 items-start pt-12 border-t">
              <div className="md:col-span-4">
                <h2 className="text-2xl font-serif font-bold text-foreground">The Cloudberry Approach</h2>
              </div>
              <div className="md:col-span-8 text-lg text-muted-foreground space-y-4 leading-relaxed">
                <p>
                  We combine the rigorous oversight of a clinical endocrinology practice with the empathy and accessibility of modern digital coaching.
                </p>
                <p>
                  When you join Cloudberry, you aren't just getting a plan—you're getting a dedicated team. Your physician, nutritionist, and fitness coach work together on a unified platform to monitor your progress, adjust your protocols, and support you every single day.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-24 text-center">
            <h2 className="text-3xl font-serif font-bold text-foreground mb-8">Our Clinical Leadership</h2>
            <div className="w-24 h-1 bg-primary mx-auto mb-8 rounded-full"></div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
              Cloudberry is led by board-certified physicians specializing in obesity medicine and endocrinology. Details of our founding clinical team will be announced shortly.
            </p>
            <Button asChild size="lg" className="rounded-full">
              <Link href="/patient/signup">Start Your Journey Today</Link>
            </Button>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
