import { MarketingLayout } from "@/components/layout/marketing-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Stethoscope, Users, LineChart, ShieldCheck } from "lucide-react";

export default function PhysicianPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&w=1400&q=80"
            alt="Doctor with patient"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary/70 to-blue-800/80" />
        </div>
        <div className="relative z-10 py-24 md:py-32">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl text-center">
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/20 text-white text-sm font-semibold mb-6 border border-white/30">
              For Clinical Partners
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Extend Your Care<br className="hidden md:block" /> Beyond The Clinic
            </h1>
            <p className="text-xl text-white/85 leading-relaxed max-w-3xl mx-auto mb-10">
              Cloudberry helps patients stay consistent with nutrition, activity, and follow-through — while keeping the physician central to medical decision-making.
            </p>
            <Button asChild size="lg" className="rounded-full px-10 h-14 text-base bg-white text-primary hover:bg-white/90 shadow-lg font-semibold">
              <Link href="/physician/signup">Explore Collaboration</Link>
            </Button>
            <p className="text-sm text-white/60 mt-4">Book a short call with the Cloudberry team.</p>
          </div>
        </div>
      </div>

      {/* Value Props */}
      <div className="bg-gradient-to-br from-white via-blue-50/30 to-amber-50/30 py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How Cloudberry Supports Your Practice</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We handle the daily support so you can focus on clinical decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
            {[
              {
                icon: LineChart,
                title: "Better Patient Adherence",
                desc: "We provide the daily accountability that 15-minute clinical visits cannot. Our coaches ensure your treatment protocols are translated into actionable daily habits.",
                color: "bg-blue-50 text-blue-600",
              },
              {
                icon: Users,
                title: "Coordinated Support",
                desc: "Your patients get access to certified nutritionists and fitness coaches who work within your established clinical boundaries, creating a unified care team.",
                color: "bg-emerald-50 text-emerald-600",
              },
              {
                icon: ShieldCheck,
                title: "Improved Patient Experience",
                desc: "Patients feel supported between visits, reducing anxiety and increasing their trust in your prescribed care pathway.",
                color: "bg-amber-50 text-amber-600",
              },
              {
                icon: Stethoscope,
                title: "Minimal Operational Burden",
                desc: "We handle the day-to-step support, tracking, and nudges. You review concise progress summaries during their scheduled follow-ups with you.",
                color: "bg-purple-50 text-purple-600",
              },
            ].map((item, i) => (
              <Card key={i} className="bg-white border-border/50 shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden">
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${item.color}`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl font-bold">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground leading-relaxed">
                  {item.desc}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA strip */}
      <div className="bg-gradient-to-r from-primary/10 via-blue-50/50 to-amber-50/40 border-t border-border/30 py-16">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Ready to Extend Your Impact?
          </h3>
          <p className="text-muted-foreground mb-8">
            Leave your details and our clinical partnership team will reach out within 24 hours.
          </p>
          <Button asChild size="lg" className="rounded-full px-10 h-14 text-base shadow-md">
            <Link href="/physician/signup">Partner with Cloudberry</Link>
          </Button>
        </div>
      </div>
    </MarketingLayout>
  );
}
