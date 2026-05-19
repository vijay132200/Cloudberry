import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Users, AlertTriangle, Calendar, MessageSquare, Search, LogOut,
  ChevronRight, Phone, Activity, TrendingDown, FileText, CheckCircle2,
  HeartPulse, Stethoscope, X, Star, Clock, Target, Dumbbell, Salad,
  ShieldAlert, ShieldCheck, Send, Video, RefreshCw
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

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

async function apiPatch(path: string) {
  const token = localStorage.getItem("cloudberry_token") || "";
  const r = await fetch(`${API}${path}`, {
    method: "PATCH", headers: { Authorization: `Bearer ${token}` },
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

type NavTab = "patients" | "messages" | "schedule" | "escalations";

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

export default function PhysicianDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [nav, setNav] = useState<NavTab>("patients");
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [detailTab, setDetailTab] = useState<"profile" | "checkins" | "health" | "notes">("profile");
  const [noteText, setNoteText] = useState("");
  const [messageText, setMessageText] = useState("");
  const [scheduleText, setScheduleText] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const name = localStorage.getItem("cloudberry_name") || "Physician";
  const specialty = localStorage.getItem("cloudberry_specialty") || "";

  useEffect(() => {
    const token = localStorage.getItem("cloudberry_token");
    const role = localStorage.getItem("cloudberry_role");
    if (!token || role !== "physician") { setLocation("/physician/signin"); }
  }, []);

  const { data: patients = [], isLoading } = useQuery<any[]>({
    queryKey: ["physician-patients"],
    queryFn: () => apiFetch("/physician/patients"),
  });

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

  const handleLogout = () => {
    ["cloudberry_token", "cloudberry_name", "cloudberry_role", "cloudberry_specialty"].forEach(k => localStorage.removeItem(k));
    setLocation("/physician/signin");
  };

  const filtered = (patients as any[]).filter(p =>
    (riskFilter === "all" || p.riskLevel === riskFilter) &&
    (!search || p.fullName?.toLowerCase().includes(search.toLowerCase()) || p.city?.toLowerCase().includes(search.toLowerCase()))
  );

  const highRisk = (patients as any[]).filter(p => p.riskLevel === "high");

  // Build chart data from patient detail
  const weightData = detail?.metrics?.filter((m: any) => m.type === "weight").slice(0, 6).reverse() ?? [];
  const glucoseData = detail?.metrics?.filter((m: any) => m.type === "fasting_glucose").slice(0, 7).reverse() ?? [];

  const navItems: { key: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "patients", label: "My Patients", icon: <Users className="w-4 h-4" />, badge: patients.length },
    { key: "escalations", label: "Escalations", icon: <AlertTriangle className="w-4 h-4" />, badge: highRisk.length },
    { key: "messages", label: "Messages", icon: <MessageSquare className="w-4 h-4" /> },
    { key: "schedule", label: "Schedule Call", icon: <Calendar className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-60" : "w-16"} transition-all bg-sky-950 text-white flex flex-col shrink-0`}>
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-400/20 border border-sky-400/30 flex items-center justify-center shrink-0">
            <Stethoscope className="w-4 h-4 text-sky-300" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{name}</p>
              <p className="text-[10px] text-sky-300 truncate">{specialty || "Physician"}</p>
            </div>
          )}
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <button key={item.key} onClick={() => setNav(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${nav === item.key ? "bg-sky-400/20 text-white" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
              {item.icon}
              {sidebarOpen && <span className="flex-1 text-left">{item.label}</span>}
              {sidebarOpen && item.badge !== undefined && item.badge > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.key === "escalations" ? "bg-rose-500 text-white" : "bg-sky-400/30 text-sky-200"}`}>{item.badge}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 text-sm transition-colors">
            <LogOut className="w-4 h-4 shrink-0" />
            {sidebarOpen && "Sign Out"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-border/60 px-6 py-4 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(v => !v)} className="text-muted-foreground hover:text-foreground">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div>
            <h1 className="font-bold text-foreground text-lg leading-tight">Physician Portal</h1>
            <p className="text-xs text-muted-foreground">Dr. {name} &middot; {specialty}</p>
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
                  <p className="text-sm text-muted-foreground">{patients.length} patient{patients.length !== 1 ? "s" : ""} assigned to you</p>
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
                    <Card key={p.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border-border/50 cursor-pointer" onClick={() => { setSelectedPatient(p); setDetailTab("profile"); }}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-foreground text-base">{p.fullName}</p>
                            <p className="text-xs text-muted-foreground">{p.city} &middot; Week {p.weekNumber}</p>
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
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs rounded-full"
                            onClick={e => { e.stopPropagation(); setSelectedPatient(p); setDetailTab("profile"); }}>
                            <ChevronRight className="w-3 h-3 mr-1" />View Profile
                          </Button>
                          {p.riskLevel !== "high" ? (
                            <Button size="sm" variant="outline" className="h-8 text-xs rounded-full text-rose-600 border-rose-200 hover:bg-rose-50"
                              onClick={e => { e.stopPropagation(); escalateMut.mutate(p.id); }}>
                              <ShieldAlert className="w-3 h-3 mr-1" />Escalate
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" className="h-8 text-xs rounded-full text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              onClick={e => { e.stopPropagation(); deescalateMut.mutate(p.id); }}>
                              <ShieldCheck className="w-3 h-3 mr-1" />De-escalate
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ESCALATIONS TAB ────────────────────────────────────── */}
          {nav === "escalations" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-foreground">Escalated Patients</h2>
                <p className="text-sm text-muted-foreground">{highRisk.length} patient{highRisk.length !== 1 ? "s" : ""} requiring immediate attention</p>
              </div>
              {highRisk.length === 0 ? (
                <Card className="text-center py-16">
                  <CardContent><ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-3" /><p className="text-muted-foreground font-medium">No escalated patients right now.</p><p className="text-xs text-muted-foreground mt-1">All patients are in good standing.</p></CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {highRisk.map(p => (
                    <Card key={p.id} className="bg-rose-50 border-rose-200 rounded-2xl shadow-sm">
                      <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-rose-100 border-2 border-rose-300 flex items-center justify-center shrink-0">
                          <HeartPulse className="w-5 h-5 text-rose-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground">{p.fullName}</p>
                          <p className="text-xs text-muted-foreground">{p.city} &middot; {formatGoal(p.primaryGoal)} &middot; Week {p.weekNumber}</p>
                          <p className="text-xs text-rose-600 mt-1">Last check-in: {relativeDays(p.lastCheckinAt)}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="h-8 text-xs rounded-full" onClick={() => { setSelectedPatient(p); setDetailTab("profile"); setNav("patients"); }}>
                            View
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 text-xs rounded-full text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => deescalateMut.mutate(p.id)}>
                            De-escalate
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── MESSAGES TAB ─────────────────────────────────────── */}
          {nav === "messages" && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <h2 className="text-xl font-bold text-foreground">Send Message</h2>
                <p className="text-sm text-muted-foreground">Communicate with patients, support team, and colleagues</p>
              </div>
              {[
                { label: "Message a Patient", desc: "Send a clinical update or check-in reminder to a patient", color: "bg-sky-50 border-sky-200" },
                { label: "Contact Dietician", desc: "Share nutrition recommendations or request a consult", color: "bg-emerald-50 border-emerald-200" },
                { label: "Contact Caretaker", desc: "Coordinate daily care tasks or share patient updates", color: "bg-amber-50 border-amber-200" },
                { label: "Contact Support Team", desc: "Escalate concerns or request operational assistance", color: "bg-violet-50 border-violet-200" },
              ].map(item => (
                <Card key={item.label} className={`${item.color} border rounded-2xl`}>
                  <CardContent className="p-5">
                    <p className="font-semibold text-foreground mb-1">{item.label}</p>
                    <p className="text-xs text-muted-foreground mb-3">{item.desc}</p>
                    <div className="flex gap-2">
                      <textarea
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                        placeholder="Type your message…"
                        className="flex-1 rounded-xl border border-border/60 bg-white p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-sky-300"
                      />
                    </div>
                    <div className="flex justify-end mt-2">
                      <Button size="sm" className="rounded-full h-8 text-xs gap-2"
                        onClick={() => { toast({ title: "Message sent!", description: "Your message has been delivered." }); setMessageText(""); }}>
                        <Send className="w-3 h-3" />Send Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* ── SCHEDULE TAB ─────────────────────────────────────── */}
          {nav === "schedule" && (
            <div className="space-y-5 max-w-xl">
              <div>
                <h2 className="text-xl font-bold text-foreground">Schedule a Call</h2>
                <p className="text-sm text-muted-foreground">Plan a consultation or follow-up call with a patient</p>
              </div>
              <Card className="rounded-2xl border-border/50 shadow-sm bg-white">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Select Patient</label>
                    <select className="w-full h-10 rounded-xl border border-border/60 px-3 text-sm bg-white">
                      <option value="">Choose a patient…</option>
                      {(patients as any[]).map(p => <option key={p.id} value={p.id}>{p.fullName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Date & Time</label>
                    <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border/60 px-3 text-sm bg-white" />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Notes (optional)</label>
                    <textarea value={scheduleText} onChange={e => setScheduleText(e.target.value)}
                      placeholder="Purpose of call, patient concerns…"
                      className="w-full rounded-xl border border-border/60 p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-sky-300" />
                  </div>
                  <Button className="w-full rounded-full h-11 gap-2"
                    onClick={() => { toast({ title: "Call scheduled!", description: `Call confirmed for ${scheduleDate ? new Date(scheduleDate).toLocaleString("en-IN") : "selected time"}.` }); setScheduleText(""); setScheduleDate(""); }}>
                    <Video className="w-4 h-4" />Confirm Schedule
                  </Button>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-border/50 shadow-sm bg-white">
                <CardHeader><CardTitle className="text-sm font-semibold">Upcoming Calls</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p className="italic">No upcoming calls scheduled. Use the form above to plan one.</p>
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
          <div className="relative w-full max-w-2xl bg-white shadow-2xl overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-sky-700 to-blue-700 text-white p-6 flex items-start justify-between">
              <div>
                <p className="text-lg font-bold">{selectedPatient.fullName}</p>
                <p className="text-sky-200 text-sm">{selectedPatient.city} &middot; {formatGoal(selectedPatient.primaryGoal)}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Badge className={`${PLAN_COLORS[selectedPatient.plan]} border text-xs capitalize`}>{selectedPatient.plan}</Badge>
                  <Badge className={`${RISK_COLORS[selectedPatient.riskLevel]} border text-xs capitalize`}>{selectedPatient.riskLevel} risk</Badge>
                </div>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="text-white/70 hover:text-white mt-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick actions */}
            <div className="flex gap-2 p-4 border-b border-border/40 bg-slate-50">
              {selectedPatient.riskLevel !== "high" ? (
                <Button size="sm" variant="outline" className="text-xs rounded-full text-rose-600 border-rose-200 hover:bg-rose-50 gap-1"
                  onClick={() => escalateMut.mutate(selectedPatient.id)}>
                  <ShieldAlert className="w-3 h-3" />Escalate
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="text-xs rounded-full text-emerald-600 border-emerald-200 hover:bg-emerald-50 gap-1"
                  onClick={() => deescalateMut.mutate(selectedPatient.id)}>
                  <ShieldCheck className="w-3 h-3" />De-escalate
                </Button>
              )}
              <Button size="sm" variant="outline" className="text-xs rounded-full gap-1"
                onClick={() => { setNav("schedule"); setSelectedPatient(null); }}>
                <Video className="w-3 h-3" />Schedule Call
              </Button>
              <Button size="sm" variant="outline" className="text-xs rounded-full gap-1"
                onClick={() => { setNav("messages"); setSelectedPatient(null); }}>
                <MessageSquare className="w-3 h-3" />Message
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-0 border-b border-border/40 bg-white px-4">
              {(["profile", "checkins", "health", "notes"] as const).map(t => (
                <button key={t} onClick={() => setDetailTab(t)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${detailTab === t ? "border-sky-600 text-sky-700" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                  {t === "checkins" ? "Check-ins" : t}
                </button>
              ))}
            </div>

            <div className="flex-1 p-5 overflow-y-auto">
              {detailLoading ? (
                <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
              ) : (
                <>
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
                      {detail?.plan && (
                        <Card className="border-border/40 rounded-xl">
                          <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">Care Plan</CardTitle></CardHeader>
                          <CardContent className="px-4 pb-4 space-y-3 text-xs text-muted-foreground">
                            <div><p className="font-semibold text-foreground text-xs mb-1">🥗 Nutrition Plan</p><p>{detail.plan.nutritionPlan}</p></div>
                            <div><p className="font-semibold text-foreground text-xs mb-1">🏃 Activity Plan</p><p>{detail.plan.activityPlan}</p></div>
                            <div><p className="font-semibold text-foreground text-xs mb-1">🎯 Weekly Goals</p><p>{detail.plan.weeklyGoals}</p></div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Check-ins tab */}
                  {detailTab === "checkins" && (
                    <div className="space-y-3">
                      {(!detail?.checkins || detail.checkins.length === 0) ? (
                        <p className="text-muted-foreground text-sm text-center py-8">No check-ins recorded yet. Will be updated soon.</p>
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

                  {/* Health Data tab */}
                  {detailTab === "health" && (
                    <div className="space-y-5">
                      {weightData.length > 0 ? (
                        <Card className="border-border/40 rounded-xl">
                          <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">Weight Trend (kg)</CardTitle></CardHeader>
                          <CardContent className="px-4 pb-4">
                            <ResponsiveContainer width="100%" height={140}>
                              <LineChart data={weightData}>
                                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                                <YAxis tick={{ fontSize: 9 }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      ) : <p className="text-muted-foreground text-sm text-center py-4">Weight data will appear here after check-ins.</p>}

                      {glucoseData.length > 0 && (
                        <Card className="border-border/40 rounded-xl">
                          <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">Blood Glucose (mg/dL)</CardTitle></CardHeader>
                          <CardContent className="px-4 pb-4">
                            <ResponsiveContainer width="100%" height={120}>
                              <BarChart data={glucoseData}>
                                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                                <YAxis tick={{ fontSize: 9 }} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Notes tab */}
                  {detailTab === "notes" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Add Clinical Note</label>
                        <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                          placeholder="Enter your clinical notes, observations, or instructions…"
                          className="w-full rounded-xl border border-border/60 p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-sky-300" />
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
  );
}
