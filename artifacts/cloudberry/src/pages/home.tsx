import { MarketingLayout } from "@/components/layout/marketing-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Activity, HeartPulse, Users, TrendingUp, GraduationCap, Stethoscope, MapPin } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const carouselFrames = [
  { title: "Doctor-Led Care", overlay: "Medical care built around your long-term health goals.", bg: "from-blue-900/65 to-blue-700/45", image: "/carousel-doctor.png", tag: "Physician-Supervised" },
  { title: "Personalized Nutrition", overlay: "Practical, culturally-fit nutrition guidance designed for real life.", bg: "from-green-900/65 to-green-700/45", image: "/carousel-nutrition.png", tag: "Expert Nutritionist" },
  { title: "Daily Accountability", overlay: "Small daily actions that create sustainable, lasting health change.", bg: "from-teal-900/65 to-teal-700/45", image: "/carousel-accountability.png", tag: "Daily Check-Ins" },
  { title: "Track Your Progress", overlay: "See measurable progress over time — not just generic advice.", bg: "from-indigo-900/65 to-indigo-700/45", image: "/carousel-progress.png", tag: "Progress Tracking" },
];

const whyCards = [
  { problem: "Most dieticians go ahead with typical, generic treatments and advice without understanding the depth of the situation — moving according to a basic reaction-plan approach.", solution: "We take the time to understand your body, your life, and your patterns before we even start building your plan.", label: "One Size Doesn't Fit All", num: "01" },
  { problem: "Inconsistency is what kills progress. You start strong, then life happens — and without someone holding you to it, the momentum dies.", solution: "Our care coordinators follow up daily. We beat inconsistency before it beats you.", label: "Consistency Is the Hard Part", num: "02" },
  { problem: "Your doctor, your dietician, and your gym trainer don't talk to each other — your care is scattered, and no one has the full picture.", solution: "Think of us as your friendly, owned-up commentator — monitoring you no matter where you are, keeping everything connected.", label: "You Need Someone in Your Corner", num: "03" },
  { problem: "Your in-checks will be tackled by your doctor and our merit-holder, worldly-experienced dieticians and caregivers who have seen what actually works.", solution: "We track the numbers that actually matter and make sure you can see your own progress clearly — no guesswork.", label: "Progress You Can Actually See", num: "04" },
];

const impactBlocks = [
  { icon: <Activity className="w-7 h-7 text-sky-400" />, title: "Better Lifestyle Consistency", desc: "Track habits and improve adherence over time." },
  { icon: <TrendingUp className="w-7 h-7 text-blue-400" />, title: "Sustainable Weight Management", desc: "Focus on gradual, long-term progress." },
  { icon: <HeartPulse className="w-7 h-7 text-rose-400" />, title: "Improved Glucose Awareness", desc: "Help patients better understand and manage their health patterns." },
  { icon: <Users className="w-7 h-7 text-emerald-400" />, title: "Continuous Human Support", desc: "Regular follow-up to help patients stay engaged and motivated." },
];

const journeySteps = [
  { week: "Week 0", title: "Assessment & Planning", desc: "Meet your care team to understand your health goals, medical history, lifestyle, and challenges. Together, we create a personalized plan aligned with your doctor's guidance." },
  { week: "Week 1", title: "Start Your Program", desc: "Begin your nutrition plan, movement routine, and habit tracking. Receive structured support and daily accountability." },
  { week: "Week 2 onwards", title: "Continuous Fine-Tuning", desc: "Your care team regularly reviews progress and adjusts recommendations to help improve long-term consistency and outcomes." },
];

const aboutCards = [
  {
    bg: "bg-primary/5 border-primary/15",
    iconBg: "bg-primary/10",
    icon: <Stethoscope className="w-6 h-6 text-primary" />,
    title: "Built Around Doctor Trust",
    body: "Every care decision at Cloudberry flows through a licensed physician. We don't replace doctors — we extend their reach so more patients can access the oversight they need.",
  },
  {
    bg: "bg-amber-50 border-amber-100",
    iconBg: "bg-amber-100",
    icon: <GraduationCap className="w-6 h-6 text-amber-600" />,
    title: "Alumni of IIT M and INSEAD",
    body: "Our founding team brings deep experience across engineering, clinical science, and global business — combining rigour with real-world pragmatism in building healthcare technology.",
  },
  {
    bg: "bg-slate-50 border-slate-100",
    iconBg: "bg-slate-100",
    icon: <MapPin className="w-6 h-6 text-slate-600" />,
    title: "Kicking It Off in Indore",
    body: "Starting from Indore, Madhya Pradesh — a city at the heart of India's growing middle class — we're building for patients who want quality care without travelling to a metro.",
  },
];

