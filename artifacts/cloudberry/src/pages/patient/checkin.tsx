import { PatientLayout } from "@/components/layout/patient-layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from "react";
import { CheckCircle2, Upload, Camera, Droplets, X } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

type Plan = "basic" | "comprehensive" | "premium";

function getPlan(): Plan {
  const p = localStorage.getItem("cloudberry_plan");
  return (p === "basic" || p === "comprehensive" || p === "premium") ? p : "comprehensive";
}

function getToday() {
  return new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function getISOWeekKey() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function getUserId(): string {
  try {
    const token = localStorage.getItem("cloudberry_token") || "";
    const data = JSON.parse(atob(token));
    return String(data.userId ?? "anon");
  } catch {
    return "anon";
  }
}

/* ─── Slider question component ─────────────────────────────── */
interface SliderQuestionProps {
  icon: React.ReactNode;
  label: string;
  scale?: string;
  value: number;
  onChange: (v: number) => void;
  lowLabel: string;
  midLabel: string;
  highLabel: string;
  reversed?: boolean;
}

function sliderColor(v: number, reversed = false) {
  const effective = reversed ? 100 - v : v;
  if (effective >= 70) return "#22c55e";
  if (effective >= 40) return "#f59e0b";
  return "#ef4444";
}

function SliderQuestion({ icon, label, scale = "(0-100)", value, onChange, lowLabel, midLabel, highLabel, reversed = false }: SliderQuestionProps) {
  const color = sliderColor(value, reversed);
  const displayLabel = value >= 70 ? (reversed ? midLabel : highLabel)
    : value >= 40 ? midLabel
    : (reversed ? highLabel : lowLabel);

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/40 last:border-0">
      <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between mb-1">
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">{label}</p>
            <p className="text-[10px] text-muted-foreground">{scale}</p>
          </div>
          <div className="flex flex-col items-end ml-4 shrink-0">
            <span className="text-2xl font-extrabold leading-none" style={{ color }}>{value}</span>
            <span className="text-[10px] font-semibold mt-0.5" style={{ color }}>{displayLabel}</span>
          </div>
        </div>
        <div className="relative mt-2">
          <input
            type="range" min={0} max={100} step={1} value={value}
            onChange={e => onChange(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer outline-none"
            style={{
              background: `linear-gradient(to right, ${color} 0%, ${color} ${value}%, #e2e8f0 ${value}%, #e2e8f0 100%)`,
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-muted-foreground">0</span>
          <span className="text-[9px] text-muted-foreground">50</span>
          <span className="text-[9px] text-muted-foreground">100</span>
        </div>
      </div>
    </div>
  );
}

/* ─── PREMIUM EXTRA QUESTIONS ───────────────────────────────── */
const HARDEST_OPTIONS = ["Cravings", "Stress eating", "Eating outside", "Low motivation", "Poor sleep", "Busy schedule", "Other"];

function PremiumExtras({ hardest, setHardest }: { hardest: string[]; setHardest: (v: string[]) => void }) {
  const toggle = (opt: string) => setHardest(hardest.includes(opt) ? hardest.filter(o => o !== opt) : [...hardest, opt]);
  return (
    <div className="mt-3 border-t border-border/40 pt-4 space-y-4">
      <div>
        <p className="text-sm font-semibold text-foreground mb-2">What was hardest today? <span className="text-xs font-normal text-muted-foreground">(Select all that apply)</span></p>
        <div className="flex flex-wrap gap-1.5">
          {HARDEST_OPTIONS.map(opt => (
            <button key={opt} type="button" onClick={() => toggle(opt)}
              className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                hardest.includes(opt) ? "bg-primary/10 border-primary text-primary" : "border-border text-foreground hover:bg-muted"
              }`}>
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ─────────────────────────────────────────────── */
export default function CheckinPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const plan = getPlan();
  const storedName = localStorage.getItem("cloudberry_name") || "there";
  const firstName = storedName.split(" ")[0];

  // Per-patient keys — prevents shared state across different patients on same browser
  const userId = getUserId();
  const todayKey = getTodayKey();
  const weekKey = getISOWeekKey();
  const lsCheckinKey = `cloudberry_checkin_date_${userId}`;
  const lsScoreKey = `cloudberry_checkin_score_${userId}`;
  const lsWeightKey = `cloudberry_weight_week_${userId}_${weekKey}`;
  const alreadyCheckedInLocally = localStorage.getItem(lsCheckinKey) === todayKey;
  const weightDoneThisWeek = !!localStorage.getItem(lsWeightKey);

  const [nutrition, setNutrition] = useState(0);
  const [activity, setActivity] = useState(0);
  const [hunger, setHunger] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [sleepQ, setSleepQ] = useState(0);
  const [glucose, setGlucose] = useState("");
  const [postGlucose, setPostGlucose] = useState("");
  const [mealPhoto, setMealPhoto] = useState<string | null>(null);
  const [hardest, setHardest] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(alreadyCheckedInLocally);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [weight, setWeight] = useState("");
  const [savedScore] = useState(() => Number(localStorage.getItem(lsScoreKey) || "0"));
  const fileRef = useRef<HTMLInputElement>(null);

  // Server-authoritative check — catches cases where localStorage is stale
  // (e.g. different device, cleared storage) — only fires when local state says not done
  const { data: todayCheckinData } = useQuery({
    queryKey: ["checkins-today", userId],
    queryFn: async () => {
      const token = localStorage.getItem("cloudberry_token");
      const r = await fetch(`${API}/checkins/today`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) return null;
      return r.json() as Promise<{ done: boolean; checkin: any }>;
    },
    enabled: !alreadyCheckedInLocally,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (todayCheckinData?.done && !submitted) {
      setSubmitted(true);
    }
  }, [todayCheckinData, submitted]);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => setMealPhoto(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const allFilled = nutrition !== undefined && activity !== undefined && hunger !== undefined && energy !== undefined && sleepQ !== undefined;
  const avgScore = Math.round((nutrition + activity + (100 - hunger) + energy + sleepQ) / 5);
  const overallColor = avgScore >= 70 ? "#22c55e" : avgScore >= 45 ? "#f59e0b" : "#ef4444";
  const motivationMsg = avgScore >= 70
    ? "Great job staying consistent! Keep going – you're doing amazing! 🌟"
    : avgScore >= 45
    ? "Good effort today. Keep showing up – every day counts! 💪"
    : "Don't worry – tomorrow is a fresh start. Your team is here to support you. 🤝";

  const handleSubmit = async () => {
    if (!allFilled) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("cloudberry_token");
      const mealsFollowed = nutrition >= 70 ? "yes" : nutrition >= 40 ? "partially" : "no";
      const energyLevel = energy >= 70 ? "good" : energy >= 40 ? "moderate" : "low";
      const weightNum = weight.trim() ? parseFloat(weight) : null;

      const resp = await fetch(`${API}/checkins`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          mealsFollowed,
          activityCompleted: activity >= 50,
          energyLevel,
          mood: energy >= 70 ? "good" : "neutral",
          glucoseReading: glucose ? Number(glucose) : undefined,
          postMealGlucose: postGlucose ? Number(postGlucose) : undefined,
          // weight is persisted server-side to metricsTable and updates patient.currentWeight
          weight: (!weightDoneThisWeek && weightNum && weightNum > 0) ? weightNum : undefined,
          // sleepHours derived from 0-100 sleep quality slider: maps to 4-9 hours
          sleepHours: Math.round(4 + (sleepQ / 100) * 5),
          notes: [
            hardest.length > 0 ? `Hardest today: ${hardest.join(", ")}` : null,
            postGlucose ? `Post-meal glucose: ${postGlucose} mg/dL` : null,
          ].filter(Boolean).join(". ") || undefined,
        }),
      });

      if (resp.status === 409) {
        // Server says already done today — sync local state
        localStorage.setItem(lsCheckinKey, todayKey);
        setSubmitted(true);
        setJustSubmitted(false);
        return;
      }

      // Mark done in per-patient localStorage
      localStorage.setItem(`cloudberry_first_checkin_done_${userId}`, "1");
      localStorage.setItem(lsCheckinKey, todayKey);
      localStorage.setItem(lsScoreKey, String(avgScore));
      // Track weight week locally (prevents re-showing the weight field this week)
      if (!weightDoneThisWeek && weightNum && weightNum > 0) {
        localStorage.setItem(lsWeightKey, String(weightNum));
      }

      setJustSubmitted(true);
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    const score = justSubmitted ? avgScore : savedScore;
    const scoreColor = score >= 70 ? "#22c55e" : score >= 45 ? "#f59e0b" : "#ef4444";
    const msg = justSubmitted ? motivationMsg
      : score >= 70 ? "Great job staying consistent! Keep going – you're doing amazing! 🌟"
      : score >= 45 ? "Good effort yesterday. Keep showing up – every day counts! 💪"
      : "Don't worry – today is a fresh start. Your team is here to support you. 🤝";

    return (
      <PatientLayout>
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <div className="max-w-sm w-full text-center space-y-5">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {justSubmitted ? "Check-in Complete!" : "Already Checked In Today"}
              </h2>
              <p className="text-muted-foreground text-sm mt-1.5 leading-relaxed">
                {justSubmitted
                  ? "Your responses have been sent to your care team. They'll review and be in touch."
                  : "You've already completed today's check-in. Come back tomorrow!"}
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4">
              <p className="text-sm text-green-800 font-medium">{msg}</p>
            </div>
            <div className="bg-muted/40 rounded-2xl px-5 py-4">
              <p className="text-xs text-muted-foreground mb-1">Today's overall score</p>
              <span className="text-4xl font-extrabold" style={{ color: scoreColor }}>{score}</span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <p className="text-xs text-muted-foreground">Your daily check-ins help personalise your plan and celebrate your progress 💙</p>
            <Button className="w-full rounded-xl" onClick={() => navigate("/patient/dashboard")}>Back to Dashboard</Button>
          </div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Hi {firstName} 👋</h1>
            <p className="text-primary font-semibold text-sm mt-0.5">Quick check-in for today</p>
            <p className="text-xs text-muted-foreground mt-0.5">Your responses help us support you better.</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-lg px-2.5 py-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Today
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{getToday()}</p>
          </div>
        </div>

        {/* Overall score preview */}
        {allFilled && (
          <div className="flex items-center gap-3 bg-muted/30 rounded-2xl px-4 py-3">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Today's score</p>
              <span className="text-3xl font-extrabold" style={{ color: overallColor }}>{avgScore}</span>
            </div>
            <div className="flex-1">
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${avgScore}%`, backgroundColor: overallColor }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-snug">{motivationMsg}</p>
            </div>
          </div>
        )}

        {/* Sliders card */}
        <div className="bg-white border border-border rounded-2xl shadow-sm px-4 py-2">
          <SliderQuestion
            icon={<span className="text-xl">🥗</span>}
            label="Nutrition consistency today?"
            value={nutrition} onChange={setNutrition}
            lowLabel="Struggled" midLabel="Mostly" highLabel="Fully"
          />
          <SliderQuestion
            icon={<span className="text-xl">🏃</span>}
            label="Activity completed?"
            value={activity} onChange={setActivity}
            lowLabel="No" midLabel="Partial" highLabel="Yes"
          />
          <SliderQuestion
            icon={<span className="text-xl">🍫</span>}
            label="Hunger / cravings today?"
            value={hunger} onChange={setHunger}
            lowLabel="High" midLabel="Moderate" highLabel="Low"
            reversed
          />
          <SliderQuestion
            icon={<span className="text-xl">⚡</span>}
            label="Energy today?"
            value={energy} onChange={setEnergy}
            lowLabel="Low" midLabel="Average" highLabel="Good"
          />
          <SliderQuestion
            icon={<span className="text-xl">🌙</span>}
            label="Sleep quality last night?"
            value={sleepQ} onChange={setSleepQ}
            lowLabel="Poor" midLabel="Average" highLabel="Good"
          />
        </div>

        {/* Comprehensive extras — meal photo only */}
        {plan === "comprehensive" && (
          <div className="bg-white border border-border rounded-2xl shadow-sm px-4 py-4 space-y-4">
            {/* Meal photo */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Camera className="w-4 h-4 text-orange-500" />
                <p className="text-sm font-semibold text-foreground">Share a photo of one meal today
                  <span className="text-xs font-normal text-muted-foreground ml-1">(optional — team will review)</span>
                </p>
              </div>
              {mealPhoto ? (
                <div className="relative inline-block">
                  <img src={mealPhoto} alt="Meal" className="h-24 w-24 object-cover rounded-xl border" />
                  <button onClick={() => setMealPhoto(null)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-white rounded-full text-[10px] flex items-center justify-center font-bold shadow">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-orange-300 bg-orange-50/60 rounded-xl text-sm text-orange-600 hover:bg-orange-50 transition-colors">
                  <Upload className="w-4 h-4" /> Upload Photo
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </div>
          </div>
        )}

        {/* Premium extras — glucose readings + meal photo */}
        {plan === "premium" && (
          <div className="bg-white border border-border rounded-2xl shadow-sm px-4 py-4 space-y-4">
            {/* Fasting glucose */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="w-4 h-4 text-blue-500" />
                <p className="text-sm font-semibold text-foreground">Fasting glucose reading
                  <span className="text-xs font-normal text-muted-foreground ml-1">(every 3 days, optional)</span>
                </p>
              </div>
              <div className="relative max-w-[180px]">
                <input type="number" placeholder="e.g. 108" value={glucose} onChange={e => setGlucose(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-border/60 bg-muted/30 px-3 py-2 pr-14 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">mg/dL</span>
              </div>
            </div>

            {/* Meal photo */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Camera className="w-4 h-4 text-orange-500" />
                <p className="text-sm font-semibold text-foreground">Share a photo of one meal today
                  <span className="text-xs font-normal text-muted-foreground ml-1">(optional — team will review)</span>
                </p>
              </div>
              {mealPhoto ? (
                <div className="relative inline-block">
                  <img src={mealPhoto} alt="Meal" className="h-24 w-24 object-cover rounded-xl border" />
                  <button onClick={() => setMealPhoto(null)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-white rounded-full text-[10px] flex items-center justify-center font-bold shadow">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-orange-300 bg-orange-50/60 rounded-xl text-sm text-orange-600 hover:bg-orange-50 transition-colors">
                  <Upload className="w-4 h-4" /> Upload Photo
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </div>

            {/* Post meal glucose */}
            <div className="bg-blue-50/60 border border-blue-100 rounded-xl px-3 py-2.5">
              <p className="text-xs text-blue-700 font-medium">Please share your post meal glucose reading today <span className="font-normal opacity-80">(if available)</span></p>
              <div className="relative max-w-[160px] mt-1.5">
                <input type="number" placeholder="e.g. 132" value={postGlucose} onChange={e => setPostGlucose(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 pr-14 text-sm outline-none focus:ring-2 focus:ring-blue-300" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">mg/dL</span>
              </div>
            </div>
          </div>
        )}

        {/* Premium extended questions */}
        {plan === "premium" && (
          <div className="bg-white border border-border rounded-2xl shadow-sm px-4 py-4">
            <PremiumExtras hardest={hardest} setHardest={setHardest} />
          </div>
        )}

        {/* Weekly weight input */}
        {!weightDoneThisWeek && (
          <div className="bg-white border border-border rounded-2xl shadow-sm px-4 py-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">⚖️</span>
              <div>
                <p className="text-sm font-semibold text-foreground">Weekly Weight Check-in</p>
                <p className="text-xs text-muted-foreground">Logged once a week until you submit</p>
              </div>
            </div>
            <div className="relative max-w-[180px]">
              <input
                type="number"
                placeholder="e.g. 72.5"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                step="0.1"
                min="20"
                max="300"
                className="flex h-10 w-full rounded-xl border border-border/60 bg-muted/30 px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">kg</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">Optional — helps track your progress over time</p>
          </div>
        )}

        {/* Motivational footer */}
        <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <span className="text-base">⭐</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800">Great job staying consistent!</p>
            <p className="text-xs text-green-700 mt-0.5">Keep going – you're doing amazing!</p>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground pb-1">Your daily check-ins help us personalise your plan and celebrate your progress 💙</p>

        {/* Submit */}
        <Button
          className="w-full rounded-xl h-12 text-base font-semibold"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Submitting…" : "Complete Check-in"}
        </Button>

        <style>{`
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: white;
            border: 2px solid #94a3b8;
            box-shadow: 0 1px 4px rgba(0,0,0,0.18);
            cursor: pointer;
            transition: border-color 0.15s;
          }
          input[type="range"]:focus::-webkit-slider-thumb {
            border-color: hsl(218 91% 50%);
          }
          input[type="range"]::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: white;
            border: 2px solid #94a3b8;
            box-shadow: 0 1px 4px rgba(0,0,0,0.18);
            cursor: pointer;
          }
        `}</style>
      </div>
    </PatientLayout>
  );
}
