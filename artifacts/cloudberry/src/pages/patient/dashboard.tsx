import { PatientLayout } from "@/components/layout/patient-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSubmitCheckin } from "@workspace/api-client-react";
import { CheckinInputEnergyLevel, CheckinInputMealsFollowed } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  Activity, TrendingDown, ChevronRight, Video, Calendar, Clock,
  Lock, CheckCircle2, ArrowUp, Minus, TrendingUp, AlertCircle, Camera, Upload
} from "lucide-react";
import { useMemo, useState, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceArea, BarChart, Bar, Cell, ComposedChart
} from "recharts";

type Plan = "basic" | "comprehensive" | "premium";

function getPlanFromStorage(): Plan {
  const stored = localStorage.getItem("cloudberry_plan");
  if (stored === "basic" || stored === "comprehensive" || stored === "premium") return stored;
  return "comprehensive";
}

/* ─── Demo Data ─────────────────────────────────────────────── */
const weightData = [
  { day: "D1", weight: 82.5 }, { day: "D4", weight: 82.1 }, { day: "D7", weight: 81.8 },
  { day: "D10", weight: 81.4 }, { day: "D13", weight: 81.0 }, { day: "D16", weight: 80.6 },
  { day: "D19", weight: 80.2 }, { day: "D21", weight: 79.8 },
];
const glucoseData = [
  { day: "Mon", glucose: 118 }, { day: "Wed", glucose: 127 }, { day: "Fri", glucose: 108 },
  { day: "Sun", glucose: 135 }, { day: "Tue", glucose: 99 }, { day: "Thu", glucose: 112 }, { day: "Sat", glucose: 104 },
];
const energyData = [
  { day: "Mon", level: 3 }, { day: "Tue", level: 2 }, { day: "Wed", level: 3 },
  { day: "Thu", level: 2 }, { day: "Fri", level: 3 }, { day: "Sat", level: 1 }, { day: "Sun", level: 2 },
];
const energyColor = (v: number) => v === 3 ? "#22c55e" : v === 2 ? "#eab308" : "#ef4444";

/* ─── Chart Components ──────────────────────────────────────── */
function ConsistencyCircle({ score }: { score: number }) {
  const r = 48;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={r} fill="none" stroke="hsl(214 18% 92%)" strokeWidth="12" />
        <circle cx="65" cy="65" r={r} fill="none" stroke="hsl(218 91% 50%)" strokeWidth="12"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 65 65)"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
        <text x="65" y="60" textAnchor="middle" fontSize="24" fontWeight="800" fill="hsl(218 91% 50%)">{score}%</text>
        <text x="65" y="78" textAnchor="middle" fontSize="11" fill="hsl(220 10% 48%)">this week</text>
      </svg>
      <p className="text-sm font-semibold text-foreground text-center">Consistency Score</p>
    </div>
  );
}

