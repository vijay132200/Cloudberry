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
import { ArrowRight, Activity, TrendingDown, Target, Droplet, Heart, ChevronRight, Video, Calendar, Clock, Apple, Dumbbell } from "lucide-react";

const checkinSchema = z.object({
  mealsFollowed: z.enum([CheckinInputMealsFollowed.yes, CheckinInputMealsFollowed.partially, CheckinInputMealsFollowed.no]),
  activityCompleted: z.boolean(),
  energyLevel: z.enum([CheckinInputEnergyLevel.low, CheckinInputEnergyLevel.moderate, CheckinInputEnergyLevel.good]),
  mood: z.enum([CheckinInputMood.stressed, CheckinInputMood.neutral, CheckinInputMood.positive]),
  glucoseReading: z.number().optional().or(z.literal("").transform(() => undefined)),
});

export default function PatientDashboard() {
  const { toast } = useToast();
  
  // Real or demo data based on API
  const { data: dashData, isLoading: dashLoading } = useGetPatientDashboard();
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
        // Fallback for demo
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

  // Demo Fallbacks
  const demoPatient = {
    patient: { fullName: "Rahul Sharma", weekNumber: 3 },
    weekNumber: 3,
    todayGoals: ["Track fasting glucose", "30 min walk", "Protein in every meal"],
    weightChange: -1.2,
    glucoseScore: 82,
    nutritionAdherence: 8,
    activityAdherence: 75,
    streak: 12,
    medicationNote: "Take Metformin 500mg after dinner",
    nextConsultation: "Oct 15, 10:00 AM"
  };

  const pData = dashData || demoPatient;
  const patient = pData.patient;

  return (
    <PatientLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        
        {/* Welcome Bar */}
        <div className="space-y-4">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
            Good {getGreeting()}, {patient?.fullName?.split(' ')[0] || "Rahul"}! 
            <span className="block text-lg text-muted-foreground font-sans font-normal mt-1">You're on Week {pData.weekNumber} of your journey.</span>
          </h1>
          
          <div className="flex flex-wrap gap-2">
            {pData.medicationNote && (
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                💊 {pData.medicationNote}
              </Badge>
            )}
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              🔥 {pData.streak} Day Streak
            </Badge>
          </div>
        </div>

        {/* Horizontal Metrics */}
        <div className="flex overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 gap-4 snap-x hide-scrollbar">
          <Card className="min-w-[140px] snap-center shrink-0 shadow-sm border-border">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <Activity className="w-5 h-5 text-muted-foreground mb-2" />
              <div className="text-2xl font-bold font-serif">{pData.weightChange || "-1.2"}<span className="text-sm font-sans font-normal text-muted-foreground">kg</span></div>
              <div className="text-xs text-primary flex items-center mt-1"><TrendingDown className="w-3 h-3 mr-1"/> from start</div>
            </CardContent>
          </Card>

          <Card className="min-w-[140px] snap-center shrink-0 shadow-sm border-border">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <Droplet className="w-5 h-5 text-muted-foreground mb-2" />
              <div className="text-2xl font-bold font-serif">{pData.glucoseScore || "82"}<span className="text-sm font-sans font-normal text-muted-foreground">/100</span></div>
              <div className="text-xs text-primary mt-1">Excellent</div>
            </CardContent>
          </Card>

          <Card className="min-w-[140px] snap-center shrink-0 shadow-sm border-border">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <Apple className="w-5 h-5 text-muted-foreground mb-2" />
              <div className="text-2xl font-bold font-serif">{pData.nutritionAdherence || "8"}<span className="text-sm font-sans font-normal text-muted-foreground">/10</span></div>
              <div className="text-xs text-muted-foreground mt-1">Nutrition</div>
            </CardContent>
          </Card>

          <Card className="min-w-[140px] snap-center shrink-0 shadow-sm border-border">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <Dumbbell className="w-5 h-5 text-muted-foreground mb-2" />
              <div className="text-2xl font-bold font-serif">{pData.activityAdherence || "7k"}<span className="text-sm font-sans font-normal text-muted-foreground"> steps</span></div>
              <div className="text-xs text-muted-foreground mt-1">Activity</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Daily Checkin */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border shadow-md bg-card relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
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
                          <FormLabel className="text-base">Did you follow your nutrition plan today?</FormLabel>
                          <div className="flex gap-2">
                            {Object.entries({ yes: "Yes", partially: "Partially", no: "No" }).map(([val, label]) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => field.onChange(val)}
                                className={`flex-1 py-3 px-4 rounded-xl border transition-all ${
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
                          <FormLabel className="text-base">Did you complete your planned activity?</FormLabel>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => field.onChange(true)}
                              className={`flex-1 py-3 px-4 rounded-xl border transition-all ${
                                field.value === true 
                                  ? "bg-primary/10 border-primary text-primary font-medium" 
                                  : "bg-background border-border text-foreground hover:bg-muted"
                              }`}
                            >
                              Yes, I moved
                            </button>
                            <button
                              type="button"
                              onClick={() => field.onChange(false)}
                              className={`flex-1 py-3 px-4 rounded-xl border transition-all ${
                                field.value === false && field.value !== undefined
                                  ? "bg-primary/10 border-primary text-primary font-medium" 
                                  : "bg-background border-border text-foreground hover:bg-muted"
                              }`}
                            >
                              Not today
                            </button>
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
                            <FormLabel>Energy Level</FormLabel>
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
                            <FormLabel>Mood</FormLabel>
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

                    <FormField
                      control={form.control}
                      name="glucoseReading"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fasting Glucose (Optional)</FormLabel>
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

                    <Button type="submit" className="w-full rounded-xl" size="lg" disabled={submitCheckin.isPending} data-testid="btn-submit-checkin">
                      {submitCheckin.isPending ? "Submitting..." : "Complete Check-in"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Curated Tips */}
            <div>
              <h3 className="font-serif font-bold text-xl mb-3 flex items-center gap-2"><Target className="w-5 h-5 text-primary"/> Focus For This Week</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-primary/5 border-primary/20 hover:border-primary/40 transition-colors">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-foreground mb-1">Prioritize Protein</h4>
                    <p className="text-sm text-muted-foreground">Aim for 20g of protein at breakfast to stabilize morning glucose and reduce cravings.</p>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border hover:border-primary/40 transition-colors">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-foreground mb-1">Post-Meal Movement</h4>
                    <p className="text-sm text-muted-foreground">A 10-minute walk after dinner significantly blunts the glucose spike.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Appointments */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  Next Consultation
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-muted overflow-hidden shrink-0">
                    <img src="/images/team-dr-mehta.png" alt="Dr Mehta" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Dr. A. Mehta</h4>
                    <p className="text-sm text-muted-foreground">Obesity Medicine</p>
                    <div className="flex items-center gap-1 mt-1 text-sm font-medium text-primary">
                      <Clock className="w-3 h-3" />
                      Tomorrow, 10:00 AM
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-xl text-xs h-9">Reschedule</Button>
                  <Button className="flex-1 rounded-xl text-xs h-9 gap-1"><Video className="w-3 h-3"/> Join Call</Button>
                </div>
              </CardContent>
            </Card>

            {/* Care Team */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Your Care Team</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-muted">
                      <img src="/images/team-priya.png" alt="Priya" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Priya S.</h4>
                      <p className="text-xs text-muted-foreground">Nutritionist</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
                
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-muted">
                      <img src="/images/team-karan.png" alt="Karan" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Karan V.</h4>
                      <p className="text-xs text-muted-foreground">Fitness Coach</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
                
                <Button variant="ghost" className="w-full rounded-xl mt-2 border-dashed h-9 text-xs">
                  Message Care Coordinator
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PatientLayout>
  );
}
