import { MarketingLayout } from "@/components/layout/marketing-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function AboutPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <div className="bg-gradient-to-br from-amber-50/60 via-white to-blue-50/60 py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="text-center mb-14">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              A new standard for<br className="hidden md:block" /> metabolic care.
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              We started Cloudberry because the current approach to managing obesity and diabetes is broken. Quick-fix diets fail, and 15-minute doctor visits aren't enough to build lasting lifestyle changes.
            </p>
          </div>

          {/* Hero Image */}
          <div className="aspect-video w-full rounded-3xl overflow-hidden relative shadow-xl border border-border/30">
            <img
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1200&q=80"
              alt="Cloudberry Care Team"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-white font-semibold text-lg drop-shadow-md">Doctor-led care, every step of the journey</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mission & Approach */}
      <div className="bg-white py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="space-y-16">
            <div className="grid md:grid-cols-12 gap-8 items-start">
              <div className="md:col-span-4">
                <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4 uppercase tracking-wider">Our Mission</div>
                <h2 className="text-2xl font-bold text-foreground">Why we exist</h2>
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

            {/* Image break */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl overflow-hidden aspect-[4/3] shadow-md">
                <img
                  src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80"
                  alt="Nutritious food"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-2xl overflow-hidden aspect-[4/3] shadow-md">
                <img
                  src="https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80"
                  alt="Active lifestyle"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-12 gap-8 items-start pt-8 border-t border-border/40">
              <div className="md:col-span-4">
                <div className="inline-block px-3 py-1 rounded-full bg-blue-100/70 text-blue-700 text-xs font-semibold mb-4 uppercase tracking-wider">Our Approach</div>
                <h2 className="text-2xl font-bold text-foreground">The Cloudberry Method</h2>
              </div>
              <div className="md:col-span-8 text-lg text-muted-foreground space-y-4 leading-relaxed">
                <p>
                  We combine the rigorous oversight of a clinical endocrinology practice with the empathy and accessibility of modern digital coaching.
                </p>
                <p>
                  When you join Cloudberry, you aren't just getting a plan — you're getting a dedicated team. Your physician, nutritionist, and fitness coach work together on a unified platform to monitor your progress, adjust your protocols, and support you every single day.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Leadership */}
      <div className="bg-gradient-to-br from-blue-50/50 via-white to-amber-50/40 py-20 md:py-24">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Our Clinical Leadership</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-primary to-blue-400 mx-auto mb-8 rounded-full" />
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Cloudberry is led by board-certified physicians specializing in obesity medicine and endocrinology. Details of our founding clinical team will be announced shortly.
          </p>

          {/* Team image placeholder */}
          <div className="max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-lg mb-10">
            <img
              src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=900&q=80"
              alt="Clinical leadership team"
              className="w-full h-72 object-cover"
            />
          </div>

          <Button asChild size="lg" className="rounded-full px-10 h-14 text-base shadow-md">
            <Link href="/patient/signup">Start Your Journey Today</Link>
          </Button>
        </div>
      </div>
    </MarketingLayout>
  );
}
