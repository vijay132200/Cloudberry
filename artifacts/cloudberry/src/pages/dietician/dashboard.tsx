import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Calendar, MessageSquare, Search, LogOut, ChevronRight,
  X, Salad, Video, FileText, Send, Utensils, Activity, Target, TrendingDown
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

const PLAN_COLORS: Record<string, string> = {
  premium: "bg-amber-50 text-amber-700 border-amber-200",
  comprehensive: "bg-sky-50 text-sky-700 border-sky-200",
  basic: "bg-slate-50 text-slate-600 border-slate-200",
};

function formatGoal(g: string) { return g?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) ?? "—"; }
function relativeDays(iso: string | null) {
  if (!iso) return "Never";
  const d = Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
  return d === 0 ? "Today" : d === 1 ? "Yesterday" : `${d}d ago`;
}

type NavTab = "patients" | "messages" | "schedule";

export default function DieticianDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [nav, setNav] = useState<NavTab>("patients");
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [detailTab, setDetailTab] = useState<"profile" | "checkins" | "nutrition" | "notes">("profile");
  const [noteText, setNoteText] = useState("");
  const [messageText, setMessageText] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [opsBackup] = useState(() => localStorage.getItem("cloudberry_ops_backup"));

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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const name = localStorage.getItem("cloudberry_name") || "Dietician";
  const specialty = localStorage.getItem("cloudberry_specialty") || "";

  useEffect(() => {
    const token = localStorage.getItem("cloudberry_token");
    const role = localStorage.getItem("cloudberry_role");
    if (!token || role !== "dietician") { setLocation("/physician/signin"); }
  }, []);

  const { data: patients = [], isLoading } = useQuery<any[]>({
    queryKey: ["dietician-patients"],
    queryFn: () => apiFetch("/dietician/patients"),
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["dietician-patient-detail", selectedPatient?.id],
    queryFn: () => apiFetch(`/dietician/patients/${selectedPatient.id}`),
    enabled: !!selectedPatient,
  });

  const noteMut = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) => apiPost(`/dietician/patients/${id}/notes`, { content, category: "nutrition" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dietician-patient-detail", selectedPatient?.id] });
      setNoteText(""); toast({ title: "Nutrition note saved" });
    },
  });

  const handleLogout = () => {
    ["cloudberry_token", "cloudberry_name", "cloudberry_role", "cloudberry_specialty"].forEach(k => localStorage.removeItem(k));
    setLocation("/physician/signin");
  };

  const filtered = (patients as any[]).filter(p =>
    !search || p.fullName?.toLowerCase().includes(search.toLowerCase()) || p.city?.toLowerCase().includes(search.toLowerCase())
  );

  const weightData = detail?.metrics?.filter((m: any) => m.type === "weight").slice(0, 6).reverse() ?? [];

  const navItems = [
    { key: "patients" as NavTab, label: "All Patients", icon: <Users className="w-4 h-4" />, badge: patients.length },
    { key: "messages" as NavTab, label: "Messages", icon: <MessageSquare className="w-4 h-4" /> },
    { key: "schedule" as NavTab, label: "Schedule", icon: <Calendar className="w-4 h-4" /> },
  ];

  return (
    <>
    {opsBackup && (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-violet-700 text-white text-xs px-4 py-2 flex items-center justify-between shadow-lg">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-300 animate-pulse" />
          Viewing <strong>Dietician Portal</strong> from Operations — read-only preview mode
        </span>
        <button onClick={handleReturnToOps} className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full font-semibold text-xs transition-colors flex items-center gap-1.5">
          ← Return to Ops
        </button>
      </div>
    )}
    <div className={`min-h-screen bg-slate-50 flex${opsBackup ? " pt-9" : ""}`}>
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-60" : "w-16"} transition-all bg-emerald-950 text-white flex flex-col shrink-0`}>
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <Salad className="w-4 h-4 text-emerald-300" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{name}</p>
              <p className="text-[10px] text-emerald-300 truncate">{specialty || "Dietician"}</p>
            </div>
          )}
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <button key={item.key} onClick={() => setNav(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${nav === item.key ? "bg-emerald-400/20 text-white" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
              {item.icon}
              {sidebarOpen && <span className="flex-1 text-left">{item.label}</span>}
              {sidebarOpen && item.badge !== undefined && item.badge > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-400/30 text-emerald-200">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 text-sm transition-colors">
            <LogOut className="w-4 h-4 shrink-0" />
            {sidebarOpen && "Sign Out"}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-border/60 px-6 py-4 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(v => !v)} className="text-muted-foreground hover:text-foreground">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div>
            <h1 className="font-bold text-foreground text-lg leading-tight">Dietician Portal</h1>
            <p className="text-xs text-muted-foreground">{name} &middot; {specialty}</p>
          </div>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground bg-slate-100 px-3 py-1.5 rounded-full">
            {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {/* Patients tab */}
          {nav === "patients" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Patient Nutrition Overview</h2>
                  <p className="text-sm text-muted-foreground">{patients.length} active patients in the programme</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients…" className="pl-9 w-52 h-9 text-sm rounded-full" />
                </div>
              </div>

              {isLoading ? (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {[1,2,3].map(i => <div key={i} className="h-40 bg-white rounded-2xl animate-pulse" />)}
                </div>
              ) : filtered.length === 0 ? (
                <Card className="text-center py-16"><CardContent><p className="text-muted-foreground">No patients found.</p></CardContent></Card>
              ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {filtered.map(p => (
                    <Card key={p.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border-border/50 cursor-pointer" onClick={() => { setSelectedPatient(p); setDetailTab("profile"); }}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-foreground">{p.fullName}</p>
                            <p className="text-xs text-muted-foreground">{p.city} &middot; Week {p.weekNumber}</p>
                          </div>
                          <Badge className={`${PLAN_COLORS[p.plan]} border text-xs capitalize`}>{p.plan}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                          <Utensils className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <div className="flex-1">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Nutrition Adherence</span>
                              <span className="font-semibold text-emerald-700">{p.nutritionAdherence ?? "—"}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${p.nutritionAdherence ?? 0}%` }} />
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4 line-clamp-2 italic">{p.nutritionPlan || "Personalised plan not yet assigned."}</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs rounded-full"
                            onClick={e => { e.stopPropagation(); setSelectedPatient(p); setDetailTab("nutrition"); }}>
                            <Salad className="w-3 h-3 mr-1" />Nutrition Plan
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 text-xs rounded-full"
                            onClick={e => { e.stopPropagation(); setSelectedPatient(p); setDetailTab("checkins"); }}>
                            <Activity className="w-3 h-3 mr-1" />Check-ins
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Messages tab */}
          {nav === "messages" && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <h2 className="text-xl font-bold text-foreground">Send Message</h2>
                <p className="text-sm text-muted-foreground">Coordinate with patients, physicians, and caretakers</p>
              </div>
              {[
                { label: "Message a Patient", desc: "Send nutrition tips or meal reminders directly to a patient", color: "bg-emerald-50 border-emerald-200" },
                { label: "Contact Physician", desc: "Share clinical nutrition updates or request medical input", color: "bg-sky-50 border-sky-200" },
                { label: "Contact Caretaker", desc: "Coordinate daily meal tracking and patient support", color: "bg-amber-50 border-amber-200" },
                { label: "Contact Support", desc: "Get operational help or report programme concerns", color: "bg-violet-50 border-violet-200" },
              ].map(item => (
                <Card key={item.label} className={`${item.color} border rounded-2xl`}>
                  <CardContent className="p-5">
                    <p className="font-semibold text-foreground mb-1">{item.label}</p>
                    <p className="text-xs text-muted-foreground mb-3">{item.desc}</p>
                    <textarea value={messageText} onChange={e => setMessageText(e.target.value)}
                      placeholder="Type your message…"
                      className="w-full rounded-xl border border-border/60 bg-white p-3 text-sm resize-none h-16 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                    <div className="flex justify-end mt-2">
                      <Button size="sm" className="rounded-full h-8 text-xs gap-2 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => { toast({ title: "Message sent!" }); setMessageText(""); }}>
                        <Send className="w-3 h-3" />Send
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Schedule tab */}
          {nav === "schedule" && (
            <div className="space-y-5 max-w-xl">
              <div>
                <h2 className="text-xl font-bold text-foreground">Schedule a Call</h2>
                <p className="text-sm text-muted-foreground">Plan a nutrition consultation with a patient</p>
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
                    <label className="text-sm font-medium block mb-1.5">Call Purpose</label>
                    <select className="w-full h-10 rounded-xl border border-border/60 px-3 text-sm bg-white">
                      <option>Nutrition Plan Review</option><option>Meal Logging Follow-up</option><option>Supplement Discussion</option><option>Progress Check-in</option>
                    </select>
                  </div>
                  <Button className="w-full rounded-full h-11 gap-2 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => toast({ title: "Consultation scheduled!", description: "Patient and care team have been notified." })}>
                    <Video className="w-4 h-4" />Confirm Schedule
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Patient Detail Panel */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedPatient(null)} />
          <div className="relative w-full max-w-2xl bg-white shadow-2xl overflow-y-auto flex flex-col">
            <div className="bg-gradient-to-r from-emerald-700 to-teal-700 text-white p-6 flex items-start justify-between">
              <div>
                <p className="text-lg font-bold">{selectedPatient.fullName}</p>
                <p className="text-emerald-200 text-sm">{selectedPatient.city} &middot; {formatGoal(selectedPatient.primaryGoal)}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Badge className={`${PLAN_COLORS[selectedPatient.plan]} border text-xs capitalize`}>{selectedPatient.plan}</Badge>
                  <span className="text-xs text-emerald-200">Nutrition adherence: {selectedPatient.nutritionAdherence ?? "—"}%</span>
                </div>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex gap-0 border-b border-border/40 bg-white px-4">
              {(["profile", "checkins", "nutrition", "notes"] as const).map(t => (
                <button key={t} onClick={() => setDetailTab(t)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${detailTab === t ? "border-emerald-600 text-emerald-700" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                  {t}
                </button>
              ))}
            </div>

            <div className="flex-1 p-5 overflow-y-auto">
              {detailLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}</div>
              ) : (
                <>
                  {detailTab === "profile" && (
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Full Name", value: selectedPatient.fullName },
                        { label: "Phone", value: selectedPatient.phone || "—" },
                        { label: "City", value: selectedPatient.city || "—" },
                        { label: "Plan", value: selectedPatient.plan?.charAt(0).toUpperCase() + selectedPatient.plan?.slice(1) },
                        { label: "Week", value: `Week ${selectedPatient.weekNumber}` },
                        { label: "Goal", value: formatGoal(selectedPatient.primaryGoal) },
                        { label: "Current Weight", value: selectedPatient.currentWeight ? `${selectedPatient.currentWeight} kg` : "—" },
                        { label: "Target Weight", value: selectedPatient.targetWeight ? `${selectedPatient.targetWeight} kg` : "—" },
                        { label: "Adherence", value: `${selectedPatient.nutritionAdherence ?? "—"}%` },
                        { label: "Last check-in", value: relativeDays(selectedPatient.lastCheckinAt) },
                      ].map(item => (
                        <div key={item.label} className="bg-slate-50 rounded-xl p-3 border border-border/40">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{item.label}</p>
                          <p className="text-sm font-semibold text-foreground">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {detailTab === "checkins" && (
                    <div className="space-y-3">
                      {(!detail?.checkins || detail.checkins.length === 0) ? (
                        <p className="text-muted-foreground text-sm text-center py-8">No check-ins yet. Will be updated soon.</p>
                      ) : detail.checkins.map((c: any) => (
                        <Card key={c.id} className="border-border/40 rounded-xl">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-semibold">{new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                              <Badge className={`text-[10px] border ${c.mealsFollowed === "yes" || c.mealsFollowed === "mostly" || c.mealsFollowed === "all_meals" || c.mealsFollowed === "most_meals" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                                Meals: {c.mealsFollowed?.replace(/_/g, " ")}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div><span className="text-muted-foreground">Energy:</span> <span className="font-medium capitalize">{c.energyLevel}</span></div>
                              <div><span className="text-muted-foreground">Mood:</span> <span className="font-medium capitalize">{c.mood}</span></div>
                              <div><span className="text-muted-foreground">Active:</span> <span className="font-medium">{c.activityCompleted ? "Yes" : "No"}</span></div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {detailTab === "nutrition" && (
                    <div className="space-y-4">
                      {detail?.plan ? (
                        <Card className="border-emerald-100 bg-emerald-50 rounded-xl">
                          <CardContent className="p-5 space-y-3">
                            <div><p className="text-xs font-semibold text-emerald-800 mb-1">🥗 Nutrition Plan</p><p className="text-sm text-emerald-900">{detail.plan.nutritionPlan}</p></div>
                            <div><p className="text-xs font-semibold text-emerald-800 mb-1">🎯 Weekly Goals</p><p className="text-sm text-emerald-900">{detail.plan.weeklyGoals}</p></div>
                          </CardContent>
                        </Card>
                      ) : <p className="text-muted-foreground text-sm italic">No nutrition plan assigned yet.</p>}
                      {weightData.length > 0 && (
                        <Card className="border-border/40 rounded-xl">
                          <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">Weight Progress</CardTitle></CardHeader>
                          <CardContent className="px-4 pb-4">
                            <ResponsiveContainer width="100%" height={120}>
                              <LineChart data={weightData}><XAxis dataKey="date" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 9 }} /><Tooltip /><Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} /></LineChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {detailTab === "notes" && (
                    <div className="space-y-4">
                      <label className="text-sm font-medium">Add Nutrition Note</label>
                      <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                        placeholder="Meal adjustments, supplement recommendations, observations…"
                        className="w-full rounded-xl border border-border/60 p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                      <Button size="sm" className="rounded-full gap-2 bg-emerald-600 hover:bg-emerald-700" disabled={!noteText.trim() || noteMut.isPending}
                        onClick={() => noteMut.mutate({ id: selectedPatient.id, content: noteText })}>
                        <FileText className="w-3 h-3" />{noteMut.isPending ? "Saving…" : "Save Note"}
                      </Button>
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
