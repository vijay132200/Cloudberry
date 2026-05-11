import { MarketingLayout } from "@/components/layout/marketing-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Stethoscope, Users, LineChart, ShieldCheck } from "lucide-react";

export default function PhysicianPage() {
  return (
    <MarketingLayout>
      <div className="bg-background py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl text-center">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 mb-6 border-none text-sm px-3 py-1">For Clinical Partners</Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground mb-6">Extend Your Care Beyond The Clinic</h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-10">
            Cloudberry helps patients stay consistent with nutrition, activity, and follow-through—while keeping the physician central to medical decision-making.
          </p>
          <Button asChild size="lg" className="rounded-full px-8 h-14 text-base">
            <Link href="/physician/signup">Explore Collaboration</Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-4">Book a short call with the Cloudberry team.</p>
        </div>
      </div>

      <div className="bg-muted/30 py-24 border-t">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <LineChart className="text-primary h-6 w-6" />
                </div>
                <CardTitle className="text-2xl font-serif">Better Patient Adherence</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                We provide the daily accountability that 15-minute clinical visits cannot. Our coaches ensure your treatment protocols are translated into actionable daily habits.
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="text-primary h-6 w-6" />
                </div>
                <CardTitle className="text-2xl font-serif">Coordinated Support</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Your patients get access to certified nutritionists and fitness coaches who work within your established clinical boundaries, creating a unified care team.
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <ShieldCheck className="text-primary h-6 w-6" />
                </div>
                <CardTitle className="text-2xl font-serif">Improved Patient Experience</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Patients feel supported between visits, reducing anxiety and increasing their trust in your prescribed care pathway.
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Stethoscope className="text-primary h-6 w-6" />
                </div>
                <CardTitle className="text-2xl font-serif">Minimal Operational Burden</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                We handle the day-to-step support, tracking, and nudges. You review concise progress summaries during their scheduled follow-ups with you.
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