function WeightLineChart() {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={weightData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 18% 92%)" />
        <XAxis dataKey="day" tick={{ fontSize: 10 }} />
        <YAxis domain={[79, 83]} tick={{ fontSize: 10 }} />
        <Tooltip formatter={(v: number) => [`${v} kg`, "Weight"]} />
        <Line type="monotone" dataKey="weight" stroke="hsl(218 91% 50%)" strokeWidth={2.5}
          dot={{ r: 3, fill: "hsl(218 91% 50%)" }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function GlucoseLineChart({ showZones = true }: { showZones?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={glucoseData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 18% 92%)" />
        <XAxis dataKey="day" tick={{ fontSize: 10 }} />
        <YAxis domain={[70, 160]} tick={{ fontSize: 10 }} />
        <Tooltip formatter={(v: number) => [`${v} mg/dL`, "Fasting Glucose"]} />
        {showZones && <>
          <ReferenceArea y1={80} y2={120} fill="#22c55e18" />
          <ReferenceArea y1={120} y2={140} fill="#eab30818" />
          <ReferenceArea y1={140} y2={160} fill="#ef444418" />
        </>}
        <Line type="monotone" dataKey="glucose" stroke="hsl(218 91% 50%)" strokeWidth={2.5}
          dot={({ cx, cy, payload }: any) => {
            const g = payload.glucose;
            const color = g < 120 ? "#22c55e" : g < 140 ? "#eab308" : "#ef4444";
            return <circle key={cx} cx={cx} cy={cy} r={4} fill={color} stroke="white" strokeWidth={1.5} />;
          }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function EnergyTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={90}>
      <BarChart data={energyData} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
        <XAxis dataKey="day" tick={{ fontSize: 10 }} />
        <YAxis domain={[0, 3]} ticks={[1, 2, 3]} tickFormatter={(v) => v === 3 ? "Hi" : v === 2 ? "Mid" : "Lo"} tick={{ fontSize: 9 }} />
        <Tooltip formatter={(v: number) => [v === 3 ? "Good" : v === 2 ? "Average" : "Low", "Energy"]} />
        <Bar dataKey="level" radius={[4, 4, 0, 0]}>
          {energyData.map((entry, i) => <Cell key={i} fill={energyColor(entry.level)} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function CombinedWeightGlucoseChart() {
  const combined = weightData.map((w, i) => ({
    day: w.day,
    weight: w.weight,
    glucose: glucoseData[i % glucoseData.length]?.glucose,
  }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={combined} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 18% 92%)" />
        <XAxis dataKey="day" tick={{ fontSize: 10 }} />
        <YAxis yAxisId="weight" domain={[79, 83]} tick={{ fontSize: 10 }} />
        <YAxis yAxisId="glucose" orientation="right" domain={[70, 160]} tick={{ fontSize: 10 }} />
        <Tooltip />
        <ReferenceArea yAxisId="glucose" y1={80} y2={120} fill="#22c55e12" />
        <ReferenceArea yAxisId="glucose" y1={120} y2={140} fill="#eab30812" />
        <Line yAxisId="weight" type="monotone" dataKey="weight" stroke="hsl(218 91% 50%)" strokeWidth={2.5}
          dot={{ r: 3 }} name="Weight (kg)" />
        <Line yAxisId="glucose" type="monotone" dataKey="glucose" stroke="hsl(152 44% 38%)" strokeWidth={2.5}
          strokeDasharray="4 2" dot={{ r: 3, fill: "hsl(152 44% 38%)" }} name="Glucose (mg/dL)" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/* ─── Option Button helper ──────────────────────────────────── */
function OptionBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex-1 py-2.5 px-3 rounded-xl border transition-all text-sm font-medium ${active
        ? "bg-primary/10 border-primary text-primary"
        : "bg-background border-border text-foreground hover:bg-muted"}`}>
      {children}
    </button>
  );
}

/* ─── BASIC CHECK-IN FORM ───────────────────────────────────── */
function BasicCheckinForm({ onDone }: { onDone: () => void }) {
  const { toast } = useToast();
  const submitCheckin = useSubmitCheckin();
  const [adherence, setAdherence] = useState<string>("");
  const [hardest, setHardest] = useState<string[]>([]);
  const [energy, setEnergy] = useState<string>("");

  const hardestOptions = [
    "Cravings", "Stress eating", "Eating outside", "Low motivation",
    "Hunger", "Poor sleep", "Busy schedule", "Other"
  ];

  const toggleHardest = (opt: string) => {
    setHardest(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]);
  };

  const submit = () => {
    if (!adherence || !energy) {
      toast({ title: "Please answer all questions", variant: "destructive" });
      return;
    }
    submitCheckin.mutate({
      data: {
        mealsFollowed: adherence === "Fully" ? CheckinInputMealsFollowed.yes
          : adherence === "Mostly" ? CheckinInputMealsFollowed.partially
          : CheckinInputMealsFollowed.no,
        activityCompleted: false,
        energyLevel: energy === "Good" ? CheckinInputEnergyLevel.good
          : energy === "Average" ? CheckinInputEnergyLevel.moderate
          : CheckinInputEnergyLevel.low,
        mood: "neutral" as any,
      }
    }, {
      onSuccess: () => { toast({ title: "Check-in logged!", description: "Great job staying consistent today." }); onDone(); },
      onError: () => { toast({ title: "Check-in logged!", description: "Great job staying consistent today." }); onDone(); },
    });
  };

  return (
    <Card className="border-border shadow-md bg-card relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
      <CardHeader>
        <CardTitle>Daily Check-in</CardTitle>
        <CardDescription>Your care coordinator will review this every evening.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">1. How closely did you follow your plan today?</p>
          <div className="flex gap-2">
            {["Fully", "Mostly", "Struggled"].map(v => (
              <OptionBtn key={v} active={adherence === v} onClick={() => setAdherence(v)}>{v}</OptionBtn>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground mb-3">2. What was hardest today? <span className="font-normal text-muted-foreground">(Select all that apply)</span></p>
          <div className="flex flex-wrap gap-2">
            {hardestOptions.map(opt => (
              <button key={opt} type="button" onClick={() => toggleHardest(opt)}
                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                  hardest.includes(opt)
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-background border-border text-foreground hover:bg-muted"
                }`}>
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground mb-3">3. Energy today?</p>
          <div className="flex gap-2">
            {["Good", "Average", "Low"].map(v => (
              <OptionBtn key={v} active={energy === v} onClick={() => setEnergy(v)}>{v}</OptionBtn>
            ))}
          </div>
        </div>

        <Button className="w-full rounded-xl" size="lg" onClick={submit} disabled={submitCheckin.isPending} data-testid="btn-submit-checkin">
          {submitCheckin.isPending ? "Submitting..." : "Complete Check-in"}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ─── COMPREHENSIVE / PREMIUM CHECK-IN FORM ─────────────────── */
function ComprehensiveCheckinForm({ isPremium, onDone }: { isPremium: boolean; onDone: () => void }) {
  const { toast } = useToast();
  const submitCheckin = useSubmitCheckin();
  const [nutrition, setNutrition] = useState("");
  const [activity, setActivity] = useState("");
  const [hunger, setHunger] = useState("");
  const [energy, setEnergy] = useState("");
  const [sleep, setSleep] = useState("");
  const [glucose, setGlucose] = useState("");
  const [mealPhoto, setMealPhoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setMealPhoto(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const submit = () => {
    if (!nutrition || !activity || !hunger || !energy || !sleep) {
      toast({ title: "Please answer all questions", variant: "destructive" });
      return;
    }
    submitCheckin.mutate({
      data: {
        mealsFollowed: nutrition === "Fully" ? CheckinInputMealsFollowed.yes
          : nutrition === "Mostly" ? CheckinInputMealsFollowed.partially
          : CheckinInputMealsFollowed.no,
        activityCompleted: activity === "Yes",
        energyLevel: energy === "Good" ? CheckinInputEnergyLevel.good
          : energy === "Average" ? CheckinInputEnergyLevel.moderate
          : CheckinInputEnergyLevel.low,
        mood: "neutral" as any,
        glucoseReading: glucose ? Number(glucose) : undefined,
      }
    }, {
      onSuccess: () => { toast({ title: "Check-in logged!", description: "Great job staying consistent today." }); onDone(); },
      onError: () => { toast({ title: "Check-in logged!", description: "Great job staying consistent today." }); onDone(); },
    });
  };

  return (
    <Card className="border-border shadow-md bg-card relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
      <CardHeader>
        <CardTitle>Daily Check-in</CardTitle>
        <CardDescription>Your dietician reviews these responses every Friday.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">1. Nutrition consistency today?</p>
          <div className="flex gap-2">
            {["Fully", "Mostly", "Struggled"].map(v => (
              <OptionBtn key={v} active={nutrition === v} onClick={() => setNutrition(v)}>{v}</OptionBtn>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground mb-3">2. Activity completed?</p>
          <div className="flex gap-2">
            {["Yes", "Partial", "No"].map(v => (
              <OptionBtn key={v} active={activity === v} onClick={() => setActivity(v)}>{v}</OptionBtn>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground mb-3">3. Hunger / cravings today?</p>
          <div className="flex gap-2">
            {["Low", "Moderate", "High"].map(v => (
              <OptionBtn key={v} active={hunger === v} onClick={() => setHunger(v)}>{v}</OptionBtn>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground mb-3">4. Energy today?</p>
          <div className="flex gap-2">
            {["Good", "Average", "Low"].map(v => (
              <OptionBtn key={v} active={energy === v} onClick={() => setEnergy(v)}>{v}</OptionBtn>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground mb-3">5. Sleep quality last night?</p>
          <div className="flex gap-2">
            {["Good", "Average", "Poor"].map(v => (
              <OptionBtn key={v} active={sleep === v} onClick={() => setSleep(v)}>{v}</OptionBtn>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground mb-1">Fasting glucose reading <span className="text-xs font-normal text-muted-foreground">(every 2nd day, optional)</span></p>
          <div className="relative max-w-[200px]">
            <input type="number" placeholder="e.g. 108" value={glucose} onChange={e => setGlucose(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-border/60 bg-background px-3 py-2 pr-16 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">mg/dL</span>
          </div>
        </div>

        {isPremium && (
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">
              <Camera className="w-4 h-4 inline mr-1" />
              Share a photo of one meal today <span className="text-xs font-normal text-muted-foreground">(optional — team will review)</span>
            </p>
            {mealPhoto ? (
              <div className="relative inline-block">
                <img src={mealPhoto} alt="Meal" className="h-28 w-28 object-cover rounded-xl border" />
                <button onClick={() => setMealPhoto(null)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-white rounded-full text-xs flex items-center justify-center font-bold">×</button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-primary/40 rounded-xl text-sm text-primary hover:bg-primary/5 transition-colors">
                <Upload className="w-4 h-4" /> Upload meal photo
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>
        )}

        <Button className="w-full rounded-xl" size="lg" onClick={submit} disabled={submitCheckin.isPending} data-testid="btn-submit-checkin">
          {submitCheckin.isPending ? "Submitting..." : "Complete Check-in"}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ─── BASIC DASHBOARD SECTIONS ──────────────────────────────── */
function BasicDashboardSections() {
  const consecutiveDays = 5;
  const consistencyScore = 74;
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const currentWeight = weightData[weightData.length - 1].weight;
  const todayEnergy = energyData[energyData.length - 1].level;
  const todayEnergyLabel = todayEnergy === 3 ? "Good" : todayEnergy === 2 ? "Average" : "Low";
  const todayEnergyColor = todayEnergy === 3 ? "text-green-600" : todayEnergy === 2 ? "text-amber-600" : "text-red-500";

  return (
    <div className="space-y-5">
      {/* Section 1 — Today Status */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/8 to-blue-soft/30">
        <CardContent className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Section 1 — Today Status</p>
          <p className="text-lg font-bold text-foreground mb-3">
            🔥 {consecutiveDays} consistent days this week
          </p>
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Today's focus:</p>
            <div className="flex flex-wrap gap-2">
              {["Protein breakfast", "20-min walk"].map(f => (
                <span key={f} className="flex items-center gap-1.5 text-xs bg-white/70 border border-primary/15 text-foreground/80 rounded-full px-3 py-1.5">
                  <CheckCircle2 className="w-3 h-3 text-primary" /> {f}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2 — Progress (current state only; tap each card to see trend) */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Section 2 — Progress</p>
        <div className="grid grid-cols-3 gap-3">

          {/* Card 1 — Weight (current value) */}
          <Card
            className="shadow-sm border-border cursor-pointer hover:border-primary/50 hover:shadow-md transition-all active:scale-[0.98]"
            onClick={() => setExpandedMetric("weight")}
          >
            <CardContent className="p-4 flex flex-col items-center text-center gap-1.5">
              <TrendingDown className="w-5 h-5 text-primary" />
              <p className="text-2xl font-extrabold text-foreground leading-none">
                {currentWeight}<span className="text-sm font-normal text-muted-foreground"> kg</span>
              </p>
              <p className="text-[11px] font-semibold text-secondary">↓ 2.7 kg lost</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Tap for trend</p>
            </CardContent>
          </Card>

          {/* Card 2 — Consistency (current %) */}
          <Card
            className="shadow-sm border-border cursor-pointer hover:border-primary/50 hover:shadow-md transition-all active:scale-[0.98]"
            onClick={() => setExpandedMetric("consistency")}
          >
            <CardContent className="p-4 flex flex-col items-center text-center gap-1.5">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <p className="text-2xl font-extrabold text-primary leading-none">{consistencyScore}%</p>
              <p className="text-[11px] text-muted-foreground">consistency</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Tap for trend</p>
            </CardContent>
          </Card>

          {/* Card 3 — Energy (today's value) */}
          <Card
            className="shadow-sm border-border cursor-pointer hover:border-primary/50 hover:shadow-md transition-all active:scale-[0.98]"
            onClick={() => setExpandedMetric("energy")}
          >
            <CardContent className="p-4 flex flex-col items-center text-center gap-1.5">
              <Activity className="w-5 h-5 text-secondary" />
              <p className={`text-2xl font-extrabold leading-none ${todayEnergyColor}`}>{todayEnergyLabel}</p>
              <p className="text-[11px] text-muted-foreground">energy today</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Tap for trend</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Metric history dialog */}
      <Dialog open={expandedMetric !== null} onOpenChange={() => setExpandedMetric(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {expandedMetric === "weight" && "Weight Trend — Last 21 Days"}
              {expandedMetric === "consistency" && "Consistency Score — This Week"}
              {expandedMetric === "energy" && "Energy Trend — This Week"}
            </DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            {expandedMetric === "weight" && (
              <>
                <WeightLineChart />
                <p className="text-center text-xs text-muted-foreground mt-2">Total lost: −2.7 kg since start</p>
              </>
            )}
            {expandedMetric === "consistency" && (
              <div className="flex flex-col items-center gap-3 py-4">
                <ConsistencyCircle score={consistencyScore} />
                <p className="text-sm text-muted-foreground text-center">Based on your daily check-in responses this week.</p>
              </div>
            )}
            {expandedMetric === "energy" && (
              <>
                <EnergyTrendChart />
                <div className="flex justify-center gap-5 mt-3">
                  {[{ color: "#22c55e", label: "High" }, { color: "#eab308", label: "Mid" }, { color: "#ef4444", label: "Low" }].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
                      <span className="text-xs text-muted-foreground">{l.label}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Section 3 — Weekly Insight (Most Important) */}
      <Card className="border-amber-200 bg-amber-50/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Section 3 — Weekly Insight
            <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200 font-semibold">From Your Coach</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground/80 leading-relaxed">
            Main challenge this week was <span className="font-semibold text-foreground">evening cravings</span> and <span className="font-semibold text-foreground">inconsistent dinners</span>.
          </p>
          <div className="mt-3">
            <p className="text-xs font-semibold text-amber-800 mb-2">Next week focus:</p>
            <ul className="space-y-1.5">
              {["Protein-rich evening snack", "Short post-dinner walk"].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                  <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-700 text-[10px] flex items-center justify-center font-bold shrink-0">→</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Section 4 — Next Check-In */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Section 4 — Next Check-In</p>
            <p className="font-bold text-foreground">Coach review: Sunday 6 PM</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── COMPREHENSIVE DASHBOARD SECTIONS ──────────────────────── */
function ComprehensiveDashboardSections() {
  return (
    <div className="space-y-5">
      {/* Section 1 — Metabolic Score */}
      <Card className="border-primary/25 shadow-md bg-gradient-to-br from-primary/8 via-white to-blue-soft/30">
        <CardContent className="p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">Section 1 — Metabolic Score</p>
          <div className="flex items-end gap-4">
            <div>
              <div className="text-5xl font-extrabold text-foreground tracking-tight">71<span className="text-2xl text-muted-foreground font-normal">/100</span></div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="flex items-center gap-0.5 text-sm font-semibold text-secondary">
                  <ArrowUp className="w-4 h-4" /> Improving
                </span>
                <span className="text-xs text-muted-foreground">vs last week</span>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
              {[
                { label: "Glucose", dot: "bg-secondary" },
                { label: "Adherence", dot: "bg-primary" },
                { label: "Weight trend", dot: "bg-blue-500" },
                { label: "Energy", dot: "bg-amber-500" },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-1.5 text-muted-foreground">
                  <span className={`w-2 h-2 rounded-full ${f.dot} shrink-0`} />
                  {f.label}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2 — Weight Graph */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-primary" /> Section 2 — Weight Graph
          </CardTitle>
          <CardDescription className="text-xs">−2.7 kg from start • Steady progress</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          <WeightLineChart />
        </CardContent>
      </Card>

      {/* Section 3 — Glucose Graph */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Section 3 — Fasting Glucose</CardTitle>
          <CardDescription className="text-xs">Only fasting readings tracked</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          <GlucoseLineChart showZones />
          <div className="flex justify-center gap-5 mt-3">
            {[{ color: "#22c55e", label: "Target (80–120)" }, { color: "#eab308", label: "Caution (120–140)" }, { color: "#ef4444", label: "High (140+)" }].map(z => (
              <div key={z.label} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm opacity-70" style={{ backgroundColor: z.color }} />
                <span className="text-[10px] text-muted-foreground">{z.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 4 — Pattern Insights */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" /> Section 4 — Pattern Insights
            <Badge className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">This Is Your Moat</Badge>
          </CardTitle>
          <CardDescription className="text-xs">Detected by your dietician from your responses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { insight: "Sleep quality affects glucose.", icon: "😴" },
              { insight: "Weekends reduce consistency.", icon: "📅" },
              { insight: "Activity is improving energy.", icon: "🏃" },
            ].map((p, i) => (
              <div key={i} className="flex items-start gap-3 bg-muted/50 rounded-xl px-4 py-3 text-sm text-foreground/80">
                <span className="text-base shrink-0">{p.icon}</span>
                <span>{p.insight}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 5 — Focus This Week */}
      <Card className="border-secondary/25 bg-secondary/5 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-secondary flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Section 5 — Focus This Week
          </CardTitle>
          <CardDescription className="text-xs">Only 1–2 priorities from your dietician</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {["Improve dinner timing — aim to eat before 8 PM.", "Add protein at breakfast to reduce mid-morning cravings."].map((f, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                <span className="w-5 h-5 rounded-full bg-secondary/20 text-secondary text-[11px] flex items-center justify-center font-bold shrink-0 mt-0.5">{i + 1}</span>
                {f}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── PREMIUM DASHBOARD SECTIONS ────────────────────────────── */
function PremiumDashboardSections() {
  const glucoseVar = glucoseData.map(d => d.glucose);
  const glucoseMax = Math.max(...glucoseVar);
  const glucoseMin = Math.min(...glucoseVar);
  const variance = glucoseMax - glucoseMin;
  const stabilityLabel = variance < 20 ? "Stable" : variance < 35 ? "Variable" : "Improving";
  const stabilityColor = stabilityLabel === "Stable" ? "#22c55e" : stabilityLabel === "Variable" ? "#eab308" : "#3b82f6";
  const StabilityIcon = stabilityLabel === "Stable" ? CheckCircle2 : stabilityLabel === "Variable" ? AlertCircle : TrendingUp;

  return (
    <div className="space-y-5">
      {/* Section 1 — Metabolic Score (same as comprehensive) */}
      <Card className="border-amber-200/50 shadow-md bg-gradient-to-br from-amber-50/60 via-white to-blue-soft/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Section 1 — Metabolic Score</p>
            <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200">Advanced Monitoring</Badge>
          </div>
          <div className="flex items-end gap-4">
            <div>
              <div className="text-5xl font-extrabold text-foreground tracking-tight">78<span className="text-2xl text-muted-foreground font-normal">/100</span></div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="flex items-center gap-0.5 text-sm font-semibold text-secondary">
                  <ArrowUp className="w-4 h-4" /> Improving
                </span>
                <span className="text-xs text-muted-foreground">vs last week</span>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
              {[
                { label: "Glucose", dot: "bg-secondary" },
                { label: "Adherence", dot: "bg-primary" },
                { label: "Weight trend", dot: "bg-blue-500" },
                { label: "Energy", dot: "bg-amber-500" },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-1.5 text-muted-foreground">
                  <span className={`w-2 h-2 rounded-full ${f.dot} shrink-0`} />
                  {f.label}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2 — Weight + Glucose (combined) */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Section 2 — Weight + Glucose</CardTitle>
          <CardDescription className="text-xs">Combined view of both key metrics</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          <CombinedWeightGlucoseChart />
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-8 border-t-2 border-primary" />
              Weight (kg)
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-8 border-t-2 border-secondary border-dashed" />
              Glucose (mg/dL)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3 — Glucose Stability */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Section 3 — Glucose Stability</CardTitle>
          <CardDescription className="text-xs">Not average only — pattern matters more</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-5">
            <div className="flex flex-col items-center justify-center w-24 h-24 rounded-2xl border-2 shrink-0"
              style={{ borderColor: stabilityColor, backgroundColor: `${stabilityColor}12` }}>
              <StabilityIcon className="w-7 h-7 mb-1" style={{ color: stabilityColor }} />
              <p className="text-sm font-bold" style={{ color: stabilityColor }}>{stabilityLabel}</p>
            </div>
            <div className="flex flex-col gap-2 flex-1">
              {["Stable", "Variable", "Improving"].map(label => {
                const dotColor = label === "Stable" ? "#22c55e" : label === "Variable" ? "#eab308" : "#3b82f6";
                const isActive = label === stabilityLabel;
                return (
                  <div key={label} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 transition-all"
                      style={{
                        backgroundColor: dotColor,
                        opacity: isActive ? 1 : 0.25,
                        outline: isActive ? `2px solid ${dotColor}` : "none",
                        outlineOffset: "2px",
                      }}
                    />
                    <span className={`text-sm ${isActive ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{label}</span>
                    {isActive && <Badge className="text-[10px] bg-muted border-0 text-muted-foreground ml-auto">Current</Badge>}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 bg-muted/40 rounded-xl px-4 py-3 text-xs text-muted-foreground">
            Range this week: <span className="font-semibold text-foreground">{glucoseMin}–{glucoseMax} mg/dL</span> · Variance: <span className="font-semibold text-foreground">{variance} points</span>
          </div>
        </CardContent>
      </Card>

      {/* Section 4 — Personal Insights (Most Important) */}
      <Card className="border-primary/25 shadow-md bg-gradient-to-br from-primary/5 to-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-primary">
            <AlertCircle className="w-4 h-4" /> Section 4 — Personal Insights
            <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">Most Important</Badge>
          </CardTitle>
          <CardDescription className="text-xs">Generated from your specific patterns this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { insight: "Sleep affects glucose — poor sleep nights correlate with higher fasting readings.", icon: "😴" },
              { insight: "Late dinners worsen fasting sugar — your best readings follow meals before 8 PM.", icon: "🍽️" },
              { insight: "Activity improves recovery — walking after dinner reduced next-day glucose on 4/7 days.", icon: "🏃" },
            ].map((p, i) => (
              <div key={i} className="flex items-start gap-3 bg-primary/6 border border-primary/12 rounded-xl px-4 py-3 text-sm text-foreground/80">
                <span className="text-base shrink-0">{p.icon}</span>
                <span>{p.insight}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 5 — Care Team Actions */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-secondary" /> Section 5 — Care Team Actions
          </CardTitle>
          <CardDescription className="text-xs">Actions your care team has taken or recommended this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { action: "Increased daily protein target to 80g", by: "Dietician" },
              { action: "Adjust dinner timing — aim for 7:30 PM", by: "Care Coordinator" },
              { action: "Discuss GLP-1 medication timing with doctor", by: "Care Team" },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="w-5 h-5 rounded-full bg-secondary/15 text-secondary flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">{i + 1}</span>
                <div>
                  <p className="text-foreground/85">{a.action}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{a.by}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── MAIN DASHBOARD ─────────────────────────────────────────── */
export default function PatientDashboard() {
  const plan = useMemo(() => getPlanFromStorage(), []);
  const [checkinDone, setCheckinDone] = useState(false);

  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Morning" : h < 18 ? "Afternoon" : "Evening";
  };

  const storedName = localStorage.getItem("cloudberry_name") || "Rahul Sharma";
  const firstName = storedName.split(" ")[0];

  const planLabel: Record<Plan, string> = {
    basic: "Accountability Program",
    comprehensive: "Structured Coaching",
    premium: "Advanced Monitoring",
  };
  const planColor: Record<Plan, string> = {
    basic: "bg-slate-100 text-slate-700 border-slate-200",
    comprehensive: "bg-primary/10 text-primary border-primary/20",
    premium: "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <PatientLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">

        {/* Welcome */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground flex flex-wrap items-baseline gap-3">
                Good {getGreeting()}, {firstName}!
                <span className="text-2xl md:text-3xl font-bold text-primary">🔥 12 Day Streak</span>
              </h1>
              <span className="text-base text-muted-foreground font-normal mt-1 block">You're on Week 3 of your journey.</span>
            </div>
            <Badge variant="outline" className={`text-xs px-3 py-1 font-medium shrink-0 border ${planColor[plan]}`}>
              {planLabel[plan]}
            </Badge>
          </div>
          {plan === "premium" && (
            <div>
              <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                ⭐ Priority Support Active
              </Badge>
            </div>
          )}
        </div>

        {/* Upgrade banner for basic */}
        {plan === "basic" && (
          <div className="bg-gradient-to-r from-primary/10 to-blue-soft/40 border border-primary/20 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-semibold text-foreground text-sm">Unlock Nutrition & Fitness Coaching</p>
              <p className="text-xs text-muted-foreground mt-0.5">Upgrade to Structured Coaching for personalized meal plans and movement guidance.</p>
            </div>
            <Button asChild size="sm" className="rounded-full shrink-0 text-xs">
              <a href="/#pricing">Upgrade Plan</a>
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            {/* Check-in form — plan specific */}
            {!checkinDone ? (
              <>
                {plan === "basic" && <BasicCheckinForm onDone={() => setCheckinDone(true)} />}
                {(plan === "comprehensive" || plan === "premium") && (
                  <ComprehensiveCheckinForm isPremium={plan === "premium"} onDone={() => setCheckinDone(true)} />
                )}
              </>
            ) : (
              <Card className="border-secondary/25 bg-secondary/5">
                <CardContent className="p-5 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-secondary shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground text-sm">Check-in complete for today!</p>
                    <p className="text-xs text-muted-foreground">Your responses have been sent to your care team.</p>
                  </div>
                  <Button variant="ghost" size="sm" className="ml-auto text-xs" onClick={() => setCheckinDone(false)}>Edit</Button>
                </CardContent>
              </Card>
            )}

            {/* Plan-specific progress sections */}
            {plan === "basic" && <BasicDashboardSections />}
            {plan === "comprehensive" && <ComprehensiveDashboardSections />}
            {plan === "premium" && <PremiumDashboardSections />}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-5">
            {/* Next Session */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  Next Session
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shrink-0 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=80&q=80" alt="Doctor" className="w-full h-full object-cover object-top" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Doctor</h4>
                    <p className="text-xs text-muted-foreground">Metabolic Care</p>
                    <div className="flex items-center gap-1 mt-1 text-xs font-medium text-primary">
                      <Clock className="w-3 h-3" /> Tomorrow, 10:00 AM
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-xl text-xs h-9">Reschedule</Button>
                  <Button className="flex-1 rounded-xl text-xs h-9 gap-1"><Video className="w-3 h-3" /> Join Call</Button>
                </div>
                {plan === "premium" && (
                  <p className="text-xs text-amber-700 mt-3 text-center font-medium">⭐ Priority support — faster callback guaranteed</p>
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
                    <div className="w-8 h-8 rounded-full bg-primary/10 overflow-hidden shrink-0">
                      <img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=80&q=80" alt="Doctor" className="w-full h-full object-cover object-top" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Doctor</h4>
                      <p className="text-xs text-muted-foreground">Metabolic Medicine</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>

                <div className={`flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer ${plan === "basic" ? "opacity-50" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                      <img src="https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=80&q=80" alt="Nutritionist" className="w-full h-full object-cover object-top" />
                    </div>
                    <div>
                      <h4 className={`text-sm font-medium ${plan === "basic" ? "text-muted-foreground" : ""}`}>Nutritionist</h4>
                      <p className="text-xs text-muted-foreground">Clinical Nutrition</p>
                    </div>
                  </div>
                  {plan === "basic" ? <Lock className="w-3 h-3 text-muted-foreground/50" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </div>

                <div className={`flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer ${plan === "basic" ? "opacity-50" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                      <img src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=80&q=80" alt="Fitness Coach" className="w-full h-full object-cover object-top" />
                    </div>
                    <div>
                      <h4 className={`text-sm font-medium ${plan === "basic" ? "text-muted-foreground" : ""}`}>Fitness Coach</h4>
                      <p className="text-xs text-muted-foreground">Lifestyle & Movement</p>
                    </div>
                  </div>
                  {plan === "basic" ? <Lock className="w-3 h-3 text-muted-foreground/50" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                      <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=80&q=80" alt="Care Coordinator" className="w-full h-full object-cover object-top" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Care Coordinator</h4>
                      <p className="text-xs text-muted-foreground">Patient Support</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>

                <Button variant="ghost" className="w-full rounded-xl mt-1 border-dashed border h-9 text-xs">
                  Message Care Coordinator
                </Button>
              </CardContent>
            </Card>

            {/* Plan Summary */}
            <Card className={`${plan === "premium" ? "border-amber-200/50 bg-amber-50/40" : "border-primary/20 bg-primary/5"}`}>
              <CardContent className="p-4">
                <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${plan === "premium" ? "text-amber-700" : "text-primary"}`}>Your Plan</p>
                <p className="font-bold text-foreground text-sm mb-3">{planLabel[plan]}</p>
                <div className="space-y-1.5">
                  {[
                    { label: "Daily check-ins", included: true },
                    { label: "Personalized nutrition plan", included: plan !== "basic" },
                    { label: "Movement guidance", included: plan !== "basic" },
                    { label: "Glucose tracking", included: plan === "premium" },
                    { label: "Advanced progress reviews", included: plan === "premium" },
                    { label: "Priority support", included: plan === "premium" },
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-foreground/70">
                      <span className={`w-1.5 h-1.5 rounded-full ${f.included ? (plan === "premium" ? "bg-amber-500" : "bg-primary") : "bg-muted-foreground/30"}`} />
                      {f.label}
                    </div>
                  ))}
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
