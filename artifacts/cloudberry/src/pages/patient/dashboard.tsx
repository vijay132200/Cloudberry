import { PatientLayout } from "@/components/layout/patient-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetPatientDashboard, useSubmitCheckin, useListTips, useListAppointments } from "@workspace/api-client-react";
import { CheckinInputEnergyLevel, CheckinInputMealsFollowed, CheckinInputMood } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Activity, TrendingDown, Target, Droplet, Heart, ChevronRight, Video, Calendar, Clock, Apple, Dumbbell, Salad, Flame, Lock } from "lucide-react";

const checkinSchema = z.object({
  mealsFollowed: z.enum([CheckinInputMealsFollowed.yes, CheckinInputMealsFollowed.partially, CheckinInputMealsFollowed.no]),
  activityCompleted: z.boolean(),
  energyLevel: z.enum([CheckinInputEnergyLevel.low, CheckinInputEnergyLevel.moderate, CheckinInputEnergyLevel.good]),
  mood: z.enum([CheckinInputMood.stressed, CheckinInputMood.neutral, CheckinInputMood.positive]),
  glucoseReading: z.number().optional().or(z.literal("").transform(() => undefined)),
});

type Plan = "basic" | "comprehensive" | "premium";

function planIncludes(plan: Plan, feature: "nutrition" | "movement" | "glucose" | "advanced_reviews"): boolean {
  if (feature === "nutrition" || feature === "movement") return plan === "comprehensive" || plan === "premium";
  if (feature === "glucose" || feature === "advanced_reviews") return plan === "premium";
  return false;
}

function PlanLockedBanner({ plan, feature }: { plan: Plan; feature: string }) {
  return (
    <div className="flex items-center gap-3 bg-muted/60 border border-dashed border-border rounded-xl px-5 py-4 text-muted-foreground text-sm">
      <Lock className="w-4 h-4 shrink-0" />
      <span><span className="font-semibold text-foreground">{feature}</span> is available on the Comprehensive or Premium plan. <a href="/#pricing" className="text-primary underline underline-offset-2">Upgrade your plan</a></span>
    </div>
  );
}

