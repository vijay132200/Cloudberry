import { MarketingLayout } from "@/components/layout/marketing-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { CheckCircle2, ArrowRight, Lock, Stethoscope, Salad, Dumbbell, MessageCircle, Activity, Star } from "lucide-react";
import { motion } from "framer-motion";

const plans = [
  {
    key: "basic",
    name: "Accountability Program",
    price: "₹990",
    period: "/month",
    tagline: "For patients who need structure, reminders, and consistent follow-up.",
    image: "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=700&q=80",
    color: "border-border",
    badge: null,
    features: [
      { label: "Daily WhatsApp check-ins", included: true },
      { label: "Personalized reminders & nudges", included: true },
      { label: "Monthly coaching call (30 min)", included: true },
      { label: "Educational health resources", included: true },
      { label: "Weekly progress summaries", included: true },
      { label: "Personalized nutrition plan", included: false },
      { label: "Personalized movement guidance", included: false },
      { label: "Bi-weekly coaching follow-ups", included: false },
      { label: "Glucose tracking support", included: false },
      { label: "Advanced progress reviews", included: false },
      { label: "Priority support", included: false },
    ],
    cta: "Start Accountability Program",
  },
  {
    key: "comprehensive",
    name: "Structured Coaching Program",
    price: "₹1,990",
    period: "/month",
    tagline: "For patients who want personalized lifestyle guidance with ongoing coaching support.",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=700&q=80",
    color: "border-primary shadow-xl",
    badge: "Most Popular",
    features: [
      { label: "Daily WhatsApp check-ins", included: true },
      { label: "Personalized reminders & nudges", included: true },
      { label: "Monthly coaching call (30 min)", included: true },
      { label: "Educational health resources", included: true },
      { label: "Weekly progress summaries", included: true },
      { label: "Personalized nutrition plan", included: true },
      { label: "Personalized movement guidance", included: true },
      { label: "Bi-weekly coaching follow-ups", included: true },
      { label: "Glucose tracking support", included: false },
      { label: "Advanced progress reviews", included: false },
      { label: "Priority support", included: false },
    ],
    cta: "Start Structured Coaching",
  },
  {
    key: "premium",
    name: "Advanced Monitoring Program",
    price: "₹3,990",
    period: "/month",
    tagline: "For patients with complex needs who require closer monitoring and the highest level of support.",
    image: "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=700&q=80",
    color: "border-border",
    badge: null,
    features: [
      { label: "Daily WhatsApp check-ins", included: true },
      { label: "Personalized reminders & nudges", included: true },
      { label: "Monthly coaching call (30 min)", included: true },
      { label: "Educational health resources", included: true },
      { label: "Weekly progress summaries", included: true },
      { label: "Personalized nutrition plan", included: true },
      { label: "Personalized movement guidance", included: true },
      { label: "Bi-weekly coaching follow-ups", included: true },
      { label: "Glucose tracking support", included: true },
      { label: "Advanced progress reviews", included: true },
      { label: "Priority support", included: true },
    ],
    cta: "Start Advanced Monitoring",
  },
];

const whatIsIncluded = [
  {
    icon: <Stethoscope className="w-6 h-6 text-primary" />,
    title: "Doctor-Led Medical Oversight",
    desc: "A board-certified physician supervises your entire care journey. Every plan is reviewed and approved by your doctor.",
    plans: ["basic", "comprehensive", "premium"],
    image: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&w=500&q=80",
  },
  {
    icon: <MessageCircle className="w-6 h-6 text-primary" />,
    title: "Daily WhatsApp Check-Ins",
    desc: "Your care coordinator reaches out every day to track your habits, mood, meals, and activity — keeping you accountable.",
    plans: ["basic", "comprehensive", "premium"],
    image: "https://images.unsplash.com/photo-1611262588024-d12430b98920?auto=format&fit=crop&w=500&q=80",
  },
  {
    icon: <Salad className="w-6 h-6 text-primary" />,
    title: "Personalized Nutrition Plan",
    desc: "A clinical nutritionist designs a sustainable meal plan tailored to your biology, preferences, and cultural diet.",
    plans: ["comprehensive", "premium"],
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=500&q=80",
  },
  {
    icon: <Dumbbell className="w-6 h-6 text-primary" />,
    title: "Movement Guidance",
    desc: "A fitness coach creates practical, achievable routines designed around your current fitness level and daily schedule.",
    plans: ["comprehensive", "premium"],
    image: "https://images.unsplash.com/photo-1524901548305-08eeddc35080?auto=format&fit=crop&w=500&q=80",
  },
  {
    icon: <Activity className="w-6 h-6 text-primary" />,
    title: "Glucose Tracking Support",
    desc: "For patients managing diabetes or insulin resistance, we provide structured support for tracking and interpreting fasting glucose readings.",
    plans: ["premium"],
    image: "/img-glucose.jpg",
  },
  {
    icon: <Star className="w-6 h-6 text-primary" />,
    title: "Priority Support",
    desc: "Premium members get priority access to their care team with faster callbacks and dedicated attention.",
    plans: ["premium"],
    image: "/img-priority.jpg",
  },
];

