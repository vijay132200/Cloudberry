import { MarketingLayout } from "@/components/layout/marketing-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Activity, HeartPulse, Users, TrendingUp } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const carouselFrames = [
  {
    title: "Doctor-Led Care",
    overlay: "Medical care built around your long-term health goals.",
    bg: "from-emerald-900/70 to-emerald-700/50",
    image: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&w=900&q=80",
    tag: "👨‍⚕️ Physician-Supervised",
  },
  {
    title: "Personalized Nutrition",
    overlay: "Practical, culturally-fit nutrition guidance designed for real life.",
    bg: "from-blue-900/70 to-blue-700/50",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
    tag: "🥗 Expert Nutritionist",
  },
  {
    title: "Daily Accountability",
    overlay: "Small daily actions that create sustainable, lasting health change.",
    bg: "from-teal-900/70 to-teal-700/50",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=900&q=80",
    tag: "🏃 Fitness Coaching",
  },
  {
    title: "Track Your Progress",
    overlay: "See measurable progress over time — not just generic advice.",
    bg: "from-indigo-900/70 to-indigo-700/50",
    image: "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80",
    tag: "📊 Progress Tracking",
  },
];

const teamMembers = [
  {
    role: "Doctor",
    desc: "Oversees medical plan and treatment decisions.",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80",
    name: "Dr. A. Mehta",
    spec: "Metabolic Medicine",
  },
  {
    role: "Nutritionist",
    desc: "Creates personalized, sustainable nutrition plans.",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=400&q=80",
    name: "Priya S.",
    spec: "Clinical Nutrition",
  },
  {
    role: "Fitness Coach",
    desc: "Designs practical movement routines for real life.",
    image: "https://images.unsplash.com/photo-1524901548305-08eeddc35080?auto=format&fit=crop&w=400&q=80",
    name: "Karan V.",
    spec: "Lifestyle & Movement",
  },
  {
    role: "Care Coordinator",
    desc: "Ensures consistent follow-up and accountability.",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80",
    name: "Anita R.",
    spec: "Patient Support",
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
    image: "https://images.unsplash.com/photo-1551190822-a9333d879b1f?auto=format&fit=crop&w=600&q=80",
  },
  {
    week: "Week 1",
    title: "Start Your Program",
    desc: "Begin your nutrition plan, movement routine, and habit tracking. Receive structured support and daily accountability.",
    image: "https://images.unsplash.com/photo-1593810451137-5dc55105dcd6?auto=format&fit=crop&w=600&q=80",
  },
  {
    week: "Week 2 onwards",
    title: "Continuous Fine-Tuning",
    desc: "Your care team regularly reviews progress and adjusts recommendations to help improve long-term consistency and outcomes.",
    image: "https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=600&q=80",
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

            {/* Carousel with images */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative w-full max-w-lg mx-auto"
            >
              <div className="relative aspect-[16/11] rounded-3xl overflow-hidden bg-muted border shadow-2xl">
                {carouselFrames.map((frame, i) => (
                  <div
                    key={i}
                    className={`absolute inset-0 transition-opacity duration-700 ${i === activeFrame ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                  >
                    {/* Background photo */}
                    <img
                      src={frame.image}
                      alt={frame.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {/* Gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${frame.bg}`} />
                    {/* Text content */}
                    <div className="absolute inset-0 flex flex-col items-start justify-end p-7 text-white">
                      <span className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-2">{frame.tag}</span>
                      <h3 className="text-2xl font-bold leading-tight mb-2">{frame.title}</h3>
                      <p className="text-white/85 text-sm leading-relaxed">{frame.overlay}</p>
                    </div>
                    {/* Bottom tag */}
                    <div className="absolute top-5 right-5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2">
                      <p className="text-white font-semibold text-xs flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-300" />{frame.title}</p>
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
                    className={`h-2 rounded-full transition-all ${i === activeFrame ? 'bg-primary w-6' : 'bg-muted-foreground/30 w-2'}`}
                  />
                ))}
              </div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/15 rounded-full blur-3xl -z-10" />
              <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-secondary/10 rounded-full blur-3xl -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF STRIP */}
      <section className="py-10 bg-muted/40 border-y">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 text-center">
            {[
              { stat: "Doctor-Led", label: "Clinical Oversight" },
              { stat: "Coordinated", label: "Care Team" },
              { stat: "Daily", label: "Accountability" },
              { stat: "Personalized", label: "Nutrition & Movement" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-xl font-bold text-primary">{item.stat}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">{item.label}</span>
              </div>
            ))}
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
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">A structured, supportive path from consultation to lasting results.</p>
          </div>
          <div className="max-w-4xl mx-auto space-y-8">
            {journeySteps.map((step, i) => (
              <div key={i} className="flex flex-col md:flex-row gap-6 items-start group">
                <div className="md:w-56 shrink-0 rounded-2xl overflow-hidden aspect-[4/3] shadow-md">
                  <img src={step.image} alt={step.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="flex gap-5">
                  <div className="flex flex-col items-center mt-1">
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* YOUR TEAM */}
      <section className="py-24 bg-gradient-to-b from-muted/30 to-blue-soft/10 border-y">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">A Coordinated Care Team</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Cloudberry combines doctors, nutritionists, fitness coaches, and care coordinators to support patients through personalized, structured care.
            </p>
            <p className="text-sm text-primary mt-4 font-medium">Founding clinical team details coming soon.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {teamMembers.map((member, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.role}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5">
                  <Badge variant="secondary" className="text-xs mb-2 bg-primary/10 text-primary border-0">{member.role}</Badge>
                  <h3 className="font-bold text-base text-foreground">{member.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{member.spec}</p>
                  <p className="text-sm text-muted-foreground">{member.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Flexible Programs Designed Around Your Needs</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the level of support that fits your needs. All plans include accountability, support, and measurable outcomes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch mb-10">
            {[
              { name: "Accountability Program", price: "₹990", desc: "Lightweight accountability and structured follow-up.", features: ["Daily WhatsApp check-ins", "Personalized reminders", "Monthly coaching call", "Educational resources"], popular: false },
              { name: "Structured Coaching", price: "₹1,990", desc: "Personalized lifestyle support with nutrition and movement.", features: ["Everything in Basic", "Personalized nutrition plan", "Movement guidance", "Bi-weekly coaching calls"], popular: true },
              { name: "Advanced Monitoring", price: "₹3,990", desc: "Closer monitoring and higher-touch support for complex needs.", features: ["Everything in Comprehensive", "Glucose tracking support", "Higher-frequency follow-ups", "Priority support"], popular: false },
            ].map((plan, i) => (
              <Card key={i} className={`flex flex-col relative ${plan.popular ? "border-primary shadow-lg" : "border-border shadow-sm"}`}>
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Most Popular</div>
                )}
                <CardHeader className="text-center pb-4 border-b">
                  <CardTitle className="text-lg font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-sm mb-2">{plan.desc}</CardDescription>
                  <div className="text-3xl font-bold text-foreground">{plan.price}<span className="text-base text-muted-foreground font-normal">/month</span></div>
                </CardHeader>
                <CardContent className="pt-5 flex-1">
                  <ul className="space-y-2">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-foreground/80">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button asChild variant={plan.popular ? "default" : "outline"} className="w-full rounded-full">
                    <Link href={`/patient/signup?plan=${i === 0 ? "basic" : i === 1 ? "comprehensive" : "premium"}`}>Get Started</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button asChild variant="outline" size="lg" className="rounded-full px-8">
              <Link href="/programs">View Full Programs & Pricing <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
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
