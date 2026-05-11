import { MarketingLayout } from "@/components/layout/marketing-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ArrowRight, CheckCircle2, Activity, HeartPulse, Users, TrendingUp } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const carouselFrames = [
  {
    title: "Doctor-Led Care",
    overlay: "Medical care built around your long-term health goals.",
    bg: "from-emerald-900/80 to-emerald-700/60",
    icon: "🩺",
  },
  {
    title: "Personalized Lifestyle Support",
    overlay: "Practical nutrition and movement guidance designed for real life.",
    bg: "from-blue-900/80 to-blue-700/60",
    icon: "🥗",
  },
  {
    title: "Daily Accountability",
    overlay: "Small daily actions that create sustainable health change.",
    bg: "from-teal-900/80 to-teal-700/60",
    icon: "📲",
  },
  {
    title: "Track Your Progress",
    overlay: "See measurable progress over time—not just generic advice.",
    bg: "from-indigo-900/80 to-indigo-700/60",
    icon: "📊",
  },
];

const whyCards = [
  {
    problem: "Most patients receive broad lifestyle advice that's difficult to apply consistently.",
    solution: "We create personalized plans designed around your routine, food preferences, and health needs.",
    label: "Generic Advice Fails",
    num: "01",
  },
  {
    problem: "Patients often start strongly, then lose consistency after a few weeks.",
    solution: "Continuous follow-up and accountability help patients stay on track.",
    label: "Motivation Drops Over Time",
    num: "02",
  },
  {
    problem: "Medical care, nutrition, fitness, and follow-up rarely work together.",
    solution: "Doctors, coaches, and care coordinators work together around your goals.",
    label: "Care Is Fragmented",
    num: "03",
  },
  {
    problem: "Patients struggle to know whether they are improving.",
    solution: "Simple tracking helps patients clearly see their progress over time.",
    label: "Progress Is Hard To Measure",
    num: "04",
  },
];

const impactBlocks = [
  {
    icon: <Activity className="w-7 h-7 text-primary" />,
    title: "Better Lifestyle Consistency",
    desc: "Track habits and improve adherence over time.",
  },
  {
    icon: <TrendingUp className="w-7 h-7 text-secondary" />,
    title: "Sustainable Weight Management",
    desc: "Focus on gradual, long-term progress.",
  },
  {
    icon: <HeartPulse className="w-7 h-7 text-primary" />,
    title: "Improved Glucose Awareness",
    desc: "Help patients better understand and manage their health patterns.",
  },
  {
    icon: <Users className="w-7 h-7 text-secondary" />,
    title: "Continuous Human Support",
    desc: "Regular follow-up to help patients stay engaged and motivated.",
  },
];

const journeySteps = [
  {
    week: "Week 0",
    title: "Assessment & Planning",
    desc: "Meet your care team to understand your health goals, medical history, lifestyle, and challenges. Together, we create a personalized plan aligned with your doctor's guidance.",
  },
  {
    week: "Week 1",
    title: "Start Your Program",
    desc: "Begin your nutrition plan, movement routine, and habit tracking. Receive structured support and daily accountability.",
  },
  {
    week: "Week 2 onwards",
    title: "Continuous Fine-Tuning",
    desc: "Your care team regularly reviews progress and adjusts recommendations to help improve long-term consistency and outcomes.",
  },
];

