import { MarketingLayout } from "@/components/layout/marketing-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ArrowRight, CheckCircle2, ChevronRight, Activity, ActivitySquare, HeartPulse } from "lucide-react";

export default function HomePage() {
  return (
    <MarketingLayout>
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-background pt-8 pb-20 md:pt-16 md:pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col gap-6 max-w-2xl"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif leading-[1.1] text-foreground font-bold tracking-tight">
                <span className="relative inline-block">
                  Personalized
                  <span className="absolute bottom-1 left-0 w-full h-3 bg-primary/20 -z-10 rounded-sm"></span>
                </span>
                , doctor-led care for sustainable weight and diabetes management.
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Cloudberry combines medical guidance, nutrition, fitness, and continuous coaching to help you build healthier habits and long-term results.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="flex flex-col gap-2">
                  <Button asChild size="lg" className="rounded-full px-8 text-base h-14 w-full sm:w-auto">
                    <Link href="/patient/signup">Get Started <ArrowRight className="ml-2 h-5 w-5" /></Link>
                  </Button>
                  <p className="text-xs text-muted-foreground text-center sm:text-left">Book a free 20-minute consultation to explore if Cloudberry is right for you.</p>
                </div>
                <Button asChild variant="outline" size="lg" className="rounded-full px-8 text-base h-14 w-full sm:w-auto border-primary/20 hover:bg-primary/5 text-primary">
                  <Link href="/physician">For Physicians <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative w-full aspect-square max-w-xl mx-auto"
            >
              <Carousel className="w-full" opts={{ loop: true }}>
                <CarouselContent>
                  <CarouselItem>
                    <div className="relative aspect-square rounded-3xl overflow-hidden border bg-muted">
                      <img src="/images/hero-1-doctor.png" alt="Doctor-Led Care" className="w-full h-full object-cover" />
                      <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-white/20">
                        <p className="font-semibold text-foreground flex items-center gap-2"><CheckCircle2 className="text-primary h-5 w-5" /> Doctor-Led Care</p>
                      </div>
                    </div>
                  </CarouselItem>
                  <CarouselItem>
                    <div className="relative aspect-square rounded-3xl overflow-hidden border bg-muted">
                      <img src="/images/hero-2-support.png" alt="Personalized Support" className="w-full h-full object-cover" />
                      <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-white/20">
                        <p className="font-semibold text-foreground flex items-center gap-2"><CheckCircle2 className="text-primary h-5 w-5" /> Personalized Support</p>
                      </div>
                    </div>
                  </CarouselItem>
                  <CarouselItem>
                    <div className="relative aspect-square rounded-3xl overflow-hidden border bg-muted">
                      <img src="/images/hero-3-nutrition.png" alt="Nutrition Support" className="w-full h-full object-cover" />
                      <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-white/20">
                        <p className="font-semibold text-foreground flex items-center gap-2"><CheckCircle2 className="text-primary h-5 w-5" /> Nutrition Support</p>
                      </div>
                    </div>
                  </CarouselItem>
                  <CarouselItem>
                    <div className="relative aspect-square rounded-3xl overflow-hidden border bg-muted">
                      <img src="/images/hero-4-lifestyle.png" alt="Lifestyle Changes" className="w-full h-full object-cover" />
                      <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-white/20">
                        <p className="font-semibold text-foreground flex items-center gap-2"><CheckCircle2 className="text-primary h-5 w-5" /> Lifestyle Changes</p>
                      </div>
                    </div>
                  </CarouselItem>
                  <CarouselItem>
                    <div className="relative aspect-square rounded-3xl overflow-hidden border bg-muted">
                      <img src="/images/hero-5-tracking.png" alt="Tracking Diagnostics" className="w-full h-full object-cover" />
                      <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-white/20">
                        <p className="font-semibold text-foreground flex items-center gap-2"><CheckCircle2 className="text-primary h-5 w-5" /> Tracking & Diagnostics</p>
                      </div>
                    </div>
                  </CarouselItem>
                </CarouselContent>
                <div className="hidden md:block">
                  <CarouselPrevious className="left-4" />
                  <CarouselNext className="right-4" />
                </div>
              </Carousel>
              
              {/* Decorative blobs */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl -z-10"></div>
              <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-secondary/20 rounded-full blur-3xl -z-10"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* WHY CLOUDBERRY */}
      <section className="py-20 bg-muted/50 border-y">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 bg-white">Why Cloudberry</Badge>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">A different approach to metabolic health</h2>
          </div>
          
          <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="item-1">
            <AccordionItem value="item-1" className="bg-card border rounded-2xl px-6 data-[state=open]:shadow-md transition-all">
              <AccordionTrigger className="text-xl font-semibold hover:no-underline py-6">
                <div className="flex items-center gap-4 text-left">
                  <span className="text-primary font-mono text-sm border border-primary/20 bg-primary/5 rounded-full w-8 h-8 flex items-center justify-center">01</span>
                  Medical-grade personalisation
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-lg leading-relaxed pb-6 pt-2 pl-12 border-t">
                <p className="mb-4">Your biology matters. We don't believe in one-size-fits-all diets.</p>
                <p>Our licensed physicians analyze your metabolic markers, medical history, and lifestyle to create a tailored program that addresses the root cause of your weight or glucose challenges, not just the symptoms.</p>
                <div className="flex flex-wrap gap-2 mt-6">
                  <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 font-normal">Doctor-led protocols</Badge>
                  <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 font-normal">Lab diagnostics</Badge>
                  <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 font-normal">Evidence-based</Badge>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2" className="bg-card border rounded-2xl px-6 data-[state=open]:shadow-md transition-all">
              <AccordionTrigger className="text-xl font-semibold hover:no-underline py-6">
                <div className="flex items-center gap-4 text-left">
                  <span className="text-primary font-mono text-sm border border-primary/20 bg-primary/5 rounded-full w-8 h-8 flex items-center justify-center">02</span>
                  All-in-one care ecosystem
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-lg leading-relaxed pb-6 pt-2 pl-12 border-t">
                <p className="mb-4">Everything under one roof.</p>
                <p>Instead of bouncing between a doctor, a nutritionist, and a fitness app, Cloudberry gives you a dedicated care team that talks to each other. Your progress is monitored continuously, allowing for real-time adjustments to your plan.</p>
                <div className="flex flex-wrap gap-2 mt-6">
                  <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 font-normal">Coordinated team</Badge>
                  <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 font-normal">Continuous monitoring</Badge>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3" className="bg-card border rounded-2xl px-6 data-[state=open]:shadow-md transition-all">
              <AccordionTrigger className="text-xl font-semibold hover:no-underline py-6">
                <div className="flex items-center gap-4 text-left">
                  <span className="text-primary font-mono text-sm border border-primary/20 bg-primary/5 rounded-full w-8 h-8 flex items-center justify-center">03</span>
                  Built for long-term success
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-lg leading-relaxed pb-6 pt-2 pl-12 border-t">
                <p className="mb-4">Not quick fixes — lasting results.</p>
                <p>We focus on sustainable habit formation rather than restrictive deprivation. Our coaches work with you to implement realistic lifestyle changes that you can maintain for years, not just weeks.</p>
                <div className="flex flex-wrap gap-2 mt-6">
                  <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 font-normal">Habit coaching</Badge>
                  <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 font-normal">Sustainable nutrition</Badge>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* GUARANTEE & IMPACT */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6 leading-tight">
              We guarantee <span className="bg-white text-primary px-2 py-1 rounded-lg">10+%</span> weight loss — otherwise, <span className="underline decoration-white/50 underline-offset-4 decoration-4">money back</span>.
            </h2>
            <p className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto">
              Our clinical protocols are so effective when followed consistently that we back them with a financial guarantee.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            <Card className="bg-primary-foreground/10 border-white/20 text-primary-foreground backdrop-blur-sm">
              <CardHeader className="pb-2">
                <Activity className="h-8 w-8 mb-4 text-white/80" />
                <CardTitle className="text-4xl font-bold font-serif">—</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-primary-foreground/80">Build healthier daily habits</p>
              </CardContent>
            </Card>
            <Card className="bg-primary-foreground/10 border-white/20 text-primary-foreground backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CheckCircle2 className="h-8 w-8 mb-4 text-white/80" />
                <CardTitle className="text-4xl font-bold font-serif">—</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-primary-foreground/80">Improve consistency and accountability</p>
              </CardContent>
            </Card>
            <Card className="bg-primary-foreground/10 border-white/20 text-primary-foreground backdrop-blur-sm">
              <CardHeader className="pb-2">
                <HeartPulse className="h-8 w-8 mb-4 text-white/80" />
                <CardTitle className="text-4xl font-bold font-serif">—</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-primary-foreground/80">Support long-term weight and glucose management</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 5-STEP JOURNEY */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">Our 5-Step Journey to Lasting Results</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A structured, clinical pathway designed to build momentum and ensure sustainable health improvements. <span className="font-medium text-foreground bg-primary/10 px-2 py-0.5 rounded">You pay monthly and can opt out anytime.</span>
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-4">
              {[
                { step: "I", title: "Assess & Initiate", time: "Week 0", desc: "Complete a detailed medical and lifestyle questionnaire. Optional lab tests to establish your metabolic baseline." },
                { step: "II", title: "Personalized Program Consultation", time: "Week 0", desc: "Meet with your Cloudberry physician via video call to discuss your health history, goals, and create your personalized medical plan." },
                { step: "III", title: "Kick-off the program", time: "Week 1", desc: "Your dedicated coach and nutritionist introduce your tailored nutrition and activity plan. Download the app to start tracking." },
                { step: "IV", title: "Weekly Fine-Tuning With Experts", time: "Weeks 2–12", desc: "Regular check-ins with your care team to monitor progress, overcome hurdles, and adjust your plan based on your body's response." },
                { step: "V", title: "Lifelong Support & Sustained Results", time: "Ongoing", desc: "Transition from active intervention to sustainable maintenance with continued monitoring and support to prevent relapse." }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 md:gap-6 group">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-mono font-medium text-sm border group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors shrink-0 z-10">
                      {item.step}
                    </div>
                    {i < 4 && <div className="w-px h-full bg-border -my-2 group-hover:bg-primary/30 transition-colors"></div>}
                  </div>
                  <div className="pb-10 pt-1">
                    <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
                      <Badge variant="secondary" className="font-mono text-xs">{item.time}</Badge>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 bg-muted/30 border-y scroll-m-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">Flexible Programs Designed Around Your Needs</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the level of support that fits your lifestyle. All plans include medical oversight and our proprietary app.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
            {/* Basic */}
            <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="text-center pb-8 border-b">
                <CardTitle className="text-xl text-foreground font-semibold">Basic</CardTitle>
                <CardDescription className="mb-4">Accountability Program</CardDescription>
                <div className="text-4xl font-bold font-serif text-foreground">₹990<span className="text-lg text-muted-foreground font-sans font-normal">/mo</span></div>
              </CardHeader>
              <CardContent className="pt-8">
                <ul className="space-y-4">
                  {["Daily WhatsApp check-ins", "Personalized habit reminders", "Monthly progress summary", "Monthly coaching call", "Educational resources and tips"].map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
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
            <Card className="border-primary shadow-md relative scale-100 md:scale-105 z-10 bg-card">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Most Popular
              </div>
              <CardHeader className="text-center pb-8 border-b">
                <CardTitle className="text-xl text-foreground font-semibold">Comprehensive</CardTitle>
                <CardDescription className="mb-4">Structured Coaching Program</CardDescription>
                <div className="text-4xl font-bold font-serif text-foreground">₹1,990<span className="text-lg text-muted-foreground font-sans font-normal">/mo</span></div>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="text-sm font-semibold mb-4 text-primary">Everything in Basic, plus:</div>
                <ul className="space-y-4">
                  {["Personalized nutrition plan", "Personalized activity guidance", "Initial onboarding session", "Bi-weekly coaching follow-ups"].map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
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
              <CardHeader className="text-center pb-8 border-b">
                <CardTitle className="text-xl text-foreground font-semibold">Premium</CardTitle>
                <CardDescription className="mb-4">Advanced Monitoring Program</CardDescription>
                <div className="text-4xl font-bold font-serif text-foreground">₹3,990<span className="text-lg text-muted-foreground font-sans font-normal">/mo</span></div>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="text-sm font-semibold mb-4 text-primary">Everything in Comprehensive, plus:</div>
                <ul className="space-y-4">
                  {["Glucose tracking support", "Advanced progress monitoring", "Higher-frequency check-ins", "Priority support"].map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
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
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">Your Coordinated Care Team</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Cloudberry combines doctors, nutritionists, fitness coaches, and care coordinators to create coordinated, personalized care.
            </p>
            <p className="text-sm text-primary mt-4 font-medium">Founding clinical team details coming soon.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { role: "Obesity Medicine Physician", desc: "Oversees medical plan and lab diagnostics.", img: "/images/team-dr-mehta.png" },
              { role: "Clinical Nutritionist", desc: "Creates sustainable eating frameworks.", img: "/images/team-priya.png" },
              { role: "Fitness Coach", desc: "Designs realistic activity protocols.", img: "/images/team-karan.png" },
              { role: "Care Coordinator", desc: "Your daily accountability partner.", img: "/images/team-coordinator.png" }
            ].map((member, i) => (
              <Card key={i} className="overflow-hidden border-border bg-card shadow-sm hover:shadow-md transition-shadow group">
                <div className="aspect-square w-full overflow-hidden bg-muted relative">
                  <img src={member.img} alt={member.role} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <CardContent className="p-5">
                  <h3 className="font-semibold text-lg mb-1">{member.role}</h3>
                  <p className="text-sm text-muted-foreground">{member.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      <div className="h-24 lg:hidden"></div> {/* Spacer for mobile floating bar */}
    </MarketingLayout>
  );
}
