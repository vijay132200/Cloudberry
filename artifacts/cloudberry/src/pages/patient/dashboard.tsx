import { PatientLayout } from "@/components/layout/patient-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity, TrendingDown, Calendar, CheckCircle2, AlertCircle,
  TrendingUp, MessageSquare, Video, Lock, ChevronRight, Star,
  Stethoscope, Apple, HeartHandshake, Sparkles,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceArea, BarChart, Bar, Cell,
} from "recharts";
import { Link, useLocation } from "wouter";
import { AssessmentModal } from "./assessment";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

type Plan = "basic" | "comprehensive" | "premium";

async function fetchDashboard() {
  const token = localStorage.getItem("cloudberry_token");
  const r = await fetch(`${API}/patients/me/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error("Failed");
  return r.json();
}
function getPlan(): Plan {
  const p = localStorage.getItem("cloudberry_plan");
  return (p === "basic" || p === "comprehensive" || p === "premium") ? p : "comprehensive";
}

const energyColor = (v: number) => v === 3 ? "#22c55e" : v === 2 ? "#f59e0b" : "#ef4444";
const energyLabel = (v: number) => v === 3 ? "High" : v === 2 ? "Moderate" : "Low";

/* ─── Empty / Locked state ────────────────────────────────────── */
function EmptyState({ icon: Icon, title, body, cta }: { icon: any; title: string; body: string; cta?: { label: string; href: string } }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-8 px-4">
      <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">{body}</p>
      {cta && (
        <Button asChild size="sm" variant="outline" className="mt-3 rounded-lg text-xs h-8">
          <Link href={cta.href}>{cta.label} <ChevronRight className="w-3 h-3 ml-1" /></Link>
        </Button>
      )}
    </div>
  );
}

function LockedCard({ title, body }: { title: string; body: string }) {
  return (
    <Card className="border-dashed border-border/60 bg-muted/20">
      <CardContent className="py-8">
        <EmptyState icon={Lock} title={title} body={body} />
      </CardContent>
    </Card>
  );
}

/* ─── Charts (all consume real data props) ───────────────────── */
function WeightChart({ data, target }: { data: any[]; target?: number | null }) {
  if (data.length === 0) return <EmptyState icon={TrendingDown} title="No weight recorded yet" body="Add your first weight in Health Records to start tracking trends." cta={{ label: "Add weight", href: "/patient/records" }} />;
  const ys = data.map(d => d.value);
  const lo = Math.floor(Math.min(...ys) - 1);
  const hi = Math.ceil(Math.max(...ys, target ?? 0) + 1);
  return (
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
        <YAxis domain={[lo, hi]} tick={{ fontSize: 9 }} />
        <Tooltip formatter={(v: number) => [`${v} kg`, "Weight"]} />
        <Line type="monotone" dataKey="value" stroke="hsl(218 91% 50%)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function GlucoseChart({ data, zones = false }: { data: any[]; zones?: boolean }) {
  if (data.length === 0) return <EmptyState icon={Activity} title="No glucose data yet" body="Glucose readings will appear once you log them in Health Records." cta={{ label: "Add reading", href: "/patient/records" }} />;
  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data.slice(-14)} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
        <YAxis domain={[60, 180]} tick={{ fontSize: 9 }} />
        <Tooltip formatter={(v: number) => [`${v} mg/dL`, "Glucose"]} />
        {zones && <>
          <ReferenceArea y1={80} y2={120} fill="#22c55e0d" />
          <ReferenceArea y1={120} y2={140} fill="#f59e0b0d" />
          <ReferenceArea y1={140} y2={180} fill="#ef44440d" />
        </>}
        <Line type="monotone" dataKey="value" stroke="hsl(218 91% 50%)" strokeWidth={2}
          dot={({ cx, cy, payload }: any) => {
            const c = payload.value < 120 ? "#22c55e" : payload.value < 140 ? "#f59e0b" : "#ef4444";
            return <circle key={cx} cx={cx} cy={cy} r={3.5} fill={c} stroke="white" strokeWidth={1} />;
          }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function EnergyChart({ data }: { data: any[] }) {
  if (data.length === 0) return <EmptyState icon={Activity} title="No energy data yet" body="Complete a check-in to start tracking your energy levels." cta={{ label: "Check in", href: "/patient/checkin" }} />;
  return (
    <ResponsiveContainer width="100%" height={90}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
        <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => new Date(d).toLocaleDateString("en-US", { weekday: "short" })} />
        <YAxis domain={[0, 3]} ticks={[1, 2, 3]} tickFormatter={v => ["", "Lo", "Mid", "Hi"][v]} tick={{ fontSize: 9 }} />
        <Tooltip formatter={(v: number) => [energyLabel(v), "Energy"]} />
        <Bar dataKey="value" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => <Cell key={i} fill={energyColor(d.value)} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ─── Adherence grid ─────────────────────────────────────────── */
function WeeklyAdherence({ days, pct }: { days: any[]; pct: number | null }) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Weekly Adherence</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{pct === null ? "No check-ins recorded this week" : `${days.filter(d => d.completed === true).length} of 7 days completed`}</p>
          </div>
          <span className="text-2xl font-extrabold text-primary">{pct === null ? "—" : `${pct}%`}</span>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d) => (
            <div key={d.date} className="flex flex-col items-center gap-1">
              <span className="text-[9px] text-muted-foreground font-medium">{d.dow}</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs ${
                d.completed === null
                  ? "bg-muted/40 text-muted-foreground/50"
                  : d.completed
                  ? "bg-green-100 text-green-700"
                  : "bg-red-50 text-red-500"
              }`}>
                {d.completed === null ? "–" : d.completed ? "✓" : "✕"}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Care Team Card ─────────────────────────────────────────── */
function CareTeamCard({ team }: { team: any }) {
  const members = [
    { key: "physician", role: "Physician", icon: Stethoscope, color: "text-blue-600 bg-blue-50", person: team?.physician },
    { key: "dietician", role: "Dietician", icon: Apple, color: "text-green-600 bg-green-50", person: team?.dietician },
    { key: "caretaker", role: "Caretaker", icon: HeartHandshake, color: "text-purple-600 bg-purple-50", person: team?.caretaker },
  ];
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Your Care Team</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {members.map(m => (
          <div key={m.key} className="flex items-center gap-3 py-1">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${m.color}`}>
              <m.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{m.role}</p>
              <p className="text-sm font-medium text-foreground truncate">
                {m.person ? m.person.name : <span className="text-muted-foreground italic font-normal">Yet to be assigned</span>}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ─── Messages ───────────────────────────────────────────────── */
function MessagesCard({ messages, careAssigned }: { messages: any[]; careAssigned: boolean }) {
  if (!careAssigned) {
    return (
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-muted-foreground" /> Care Team Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <EmptyState icon={Lock} title="Awaiting care team allocation" body="Once your care team is assigned, their messages will appear here." />
        </CardContent>
      </Card>
    );
  }
  const roleColor: Record<string, string> = {
    physician: "bg-blue-100 text-blue-700",
    dietician: "bg-green-100 text-green-700",
    caretaker: "bg-purple-100 text-purple-700",
  };
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" /> Care Team Messages
          </CardTitle>
          {messages.length > 0 && <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{messages.length}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {messages.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No messages yet" body="Your care team hasn't sent any messages." />
        ) : (
          <div className="space-y-3">
            {messages.map(m => (
              <div key={m.id} className="flex gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${roleColor[m.role] ?? "bg-muted text-foreground"}`}>
                  {m.from.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-foreground">{m.from}</p>
                    <span className="text-[10px] text-muted-foreground capitalize">{m.role}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{new Date(m.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{m.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Insights ───────────────────────────────────────────────── */
function InsightsCard({ insights, hasEnoughData, careAssigned }: { insights: any[] | null; hasEnoughData: boolean; careAssigned: boolean }) {
  if (!careAssigned) return <LockedCard title="Insights pending care team" body="Clinical insights are generated by your care team after assignment." />;
  if (!hasEnoughData) return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" /> Weekly Insights</CardTitle></CardHeader>
      <CardContent className="pt-0">
        <EmptyState icon={AlertCircle} title="Not enough data yet" body="Complete at least 5 daily check-ins to unlock personalised insights." cta={{ label: "Check in now", href: "/patient/checkin" }} />
      </CardContent>
    </Card>
  );
  if (!insights || insights.length === 0) return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" /> Weekly Insights</CardTitle></CardHeader>
      <CardContent className="pt-0"><EmptyState icon={Sparkles} title="All systems steady" body="No notable patterns detected this week. Keep going." /></CardContent>
    </Card>
  );
  const palette: Record<string, string> = {
    challenge: "bg-red-50/60 border-red-100",
    positive: "bg-green-50/60 border-green-100",
    focus: "bg-blue-50/60 border-blue-100",
  };
  const labelColor: Record<string, string> = {
    challenge: "text-red-700",
    positive: "text-green-700",
    focus: "text-blue-700",
  };
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" /> Weekly Insights</CardTitle></CardHeader>
      <CardContent className="pt-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {insights.map((ins, i) => (
          <div key={i} className={`rounded-xl p-3 border ${palette[ins.kind] ?? "bg-muted/40"}`}>
            <p className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${labelColor[ins.kind] ?? "text-foreground"}`}>{ins.title}</p>
            <p className="text-xs text-foreground/80 leading-relaxed">{ins.body}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ─── Next Review ────────────────────────────────────────────── */
function NextReviewCard({ appt, careAssigned }: { appt: any; careAssigned: boolean }) {
  if (!careAssigned) return <LockedCard title="No upcoming meetings" body="Meetings appear here once your care team is assigned and schedules a review." />;
  if (!appt) return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3"><CardTitle className="text-sm">Next Coach Review</CardTitle></CardHeader>
      <CardContent className="pt-0"><EmptyState icon={Calendar} title="No upcoming meetings" body="When your care team schedules a session, it will appear here." cta={{ label: "View appointments", href: "/patient/appointments" }} /></CardContent>
    </Card>
  );
  const d = new Date(appt.scheduledAt);
  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="p-4">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Next Review</p>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">{d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}</p>
            <p className="text-xs text-muted-foreground">{d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })} · with {appt.careTeamMember}</p>
          </div>
        </div>
        {appt.notes && <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-2.5 mb-3">{appt.notes}</p>}
        <Button size="sm" className="w-full h-8 rounded-lg text-xs gap-1.5"><Video className="w-3.5 h-3.5" /> Join Call</Button>
      </CardContent>
    </Card>
  );
}

/* ─── Care Plan ──────────────────────────────────────────────── */
function CarePlanCard({ plan, careAssigned }: { plan: any; careAssigned: boolean }) {
  if (!careAssigned) return <LockedCard title="Care plan pending" body="Your personalised nutrition and activity plan will be ready after your care team is assigned." />;
  if (!plan || (!plan.nutritionPlan && !plan.activityPlan && !plan.weeklyGoals)) return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3"><CardTitle className="text-sm">Your Care Plan</CardTitle></CardHeader>
      <CardContent className="pt-0"><EmptyState icon={AlertCircle} title="Plan being prepared" body="Your care team is finalising your plan. Check back soon." /></CardContent>
    </Card>
  );
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3"><CardTitle className="text-sm">Your Care Plan</CardTitle></CardHeader>
      <CardContent className="pt-0 space-y-3 text-xs text-foreground/80 leading-relaxed">
        {plan.weeklyGoals && <div><p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">This Week's Goals</p>{plan.weeklyGoals}</div>}
        {plan.nutritionPlan && <div><p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Nutrition</p>{plan.nutritionPlan}</div>}
        {plan.activityPlan && <div><p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Activity</p>{plan.activityPlan}</div>}
      </CardContent>
    </Card>
  );
}

/* ─── Metric Cards Row ───────────────────────────────────────── */
function MetricRow({ dash }: { dash: any }) {
  const { weightSeries, consistencyBreakdown, energySeries, glucoseSeries } = dash;
  const lastWeight = weightSeries[weightSeries.length - 1]?.value ?? null;
  const startWeight = weightSeries[0]?.value ?? null;
  const weightDelta = (lastWeight !== null && startWeight !== null) ? lastWeight - startWeight : null;
  const lastEnergy = energySeries[energySeries.length - 1]?.value ?? null;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Weight</p>
            <TrendingDown className="w-3 h-3 text-primary" />
          </div>
          {lastWeight === null ? (
            <p className="text-sm text-muted-foreground mt-2">No data</p>
          ) : (
            <>
              <p className="text-xl font-extrabold text-foreground">{lastWeight} <span className="text-xs font-normal">kg</span></p>
              {weightDelta !== null && weightDelta !== 0 && (
                <p className={`text-[10px] font-semibold ${weightDelta < 0 ? "text-green-600" : "text-amber-600"}`}>
                  {weightDelta < 0 ? "↓" : "↑"} {Math.abs(weightDelta).toFixed(1)} kg since start
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Consistency</p>
            <CheckCircle2 className="w-3 h-3 text-primary" />
          </div>
          {consistencyBreakdown === null ? (
            <p className="text-sm text-muted-foreground mt-2">No data</p>
          ) : (
            <>
              <p className="text-2xl font-extrabold text-primary">{consistencyBreakdown.checkIns}%</p>
              <p className="text-[10px] text-muted-foreground">check-ins · 7 days</p>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Energy</p>
            <Activity className="w-3 h-3 text-amber-500" />
          </div>
          {lastEnergy === null ? (
            <p className="text-sm text-muted-foreground mt-2">No data</p>
          ) : (
            <>
              <p className={`text-xl font-extrabold ${lastEnergy === 3 ? "text-green-600" : lastEnergy === 2 ? "text-amber-500" : "text-red-500"}`}>{energyLabel(lastEnergy)}</p>
              <p className="text-[10px] text-muted-foreground">latest check-in</p>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Avg Glucose</p>
            <TrendingUp className="w-3 h-3 text-primary" />
          </div>
          {dash.avgGlucose === null ? (
            <p className="text-sm text-muted-foreground mt-2">No data</p>
          ) : (
            <>
              <p className="text-xl font-extrabold text-foreground">{dash.avgGlucose}<span className="text-xs font-normal"> mg/dL</span></p>
              <p className="text-[10px] text-muted-foreground">{dash.timeInRange}% in range · 7d</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── MAIN EXPORT ────────────────────────────────────────────── */
export default function PatientDashboard() {
  const plan = useMemo(() => getPlan(), []);
  const [, navigate] = useLocation();
  const [assessmentDone, setAssessmentDone] = useState(() => localStorage.getItem("cloudberry_assessment_done") === "1");
  const [showAssessment, setShowAssessment] = useState(false);
  const [checkinRequired, setCheckinRequired] = useState(() => localStorage.getItem("cloudberry_first_checkin_done") !== "1");

  const { data: dash, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard, retry: 1, staleTime: 60_000 });

  const storedName = localStorage.getItem("cloudberry_name") || "there";
  const firstName = storedName.split(" ")[0];

  const weekNum = dash?.weekNumber ?? 1;
  const streak = dash?.streak ?? 0;
  const totalCheckins = dash?.totalCheckins ?? 0;
  const isNewPatient = totalCheckins === 0;
  const careAssigned = dash?.careAssigned ?? false;

  useEffect(() => {
    if (dash && isNewPatient && !assessmentDone) setShowAssessment(true);
  }, [dash, isNewPatient, assessmentDone]);

  const planLabel: Record<Plan, string> = { basic: "Accountability", comprehensive: "Structured Coaching", premium: "Advanced Monitoring" };
  const planColor: Record<Plan, string> = {
    basic: "bg-slate-100 text-slate-700 border-slate-200",
    comprehensive: "bg-primary/10 text-primary border-primary/20",
    premium: "bg-amber-50 text-amber-700 border-amber-200",
  };

  if (isLoading || !dash) return (
    <PatientLayout>
      <div className="p-6 max-w-5xl mx-auto"><div className="text-sm text-muted-foreground">Loading your dashboard…</div></div>
    </PatientLayout>
  );

  return (
    <PatientLayout>
      {showAssessment && !assessmentDone && (
        <AssessmentModal plan={plan} onComplete={() => {
          localStorage.setItem("cloudberry_assessment_done", "1");
          setAssessmentDone(true); setShowAssessment(false);
          navigate("/patient/checkin");
        }} />
      )}

      {assessmentDone && checkinRequired && isNewPatient && (
        <div className="fixed inset-0 z-40 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-border p-8 max-w-md w-full text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto"><CheckCircle2 className="w-7 h-7 text-primary" /></div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Assessment complete! 🎉</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">Complete your first daily check-in to start tracking your journey.</p>
            </div>
            <Button className="w-full rounded-xl" onClick={() => navigate("/patient/checkin")}>Do Your First Check-in <ChevronRight className="w-4 h-4 ml-1" /></Button>
            <button className="text-xs text-muted-foreground underline underline-offset-2" onClick={() => { localStorage.setItem("cloudberry_first_checkin_done", "1"); setCheckinRequired(false); }}>Skip for now</button>
          </div>
        </div>
      )}

      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                {new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening"}, {firstName}
              </h1>
              {streak > 0 && (
                <span className="text-sm font-bold text-orange-500 flex items-center gap-1">🔥 {streak}-day streak</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Week {weekNum} · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
          </div>
          <Badge variant="outline" className={`text-xs px-3 py-1 font-medium border ${planColor[plan]}`}>
            {plan === "premium" && <Star className="w-3 h-3 mr-1 fill-amber-500 text-amber-500" />}{planLabel[plan]}
          </Badge>
        </div>

        {/* Assessment prompt */}
        {!assessmentDone && (
          <div className="bg-gradient-to-r from-primary/8 to-blue-50/60 border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Lock className="w-4 h-4 text-primary" /></div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Complete your initial health assessment</p>
              <p className="text-xs text-muted-foreground mt-0.5">Takes ~5 minutes. We use this to personalise your plan.</p>
            </div>
            <Button size="sm" className="shrink-0 rounded-xl text-xs" onClick={() => setShowAssessment(true)}>Start <ChevronRight className="w-3 h-3 ml-1" /></Button>
          </div>
        )}

        {/* Pre-care-assignment banner */}
        {!careAssigned && (
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0"><Sparkles className="w-4 h-4 text-amber-600" /></div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">Your care team is being assigned</p>
              <p className="text-xs text-amber-800/80 mt-0.5">Meetings, care plans, messages and insights will unlock once Operations completes your onboarding.</p>
            </div>
          </div>
        )}

        {/* Check-in CTA row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="border-border/60 shadow-sm sm:col-span-2 bg-gradient-to-br from-primary/5 to-blue-50/30">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Today's Check-in</p>
              <div className="flex items-center gap-3">
                {dash.checkinDoneToday ? (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center"><CheckCircle2 className="w-6 h-6 text-green-600" /></div>
                    <div>
                      <p className="text-base font-bold text-foreground">Done for today ✓</p>
                      <p className="text-xs text-muted-foreground">Great job. Come back tomorrow to keep your streak.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center"><AlertCircle className="w-6 h-6 text-primary" /></div>
                    <div className="flex-1">
                      <p className="text-base font-bold text-foreground">Check-in pending</p>
                      <p className="text-xs text-muted-foreground">5 quick questions · under 2 minutes</p>
                    </div>
                    <Button asChild size="sm" className="rounded-xl text-xs"><Link href="/patient/checkin">Check in <ChevronRight className="w-3.5 h-3.5 ml-1" /></Link></Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">This Week</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-foreground">{totalCheckins}</span>
                <span className="text-xs text-muted-foreground">check-ins total</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Since week 1 of your program</p>
            </CardContent>
          </Card>
        </div>

        {/* Adherence */}
        <WeeklyAdherence days={dash.adherence7Day} pct={dash.adherencePct} />

        {/* Metric Row */}
        <MetricRow dash={dash} />

        {/* Care team + Glucose */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <CareTeamCard team={dash.careTeam} />
          <Card className="lg:col-span-2 border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Fasting Glucose Trend</CardTitle>
                {dash.glucoseSeries.length > 0 && <Badge className="text-[10px] bg-green-50 text-green-700 border-green-200">Avg {dash.avgGlucose} mg/dL</Badge>}
              </div>
              <CardDescription className="text-xs">Last 14 readings</CardDescription>
            </CardHeader>
            <CardContent className="px-2 pb-3"><GlucoseChart data={dash.glucoseSeries} zones /></CardContent>
          </Card>
        </div>

        {/* Weight + Energy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Weight Progress</CardTitle></CardHeader>
            <CardContent className="px-2 pb-3"><WeightChart data={dash.weightSeries} target={dash.patient.targetWeight} /></CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Energy (last 7 check-ins)</CardTitle></CardHeader>
            <CardContent className="px-2 pb-3"><EnergyChart data={dash.energySeries} /></CardContent>
          </Card>
        </div>

        {/* Insights + Next review */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2"><InsightsCard insights={dash.insights} hasEnoughData={dash.hasEnoughData} careAssigned={careAssigned} /></div>
          <NextReviewCard appt={dash.nextAppointment} careAssigned={careAssigned} />
        </div>

        {/* Care plan + Messages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CarePlanCard plan={dash.carePlan} careAssigned={careAssigned} />
          <MessagesCard messages={dash.messages ?? []} careAssigned={careAssigned} />
        </div>

        {/* Upgrade banner */}
        {plan === "basic" && (
          <div className="bg-gradient-to-r from-primary/8 to-blue-50/40 border border-primary/20 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-semibold text-foreground text-sm">Unlock Nutrition & Fitness Coaching</p>
              <p className="text-xs text-muted-foreground mt-0.5">Upgrade to Comprehensive for personalised meal plans and movement guidance.</p>
            </div>
            <Button asChild size="sm" className="rounded-full shrink-0 text-xs"><a href="/#pricing">Upgrade Plan →</a></Button>
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