export default function HomePage() {
  const [activeFrame, setActiveFrame] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveFrame((prev) => (prev + 1) % carouselFrames.length);
    }, 3500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <MarketingLayout>
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-background pt-8 pb-20 md:pt-16 md:pb-28">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-blue-soft/30 to-warm-neutral/40 pointer-events-none" />

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col gap-6 max-w-xl"
            >
              <h1 className="text-4xl md:text-5xl lg:text-[3.2rem] font-bold leading-[1.1] text-foreground tracking-tight">
                Personalized, doctor-led care for sustainable weight and diabetes management.
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Cloudberry combines medical guidance, nutrition, movement, and continuous coaching to help patients improve glucose control, build healthier habits, and achieve sustainable long-term results.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                <div className="flex flex-col gap-2">
                  <Button asChild size="lg" className="rounded-full px-8 text-base h-14 w-full sm:w-auto">
                    <Link href="/patient/signup">Get Started <ArrowRight className="ml-2 h-5 w-5" /></Link>
                  </Button>
                  <p className="text-xs text-muted-foreground text-center sm:text-left">Book a free 20-minute consultation to explore whether Cloudberry is right for you.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button asChild variant="outline" size="lg" className="rounded-full px-8 text-base h-14 w-full sm:w-auto border-primary/30 hover:bg-primary/5 text-primary">
                    <Link href="/physician">For Physicians <ArrowRight className="ml-2 h-5 w-5" /></Link>
                  </Button>
                  <p className="text-xs text-muted-foreground text-center sm:text-left">Explore collaboration opportunities with Cloudberry Care.</p>
                </div>
              </div>
            </motion.div>

            {/* Carousel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative w-full max-w-lg mx-auto"
            >
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-muted border shadow-xl">
                {carouselFrames.map((frame, i) => (
                  <div
                    key={i}
                    className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-700 ${i === activeFrame ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${frame.bg}`} />
                    <div className="relative z-10 flex flex-col items-center justify-center gap-4 px-8 py-10 text-white text-center">
                      <span className="text-6xl mb-2">{frame.icon}</span>
                      <p className="text-lg font-semibold leading-snug">{frame.overlay}</p>
                    </div>
                    <div className="absolute bottom-5 left-5 right-5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3">
                      <p className="text-white font-semibold text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-white/80" />{frame.title}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Dots */}
              <div className="flex justify-center gap-2 mt-4">
                {carouselFrames.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setActiveFrame(i); if (intervalRef.current) clearInterval(intervalRef.current); }}
                    className={`w-2 h-2 rounded-full transition-all ${i === activeFrame ? 'bg-primary w-5' : 'bg-muted-foreground/30'}`}
                  />
                ))}
              </div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/15 rounded-full blur-3xl -z-10" />
              <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-secondary/10 rounded-full blur-3xl -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* WHY MOST PLANS DON'T LAST */}
      <section className="py-20 bg-gradient-to-b from-muted/60 to-blue-soft/20 border-y">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Why Most Weight & Diabetes Plans Don't Last</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Cloudberry is designed to solve the gaps traditional care often misses.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {whyCards.map((card, i) => (
              <Card key={i} className="border-border shadow-sm hover:shadow-md transition-shadow bg-card flex flex-col">
                <CardHeader className="pb-3">
                  <span className="text-xs font-mono font-bold text-primary bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center mb-3">{card.num}</span>
                  <CardTitle className="text-base font-semibold text-foreground leading-snug">{card.label}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 flex-1">
                  <div className="bg-muted/70 rounded-xl p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">The Problem</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{card.problem}</p>
                  </div>
                  <div className="bg-primary/8 border border-primary/20 rounded-xl p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Cloudberry</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{card.solution}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT WE AIM TO HELP YOU IMPROVE */}
      <section className="py-24 bg-gradient-to-br from-foreground via-foreground to-foreground/90 text-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">What We Aim To Help You Improve</h2>
            <p className="text-background/70 text-lg max-w-xl mx-auto">Measurable outcomes that matter — tracked consistently over time.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {impactBlocks.map((block, i) => (
              <div key={i} className="bg-white/8 border border-white/15 rounded-2xl p-6 flex flex-col gap-3 backdrop-blur-sm hover:bg-white/12 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">{block.icon}</div>
                <h3 className="font-semibold text-base text-background leading-snug">{block.title}</h3>
                <p className="text-background/65 text-sm leading-relaxed">{block.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* YOUR JOURNEY WITH CLOUDBERRY */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Your Journey With Cloudberry</h2>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              {journeySteps.map((step, i) => (
                <div key={i} className="flex gap-5 group">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-mono font-bold text-sm border group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors shrink-0 z-10">
                      {i + 1}
                    </div>
                    {i < journeySteps.length - 1 && <div className="w-px flex-1 bg-border mt-2 group-hover:bg-primary/30 transition-colors" style={{ minHeight: '2rem' }} />}
                  </div>
                  <div className="pb-10 pt-1">
                    <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-bold text-foreground">{step.title}</h3>
                      <Badge variant="secondary" className="font-mono text-xs bg-blue-soft text-blue-soft-foreground border-0">{step.week}</Badge>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 bg-gradient-to-b from-muted/30 to-blue-soft/20 border-y scroll-m-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Flexible Programs Designed Around Your Needs</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the level of support that fits your needs. All plans include accountability, support, and measurable outcomes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
            {/* Basic */}
            <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="text-center pb-6 border-b">
                <CardTitle className="text-xl text-foreground font-bold">Accountability Program</CardTitle>
                <CardDescription className="mb-3 text-sm">For patients looking for lightweight accountability and structured follow-up.</CardDescription>
                <div className="text-4xl font-bold text-foreground">₹990<span className="text-lg text-muted-foreground font-normal">/month</span></div>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {[
                    "Daily WhatsApp check-ins",
                    "Personalized reminders",
                    "Monthly coaching call",
                    "Educational resources",
                    "Progress summaries",
                  ].map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full rounded-full" data-testid="btn-pricing-basic">
                  <Link href="/patient/signup?plan=basic">Get Started</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Comprehensive */}
            <Card className="border-primary shadow-lg relative scale-100 md:scale-105 z-10 bg-card">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Most Popular
              </div>
              <CardHeader className="text-center pb-6 border-b">
                <CardTitle className="text-xl text-foreground font-bold">Structured Coaching Program</CardTitle>
                <CardDescription className="mb-3 text-sm">For patients looking for personalized lifestyle support.</CardDescription>
                <div className="text-4xl font-bold text-foreground">₹1,990<span className="text-lg text-muted-foreground font-normal">/month</span></div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-sm font-semibold mb-3 text-primary">Everything in Basic, plus:</div>
                <ul className="space-y-3">
                  {[
                    "Personalized nutrition plan",
                    "Personalized movement guidance",
                    "Initial onboarding session",
                    "Bi-weekly coaching follow-ups",
                  ].map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full rounded-full" data-testid="btn-pricing-comp">
                  <Link href="/patient/signup?plan=comprehensive">Get Started</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Premium */}
            <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="text-center pb-6 border-b">
                <CardTitle className="text-xl text-foreground font-bold">Advanced Monitoring Program</CardTitle>
                <CardDescription className="mb-3 text-sm">For patients requiring closer monitoring and higher-touch support.</CardDescription>
                <div className="text-4xl font-bold text-foreground">₹3,990<span className="text-lg text-muted-foreground font-normal">/month</span></div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-sm font-semibold mb-3 text-primary">Everything in Comprehensive, plus:</div>
                <ul className="space-y-3">
                  {[
                    "Glucose tracking support",
                    "Higher-frequency follow-ups",
                    "Advanced progress reviews",
                    "Priority support",
                  ].map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full rounded-full" data-testid="btn-pricing-premium">
                  <Link href="/patient/signup?plan=premium">Get Started</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* YOUR TEAM */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">A Coordinated Care Team</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Cloudberry combines doctors, nutritionists, fitness coaches, and care coordinators to support patients through personalized, structured care.
            </p>
            <p className="text-sm text-primary mt-4 font-medium">Founding clinical team details coming soon.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { role: "Doctor", desc: "Oversees medical plan and treatment decisions." },
              { role: "Nutritionist", desc: "Creates personalized, sustainable nutrition plans." },
              { role: "Fitness Coach", desc: "Designs practical movement routines for real life." },
              { role: "Care Coordinator", desc: "Ensures consistent follow-up and accountability." },
            ].map((member, i) => (
              <div key={i} className="bg-gradient-to-br from-muted/60 to-blue-soft/30 border border-border rounded-2xl p-6 flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl font-bold text-primary font-mono">
                  {member.role.charAt(0)}
                </div>
                <h3 className="font-bold text-base text-foreground">{member.role}</h3>
                <p className="text-sm text-muted-foreground">{member.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 bg-gradient-to-b from-muted/40 to-warm-neutral/20 border-t">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Frequently Asked Questions</h2>
          </div>
          <Accordion type="single" collapsible className="w-full space-y-3">
            {[
              { q: "What makes Cloudberry different?", a: "Cloudberry combines medical care, nutrition, movement, and ongoing coaching into one coordinated program focused on sustainable metabolic health improvement." },
              { q: "Is this only for weight loss?", a: "No. Cloudberry supports patients managing obesity, diabetes, insulin resistance, and lifestyle-related metabolic conditions." },
              { q: "Will I still see my doctor?", a: "Yes. Your doctor remains central to all medical decisions and treatment plans." },
              { q: "Can I cancel anytime?", a: "Yes. Plans can be cancelled anytime with pro-rated refunds." },
              { q: "How does Cloudberry track progress?", a: "We use habit tracking, regular check-ins, progress reviews, and optional glucose logging to help patients stay accountable." },
              { q: "Is the program fully online?", a: "Most support is provided digitally through WhatsApp, calls, and online coordination." },
              { q: "Is Cloudberry available outside Indore?", a: "Currently we are beginning in Indore and plan to expand gradually." },
            ].map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="bg-card border rounded-xl px-5">
                <AccordionTrigger className="text-base font-semibold hover:no-underline py-4 text-left">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-4 border-t pt-3">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="mt-10 text-center">
            <Button asChild variant="outline" className="rounded-full" size="lg">
              <Link href="/faqs">View All FAQs</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="h-24 lg:hidden" />
    </MarketingLayout>
  );
}