export default function HomePage() {
  const [activeFrame, setActiveFrame] = useState(0);
  const [activeCard, setActiveCard] = useState(0);
  const [activeAboutCard, setActiveAboutCard] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);
  const cardsRef = useRef<HTMLDivElement | null>(null);
  const aboutCardsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => { setActiveFrame(prev => (prev + 1) % carouselFrames.length); }, 3500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const handleCarouselTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.targetTouches[0].clientX; };
  const handleCarouselTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setActiveFrame(prev => diff > 0 ? (prev + 1) % carouselFrames.length : (prev - 1 + carouselFrames.length) % carouselFrames.length);
    }
    touchStartX.current = null;
  };

  const scrollToCard = (idx: number) => {
    setActiveCard(idx);
    if (cardsRef.current) {
      const container = cardsRef.current;
      const cardWidth = container.scrollWidth / whyCards.length;
      container.scrollTo({ left: cardWidth * idx, behavior: "smooth" });
    }
  };

  const scrollToAboutCard = (idx: number) => {
    setActiveAboutCard(idx);
    if (aboutCardsRef.current) {
      const container = aboutCardsRef.current;
      const cardWidth = container.scrollWidth / aboutCards.length;
      container.scrollTo({ left: cardWidth * idx, behavior: "smooth" });
    }
  };

  return (
    <MarketingLayout>
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-background pt-6 pb-14 md:pt-10 md:pb-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-blue-50/30 to-amber-50/40 pointer-events-none" />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex flex-col gap-5 max-w-xl">
              <h1 className="text-4xl md:text-5xl lg:text-[3.2rem] font-bold leading-[1.1] text-foreground tracking-tight">
                Personalized, doctor-led care for sustainable metabolic health.
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Cloudberry combines medical guidance, nutrition, movement, and continuous coaching to help patients build healthier habits and achieve sustainable long-term results.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-1">
                <div className="flex flex-col gap-1.5">
                  <Button asChild size="lg" className="rounded-full px-8 text-base h-13 w-full sm:w-auto">
                    <Link href="/patient/signup">For Patients <ArrowRight className="ml-2 h-5 w-5" /></Link>
                  </Button>
                  <p className="text-xs text-muted-foreground text-center sm:text-left">Sign up to start your care journey with Cloudberry.</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Button asChild variant="outline" size="lg" className="rounded-full px-8 text-base h-13 w-full sm:w-auto border-primary/30 hover:bg-primary/5 text-primary">
                    <Link href="/physician/signup">For Doctors <ArrowRight className="ml-2 h-5 w-5" /></Link>
                  </Button>
                  <p className="text-xs text-muted-foreground text-center sm:text-left">Partner with Cloudberry to extend your clinic's reach.</p>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative w-full max-w-lg mx-auto">
              <div className="relative aspect-[16/11] rounded-3xl overflow-hidden bg-muted border shadow-2xl cursor-grab active:cursor-grabbing" onTouchStart={handleCarouselTouchStart} onTouchEnd={handleCarouselTouchEnd}>
                {carouselFrames.map((frame, i) => (
                  <div key={i} className={`absolute inset-0 transition-opacity duration-700 ${i === activeFrame ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                    <img src={frame.image} alt={frame.title} className="absolute inset-0 w-full h-full object-cover" />
                    <div className={`absolute inset-0 bg-gradient-to-br ${frame.bg}`} />
                    <div className="absolute inset-0 flex flex-col items-start justify-end p-7 text-white">
                      <span className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-2">{frame.tag}</span>
                      <h3 className="text-2xl font-bold leading-tight mb-2">{frame.title}</h3>
                      <p className="text-white/85 text-sm leading-relaxed">{frame.overlay}</p>
                    </div>
                    <div className="absolute top-5 right-5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2">
                      <p className="text-white font-semibold text-xs flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-300" />{frame.title}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-2 mt-4">
                {carouselFrames.map((_, i) => (
                  <button key={i} onClick={() => { setActiveFrame(i); if (intervalRef.current) clearInterval(intervalRef.current); }}
                    className={`h-2 rounded-full transition-all ${i === activeFrame ? 'bg-primary w-6' : 'bg-muted-foreground/30 w-2'}`} />
                ))}
              </div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/15 rounded-full blur-3xl -z-10" />
              <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-amber-200/10 rounded-full blur-3xl -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF STRIP — Dark */}
      <section className="py-8 bg-gray-900">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 text-center">
            {[
              { stat: "Doctor-Led", label: "Clinical Oversight" },
              { stat: "Coordinated", label: "Care Team" },
              { stat: "Daily", label: "Accountability" },
              { stat: "Personalized", label: "Nutrition & Movement" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-xl font-bold text-sky-300">{item.stat}</span>
                <span className="text-xs text-white/60 uppercase tracking-wider">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY MOST PLANS DON'T LAST */}
      <section className="py-14 bg-gradient-to-b from-muted/60 to-blue-50/20 border-y">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Why Most Plans Fall Apart</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Real talk — and what we do differently.</p>
          </div>
          {/* Desktop Grid */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {whyCards.map((card, i) => (
              <Card key={i} className="border-border shadow-sm hover:shadow-md transition-shadow bg-card flex flex-col h-full">
                <CardHeader className="pb-3">
                  <span className="text-xs font-mono font-bold text-primary bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center mb-3">{card.num}</span>
                  <CardTitle className="text-base font-semibold text-foreground leading-snug">{card.label}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 flex-1">
                  <div className="bg-muted/70 rounded-xl p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">The Reality</p>
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
          {/* Mobile Carousel */}
          <div className="md:hidden">
            <div ref={cardsRef} className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {whyCards.map((card, i) => (
                <div key={i} className="snap-start shrink-0 w-[82vw]">
                  <Card className="border-border shadow-sm bg-card flex flex-col h-full">
                    <CardHeader className="pb-3">
                      <span className="text-xs font-mono font-bold text-primary bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center mb-3">{card.num}</span>
                      <CardTitle className="text-base font-semibold text-foreground leading-snug">{card.label}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4 flex-1">
                      <div className="bg-muted/70 rounded-xl p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">The Reality</p>
                        <p className="text-sm text-foreground/80 leading-relaxed">{card.problem}</p>
                      </div>
                      <div className="bg-primary/8 border border-primary/20 rounded-xl p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Cloudberry</p>
                        <p className="text-sm text-foreground/80 leading-relaxed">{card.solution}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-2 mt-4">
              {whyCards.map((_, i) => (
                <button key={i} onClick={() => scrollToCard(i)}
                  className={`h-2 rounded-full transition-all ${i === activeCard ? 'bg-primary w-6' : 'bg-muted-foreground/30 w-2'}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHAT WE AIM TO HELP YOU IMPROVE — Dark */}
      <section className="py-16 bg-gray-900">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">What We Aim To Help You Improve</h2>
            <p className="text-white/60 text-lg max-w-xl mx-auto">Measurable outcomes that matter — tracked consistently over time.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {impactBlocks.map((block, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-3 hover:bg-white/10 hover:border-white/20 transition-all">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">{block.icon}</div>
                <h3 className="font-semibold text-base text-white leading-snug">{block.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{block.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* YOUR JOURNEY WITH CLOUDBERRY */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Your Journey With Cloudberry</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">A structured, supportive path from consultation to lasting results.</p>
          </div>
          <div className="max-w-2xl mx-auto space-y-0">
            {journeySteps.map((step, i) => (
              <div key={i} className="flex gap-5 items-start group">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-mono font-bold text-sm border border-primary/30 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors shrink-0 z-10 text-primary">
                    {i + 1}
                  </div>
                  {i < journeySteps.length - 1 && <div className="w-px flex-1 bg-border mt-2 group-hover:bg-primary/30 transition-colors" style={{ minHeight: '2.5rem' }} />}
                </div>
                <div className="pb-8 pt-1">
                  <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                    <h3 className="text-xl font-bold text-foreground">{step.title}</h3>
                    <Badge variant="secondary" className="font-mono text-xs">{step.week}</Badge>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROGRAMS & PRICING — Dark, all uniform */}
      <section id="pricing" className="py-14 bg-gray-900 scroll-mt-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Programs & Pricing</h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Choose the level of support that fits your needs. All plans include daily accountability, doctor oversight, and measurable outcomes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {[
              {
                label: "BASIC", name: "Basic Plan", subtitle: "Accountability Program", price: "₹990", planKey: "basic", popular: false,
                bestFor: "Patients wanting lightweight accountability support.", everythingIn: null,
                includes: ["Daily WhatsApp check-ins", "Personalized reminders", "Monthly coaching call", "Educational resources"],
              },
              {
                label: "COMPREHENSIVE", name: "Comprehensive Plan", subtitle: "Structured Coaching", price: "₹1,990", planKey: "comprehensive", popular: true,
                bestFor: "Patients wanting personalized nutrition and movement guidance.", everythingIn: "Everything in Basic +",
                includes: ["Personalized nutrition plan", "Personalized activity guidance", "Bi-weekly coaching calls"],
              },
              {
                label: "PREMIUM", name: "Premium Plan", subtitle: "Advanced Monitoring", price: "₹3,990", planKey: "premium", popular: false,
                bestFor: "Patients needing closer monitoring and higher-touch support.", everythingIn: "Everything in Comprehensive +",
                includes: ["Glucose tracking support", "Higher-frequency follow-ups", "Priority support"],
              },
            ].map((plan, pi) => (
              <div key={pi} className={`rounded-2xl flex flex-col gap-4 p-6 relative ${
                plan.popular
                  ? "bg-white/10 border border-primary/50 ring-1 ring-primary/30"
                  : "bg-white/5 border border-white/15"
              }`}>
                <div>
                  <span className={`inline-block text-[10px] font-extrabold tracking-widest px-3 py-1 rounded-full ${
                    plan.popular ? "bg-primary text-white" : "border border-white/20 text-white/60"
                  }`}>{plan.label}</span>
                  {plan.popular && <span className="ml-2 text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">Most Popular</span>}
                </div>
                <div>
                  <h3 className="text-2xl font-bold leading-tight text-white">{plan.name}</h3>
                  <p className="text-sm mt-0.5 text-white/50">{plan.subtitle}</p>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-base font-normal text-white/50">/month</span>
                  </div>
                </div>
                <hr className="border-white/10" />
                <div>
                  <p className="text-[10px] font-extrabold tracking-widest uppercase mb-1 text-white/40">Best For:</p>
                  <p className="text-sm leading-relaxed text-white/60">{plan.bestFor}</p>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-extrabold tracking-widest uppercase mb-2 text-white/40">Includes:</p>
                  {plan.everythingIn && <p className="text-sm font-semibold mb-2 text-amber-400">{plan.everythingIn}</p>}
                  <ul className="space-y-2">
                    {plan.includes.map((feat, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-white/70">
                        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button asChild variant="outline" className="w-full rounded-full mt-auto border-white/20 text-white hover:bg-white/10">
                  <Link href={`/patient/signup?plan=${plan.planKey}`}>Get Started</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT US */}
      <section id="about" className="py-16 bg-background scroll-mt-20">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">About Us</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Cloudberry was built by people who believe healthcare needs a smarter, more human approach to chronic metabolic conditions.
            </p>
          </div>

          {/* Desktop Grid */}
          <div className="hidden md:grid grid-cols-3 gap-6">
            {aboutCards.map((card, i) => (
              <div key={i} className={`rounded-2xl p-7 flex flex-col gap-4 border ${card.bg}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.iconBg}`}>{card.icon}</div>
                <h3 className="text-lg font-bold text-foreground">{card.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>

          {/* Mobile Carousel */}
          <div className="md:hidden">
            <div ref={aboutCardsRef} className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {aboutCards.map((card, i) => (
                <div key={i} className="snap-start shrink-0 w-[82vw]">
                  <div className={`rounded-2xl p-7 flex flex-col gap-4 border h-full ${card.bg}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.iconBg}`}>{card.icon}</div>
                    <h3 className="text-lg font-bold text-foreground">{card.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{card.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-2 mt-4">
              {aboutCards.map((_, i) => (
                <button key={i} onClick={() => scrollToAboutCard(i)}
                  className={`h-2 rounded-full transition-all ${i === activeAboutCard ? 'bg-primary w-6' : 'bg-muted-foreground/30 w-2'}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQs — White background */}
      <section id="faqs" className="py-14 bg-white border-t scroll-mt-20">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <div className="text-center mb-8">
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
            ].map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border/50 rounded-2xl px-5 bg-slate-50/60">
                <AccordionTrigger className="text-foreground font-medium hover:no-underline py-4">{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </MarketingLayout>
  );
}
