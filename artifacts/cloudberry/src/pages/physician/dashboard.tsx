import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Search, LogOut, ChevronRight, Activity, TrendingDown,
  FileText, CheckCircle2, HeartPulse, Stethoscope, X, Clock,
  Target, User, RefreshCw, Save, CalendarDays, Scale, Flame,
  Salad, Footprints, Dumbbell, MinusCircle, XCircle, Droplets,
  Star,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea,
} from "recharts";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

async function apiFetch(path: string) {
  const token = localStorage.getItem("cloudberry_token") || "";
  const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function apiPost(path: string, body: any) {
  const token = localStorage.getItem("cloudberry_token") || "";
  const r = await fetch(`${API}${path}`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function apiPatch(path: string, body?: any) {
  const token = localStorage.getItem("cloudberry_token") || "";
  const r = await fetch(`${API}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

const PLAN_COLORS: Record<string, string> = {
  premium: "bg-amber-50 text-amber-700 border-amber-200",
  comprehensive: "bg-sky-50 text-sky-700 border-sky-200",
  basic: "bg-slate-50 text-slate-600 border-slate-200",
};
const RISK_COLORS: Record<string, string> = {
  high: "bg-rose-50 text-rose-700 border-rose-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

type NavTab = "patients" | "profile";
type DetailTab = "dashboard" | "profile" | "checkins";

function formatGoal(g: string) {
  return g?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) ?? "—";
}

function relativeDays(iso: string | null) {
  if (!iso) return "Never";
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff}d ago`;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function adherenceLabel(pct: number | null) {
  if (pct === null || pct === undefined) return "—";
  if (pct >= 80) return "Strong";
  if (pct >= 60) return "Moderate";
  return "Needs Work";
}
function adherenceLabelCls(pct: number | null) {
  if (!pct) return "bg-slate-50 text-slate-600 border-slate-200";
  if (pct >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (pct >= 60) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
}
function energyColor(v: number) {
  if (v >= 3) return "#22c55e";
  if (v >= 2) return "#f59e0b";
  return "#ef4444";
}

/* ── Full Patient Dashboard (physician view) ─────────────── */
function PhysicianPatientDashboard({ patient, dashData }: { patient: any; dashData: any }) {
  const d = dashData;
  const adherence7Day: any[] = d.adherence7Day || [];
  const adherencePct: number | null = d.adherencePct ?? null;
  const weightSeries: any[] = d.weightSeries || [];
  const glucoseSeries: any[] = d.glucoseSeries || [];
  const energySeries: any[] = d.energySeries || [];
  const consistencyBreakdown = d.consistencyBreakdown || {};
  const insights: any[] = d.insights || [];
  const weightChange: number | null = d.weightChange ?? null;
  const avgGlucose: number | null = d.avgGlucose ?? null;
  const streak: number = d.streak ?? 0;
  const completedCount = adherence7Day.filter((day: any) => day.completed === true).length;
  const checkinCount = adherence7Day.filter((day: any) => day.completed !== null).length;
  const sleepCount = Math.round(((consistencyBreakdown.sleep ?? 0) / 100) * 7);
  const mealCount = Math.round(((consistencyBreakdown.mealLogging ?? 0) / 100) * 7);
  const activityCount = Math.round(((consistencyBreakdown.activity ?? 0) / 100) * 7);
  const lost = weightChange !== null && weightChange < 0;

  return (
    <div className="space-y-5">
      {/* Header stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Plan", value: patient.plan ? patient.plan.charAt(0).toUpperCase() + patient.plan.slice(1) : "—" },
          { label: "Week", value: `Week ${patient.weekNumber ?? "—"}` },
          { label: "Adherence", value: `${adherencePct ?? "—"}%` },
          { label: "Check-ins", value: `${checkinCount}/7` },
        ].map(s => (
          <div key={s.label} className="bg-muted/40 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{s.label}</p>
            <p className="font-bold text-foreground text-sm">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Streak */}
      {streak > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <Star className="w-4 h-4 text-amber-500" />
          <p className="text-xs font-semibold text-amber-800">{streak}-day streak — consistency is building!</p>
        </div>
      )}

      {/* 7-day adherence grid */}
      <Card className="border-border/40 rounded-xl">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><CalendarDays className="w-4 h-4 text-primary" />Weekly Adherence</CardTitle>
            {adherencePct !== null && <span className="text-sm font-bold text-primary">{adherencePct}% this week</span>}
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex justify-between gap-1 mb-2">
            {adherence7Day.map((day: any, i: number) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${day.completed === true ? "bg-emerald-50 border-emerald-400" : day.completed === false ? "bg-rose-50 border-rose-300" : "bg-slate-100 border-slate-200"}`}>
                  {day.completed === true ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : day.completed === false ? <XCircle className="w-3.5 h-3.5 text-rose-400" /> : <MinusCircle className="w-3.5 h-3.5 text-slate-400" />}
                </div>
                <span className="text-[10px] text-muted-foreground">{day.dow}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" />Met goals</span>
            <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-rose-400" />Not met</span>
            <span className="flex items-center gap-1"><MinusCircle className="w-3 h-3 text-slate-400" />No data</span>
          </div>
        </CardContent>
      </Card>

      {/* Behavioral Consistency */}
      <Card className="border-border/40 rounded-xl">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" />Behavioral Consistency</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {[
            { label: "Sleep Quality", count: sleepCount, color: "bg-indigo-500" },
            { label: "Nutrition", count: mealCount, color: "bg-emerald-500" },
            { label: "Activity", count: activityCount, color: "bg-violet-500" },
          ].map(b => (
            <div key={b.label}>
              <div className="flex justify-between text-xs mb-1"><span className="text-foreground/80">{b.label}</span><span className="font-semibold text-foreground">{b.count}/7</span></div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${b.color}`} style={{ width: `${(b.count / 7) * 100}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Weight trend */}
      {weightSeries.length > 1 && (
        <Card className="border-border/40 rounded-xl">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><Scale className="w-4 h-4 text-sky-600" />Weight Trend</CardTitle>
              {weightChange !== null && (
                <div className="flex items-center gap-1">
                  {lost ? <TrendingDown className="w-3.5 h-3.5 text-emerald-600" /> : <Activity className="w-3.5 h-3.5 text-rose-500" />}
                  <span className={`text-sm font-bold ${lost ? "text-emerald-600" : "text-rose-500"}`}>{lost ? "" : "+"}{weightChange} kg</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={weightSeries}>
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={fmt} />
                <YAxis tick={{ fontSize: 9 }} domain={["auto", "auto"]} width={32} />
                <Tooltip formatter={(v: number) => [`${v} kg`, "Weight"]} labelFormatter={fmt} />
                <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex justify-between text-xs text-muted-foreground mt-2 pt-2 border-t border-border/40">
              {patient.startingWeight && <span>Start: <strong className="text-foreground">{patient.startingWeight} kg</strong></span>}
              {patient.currentWeight && <span>Current: <strong className="text-foreground">{patient.currentWeight} kg</strong></span>}
              {patient.targetWeight && <span>Goal: <strong className="text-foreground">{patient.targetWeight} kg</strong></span>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Energy trend */}
      {energySeries.length > 0 && (
        <Card className="border-border/40 rounded-xl">
          <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm flex items-center gap-2"><Flame className="w-4 h-4 text-amber-500" />Energy & Wellbeing</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4">
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={energySeries} barCategoryGap="30%">
                <XAxis dataKey="date" tick={{ fontSize: 8 }} tickFormatter={fmt} />
                <YAxis tick={false} domain={[0, 3]} hide />
                <Tooltip formatter={(v: number) => [v === 3 ? "High" : v === 2 ? "Moderate" : "Low", "Energy"]} labelFormatter={fmt} />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {energySeries.map((e: any, i: number) => <Cell key={i} fill={energyColor(e.value)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Glucose trend */}
      {glucoseSeries.length > 1 && (
        <Card className="border-border/40 rounded-xl">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Droplets className="w-4 h-4 text-rose-500" />Fasting Glucose Trend
              {avgGlucose && <span className="text-xs font-normal text-muted-foreground ml-1">avg {avgGlucose} mg/dL</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={glucoseSeries}>
                <ReferenceArea y1={80} y2={120} fill="#d1fae5" fillOpacity={0.4} />
                <ReferenceArea y1={120} y2={140} fill="#fef3c7" fillOpacity={0.4} />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={fmt} />
                <YAxis tick={{ fontSize: 9 }} domain={[60, 180]} width={30} />
                <Tooltip formatter={(v: number) => [`${Number(v).toFixed(0)} mg/dL`, "Glucose"]} labelFormatter={fmt} />
                <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <Card className="border-border/40 rounded-xl">
          <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm flex items-center gap-2"><HeartPulse className="w-4 h-4 text-primary" />Weekly Insights</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {insights.map((ins: any, i: number) => (
              <div key={i} className={`rounded-xl border p-3 text-xs ${ins.kind === "positive" ? "bg-emerald-50 border-emerald-200" : ins.kind === "challenge" ? "bg-rose-50 border-rose-200" : "bg-blue-50 border-blue-200"}`}>
                <p className="font-semibold text-foreground mb-0.5">{ins.title}</p>
                <p className="text-muted-foreground leading-relaxed">{ins.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Care plan */}
      {d.carePlan && (
        <Card className="border-border/40 rounded-xl">
          <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">Care Plan</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4 space-y-3 text-xs text-muted-foreground">
            <div><p className="font-semibold text-foreground text-xs mb-1">Nutrition Plan</p><p>{d.carePlan.nutritionPlan}</p></div>
            <div><p className="font-semibold text-foreground text-xs mb-1">Activity Plan</p><p>{d.carePlan.activityPlan}</p></div>
            <div><p className="font-semibold text-foreground text-xs mb-1">Weekly Goals</p><p>{d.carePlan.weeklyGoals}</p></div>
          </CardContent>
        </Card>
      )}

      {/* Next appointment + care team */}
      {(d.nextAppointment || d.careTeam) && (
        <Card className="border-border/40 rounded-xl">
          <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm flex items-center gap-2"><CalendarDays className="w-4 h-4 text-primary" />Next Review</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {d.nextAppointment ? (
              <div className="bg-primary/5 rounded-xl p-3">
                <p className="text-sm font-semibold text-foreground">
                  {new Date(d.nextAppointment.scheduledAt).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(d.nextAppointment.scheduledAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                  {d.nextAppointment.careTeamMember && ` · with ${d.nextAppointment.careTeamMember}`}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No upcoming review scheduled.</p>
            )}
            {d.careTeam && (d.careTeam.physician || d.careTeam.dietician || d.careTeam.caretaker) && (
              <div className="pt-2 border-t border-border/40">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Care Team</p>
                <div className="space-y-1.5">
                  {d.careTeam.physician && <div className="flex items-center gap-2 text-xs"><Stethoscope className="w-3 h-3 text-sky-600" /><span className="text-foreground">{d.careTeam.physician.name}</span><span className="text-muted-foreground">Physician</span></div>}
                  {d.careTeam.dietician && <div className="flex items-center gap-2 text-xs"><Salad className="w-3 h-3 text-emerald-600" /><span className="text-foreground">{d.careTeam.dietician.name}</span><span className="text-muted-foreground">Dietician</span></div>}
                  {d.careTeam.caretaker && <div className="flex items-center gap-2 text-xs"><User className="w-3 h-3 text-violet-600" /><span className="text-foreground">{d.careTeam.caretaker.name}</span><span className="text-muted-foreground">Care Coordinator</span></div>}
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground pt-2 border-t border-border/40">
              Responded to <strong className="text-foreground">{checkinCount} of 7</strong> check-ins this week
              {d.totalCheckins > 0 && <span> · {d.totalCheckins} total</span>}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ═══════════════ MAIN COMPONENT ═════════════════════════════ */
export default function PhysicianDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [nav, setNav] = useState<NavTab>("patients");
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("dashboard");
  const [noteText, setNoteText] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [opsBackup] = useState(() => localStorage.getItem("cloudberry_ops_backup"));

  const [editName, setEditName] = useState("");
  const [editSpecialty, setEditSpecialty] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [profileEditing, setProfileEditing] = useState(false);

  const storedName = localStorage.getItem("cloudberry_name") || "Physician";
  const storedSpecialty = localStorage.getItem("cloudberry_specialty") || "";

  useEffect(() => {
    const token = localStorage.getItem("cloudberry_token");
    const role = localStorage.getItem("cloudberry_role");
    if (!token || (role !== "physician" && !opsBackup)) { setLocation("/physician/signin"); }
  }, []);

  const handleReturnToOps = () => {
    if (!opsBackup) return;
    try {
      const { token, role, name: n } = JSON.parse(opsBackup);
      localStorage.setItem("cloudberry_token", token);
      localStorage.setItem("cloudberry_role", role ?? "ops");
      if (n) localStorage.setItem("cloudberry_name", n);
      localStorage.removeItem("cloudberry_ops_backup");
      setLocation("/ops/dashboard");
    } catch { setLocation("/ops/dashboard"); }
  };

  const { data: patients = [], isLoading } = useQuery<any[]>({
    queryKey: ["physician-patients"],
    queryFn: () => apiFetch("/physician/patients"),
  });

  const { data: physicianMe } = useQuery({
    queryKey: ["physician-me"],
    queryFn: () => apiFetch("/physician/me"),
    enabled: nav === "profile",
  });

  useEffect(() => {
    if (physicianMe) {
      setEditName(physicianMe.fullName || storedName);
      setEditSpecialty(physicianMe.specialty || storedSpecialty);
      setEditPhone(physicianMe.phone || "");
    }
  }, [physicianMe]);

  const { data: patientDash, isLoading: dashLoading } = useQuery({
    queryKey: ["physician-patient-dashboard", selectedPatient?.id],
    queryFn: () => apiFetch(`/physician/patients/${selectedPatient.id}/dashboard`),
    enabled: !!selectedPatient && detailTab === "dashboard",
    staleTime: 60000,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["physician-patient-detail", selectedPatient?.id],
    queryFn: () => apiFetch(`/physician/patients/${selectedPatient.id}`),
    enabled: !!selectedPatient && detailTab !== "dashboard",
  });

  const noteMut = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) => apiPost(`/physician/patients/${id}/notes`, { content, category: "physician" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["physician-patient-detail", selectedPatient?.id] });
      setNoteText(""); toast({ title: "Note saved successfully" });
    },
  });

  const profileMut = useMutation({
    mutationFn: (body: any) => apiPatch("/physician/me", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["physician-me"] });
      if (editName) localStorage.setItem("cloudberry_name", editName);
      if (editSpecialty !== undefined) localStorage.setItem("cloudberry_specialty", editSpecialty);
      setProfileEditing(false);
      toast({ title: "Profile updated successfully" });
    },
    onError: () => toast({ title: "Failed to update profile", variant: "destructive" }),
  });

  const handleLogout = () => {
    ["cloudberry_token", "cloudberry_name", "cloudberry_role", "cloudberry_specialty"].forEach(k => localStorage.removeItem(k));
    setLocation("/physician/signin");
  };

  const filtered = (patients as any[]).filter(p =>
    (riskFilter === "all" || p.riskLevel === riskFilter) &&
    (!search || p.fullName?.toLowerCase().includes(search.toLowerCase()) || p.city?.toLowerCase().includes(search.toLowerCase()))
  );

  const navItems: { key: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "patients", label: "My Patients", icon: <Users className="w-4 h-4" />, badge: (patients as any[]).length },
    { key: "profile", label: "My Profile", icon: <User className="w-4 h-4" /> },
  ];

  return (
    <>
    {opsBackup && (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-violet-700 text-white text-xs px-4 py-2 flex items-center justify-between shadow-lg">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-300 animate-pulse" />
          Viewing <strong>Physician Portal</strong> from Operations — read-only preview mode
        </span>
        <button onClick={handleReturnToOps} className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full font-semibold text-xs transition-colors flex items-center gap-1.5">
          ← Return to Ops
        </button>
      </div>
    )}
    <div className={`min-h-screen bg-slate-50 flex${opsBackup ? " pt-9" : ""}`}>
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-60" : "w-16"} transition-all bg-white border-r border-border/60 flex flex-col shrink-0 shadow-sm`}>
        <div className="p-4 border-b border-border/60 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Stethoscope className="w-4 h-4 text-primary" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{storedName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{storedSpecialty || "Physician"}</p>
            </div>
          )}
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <button key={item.key} onClick={() => setNav(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${nav === item.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-slate-50"}`}>
              {item.icon}
              {sidebarOpen && <span className="flex-1 text-left">{item.label}</span>}
              {sidebarOpen && item.badge !== undefined && item.badge > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-border/60">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-50 text-sm transition-colors">
            <LogOut className="w-4 h-4 shrink-0" />
            {sidebarOpen && "Sign Out"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-border/60 px-6 py-4 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(v => !v)} className="text-muted-foreground hover:text-foreground">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div>
            <h1 className="font-bold text-foreground text-lg leading-tight">Physician Portal</h1>
            <p className="text-xs text-muted-foreground">Dr. {storedName} · {storedSpecialty}</p>
          </div>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground bg-slate-100 px-3 py-1.5 rounded-full">
            {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">

          {/* ── PATIENTS TAB ─────────────────────────────────────────── */}
          {nav === "patients" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">My Patients</h2>
                  <p className="text-sm text-muted-foreground">{(patients as any[]).length} patient{(patients as any[]).length !== 1 ? "s" : ""} assigned to you</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients…" className="pl-9 w-56 h-9 text-sm rounded-full" />
                  </div>
                  <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)}
                    className="h-9 rounded-full border border-border/60 px-3 text-sm bg-white text-foreground">
                    <option value="all">All Risk Levels</option>
                    <option value="low">Low Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="high">High Risk</option>
                  </select>
                </div>
              </div>

              {isLoading ? (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {[1,2,3].map(i => <div key={i} className="h-44 bg-white rounded-2xl animate-pulse" />)}
                </div>
              ) : filtered.length === 0 ? (
                <Card className="text-center py-16">
                  <CardContent><Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No patients found.</p></CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {filtered.map(p => (
                    <Card key={p.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border-border/50 cursor-pointer" onClick={() => { setSelectedPatient(p); setDetailTab("dashboard"); }}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-foreground text-base">{p.fullName}</p>
                            <p className="text-xs text-muted-foreground">{p.city} · Week {p.weekNumber}</p>
                          </div>
                          <Badge className={`${RISK_COLORS[p.riskLevel]} border text-xs capitalize`}>{p.riskLevel}</Badge>
                        </div>
                        <div className="flex gap-2 mb-4 flex-wrap">
                          <Badge className={`${PLAN_COLORS[p.plan]} border text-xs capitalize`}>{p.plan}</Badge>
                          <span className="text-xs text-muted-foreground bg-slate-50 border border-border/40 rounded-full px-2 py-0.5">{formatGoal(p.primaryGoal)}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Adherence</p>
                            <p className="font-bold text-foreground">{p.adherencePct ?? "—"}%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Check-ins</p>
                            <p className="font-bold text-foreground">{p.streak}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Last seen</p>
                            <p className="font-bold text-foreground text-xs">{relativeDays(p.lastCheckinAt)}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="w-full h-8 text-xs rounded-full"
                          onClick={e => { e.stopPropagation(); setSelectedPatient(p); setDetailTab("dashboard"); }}>
                          <ChevronRight className="w-3 h-3 mr-1" />View Patient
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── MY PROFILE TAB ────────────────────────────────── */}
          {nav === "profile" && (
            <div className="max-w-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">My Profile</h2>
                <p className="text-sm text-muted-foreground">Your details as seen by patients and the Cloudberry team</p>
              </div>
              <Card className="rounded-2xl border-border/50 shadow-sm bg-white">
                <CardHeader className="flex-row items-center justify-between px-6 pt-5 pb-3">
                  <CardTitle className="text-base">Profile Details</CardTitle>
                  <Button size="sm" variant="outline" className="rounded-full text-xs gap-1.5 h-8"
                    onClick={() => setProfileEditing(v => !v)}>
                    {profileEditing ? <><X className="w-3 h-3" /> Cancel</> : <><RefreshCw className="w-3 h-3" /> Edit</>}
                  </Button>
                </CardHeader>
                <CardContent className="px-6 pb-6 space-y-4">
                  <div className="flex items-center gap-4 pb-4 border-b border-border/40">
                    <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center shrink-0">
                      <Stethoscope className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-lg">{editName || storedName}</p>
                      <p className="text-sm text-muted-foreground">{editSpecialty || storedSpecialty || "Physician"}</p>
                    </div>
                  </div>
                  {profileEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Full Name</label>
                        <Input value={editName} onChange={e => setEditName(e.target.value)} className="rounded-xl" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Specialty</label>
                        <Input value={editSpecialty} onChange={e => setEditSpecialty(e.target.value)} placeholder="e.g. Endocrinology" className="rounded-xl" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Phone</label>
                        <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="Contact number" className="rounded-xl" />
                      </div>
                      <Button className="rounded-full gap-2 w-full" disabled={profileMut.isPending}
                        onClick={() => profileMut.mutate({ fullName: editName, specialty: editSpecialty, phone: editPhone })}>
                        <Save className="w-4 h-4" />{profileMut.isPending ? "Saving…" : "Save Changes"}
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "Full Name", value: physicianMe?.fullName || storedName },
                        { label: "Specialty", value: physicianMe?.specialty || storedSpecialty || "—" },
                        { label: "Email", value: physicianMe?.email || "—" },
                        { label: "Phone", value: physicianMe?.phone || "—" },
                        { label: "Patients Assigned", value: (patients as any[]).length.toString() },
                      ].map(item => (
                        <div key={item.label} className="bg-slate-50 rounded-xl p-3 border border-border/40">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{item.label}</p>
                          <p className="text-sm font-semibold text-foreground">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* ── PATIENT DETAIL SLIDE-OUT PANEL ──────────────────────── */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedPatient(null)} />
          <div className="relative w-full max-w-2xl bg-white shadow-2xl flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-6 flex items-start justify-between shrink-0">
              <div>
                <p className="text-lg font-bold">{selectedPatient.fullName}</p>
                <p className="text-white/70 text-sm">{selectedPatient.city} · {formatGoal(selectedPatient.primaryGoal)}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Badge className={`${PLAN_COLORS[selectedPatient.plan]} border text-xs capitalize`}>{selectedPatient.plan}</Badge>
                  <Badge className={`${RISK_COLORS[selectedPatient.riskLevel]} border text-xs capitalize`}>{selectedPatient.riskLevel} risk</Badge>
                </div>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="text-white/70 hover:text-white ml-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-0 border-b border-border/40 bg-white px-4 shrink-0">
              {(["dashboard", "profile", "checkins"] as DetailTab[]).map(t => (
                <button key={t} onClick={() => setDetailTab(t)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${detailTab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                  {t === "checkins" ? "Check-ins" : t}
                </button>
              ))}
            </div>

            <div className="flex-1 p-5 overflow-y-auto">
              {/* Dashboard tab — full patient dashboard view */}
              {detailTab === "dashboard" && (
                <>
                  {(dashLoading) && (
                    <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
                  )}
                  {patientDash && !dashLoading && (
                    <PhysicianPatientDashboard patient={selectedPatient} dashData={patientDash} />
                  )}
                  {!patientDash && !dashLoading && (
                    <p className="text-sm text-muted-foreground text-center py-10">Dashboard data unavailable.</p>
                  )}
                </>
              )}

              {/* Profile tab */}
              {detailTab === "profile" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Full Name", value: selectedPatient.fullName },
                      { label: "Phone", value: selectedPatient.phone || "—" },
                      { label: "Email", value: selectedPatient.email || "—" },
                      { label: "City", value: selectedPatient.city || "—" },
                      { label: "Plan", value: selectedPatient.plan?.charAt(0).toUpperCase() + selectedPatient.plan?.slice(1) },
                      { label: "Week", value: `Week ${selectedPatient.weekNumber}` },
                      { label: "Goal", value: formatGoal(selectedPatient.primaryGoal) },
                      { label: "Risk Level", value: selectedPatient.riskLevel?.charAt(0).toUpperCase() + selectedPatient.riskLevel?.slice(1) },
                      { label: "Starting Weight", value: selectedPatient.startingWeight ? `${selectedPatient.startingWeight} kg` : "—" },
                      { label: "Current Weight", value: selectedPatient.currentWeight ? `${selectedPatient.currentWeight} kg` : "—" },
                      { label: "Target Weight", value: selectedPatient.targetWeight ? `${selectedPatient.targetWeight} kg` : "—" },
                      { label: "Adherence", value: `${selectedPatient.adherencePct ?? "—"}%` },
                    ].map(item => (
                      <div key={item.label} className="bg-slate-50 rounded-xl p-3 border border-border/40">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{item.label}</p>
                        <p className="text-sm font-semibold text-foreground">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Check-ins tab */}
              {detailTab === "checkins" && (
                <div className="space-y-3">
                  {detailLoading ? (
                    <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
                  ) : (!detail?.checkins || detail.checkins.length === 0) ? (
                    <p className="text-muted-foreground text-sm text-center py-8">No check-ins recorded yet.</p>
                  ) : detail.checkins.map((c: any) => (
                    <Card key={c.id} className="border-border/40 rounded-xl">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold">{new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                          <div className="flex gap-1.5 flex-wrap">
                            <Badge className={`text-[10px] border ${c.mealsFollowed === "yes" || c.mealsFollowed === "mostly" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                              Meals: {c.mealsFollowed}
                            </Badge>
                            <Badge className={`text-[10px] border ${c.activityCompleted ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                              {c.activityCompleted ? "Active" : "No Activity"}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div><span className="text-muted-foreground">Energy:</span> <span className="font-medium capitalize">{c.energyLevel}</span></div>
                          <div><span className="text-muted-foreground">Mood:</span> <span className="font-medium capitalize">{c.mood}</span></div>
                          {c.glucoseReading && <div><span className="text-muted-foreground">Glucose:</span> <span className="font-medium">{Number(c.glucoseReading).toFixed(0)} mg/dL</span></div>}
                        </div>
                        {c.notes && <p className="text-xs text-muted-foreground mt-2 italic">"{c.notes}"</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
