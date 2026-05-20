import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Users, MessageSquare, Search, LogOut, X, UserCheck, Upload,
  CheckCircle2, XCircle, Send, MessageCircle, Calendar, Phone
} from "lucide-react";

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

function relativeDays(iso: string | null) {
  if (!iso) return "Never";
  const d = Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
  return d === 0 ? "Today" : d === 1 ? "Yesterday" : `${d}d ago`;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type NavTab = "patients" | "messages";

export default function CaretakerDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [nav, setNav] = useState<NavTab>("patients");
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [uploadText, setUploadText] = useState("");
  const [messageText, setMessageText] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  const name = localStorage.getItem("cloudberry_name") || "Caretaker";
  const specialty = localStorage.getItem("cloudberry_specialty") || "";

  useEffect(() => {
    const token = localStorage.getItem("cloudberry_token");
    const role = localStorage.getItem("cloudberry_role");
    if (!token || role !== "caretaker") { setLocation("/physician/signin"); }
  }, []);

  const { data: patients = [], isLoading } = useQuery<any[]>({
    queryKey: ["caretaker-patients"],
    queryFn: () => apiFetch("/caretaker/patients"),
  });

  const { data: conversations = [] } = useQuery<any[]>({
    queryKey: ["caretaker-conversations", selectedPatient?.id],
    queryFn: () => apiFetch(`/caretaker/patients/${selectedPatient.id}/conversations`),
    enabled: !!selectedPatient,
  });

  const uploadMut = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) => apiPost(`/caretaker/patients/${id}/conversation`, { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["caretaker-conversations", selectedPatient?.id] });
      setUploadText(""); toast({ title: "Conversation uploaded successfully" });
    },
  });

  const handleLogout = () => {
    ["cloudberry_token", "cloudberry_name", "cloudberry_role", "cloudberry_specialty"].forEach(k => localStorage.removeItem(k));
    setLocation("/physician/signin");
  };

  const filtered = (patients as any[]).filter(p =>
    !search || p.fullName?.toLowerCase().includes(search.toLowerCase()) || p.city?.toLowerCase().includes(search.toLowerCase())
  );

  const checkedInToday = (patients as any[]).filter(p => p.checkedInToday).length;
  const highConsistency = (patients as any[]).filter(p => p.consistencyPct >= 70).length;

  const navItems = [
    { key: "patients" as NavTab, label: "My Patients", icon: <Users className="w-4 h-4" />, badge: patients.length },
    { key: "messages" as NavTab, label: "Messages", icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <>
    {opsBackup && (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-violet-700 text-white text-xs px-4 py-2 flex items-center justify-between shadow-lg">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-300 animate-pulse" />
          Viewing <strong>Caretaker Portal</strong> from Operations — read-only preview mode
        </span>
        <button onClick={handleReturnToOps} className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full font-semibold text-xs transition-colors flex items-center gap-1.5">
          ← Return to Ops
        </button>
      </div>
    )}
    <div className={`min-h-screen bg-slate-50 flex${opsBackup ? " pt-9" : ""}`}>
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-60" : "w-16"} transition-all bg-purple-950 text-white flex flex-col shrink-0`}>
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-400/20 border border-purple-400/30 flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4 text-purple-300" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{name}</p>
              <p className="text-[10px] text-purple-300 truncate">{specialty || "Caretaker"}</p>
            </div>
          )}
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <button key={item.key} onClick={() => setNav(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${nav === item.key ? "bg-purple-400/20 text-white" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
              {item.icon}
              {sidebarOpen && <span className="flex-1 text-left">{item.label}</span>}
              {sidebarOpen && item.badge !== undefined && item.badge > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-400/30 text-purple-200">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 text-sm">
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
            <h1 className="font-bold text-foreground text-lg leading-tight">Caretaker Portal</h1>
            <p className="text-xs text-muted-foreground">{name} &middot; {specialty}</p>
          </div>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground bg-slate-100 px-3 py-1.5 rounded-full">
            {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {nav === "patients" && (
            <div className="space-y-5">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Total Patients", value: patients.length, color: "text-purple-700", bg: "bg-purple-50 border-purple-100" },
                  { label: "Checked In Today", value: checkedInToday, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
                  { label: "On Track (≥70%)", value: highConsistency, color: "text-sky-700", bg: "bg-sky-50 border-sky-100" },
                ].map(s => (
                  <Card key={s.label} className={`${s.bg} border rounded-2xl`}>
                    <CardContent className="p-4 text-center">
                      <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Patient Consistency Tracker</h2>
                  <p className="text-sm text-muted-foreground">Daily check-in adherence for all assigned patients</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients…" className="pl-9 w-52 h-9 text-sm rounded-full" />
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />)}</div>
              ) : filtered.length === 0 ? (
                <Card className="text-center py-16"><CardContent><p className="text-muted-foreground">No patients found.</p></CardContent></Card>
              ) : (
                <div className="space-y-3">
                  {filtered.map(p => (
                    <Card key={p.id} className="bg-white rounded-2xl shadow-sm border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="font-semibold text-foreground">{p.fullName}</p>
                              <Badge className={`${PLAN_COLORS[p.plan]} border text-xs capitalize`}>{p.plan}</Badge>
                              {p.checkedInToday ? (
                                <span className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                                  <CheckCircle2 className="w-3 h-3" />Checked in today
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                                  <XCircle className="w-3 h-3" />Not yet today
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{p.city} &middot; Week {p.weekNumber} &middot; Last: {relativeDays(p.lastCheckinAt)}</p>
                            {/* 7-day adherence grid */}
                            <div className="flex items-center gap-1.5">
                              {DAYS.map((day, i) => (
                                <div key={day} className="flex flex-col items-center gap-1">
                                  <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-semibold ${p.adherenceMap?.[i] ? "bg-emerald-400 text-white" : "bg-slate-100 text-slate-400"}`}>
                                    {p.adherenceMap?.[i] ? "✓" : "·"}
                                  </div>
                                  <span className="text-[9px] text-muted-foreground">{day}</span>
                                </div>
                              ))}
                              <div className="ml-2 flex flex-col">
                                <span className="text-[10px] text-muted-foreground">Consistency</span>
                                <span className={`text-sm font-bold ${p.consistencyPct >= 70 ? "text-emerald-600" : p.consistencyPct >= 40 ? "text-amber-600" : "text-rose-600"}`}>
                                  {p.consistencyPct}%
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <Button size="sm" variant="outline" className="h-8 text-xs rounded-full gap-1"
                              onClick={() => setSelectedPatient(p)}>
                              <Upload className="w-3 h-3" />Upload Chat
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 text-xs rounded-full gap-1"
                              onClick={() => toast({ title: "Calling patient…", description: "Feature will connect via the app." })}>
                              <Phone className="w-3 h-3" />Call
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {nav === "messages" && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <h2 className="text-xl font-bold text-foreground">Send Message</h2>
                <p className="text-sm text-muted-foreground">Reach out to patients, physicians, or dieticians</p>
              </div>
              {[
                { label: "Message a Patient", desc: "Remind a patient about their daily check-in or share an encouraging note", color: "bg-purple-50 border-purple-200" },
                { label: "Contact Physician", desc: "Escalate a concern or share patient observations with the assigned doctor", color: "bg-sky-50 border-sky-200" },
                { label: "Contact Dietician", desc: "Share patient meal habits or request a nutrition update", color: "bg-emerald-50 border-emerald-200" },
              ].map(item => (
                <Card key={item.label} className={`${item.color} border rounded-2xl`}>
                  <CardContent className="p-5">
                    <p className="font-semibold text-foreground mb-1">{item.label}</p>
                    <p className="text-xs text-muted-foreground mb-3">{item.desc}</p>
                    <textarea value={messageText} onChange={e => setMessageText(e.target.value)}
                      placeholder="Type your message…"
                      className="w-full rounded-xl border border-border/60 bg-white p-3 text-sm resize-none h-16 focus:outline-none focus:ring-2 focus:ring-purple-300" />
                    <div className="flex justify-end mt-2">
                      <Button size="sm" className="rounded-full h-8 text-xs gap-2 bg-purple-700 hover:bg-purple-800"
                        onClick={() => { toast({ title: "Message sent!" }); setMessageText(""); }}>
                        <Send className="w-3 h-3" />Send
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Upload WhatsApp Conversation Panel */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedPatient(null)} />
          <div className="relative w-full max-w-xl bg-white shadow-2xl overflow-y-auto flex flex-col">
            <div className="bg-gradient-to-r from-purple-800 to-purple-700 text-white p-6 flex items-start justify-between">
              <div>
                <p className="text-lg font-bold">{selectedPatient.fullName}</p>
                <p className="text-purple-200 text-sm">{selectedPatient.city} &middot; Consistency: {selectedPatient.consistencyPct}%</p>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-5">
              {/* 7-day grid */}
              <Card className="border-border/40 rounded-xl">
                <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">This Week's Check-in Grid</CardTitle></CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="flex gap-2 justify-between">
                    {DAYS.map((day, i) => (
                      <div key={day} className="flex flex-col items-center gap-1.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${selectedPatient.adherenceMap?.[i] ? "bg-emerald-400 text-white" : "bg-slate-100 text-slate-400"}`}>
                          {selectedPatient.adherenceMap?.[i] ? "✓" : "—"}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{day}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                    <span>Streak: <b className="text-foreground">{selectedPatient.streak} days</b></span>
                    <span>Last mood: <b className="text-foreground capitalize">{selectedPatient.lastMood || "—"}</b></span>
                    <span>Energy: <b className="text-foreground capitalize">{selectedPatient.lastEnergy || "—"}</b></span>
                  </div>
                </CardContent>
              </Card>

              {/* Upload WhatsApp conversation */}
              <Card className="border-green-200 bg-green-50 rounded-xl">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2 text-green-800">
                    <MessageCircle className="w-4 h-4 text-green-600" />Upload WhatsApp Conversation
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <p className="text-xs text-green-700">Paste the WhatsApp chat export text for this patient. This is stored securely and visible to the care team.</p>
                  <textarea
                    value={uploadText}
                    onChange={e => setUploadText(e.target.value)}
                    placeholder="Paste WhatsApp conversation here (e.g. 10/05/2025, 9:00 AM - Ranjit Kumar: Hello, how are you feeling today?…)"
                    className="w-full rounded-xl border border-green-200 bg-white p-3 text-sm resize-none h-40 focus:outline-none focus:ring-2 focus:ring-green-300"
                  />
                  <Button className="w-full rounded-full gap-2 bg-green-600 hover:bg-green-700"
                    disabled={!uploadText.trim() || uploadMut.isPending}
                    onClick={() => uploadMut.mutate({ id: selectedPatient.id, content: uploadText })}>
                    <Upload className="w-4 h-4" />
                    {uploadMut.isPending ? "Uploading…" : "Upload Conversation"}
                  </Button>
                </CardContent>
              </Card>

              {/* Previous uploads */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Previous Uploads</p>
                {(conversations as any[]).length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No conversations uploaded yet for this patient.</p>
                ) : (conversations as any[]).map((c: any) => (
                  <Card key={c.id} className="border-border/40 rounded-xl">
                    <CardContent className="p-3">
                      <p className="text-[10px] text-muted-foreground mb-1">{new Date(c.createdAt).toLocaleString("en-IN")}</p>
                      <p className="text-xs text-foreground line-clamp-3 whitespace-pre-wrap">{c.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
