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
  Target, User, ShieldAlert, ShieldCheck, RefreshCw, Save,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

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
type DetailTab = "dashboard" | "profile" | "checkins" | "notes";

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

/* ── Patient Dashboard (read-only) ─────────────────────────── */
function PatientDashboardView({ patient, detail }: { patient: any; detail: any }) {
  const weightData = detail?.metrics?.filter((m: any) => m.type === "weight").slice(0, 8).reverse() ?? [];
  const glucoseData = detail?.metrics?.filter((m: any) => m.type === "fasting_glucose").slice(0, 10).reverse() ?? [];
  const checkins = detail?.checkins ?? [];
  const recentCheckins = checkins.slice(0, 5);
  const adherencePct = checkins.length
    ? Math.round((checkins.filter((c: any) => c.mealsFollowed === "yes" || c.mealsFollowed === "mostly" || c.mealsFollowed === "all_meals" || c.mealsFollowed === "most_meals").length / checkins.length) * 100)
    : null;

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Plan", value: patient.plan?.charAt(0).toUpperCase() + patient.plan?.slice(1), icon: <Target className="w-4 h-4 text-primary" /> },
          { label: "Week", value: `Week ${patient.weekNumber ?? "—"}`, icon: <Clock className="w-4 h-4 text-amber-500" /> },
          { label: "Adherence", value: adherencePct !== null ? `${adherencePct}%` : `${patient.adherencePct ?? "—"}%`, icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
        ].map(s => (
          <div key={s.label} className="bg-slate-50 border border-border/40 rounded-xl p-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">{s.icon}<p className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</p></div>
            <p className="font-bold text-foreground text-base">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Weight chart */}
      <Card className="border-border/40 rounded-xl">
        <CardHeader className="pb-2 pt-4 px-4 flex-row items-center gap-2">
          <TrendingDown className="w-4 h-4 text-sky-500" />
          <CardTitle className="text-sm">Weight Trend (kg)</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {weightData.length > 0 ? (
            <ResponsiveContainer width="100%" height={130}>
              <LineChart data={weightData}>
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip formatter={(v: number) => [`${v} kg`, "Weight"]} />
                <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-muted-foreground text-center py-6">No weight data recorded yet.</p>}
        </CardContent>
      </Card>

      {/* Glucose chart — show only if premium or data exists */}
      {(patient.plan === "premium" || glucoseData.length > 0) && (
        <Card className="border-border/40 rounded-xl">
          <CardHeader className="pb-2 pt-4 px-4 flex-row items-center gap-2">
            <Activity className="w-4 h-4 text-rose-500" />
            <CardTitle className="text-sm">Fasting Glucose (mg/dL)</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {glucoseData.length > 0 ? (
              <ResponsiveContainer width="100%" height={110}>
                <BarChart data={glucoseData}>
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} />
                  <YAxis tick={{ fontSize: 9 }} domain={[60, 200]} />
                  <Tooltip formatter={(v: number) => [`${v} mg/dL`, "Glucose"]} />
                  <Bar dataKey="value" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-xs text-muted-foreground text-center py-6">No glucose data recorded yet.</p>}
          </CardContent>
        </Card>
      )}

      {/* Recent check-ins summary */}
      <Card className="border-border/40 rounded-xl">
        <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">Recent Check-ins</CardTitle></CardHeader>
        <CardContent className="px-4 pb-4">
          {recentCheckins.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No check-ins yet.</p>
          ) : (
            <div className="space-y-2">
              {recentCheckins.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <p className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                  <div className="flex gap-1.5">
                    <Badge className={`text-[10px] border ${c.mealsFollowed === "yes" || c.mealsFollowed === "mostly" || c.mealsFollowed === "all_meals" || c.mealsFollowed === "most_meals" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                      Meals: {c.mealsFollowed?.replace(/_/g, " ")}
                    </Badge>
                    <Badge className={`text-[10px] border ${c.activityCompleted ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                      {c.activityCompleted ? "Active" : "No Activity"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Care plan */}
      {detail?.plan && (
        <Card className="border-border/40 rounded-xl">
          <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">Care Plan</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4 space-y-3 text-xs text-muted-foreground">
            <div><p className="font-semibold text-foreground text-xs mb-1">Nutrition Plan</p><p>{detail.plan.nutritionPlan}</p></div>
            <div><p className="font-semibold text-foreground text-xs mb-1">Activity Plan</p><p>{detail.plan.activityPlan}</p></div>
            <div><p className="font-semibold text-foreground text-xs mb-1">Weekly Goals</p><p>{detail.plan.weeklyGoals}</p></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

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

  // My Profile edit state
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

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["physician-patient-detail", selectedPatient?.id],
    queryFn: () => apiFetch(`/physician/patients/${selectedPatient.id}`),
    enabled: !!selectedPatient,
  });

  const escalateMut = useMutation({
    mutationFn: (id: number) => apiPatch(`/physician/patients/${id}/escalate`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["physician-patients"] }); toast({ title: "Patient escalated to High Risk", variant: "destructive" }); },
  });

  const deescalateMut = useMutation({
    mutationFn: (id: number) => apiPatch(`/physician/patients/${id}/deescalate`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["physician-patients"] }); toast({ title: "Patient de-escalated to Low Risk" }); },
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

  const highRisk = (patients as any[]).filter(p => p.riskLevel === "high");

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
      {/* Sidebar — Light theme */}
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
          {/* High risk alert inline */}
          {sidebarOpen && highRisk.length > 0 && (
            <div className="mt-3 px-3 py-2.5 rounded-lg bg-rose-50 border border-rose-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="text-xs font-semibold text-rose-700">{highRisk.length} High Risk</span>
              </div>
              <p className="text-[10px] text-rose-500 mt-0.5">Patients needing attention</p>
            </div>
          )}
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

              {/* High risk banner */}
              {highRisk.length > 0 && (
                <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                  <p className="text-sm text-rose-700 font-medium">{highRisk.length} patient{highRisk.length !== 1 ? "s" : ""} flagged as high risk — review their profiles.</p>
                  <Button size="sm" variant="outline" className="ml-auto text-xs rounded-full text-rose-600 border-rose-200 hover:bg-rose-50"
                    onClick={() => setRiskFilter("high")}>View</Button>
                </div>
              )}

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

          {/* ── MY PROFILE TAB ────────────────────────────────────── */}
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
                        { label: "High Risk Patients", value: highRisk.length.toString() },
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
              <div className="flex items-center gap-2">
                {selectedPatient.riskLevel !== "high" ? (
                  <Button size="sm" variant="outline" className="text-xs rounded-full bg-white/10 border-white/30 text-white hover:bg-white/20 gap-1"
                    onClick={() => escalateMut.mutate(selectedPatient.id)}>
                    <ShieldAlert className="w-3 h-3" />Escalate
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="text-xs rounded-full bg-white/10 border-white/30 text-white hover:bg-white/20 gap-1"
                    onClick={() => deescalateMut.mutate(selectedPatient.id)}>
                    <ShieldCheck className="w-3 h-3" />De-escalate
                  </Button>
                )}
                <button onClick={() => setSelectedPatient(null)} className="text-white/70 hover:text-white ml-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-0 border-b border-border/40 bg-white px-4 shrink-0">
              {(["dashboard", "profile", "checkins", "notes"] as DetailTab[]).map(t => (
                <button key={t} onClick={() => setDetailTab(t)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${detailTab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                  {t === "checkins" ? "Check-ins" : t}
                </button>
              ))}
            </div>

            <div className="flex-1 p-5 overflow-y-auto">
              {detailLoading ? (
                <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
              ) : (
                <>
                  {/* Dashboard tab */}
                  {detailTab === "dashboard" && (
                    <PatientDashboardView patient={selectedPatient} detail={detail} />
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
                      {(!detail?.checkins || detail.checkins.length === 0) ? (
                        <p className="text-muted-foreground text-sm text-center py-8">No check-ins recorded yet.</p>
                      ) : detail.checkins.map((c: any) => (
                        <Card key={c.id} className="border-border/40 rounded-xl">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-semibold">{new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                              <div className="flex gap-1.5 flex-wrap">
                                <Badge className={`text-[10px] border ${c.mealsFollowed === "yes" || c.mealsFollowed === "mostly" || c.mealsFollowed === "all_meals" || c.mealsFollowed === "most_meals" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                                  Meals: {c.mealsFollowed?.replace(/_/g, " ")}
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

                  {/* Notes tab */}
                  {detailTab === "notes" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Add Clinical Note</label>
                        <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                          placeholder="Enter your clinical notes, observations, or instructions…"
                          className="w-full rounded-xl border border-border/60 p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        <Button size="sm" className="rounded-full gap-2" disabled={!noteText.trim() || noteMut.isPending}
                          onClick={() => noteMut.mutate({ id: selectedPatient.id, content: noteText })}>
                          <FileText className="w-3 h-3" />
                          {noteMut.isPending ? "Saving…" : "Save Note"}
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Previous Notes</p>
                        {(!detail?.notes || detail.notes.length === 0) ? (
                          <p className="text-xs text-muted-foreground italic">No clinical notes yet.</p>
                        ) : detail.notes.map((n: any) => (
                          <Card key={n.id} className="border-border/40 rounded-xl">
                            <CardContent className="p-3">
                              <p className="text-xs text-muted-foreground mb-1">{new Date(n.createdAt).toLocaleString("en-IN")}</p>
                              <p className="text-sm">{n.content}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