export default function PatientDashboard() {
  const { toast } = useToast();

  const { data: dashData } = useGetPatientDashboard();
  const submitCheckin = useSubmitCheckin();

  const form = useForm<z.infer<typeof checkinSchema>>({
    resolver: zodResolver(checkinSchema),
    defaultValues: {
      activityCompleted: false,
    }
  });

  const onSubmit = (values: z.infer<typeof checkinSchema>) => {
    submitCheckin.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Check-in logged", description: "Great job staying consistent today!" });
        form.reset();
      },
      onError: () => {
        toast({ title: "Demo Check-in", description: "Logged in demo mode." });
      }
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Morning";
    if (hour < 18) return "Afternoon";
    return "Evening";
  };

  const demoPatient = {
    patient: { fullName: "Rahul Sharma", weekNumber: 3 },
    weekNumber: 3,
    todayGoals: ["30-minute walk", "Follow lunch plan", "Record fasting glucose"],
    weightChange: -1.2,
    glucoseScore: 82,
    nutritionAdherence: 8,
    activityAdherence: 75,
    streak: 12,
    medicationNote: "Take Metformin 500mg after dinner",
    nextConsultation: "Oct 15, 10:00 AM",
    plan: "comprehensive" as Plan,
  };

  const pData = dashData || demoPatient;
  const patient = pData.patient;
  const plan: Plan = (pData as any).plan || "comprehensive";

  const planLabel: Record<Plan, string> = {
    basic: "Accountability Program",
    comprehensive: "Structured Coaching",
    premium: "Advanced Monitoring",
  };

  return (
    <PatientLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">

        {/* Welcome Bar */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Good {getGreeting()}, {patient?.fullName?.split(' ')[0] || "Rahul"}!
              <span className="block text-base text-muted-foreground font-normal mt-1">You're on Week {pData.weekNumber} of your journey.</span>
            </h1>
            <Badge variant="outline" className="text-xs px-3 py-1 border-primary/30 bg-primary/5 text-primary font-medium shrink-0">
              {planLabel[plan]}
            </Badge>
          </div>

          {/* Today's Goals */}
          <div className="bg-gradient-to-r from-primary/8 to-blue-soft/40 border border-primary/20 rounded-xl px-5 py-4">
            <p className="text-sm font-semibold text-foreground mb-2">Today's Goals</p>
            <div className="flex flex-wrap gap-2">
              {(pData.todayGoals || ["30-minute walk", "Follow lunch plan", "Record fasting glucose"]).map((goal: string, i: number) => (
                <span key={i} className="text-xs bg-white/70 border border-primary/15 text-foreground/80 rounded-full px-3 py-1">{goal}</span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {pData.medicationNote && (
              <Badge variant="secondary" className="bg-blue-soft text-blue-soft-foreground border-0 text-xs">
                💊 {pData.medicationNote}
              </Badge>
            )}
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
              🔥 {pData.streak} Day Streak
            </Badge>
          </div>
        </div>

        {/* Metrics */}
        <div className="flex overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 gap-4 snap-x">
          <Card className="min-w-[140px] snap-center shrink-0 shadow-sm border-border">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <Activity className="w-5 h-5 text-muted-foreground mb-2" />
              <div className="text-2xl font-bold">{pData.weightChange || "-1.2"}<span className="text-sm font-normal text-muted-foreground">kg</span></div>
              <div className="text-xs text-primary flex items-center mt-1"><TrendingDown className="w-3 h-3 mr-1"/> Weight change</div>
            </CardContent>
          </Card>

          <Card className="min-w-[140px] snap-center shrink-0 shadow-sm border-border">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <Flame className="w-5 h-5 text-muted-foreground mb-2" />
              <div className="text-2xl font-bold">{pData.streak || 12}<span className="text-sm font-normal text-muted-foreground">d</span></div>
              <div className="text-xs text-muted-foreground mt-1">Streak</div>
            </CardContent>
          </Card>

          <Card className="min-w-[140px] snap-center shrink-0 shadow-sm border-border">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <Apple className="w-5 h-5 text-muted-foreground mb-2" />
              <div className="text-2xl font-bold">{pData.nutritionAdherence || "8"}<span className="text-sm font-normal text-muted-foreground">/10</span></div>
              <div className="text-xs text-muted-foreground mt-1">Nutrition</div>
            </CardContent>
          </Card>

          <Card className="min-w-[140px] snap-center shrink-0 shadow-sm border-border">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <Dumbbell className="w-5 h-5 text-muted-foreground mb-2" />
              <div className="text-2xl font-bold">{pData.activityAdherence || "75"}<span className="text-sm font-normal text-muted-foreground">%</span></div>
              <div className="text-xs text-muted-foreground mt-1">Activity</div>
            </CardContent>
          </Card>

          {planIncludes(plan, "glucose") && (
            <Card className="min-w-[140px] snap-center shrink-0 shadow-sm border-border">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <Droplet className="w-5 h-5 text-sky-500 mb-2" />
                <div className="text-2xl font-bold">{pData.glucoseScore || "82"}<span className="text-sm font-normal text-muted-foreground">/100</span></div>
                <div className="text-xs text-sky-600 mt-1">Glucose Score</div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            {/* Daily Check-In */}
            <Card className="border-border shadow-md bg-card relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <CardHeader>
                <CardTitle>Daily Check-in</CardTitle>
                <CardDescription>Take 60 seconds to reflect on your day.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                    <FormField
                      control={form.control}
                      name="mealsFollowed"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Meals followed today?</FormLabel>
                          <div className="flex gap-2">
                            {Object.entries({ yes: "Yes", partially: "Partially", no: "No" }).map(([val, label]) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => field.onChange(val)}
                                className={`flex-1 py-3 px-4 rounded-xl border transition-all text-sm ${
                                  field.value === val
                                    ? "bg-primary/10 border-primary text-primary font-medium"
                                    : "bg-background border-border text-foreground hover:bg-muted"
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="activityCompleted"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Physical activity completed?</FormLabel>
                          <div className="flex gap-2">
                            {[{ val: true, label: "Yes" }, { val: false, label: "No" }].map(({ val, label }) => (
                              <button
                                key={String(val)}
                                type="button"
                                onClick={() => field.onChange(val)}
                                className={`flex-1 py-3 px-4 rounded-xl border transition-all text-sm ${
                                  field.value === val
                                    ? "bg-primary/10 border-primary text-primary font-medium"
                                    : "bg-background border-border text-foreground hover:bg-muted"
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="energyLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Energy today?</FormLabel>
                            <div className="flex flex-col gap-2">
                              {Object.entries({ low: "Low", moderate: "Moderate", good: "Good" }).map(([val, label]) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => field.onChange(val)}
                                  className={`py-2 px-3 rounded-lg border text-sm text-left transition-all ${
                                    field.value === val ? "bg-primary/10 border-primary text-primary" : "bg-background border-border"
                                  }`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="mood"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mood today?</FormLabel>
                            <div className="flex flex-col gap-2">
                              {Object.entries({ stressed: "Stressed", neutral: "Neutral", positive: "Positive" }).map(([val, label]) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => field.onChange(val)}
                                  className={`py-2 px-3 rounded-lg border text-sm text-left transition-all ${
                                    field.value === val ? "bg-primary/10 border-primary text-primary" : "bg-background border-border"
                                  }`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Glucose — Premium only */}
                    {planIncludes(plan, "glucose") ? (
                      <FormField
                        control={form.control}
                        name="glucoseReading"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fasting Glucose? <span className="text-xs text-muted-foreground font-normal">(Optional, 2–4×/week)</span></FormLabel>
                            <FormControl>
                              <div className="relative max-w-[200px]">
                                <Input type="number" placeholder="e.g. 95" {...field} className="pr-12" />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">mg/dL</span>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <PlanLockedBanner plan={plan} feature="Fasting glucose tracking" />
                    )}

                    <Button type="submit" className="w-full rounded-xl" size="lg" disabled={submitCheckin.isPending} data-testid="btn-submit-checkin">
                      {submitCheckin.isPending ? "Submitting..." : "Complete Check-in"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Nutrition Plan — Comprehensive & Premium */}
            {planIncludes(plan, "nutrition") ? (
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2"><Salad className="w-5 h-5 text-primary" /> Your Nutrition Plan</CardTitle>
                  <CardDescription>Personalized plan designed around your routine and goals.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {["Breakfast: High-protein meal with eggs or paneer", "Lunch: Balanced plate — roti, dal, sabzi, salad", "Dinner: Light — soup or khichdi with vegetables", "Snack: Handful of nuts or fruit"].map((meal, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm bg-muted/50 rounded-lg px-4 py-3">
                      <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center font-bold shrink-0">{i + 1}</span>
                      <span className="text-foreground/80">{meal}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <PlanLockedBanner plan={plan} feature="Personalized nutrition plan" />
            )}

            {/* Movement Guidance — Comprehensive & Premium */}
            {planIncludes(plan, "movement") ? (
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2"><Dumbbell className="w-5 h-5 text-primary" /> Movement Guidance</CardTitle>
                  <CardDescription>Your personalized activity routine for this week.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: "Morning Walk", detail: "30 minutes, moderate pace", days: "Mon–Fri" },
                      { label: "Post-dinner Walk", detail: "10 minutes after dinner", days: "Daily" },
                      { label: "Strength (Optional)", detail: "Bodyweight exercises", days: "Tue, Thu" },
                      { label: "Rest & Recovery", detail: "Light stretching", days: "Sat–Sun" },
                    ].map((activity, i) => (
                      <div key={i} className="bg-muted/50 rounded-xl p-4">
                        <p className="font-semibold text-sm text-foreground">{activity.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{activity.detail}</p>
                        <Badge variant="outline" className="mt-2 text-[10px] border-primary/20 text-primary bg-primary/5">{activity.days}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <PlanLockedBanner plan={plan} feature="Personalized movement guidance" />
            )}

            {/* Advanced Progress Reviews — Premium only */}
            {planIncludes(plan, "advanced_reviews") && (
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> Advanced Progress Review</CardTitle>
                  <CardDescription>Detailed analysis from your care team this week.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { label: "Weight Trend", value: "-1.2 kg", sub: "This week" },
                      { label: "Avg Glucose", value: "102 mg/dL", sub: "Fasting" },
                      { label: "Adherence", value: "85%", sub: "7-day avg" },
                    ].map((stat, i) => (
                      <div key={i} className="bg-muted/50 rounded-xl p-4">
                        <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                        <p className="font-bold text-lg text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.sub}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Curated Tips */}
            <div>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> Tips For This Week</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: "Walk after dinner", tip: "A short walk after dinner may help glucose control." },
                  { title: "Protein at breakfast", tip: "Adding protein to breakfast can improve fullness." },
                  { title: "Consistency first", tip: "Consistency matters more than perfection." },
                ].slice(0, plan === "basic" ? 1 : 2).map((tip, i) => (
                  <Card key={i} className={`border-border hover:border-primary/40 transition-colors ${i === 0 ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}>
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-foreground mb-1 text-sm">{tip.title}</h4>
                      <p className="text-sm text-muted-foreground">{tip.tip}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-5">
            {/* Appointments */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  Next Session
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                    M
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Dr. A. Mehta</h4>
                    <p className="text-xs text-muted-foreground">Metabolic Care</p>
                    <div className="flex items-center gap-1 mt-1 text-xs font-medium text-primary">
                      <Clock className="w-3 h-3" />
                      Tomorrow, 10:00 AM
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-xl text-xs h-9">Reschedule</Button>
                  <Button className="flex-1 rounded-xl text-xs h-9 gap-1"><Video className="w-3 h-3" /> Join Call</Button>
                </div>
                {plan === "premium" && (
                  <p className="text-xs text-primary mt-3 text-center font-medium">Priority support — faster callback guaranteed</p>
                )}
              </CardContent>
            </Card>

            {/* Care Team */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Your Care Team</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">P</div>
                    <div>
                      <h4 className="text-sm font-medium">Priya S.</h4>
                      <p className="text-xs text-muted-foreground">Nutritionist</p>
                    </div>
                  </div>
                  {planIncludes(plan, "nutrition") ? (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">K</div>
                    <div>
                      <h4 className="text-sm font-medium">Karan V.</h4>
                      <p className="text-xs text-muted-foreground">Fitness Coach</p>
                    </div>
                  </div>
                  {planIncludes(plan, "movement") ? (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>

                <Button variant="ghost" className="w-full rounded-xl mt-1 border-dashed border h-9 text-xs">
                  Message Care Coordinator
                </Button>
              </CardContent>
            </Card>

            {/* Plan Summary */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Your Plan</p>
                <p className="font-bold text-foreground text-sm mb-3">{planLabel[plan]}</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-foreground/70">
                    <span className={`w-1.5 h-1.5 rounded-full ${plan !== "basic" ? "bg-primary" : "bg-muted-foreground/40"}`} />
                    Daily WhatsApp check-ins
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground/70">
                    <span className={`w-1.5 h-1.5 rounded-full ${planIncludes(plan, "nutrition") ? "bg-primary" : "bg-muted-foreground/40"}`} />
                    Personalized nutrition plan
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground/70">
                    <span className={`w-1.5 h-1.5 rounded-full ${planIncludes(plan, "movement") ? "bg-primary" : "bg-muted-foreground/40"}`} />
                    Movement guidance
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground/70">
                    <span className={`w-1.5 h-1.5 rounded-full ${planIncludes(plan, "glucose") ? "bg-primary" : "bg-muted-foreground/40"}`} />
                    Glucose tracking support
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground/70">
                    <span className={`w-1.5 h-1.5 rounded-full ${planIncludes(plan, "advanced_reviews") ? "bg-primary" : "bg-muted-foreground/40"}`} />
                    Advanced progress reviews
                  </div>
                </div>
                {plan !== "premium" && (
                  <Button asChild size="sm" variant="outline" className="w-full mt-4 rounded-full text-xs border-primary/30 text-primary hover:bg-primary/10">
                    <a href="/#pricing">Upgrade Plan</a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PatientLayout>
  );
}