const faqs = [
  { q: "Can I switch plans later?", a: "Yes. You can upgrade or change your plan at any time. Upgrades take effect immediately with pro-rated billing." },
  { q: "Is there a lock-in period?", a: "No. All plans are month-to-month. You can cancel anytime and receive a pro-rated refund for unused days." },
  { q: "What happens during onboarding?", a: "You'll have a free 20-minute consultation call with our team. We'll understand your health history, goals, and assign your care team." },
  { q: "Are consultations with the doctor included?", a: "The doctor reviews your plan and progress. Direct doctor consultations beyond plan reviews may have additional charges." },
  { q: "Is everything done online?", a: "Yes. All coaching, check-ins, and reviews are handled digitally via WhatsApp, calls, and our patient portal." },
  { q: "What cities is Cloudberry available in?", a: "We are starting in Indore and expanding soon. Join the waitlist if you're in another city." },
];

export default function ProgramsPage() {
  return (
    <MarketingLayout>
      {/* HERO */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1400&q=80"
            alt="Programs hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-foreground/90 via-foreground/80 to-primary/70" />
        </div>
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge className="mb-5 bg-white/15 text-white border-white/30 backdrop-blur-sm px-4 py-1.5 text-sm">Programs & Pricing</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight">
              Choose the care that fits<br className="hidden md:block" /> your health journey
            </h1>
            <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
              Every plan includes a coordinated care team, daily accountability, and doctor oversight. Choose the depth of support that's right for you.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild size="lg" className="rounded-full px-8 h-13 bg-white text-foreground hover:bg-white/90">
                <Link href="/patient/signup">Get Started Free Consultation</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8 h-13 border-white/40 text-white hover:bg-white/10">
                <a href="#compare">Compare Plans</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PLAN CARDS */}
      <section id="compare" className="py-20 bg-background scroll-m-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Our Three Programs</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              All programs include medical oversight, care coordination, and daily check-ins. Higher tiers add personalized nutrition, fitness coaching, and glucose monitoring.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.key}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <Card className={`relative flex flex-col overflow-hidden ${plan.color} ${plan.badge ? "md:scale-105" : ""}`}>
                  {plan.badge && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider z-10">
                      {plan.badge}
                    </div>
                  )}
                  {/* Plan image */}
                  <div className="aspect-[16/7] overflow-hidden relative">
                    <img src={plan.image} alt={plan.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-4 left-5">
                      <span className="text-white font-bold text-lg drop-shadow">{plan.name}</span>
                    </div>
                  </div>

                  <CardHeader className="text-center pb-5 border-b pt-6">
                    <CardDescription className="text-sm mb-3 leading-relaxed">{plan.tagline}</CardDescription>
                    <div className="text-4xl font-bold text-foreground">{plan.price}<span className="text-lg text-muted-foreground font-normal">{plan.period}</span></div>
                  </CardHeader>

                  <CardContent className="pt-6 flex-1">
                    <ul className="space-y-2.5">
                      {plan.features.map((feat, j) => (
                        <li key={j} className={`flex items-start gap-3 text-sm ${feat.included ? "text-foreground/80" : "text-muted-foreground/50"}`}>
                          {feat.included ? (
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          ) : (
                            <Lock className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground/40" />
                          )}
                          <span>{feat.label}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-4">
                    <Button asChild variant={plan.badge ? "default" : "outline"} className="w-full rounded-full h-11">
                      <Link href={`/patient/signup?plan=${plan.key}`}>{plan.cta} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT'S INCLUDED DEEP DIVE */}
      <section className="py-20 bg-gradient-to-b from-muted/40 to-blue-soft/20 border-y">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">What's Included — In Detail</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Every feature explained, so you know exactly what you're getting.</p>
          </div>

          <div className="max-w-5xl mx-auto space-y-8">
            {whatIsIncluded.map((item, i) => (
              <div key={i} className={`flex flex-col md:flex-row ${i % 2 === 1 ? "md:flex-row-reverse" : ""} gap-6 items-center bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
                <div className="md:w-64 shrink-0 aspect-[4/3] md:aspect-auto md:h-52 overflow-hidden">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-6 flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">{item.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {(["basic", "comprehensive", "premium"] as const).map((tier) => (
                      <Badge
                        key={tier}
                        variant={item.plans.includes(tier) ? "default" : "secondary"}
                        className={`text-xs px-3 py-1 ${item.plans.includes(tier) ? "bg-primary/15 text-primary border-primary/30 border" : "bg-muted text-muted-foreground/50"}`}
                      >
                        {tier === "basic" ? "Accountability" : tier === "comprehensive" ? "Structured Coaching" : "Advanced Monitoring"}
                        {item.plans.includes(tier) ? " ✓" : " ✗"}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Side-by-Side Comparison</h2>
          </div>
          <div className="max-w-4xl mx-auto overflow-x-auto rounded-2xl border border-border shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left p-4 font-semibold text-foreground w-2/5">Feature</th>
                  <th className="text-center p-4 font-semibold text-foreground">Accountability<br /><span className="text-muted-foreground font-normal">₹990/mo</span></th>
                  <th className="text-center p-4 font-semibold text-primary bg-primary/5">Structured Coaching<br /><span className="font-normal">₹1,990/mo</span></th>
                  <th className="text-center p-4 font-semibold text-foreground">Advanced Monitoring<br /><span className="text-muted-foreground font-normal">₹3,990/mo</span></th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Doctor oversight", basic: true, comp: true, prem: true },
                  { feature: "Daily WhatsApp check-ins", basic: true, comp: true, prem: true },
                  { feature: "Care coordinator", basic: true, comp: true, prem: true },
                  { feature: "Monthly coaching call", basic: true, comp: true, prem: true },
                  { feature: "Progress summaries", basic: true, comp: true, prem: true },
                  { feature: "Personalized nutrition plan", basic: false, comp: true, prem: true },
                  { feature: "Movement guidance", basic: false, comp: true, prem: true },
                  { feature: "Bi-weekly coaching follow-ups", basic: false, comp: true, prem: true },
                  { feature: "Glucose tracking support", basic: false, comp: false, prem: true },
                  { feature: "Advanced progress reviews", basic: false, comp: false, prem: true },
                  { feature: "Priority support", basic: false, comp: false, prem: true },
                ].map((row, i) => (
                  <tr key={i} className={`border-b last:border-0 ${i % 2 === 0 ? "bg-background" : "bg-muted/20"}`}>
                    <td className="p-4 text-foreground/80 font-medium">{row.feature}</td>
                    <td className="p-4 text-center">{row.basic ? <CheckCircle2 className="w-4 h-4 text-primary mx-auto" /> : <span className="text-muted-foreground/40 text-lg">—</span>}</td>
                    <td className="p-4 text-center bg-primary/5">{row.comp ? <CheckCircle2 className="w-4 h-4 text-primary mx-auto" /> : <span className="text-muted-foreground/40 text-lg">—</span>}</td>
                    <td className="p-4 text-center">{row.prem ? <CheckCircle2 className="w-4 h-4 text-primary mx-auto" /> : <span className="text-muted-foreground/40 text-lg">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gradient-to-b from-muted/40 to-warm-neutral/20 border-t">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Pricing FAQs</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1551190822-a9333d879b1f?auto=format&fit=crop&w=1400&q=80" alt="CTA" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-foreground/80" />
        </div>
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Not sure which plan is right for you?</h2>
          <p className="text-white/80 text-lg max-w-xl mx-auto mb-8">Book a free 20-minute consultation and our team will recommend the best program based on your health goals.</p>
          <Button asChild size="lg" className="rounded-full px-10 h-14 text-base bg-white text-foreground hover:bg-white/90">
            <Link href="/patient/signup">Book Free Consultation <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>

      <div className="h-24 lg:hidden" />
    </MarketingLayout>
  );
}
