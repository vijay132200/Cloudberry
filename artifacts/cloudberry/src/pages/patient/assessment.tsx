import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Upload, FileText, ChevronRight, ChevronLeft, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Plan = "basic" | "comprehensive" | "premium";

const CHALLENGES = ["Late night eating", "Stress eating", "Skipping meals", "Poor sleep", "Low motivation", "Cravings", "Eating outside", "Busy schedule", "Low energy", "Emotional eating"];
const GOALS = ["Lose weight", "Manage diabetes", "Reduce medications", "Improve energy", "Better sleep", "Manage PCOS", "Improve glucose control", "Build healthy habits", "Manage cholesterol"];
const ACTIVITY_LEVELS = ["Sedentary (mostly desk work)", "Lightly active (1-2 days/week)", "Moderately active (3-4 days/week)", "Very active (5+ days/week)"];

function DocUploadField({ label, sub }: { label: string; sub: string }) {
  const [file, setFile] = useState<string | null>(null);
  return (
    <div className="border-2 border-dashed border-border rounded-xl p-4">
      <div className="flex items-start gap-3">
        <FileText className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          {file ? (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Uploaded
              </Badge>
              <button onClick={() => setFile(null)} className="text-muted-foreground hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <label className="inline-flex items-center gap-1.5 mt-2 text-xs text-primary cursor-pointer hover:underline">
              <Upload className="w-3.5 h-3.5" /> Upload document (PDF/image)
              <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={() => setFile("uploaded")} />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}

interface Props {
  plan: Plan;
  onComplete: () => void;
}

const STEPS_BASIC = ["Welcome", "Current Health", "Behaviours", "Nutrition", "Activity", "Goals"];
const STEPS_COMP = [...STEPS_BASIC, "Playbook"];
const STEPS_PREMIUM = [...STEPS_COMP, "Clinical Extras"];

export function AssessmentModal({ plan, onComplete }: Props) {
  const { toast } = useToast();
  const steps = plan === "premium" ? STEPS_PREMIUM : plan === "comprehensive" ? STEPS_COMP : STEPS_BASIC;
  const [step, setStep] = useState(0);
  const [challenges, setChallenges] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [activity, setActivity] = useState("");
  const [nutritionNotes, setNutritionNotes] = useState("");
  const [habits, setHabits] = useState("");
  const [playbookNote, setPlaybookNote] = useState("");

  const toggle = (arr: string[], set: (v: string[]) => void, val: string) => {
    set(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  const next = () => {
    if (step < steps.length - 1) setStep(s => s + 1);
    else {
      toast({ title: "Assessment complete!", description: "Your care team will review this before your first session." });
      onComplete();
    }
  };
  const back = () => setStep(s => s - 1);

  const progress = Math.round(((step + 1) / steps.length) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="max-w-xl mx-auto px-4 py-8 min-h-screen flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">Initial Health Assessment</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Help us personalise your care plan</p>
            </div>
            <Badge variant="outline" className="text-xs">Step {step + 1} of {steps.length}</Badge>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">{steps[step]}</span>
            <span className="text-xs text-muted-foreground">{progress}% complete</span>
          </div>
        </div>

        <Card className="flex-1 border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-5">

            {/* STEP 0: Welcome */}
            {step === 0 && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">👋</span>
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Welcome to Cloudberry!</h2>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
                  Before your first session, we'd like to understand your health background. This assessment helps us personalise your care plan.
                </p>
                <p className="text-xs text-muted-foreground mt-3">Takes about 5 minutes to complete. Your data is confidential.</p>
              </div>
            )}

            {/* STEP 1: Current Health */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-foreground">Current Health Status</h2>
                <DocUploadField
                  label="Recent Lab Reports / Metabolic Status"
                  sub="Upload your latest blood test, HbA1c, lipid panel or any relevant lab report"
                />
                <DocUploadField
                  label="Medication History"
                  sub="Upload your current medication list or prescriptions (if any)"
                />
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Current diagnosed conditions <span className="font-normal text-muted-foreground">(optional)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {["Type 2 Diabetes", "Pre-diabetes", "PCOS", "Hypothyroidism", "High cholesterol", "Hypertension", "Obesity", "Other"].map(c => (
                      <button key={c} type="button" onClick={() => toggle(challenges, setChallenges, c)}
                        className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${challenges.includes(c) ? "bg-primary/10 border-primary text-primary" : "border-border text-foreground hover:bg-muted"}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Behaviours */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-foreground">Behavioural Challenges</h2>
                <p className="text-sm text-muted-foreground">What makes it hardest to maintain healthy habits?</p>
                <div className="flex flex-wrap gap-2">
                  {CHALLENGES.map(c => (
                    <button key={c} type="button" onClick={() => toggle(challenges, setChallenges, c)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${challenges.includes(c) ? "bg-primary/10 border-primary text-primary" : "border-border text-foreground hover:bg-muted"}`}>
                      {c}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Any specific habits or characteristics we should know about?</label>
                  <Textarea value={habits} onChange={e => setHabits(e.target.value)} placeholder="e.g. I tend to snack late at night, I travel frequently for work..." className="rounded-xl text-sm resize-none" rows={3} />
                </div>
              </div>
            )}

            {/* STEP 3: Nutrition */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-foreground">Nutrition Patterns</h2>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Describe your typical eating habits</label>
                  <Textarea value={nutritionNotes} onChange={e => setNutritionNotes(e.target.value)}
                    placeholder="e.g. I usually skip breakfast, have a large lunch, and have dinner late around 10 PM..."
                    className="rounded-xl text-sm resize-none" rows={4} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Dietary preferences / restrictions</label>
                  <div className="flex flex-wrap gap-2">
                    {["Vegetarian", "Vegan", "Non-vegetarian", "Jain", "Gluten-free", "Lactose intolerant", "No restrictions"].map(d => (
                      <button key={d} type="button" onClick={() => toggle(goals, setGoals, d)}
                        className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${goals.includes(d) ? "bg-primary/10 border-primary text-primary" : "border-border text-foreground hover:bg-muted"}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Activity */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-foreground">Activity Level</h2>
                <div className="space-y-2">
                  {ACTIVITY_LEVELS.map(lvl => (
                    <button key={lvl} type="button" onClick={() => setActivity(lvl)}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${activity === lvl ? "bg-primary/10 border-primary text-primary font-medium" : "border-border text-foreground hover:bg-muted"}`}>
                      {lvl}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">What type of exercise do you currently do or enjoy?</label>
                  <Textarea placeholder="e.g. I go for morning walks occasionally, used to do yoga..." className="rounded-xl text-sm resize-none" rows={2} />
                </div>
              </div>
            )}

            {/* STEP 5: Goals */}
            {step === 5 && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-foreground">Your Health Goals</h2>
                <p className="text-sm text-muted-foreground">What do you most want to achieve? Select all that apply.</p>
                <div className="flex flex-wrap gap-2">
                  {GOALS.map(g => (
                    <button key={g} type="button" onClick={() => toggle(goals, setGoals, g)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${goals.includes(g) ? "bg-primary/10 border-primary text-primary" : "border-border text-foreground hover:bg-muted"}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 6 (Comp+): Personalized Playbook */}
            {step === 6 && plan !== "basic" && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-foreground">Define Your Personalized Playbook</h2>
                <p className="text-sm text-muted-foreground">Your dietician will use these as a starting point to build your custom plan.</p>
                <Textarea value={playbookNote} onChange={e => setPlaybookNote(e.target.value)}
                  placeholder="e.g. I prefer simple, quick meals. I like Indian food and cannot follow a very strict diet. I want a plan that works around my family meals..."
                  className="rounded-xl text-sm resize-none" rows={5} />
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Preferred time for diet changes <span className="font-normal text-muted-foreground">(optional)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {["Morning", "Lunch", "Evening", "All meals"].map(t => (
                      <button key={t} type="button"
                        className="px-3 py-1.5 rounded-full border text-xs font-medium border-border text-foreground hover:bg-muted transition-all">
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 7 (Premium): Clinical Extras */}
            {step === 7 && plan === "premium" && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-foreground">Clinical History</h2>
                <p className="text-sm text-muted-foreground">Premium patients get full clinical review. Please share as much as possible.</p>
                <DocUploadField label="Glucose History / CGM Data" sub="Upload glucometer readings or CGM export (last 30–90 days)" />
                <DocUploadField label="Medication List" sub="Current medications with dosage and timing" />
                <div className="space-y-3">
                  {[
                    { label: "Eating timing patterns", placeholder: "e.g. Eat at 8am, 1pm, and 8:30pm typically..." },
                    { label: "Sleep patterns", placeholder: "e.g. Sleep around midnight, wake at 7am, often restless..." },
                    { label: "Stress & cravings", placeholder: "e.g. High stress at work, evening cravings after dinner..." },
                    { label: "Weight history", placeholder: "e.g. Started at 95kg 2 years ago, lost 8kg but regained 5kg..." },
                  ].map(({ label, placeholder }) => (
                    <div key={label}>
                      <label className="text-sm font-medium text-foreground block mb-1.5">{label}</label>
                      <Textarea placeholder={placeholder} className="rounded-xl text-sm resize-none" rows={2} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-3 mt-4">
          {step > 0 && (
            <Button variant="outline" onClick={back} className="flex-1 rounded-xl">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          )}
          <Button onClick={next} className="flex-1 rounded-xl">
            {step === steps.length - 1 ? (
              <><CheckCircle2 className="w-4 h-4 mr-1" /> Submit Assessment</>
            ) : (
              <>Continue <ChevronRight className="w-4 h-4 ml-1" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
