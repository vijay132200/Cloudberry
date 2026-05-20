import { StaffLayout } from "@/components/layout/staff-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Users, AlertTriangle, CheckCircle, Clock, ShieldAlert, HeartPulse, CalendarDays,
  Bell, Download, Search, Phone, Mail, TrendingUp, Activity, Star,
  Stethoscope, Target, Dumbbell, Salad, UserCheck, Shield, ChevronRight,
  X, ChevronDown, Weight, MapPin, CalendarCheck, User, FileText,
  MessageSquare, Plus, ExternalLink, ArrowUp, ArrowDown, CalendarPlus, ClipboardList
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";

async function fetchJson(path: string) {
  const token = localStorage.getItem("cloudberry_token") || "";
  const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function patchJson(path: string, body: any) {
  const token = localStorage.getItem("cloudberry_token") || "";
  const r = await fetch(`${API}${path}`, {
    method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function postJson(path: string, body: any) {
  const token = localStorage.getItem("cloudberry_token") || "";
  const r = await fetch(`${API}${path}`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

function roleColor(role: string) {
  const m: Record<string, string> = {
    ops: "bg-violet-50 text-violet-700 border-violet-200",
    physician: "bg-sky-50 text-sky-700 border-sky-200",
    dietician: "bg-emerald-50 text-emerald-700 border-emerald-200",
    caretaker: "bg-amber-50 text-amber-700 border-amber-200",
    coach: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return m[role] || "bg-muted text-muted-foreground border-border";
}

function roleIcon(role: string) {
  if (role === "physician") return <Stethoscope className="w-3.5 h-3.5" />;
  if (role === "dietician") return <Salad className="w-3.5 h-3.5" />;
  if (role === "caretaker") return <UserCheck className="w-3.5 h-3.5" />;
  if (role === "ops") return <Shield className="w-3.5 h-3.5" />;
  return <Dumbbell className="w-3.5 h-3.5" />;
}

function planColor(plan: string) {
  if (plan === "premium") return "bg-amber-50 text-amber-700 border-amber-200";
  if (plan === "comprehensive") return "bg-sky-50 text-sky-700 border-sky-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
}

function getRiskStyle(risk: string) {
  if (risk === "low") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (risk === "medium") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
}

function getRiskDot(risk: string) {
  if (risk === "low") return "bg-emerald-500";
  if (risk === "medium") return "bg-amber-500";
  return "bg-rose-500";
}

function goalLabel(goal: string) {
  const m: Record<string, string> = {
    weight_loss: "Weight Loss", diabetes_reversal: "Diabetes Reversal",
    pcos_management: "PCOS Management", cholesterol_control: "Cholesterol Control",
    metabolic_health: "Metabolic Health",
  };
  return m[goal] || goal;
}

function exportCSV(patients: any[]) {
  const headers = ["ID", "Name", "Phone", "Email", "City", "Plan", "Risk", "Adherence%", "Week", "Last Check-in", "Physician", "Dietician", "Caretaker"];
  const rows = patients.map(p => [
    p.id, p.fullName, p.phone, p.email, p.city, p.plan, p.riskLevel,
    p.adherencePct, p.weekNumber, p.lastCheckinAt,
    p.assignedPhysician || "", p.assignedDietician || "", p.assignedCaretaker || "",
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `cloudberry-patients-${new Date().toISOString().split("T")[0]}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

type TabType = "patients" | "registrations" | "leads" | "staff" | "credentials";
type DetailTab = "profile" | "checkins" | "metrics" | "team" | "notes" | "appointments" | "plan";

/* ── Appointment Scheduler ────────────────────────────────────────── */
function AppointmentScheduler({ patient, detail, staff, onRefresh }: { patient: any; detail: any; staff: any[]; onRefresh: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ careTeamMember: "", role: "physician", scheduledAt: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const careTeamOptions = [
    ...(detail?.assignedPhysician ? [{ name: detail.assignedPhysician, role: "physician" }] : []),
    ...(detail?.assignedDietician ? [{ name: detail.assignedDietician, role: "dietician" }] : []),
    ...(detail?.assignedCaretaker ? [{ name: detail.assignedCaretaker, role: "caretaker" }] : []),
  ];

  const handleSchedule = async () => {
    if (!form.careTeamMember || !form.scheduledAt) { toast({ title: "Fill in care team member and date/time", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem("cloudberry_token") || "";
      const r = await fetch(`${import.meta.env.BASE_URL?.replace(/\/$/, "")}/api/ops/patients/${patient.id}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ careTeamMember: form.careTeamMember, role: form.role, scheduledAt: form.scheduledAt, notes: form.notes }),
      });
      if (!r.ok) throw new Error(await r.text());
      toast({ title: "Appointment scheduled", description: `${form.careTeamMember} on ${new Date(form.scheduledAt).toLocaleDateString("en-IN")}` });
      setForm({ careTeamMember: "", role: "physician", scheduledAt: "", notes: "" });
      onRefresh();
    } catch { toast({ title: "Failed to schedule", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const appts: any[] = detail?.appointments ?? [];

  return (
    <div className="space-y-5">
      {/* Schedule new */}
      <Card className="border-border">
        <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5"><CalendarPlus className="w-3.5 h-3.5 text-primary" /> Schedule New Appointment</CardTitle></CardHeader>
        <CardContent className="space-y-3 pb-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Care Team Member</label>
            {careTeamOptions.length > 0 ? (
              <Select value={form.careTeamMember} onValueChange={v => {
                const opt = careTeamOptions.find(o => o.name === v);
                setForm(f => ({ ...f, careTeamMember: v, role: opt?.role ?? "physician" }));
              }}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select care team member" /></SelectTrigger>
                <SelectContent>
                  {careTeamOptions.map((o, i) => <SelectItem key={i} value={o.name}>{o.name} <span className="text-muted-foreground capitalize ml-1">({o.role})</span></SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input value={form.careTeamMember} onChange={e => setForm(f => ({ ...f, careTeamMember: e.target.value }))}
                placeholder="Enter care team member name" className="h-9 text-xs" />
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Role</label>
            <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="physician">Physician</SelectItem>
                <SelectItem value="dietician">Dietician</SelectItem>
                <SelectItem value="caretaker">Caretaker</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Date & Time</label>
            <Input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
              className="h-9 text-xs" min={new Date().toISOString().slice(0, 16)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Notes (optional)</label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Appointment notes or instructions..." className="text-xs min-h-[60px] resize-none rounded-xl" />
          </div>
          <Button className="w-full rounded-xl" onClick={handleSchedule} disabled={saving}>
            <CalendarPlus className="w-3.5 h-3.5 mr-1.5" />{saving ? "Scheduling..." : "Schedule Appointment"}
          </Button>
        </CardContent>
      </Card>

      {/* Existing appointments */}
      <div>
        <p className="text-xs font-semibold text-foreground mb-2">Scheduled Appointments ({appts.length})</p>
        {appts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No appointments on record.</p>
        ) : appts.slice(0, 10).map((a: any, i: number) => (
          <div key={i} className="border border-border/50 rounded-xl p-3 text-xs mb-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">{a.careTeamMember}</span>
              <Badge variant="outline" className={`text-[10px] capitalize ${a.status === "upcoming" ? "bg-sky-50 text-sky-700 border-sky-200" : a.status === "completed" ? "bg-green-50 text-green-700 border-green-200" : "bg-muted text-muted-foreground"}`}>{a.status}</Badge>
            </div>
            <p className="text-muted-foreground mt-0.5 capitalize">{a.role} · {a.scheduledAt ? new Date(a.scheduledAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</p>
            {a.notes && <p className="text-muted-foreground italic mt-0.5">"{a.notes}"</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Patient Detail Slide-out Panel ─────────────────────────────── */
function PatientDetailPanel({
  patient, staff, onClose, onRefresh,
}: {
  patient: any; staff: any[]; onClose: () => void; onRefresh: () => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [detailTab, setDetailTab] = useState<DetailTab>("profile");
  const [noteText, setNoteText] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  const { data: detail, isLoading } = useQuery({
    queryKey: ["ops-patient-detail", patient.id],
    queryFn: () => fetchJson(`/ops/patients/${patient.id}/detail`),
    staleTime: 30000,
  });

  const physicians = staff.filter(s => s.role === "physician");
  const dieticians = staff.filter(s => s.role === "dietician");
  const caretakers = staff.filter(s => s.role === "caretaker");

  const [selPhysician, setSelPhysician] = useState<string>("");
  const [selDietician, setSelDietician] = useState<string>("");
  const [selCaretaker, setSelCaretaker] = useState<string>("");

  useEffect(() => {
    if (detail) {
      setSelPhysician(detail.assignedPhysicianId ? String(detail.assignedPhysicianId) : "none");
      setSelDietician(detail.assignedDieticianId ? String(detail.assignedDieticianId) : "none");
      setSelCaretaker(detail.assignedCaretakerId ? String(detail.assignedCaretakerId) : "none");
    }
  }, [detail]);

  const assignTeam = useMutation({
    mutationFn: (body: any) => patchJson(`/ops/patients/${patient.id}/assign-team`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ops-patients"] });
      qc.invalidateQueries({ queryKey: ["ops-patient-detail", patient.id] });
      toast({ title: "Care team updated" });
      onRefresh();
    },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  const escalate = useMutation({
    mutationFn: () => patchJson(`/ops/patients/${patient.id}/escalate`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ops-patients"] });
      qc.invalidateQueries({ queryKey: ["ops-patient-detail", patient.id] });
      toast({ title: "Patient escalated to high risk", variant: "destructive" });
      onRefresh();
    },
  });

  const deescalate = useMutation({
    mutationFn: () => patchJson(`/ops/patients/${patient.id}/deescalate`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ops-patients"] });
      qc.invalidateQueries({ queryKey: ["ops-patient-detail", patient.id] });
      toast({ title: "Patient de-escalated to low risk" });
      onRefresh();
    },
  });

  const addNote = async () => {
    if (!noteText.trim()) return;
    setSubmittingNote(true);
    try {
      await postJson(`/ops/patients/${patient.id}/notes`, { content: noteText.trim(), category: "ops" });
      setNoteText("");
      qc.invalidateQueries({ queryKey: ["ops-patient-detail", patient.id] });
      toast({ title: "Note added" });
    } catch {
      toast({ title: "Failed to add note", variant: "destructive" });
    } finally { setSubmittingNote(false); }
  };

  const saveTeam = () => {
    assignTeam.mutate({
      physicianId: selPhysician === "none" ? null : Number(selPhysician),
      dieticianId: selDietician === "none" ? null : Number(selDietician),
      caretakerId: selCaretaker === "none" ? null : Number(selCaretaker),
    });
  };

  const p = detail ?? patient;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-start justify-between ${p.riskLevel === "high" ? "bg-rose-50" : "bg-white"}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${p.riskLevel === "high" ? "bg-rose-100 text-rose-700" : "bg-primary/10 text-primary"}`}>
              {p.fullName?.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
            </div>
            <div>
              <h2 className="font-bold text-foreground flex items-center gap-2">
                {p.fullName}
                {p.riskLevel === "high" && <ShieldAlert className="w-4 h-4 text-rose-500" />}
              </h2>
              <p className="text-xs text-muted-foreground">Patient ID #{p.id} · {p.city}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-[10px] ${getRiskStyle(p.riskLevel)}`}>{p.riskLevel} risk</Badge>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="px-5 py-2 border-b bg-muted/30 flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
            onClick={() => { navigator.clipboard?.writeText(p.phone || ""); toast({ title: "Phone copied" }); }}>
            <Phone className="w-3 h-3" /> {p.phone}
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
            onClick={() => { navigator.clipboard?.writeText(p.email || ""); toast({ title: "Email copied" }); }}>
            <Mail className="w-3 h-3" /> Copy Email
          </Button>
          {p.riskLevel !== "high" ? (
            <Button size="sm" variant="outline" className="h-7 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 gap-1"
              onClick={() => escalate.mutate()}>
              <ShieldAlert className="w-3 h-3" /> Escalate
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="h-7 text-xs text-green-600 border-green-200 hover:bg-green-50 gap-1"
              onClick={() => deescalate.mutate()}>
              <CheckCircle className="w-3 h-3" /> De-escalate
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b px-5 overflow-x-auto shrink-0">
          {(["profile", "checkins", "metrics", "team", "notes", "appointments", "plan"] as DetailTab[]).map(t => (
            <button key={t} onClick={() => setDetailTab(t)}
              className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors capitalize ${detailTab === t ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              {t === "checkins" ? "Check-ins" : t === "team" ? "Care Team" : t === "plan" ? "Care Plan" : t === "appointments" ? "Appointments" : t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading && <div className="text-center text-sm text-muted-foreground py-10">Loading patient data...</div>}

          {/* Profile */}
          {!isLoading && detailTab === "profile" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <Phone className="w-3.5 h-3.5" />, label: "Phone", val: p.phone },
                  { icon: <Mail className="w-3.5 h-3.5" />, label: "Email", val: p.email },
                  { icon: <MapPin className="w-3.5 h-3.5" />, label: "City", val: p.city },
                  { icon: <Target className="w-3.5 h-3.5" />, label: "Goal", val: goalLabel(p.primaryGoal) },
                  { icon: <CalendarCheck className="w-3.5 h-3.5" />, label: "Program Week", val: `Week ${p.weekNumber}` },
                  { icon: <Star className="w-3.5 h-3.5" />, label: "Plan", val: p.plan },
                ].map(item => (
                  <div key={item.label} className="bg-muted/40 rounded-xl p-3">
                    <div className="text-[10px] text-muted-foreground uppercase flex items-center gap-1 mb-1">{item.icon} {item.label}</div>
                    <div className="text-sm font-semibold text-foreground capitalize">{item.val || "—"}</div>
                  </div>
                ))}
              </div>

              {/* Weight progress */}
              {p.startingWeight && (
                <Card className="border-border">
                  <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Weight Progress</CardTitle></CardHeader>
                  <CardContent className="pb-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">Starting</p>
                        <p className="font-bold text-foreground">{p.startingWeight} kg</p>
                      </div>
                      <div className="flex-1 mx-4 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.max(5, Math.min(95, ((p.startingWeight - p.currentWeight) / (p.startingWeight - p.targetWeight)) * 100))}%` }} />
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">Current</p>
                        <p className="font-bold text-primary">{p.currentWeight} kg</p>
                      </div>
                      <div className="ml-4 text-center">
                        <p className="text-[10px] text-muted-foreground">Target</p>
                        <p className="font-bold text-muted-foreground">{p.targetWeight} kg</p>
                      </div>
                    </div>
                    <p className="text-xs text-green-600 font-semibold mt-2 text-center">
                      ↓ {(p.startingWeight - p.currentWeight).toFixed(1)} kg lost · {(p.currentWeight - p.targetWeight).toFixed(1)} kg to goal
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Joined date */}
              <div className="text-xs text-muted-foreground text-center pt-1">
                Joined: {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}
              </div>
            </div>
          )}

          {/* Metrics */}
          {!isLoading && detailTab === "metrics" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground mb-3">Recent health metrics from Neon database</p>
              {(!detail?.metrics || detail.metrics.length === 0) ? (
                <div className="text-center text-muted-foreground text-sm py-10">No metrics recorded yet.</div>
              ) : (
                <div className="space-y-2">
                  {["weight", "glucose", "fasting_glucose", "sleep_hours", "hunger_score"].map(type => {
                    const entries = detail.metrics.filter((m: any) => m.type === type);
                    if (!entries.length) return null;
                    const latest = entries[0];
                    const unit = type === "weight" ? "kg" : type.includes("glucose") ? "mg/dL" : type === "sleep_hours" ? "hrs" : "/5";
                    const label = type === "weight" ? "Weight" : type === "glucose" ? "Glucose" : type === "fasting_glucose" ? "Fasting Glucose" : type === "sleep_hours" ? "Sleep" : "Hunger";
                    return (
                      <div key={type} className="border border-border/50 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-foreground">{label}</span>
                          <span className="text-xs text-muted-foreground">{entries.length} readings</span>
                        </div>
                        <div className="flex items-end gap-1 overflow-x-auto pb-1">
                          {entries.slice(0, 10).reverse().map((m: any, i: number) => {
                            const vals = entries.slice(0, 10).map((x: any) => x.value);
                            const min = Math.min(...vals), max = Math.max(...vals);
                            const range = max - min || 1;
                            const h = Math.round(20 + ((m.value - min) / range) * 30);
                            return (
                              <div key={i} className="flex flex-col items-center gap-0.5 shrink-0">
                                <span className="text-[9px] text-muted-foreground">{m.value}</span>
                                <div className="w-6 rounded-t bg-primary/60" style={{ height: `${h}px` }} />
                                <span className="text-[9px] text-muted-foreground">{m.date?.slice(5) || m.createdAt?.slice(5, 10)}</span>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1.5">Latest: <span className="font-semibold text-foreground">{latest.value} {unit}</span> on {latest.date || latest.createdAt?.slice(0, 10)}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Check-ins */}
          {!isLoading && detailTab === "checkins" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-3">Last {detail?.checkins?.length ?? 0} check-ins (most recent first)</p>
              {(!detail?.checkins || detail.checkins.length === 0) ? (
                <div className="text-center text-muted-foreground text-sm py-10">No check-ins recorded yet.</div>
              ) : detail.checkins.map((c: any, i: number) => (
                <div key={c.id ?? i} className="border border-border/50 rounded-xl p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">
                      {new Date(c.createdAt).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                    <div className="flex gap-1.5">
                      <Badge variant="outline" className={`text-[10px] px-1.5 ${c.mealsFollowed === "yes" ? "bg-green-50 text-green-700 border-green-200" : c.mealsFollowed === "partially" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                        {c.mealsFollowed === "yes" ? "✓ Meals" : c.mealsFollowed === "partially" ? "≈ Meals" : "✗ Meals"}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] px-1.5 ${c.activityCompleted ? "bg-green-50 text-green-700 border-green-200" : "bg-muted text-muted-foreground"}`}>
                        {c.activityCompleted ? "✓ Active" : "✗ Active"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-4 text-muted-foreground">
                    <span>Energy: <span className="font-medium text-foreground capitalize">{c.energyLevel}</span></span>
                    <span>Mood: <span className="font-medium text-foreground capitalize">{c.mood}</span></span>
                    {c.glucoseReading && <span>Glucose: <span className="font-medium text-foreground">{c.glucoseReading} mg/dL</span></span>}
                  </div>
                  {c.notes && <p className="text-muted-foreground italic">"{c.notes}"</p>}
                </div>
              ))}
            </div>
          )}

          {/* Care Team Assignment */}
          {!isLoading && detailTab === "team" && (
            <div className="space-y-5">
              <p className="text-xs text-muted-foreground">Assign this patient to their care team. Changes take effect immediately across all portals.</p>

              {/* Current team */}
              <Card className="border-border">
                <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Current Assignment</CardTitle></CardHeader>
                <CardContent className="space-y-2 pb-4">
                  {[
                    { label: "Physician", val: detail?.assignedPhysician, icon: <Stethoscope className="w-3.5 h-3.5 text-sky-500" /> },
                    { label: "Dietician", val: detail?.assignedDietician, icon: <Salad className="w-3.5 h-3.5 text-emerald-500" /> },
                    { label: "Caretaker", val: detail?.assignedCaretaker, icon: <UserCheck className="w-3.5 h-3.5 text-amber-500" /> },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2 text-sm">
                      {item.icon}
                      <span className="text-muted-foreground w-20">{item.label}:</span>
                      <span className={`font-medium ${item.val ? "text-foreground" : "text-muted-foreground italic"}`}>
                        {item.val || "Unassigned"}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Assignment controls */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Stethoscope className="w-3.5 h-3.5 text-sky-500" /> Physician
                  </label>
                  <Select value={selPhysician} onValueChange={setSelPhysician}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select physician" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Unassign —</SelectItem>
                      {physicians.map((ph: any) => (
                        <SelectItem key={ph.id} value={String(ph.id)}>
                          {ph.fullName} <span className="text-muted-foreground ml-1">({ph.specialty})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Salad className="w-3.5 h-3.5 text-emerald-500" /> Dietician
                  </label>
                  <Select value={selDietician} onValueChange={setSelDietician}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select dietician" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Unassign —</SelectItem>
                      {dieticians.map((d: any) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.fullName} <span className="text-muted-foreground ml-1">({d.specialty})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-amber-500" /> Caretaker
                  </label>
                  <Select value={selCaretaker} onValueChange={setSelCaretaker}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select caretaker" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Unassign —</SelectItem>
                      {caretakers.map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.fullName} <span className="text-muted-foreground ml-1">({c.specialty})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full rounded-xl" onClick={saveTeam} disabled={assignTeam.isPending}>
                  {assignTeam.isPending ? "Saving..." : "Save Care Team Assignment"}
                </Button>
              </div>
            </div>
          )}

          {/* Notes */}
          {!isLoading && detailTab === "notes" && (
            <div className="space-y-4">
              {/* Add note */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Add Clinical Note</label>
                <Textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                  placeholder="Enter observation, instruction, or clinical note..."
                  className="text-xs min-h-[80px] resize-none rounded-xl" />
                <Button size="sm" className="w-full rounded-xl text-xs" onClick={addNote} disabled={submittingNote || !noteText.trim()}>
                  <Plus className="w-3 h-3 mr-1" /> {submittingNote ? "Adding..." : "Add Note"}
                </Button>
              </div>

              {/* Notes list */}
              <div className="space-y-2">
                {(!detail?.notes || detail.notes.length === 0) ? (
                  <div className="text-center text-muted-foreground text-sm py-6">No notes yet.</div>
                ) : detail.notes.map((n: any, i: number) => (
                  <div key={n.id ?? i} className="border border-border/50 rounded-xl p-3 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <Badge variant="outline" className="text-[10px] capitalize">{n.category || "ops"}</Badge>
                      <span>{new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}</span>
                    </div>
                    <p className="text-xs text-foreground leading-relaxed">{n.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Appointments */}
          {!isLoading && detailTab === "appointments" && (
            <AppointmentScheduler patient={p} detail={detail} staff={staff} onRefresh={() => {
              qc.invalidateQueries({ queryKey: ["ops-patient-detail", patient.id] });
              onRefresh();
            }} />
          )}

          {/* Care Plan */}
          {!isLoading && detailTab === "plan" && (
            <div className="space-y-4">
              {detail?.nutritionPlan ? (
                <>
                  <Card className="border-border">
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Salad className="w-3.5 h-3.5 text-emerald-500" /> Nutrition Plan</CardTitle></CardHeader>
                    <CardContent className="pb-4"><p className="text-xs text-foreground leading-relaxed">{detail.nutritionPlan}</p></CardContent>
                  </Card>
                  <Card className="border-border">
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Activity className="w-3.5 h-3.5 text-sky-500" /> Activity Plan</CardTitle></CardHeader>
                    <CardContent className="pb-4"><p className="text-xs text-foreground leading-relaxed">{detail.activityPlan}</p></CardContent>
                  </Card>
                  <Card className="border-border">
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Target className="w-3.5 h-3.5 text-primary" /> Weekly Goals</CardTitle></CardHeader>
                    <CardContent className="pb-4"><p className="text-xs text-foreground leading-relaxed">{detail.weeklyGoals}</p></CardContent>
                  </Card>
                </>
              ) : (
                <div className="text-center text-muted-foreground text-sm py-10">No care plan on record.</div>
              )}

              {/* Appointments */}
              {detail?.appointments?.length > 0 && (
                <Card className="border-border">
                  <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5 text-primary" /> Appointments</CardTitle></CardHeader>
                  <CardContent className="space-y-2 pb-4">
                    {detail.appointments.slice(0, 5).map((a: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs border-b border-border/30 pb-1.5 last:border-0 last:pb-0">
                        <span className="font-medium text-foreground capitalize">{a.type || "Consultation"}</span>
                        <span className="text-muted-foreground">{a.scheduledAt ? new Date(a.scheduledAt).toLocaleDateString("en-IN") : "—"}</span>
                        <Badge variant="outline" className={`text-[10px] capitalize ${a.status === "completed" ? "bg-green-50 text-green-700 border-green-200" : a.status === "upcoming" ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-muted text-muted-foreground"}`}>
                          {a.status}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main Dashboard ──────────────────────────────────────────────── */
export default function OpsDashboard() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [tab, setTab] = useState<TabType>("patients");
  const [staffSearch, setStaffSearch] = useState("");
  const [regSearch, setRegSearch] = useState("");

  // Auth guard
  useEffect(() => {
    const token = localStorage.getItem("cloudberry_token");
    const role = localStorage.getItem("cloudberry_role");
    if (!token || role !== "ops") navigate("/ops/signin");
  }, []);

  const { data: kpi } = useQuery({
    queryKey: ["ops-dashboard"],
    queryFn: () => fetchJson("/ops/dashboard"),
    refetchInterval: 30000,
  });

  const { data: patients = [], isLoading: pLoading, refetch: refetchPatients } = useQuery({
    queryKey: ["ops-patients"],
    queryFn: () => fetchJson("/ops/patients"),
    refetchInterval: 30000,
  });

  const { data: staff = [], isLoading: sLoading } = useQuery({
    queryKey: ["ops-staff"],
    queryFn: () => fetchJson("/ops/staff"),
    refetchInterval: 60000,
  });

  const { data: leads = [], isLoading: lLoading, refetch: refetchLeads } = useQuery({
    queryKey: ["ops-leads"],
    queryFn: () => fetchJson("/ops/leads"),
    refetchInterval: 60000,
  });
  const [leadSearch, setLeadSearch] = useState("");

  const escalateMutation = useMutation({
    mutationFn: (id: number) => patchJson(`/ops/patients/${id}/escalate`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ops-patients"] }); toast({ title: "Patient escalated", variant: "destructive" }); },
  });

  const filteredPatients = (patients as any[]).filter((p: any) =>
    !search || p.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search) || p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.city?.toLowerCase().includes(search.toLowerCase())
  );

  // Sort registrations by newest first
  const registrations = [...(patients as any[])].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).filter((p: any) =>
    !regSearch || p.fullName?.toLowerCase().includes(regSearch.toLowerCase()) ||
    p.phone?.includes(regSearch) || p.email?.toLowerCase().includes(regSearch.toLowerCase())
  );

  const filteredStaff = (staff as any[]).filter((s: any) =>
    !staffSearch || s.fullName?.toLowerCase().includes(staffSearch.toLowerCase()) ||
    s.email?.toLowerCase().includes(staffSearch.toLowerCase())
  );

  const metrics = [
    { label: "Active Patients", value: kpi?.activePatients ?? "—", icon: <Users className="w-3 h-3" />, bg: "bg-sky-50", color: "text-sky-700" },
    { label: "Daily Adherence", value: kpi?.dailyAdherencePct ? `${kpi.dailyAdherencePct}%` : "—", icon: <CheckCircle className="w-3 h-3" />, bg: "bg-emerald-50", color: "text-emerald-700" },
    { label: "Missed Check-ins", value: kpi?.missedCheckins ?? "—", icon: <AlertTriangle className="w-3 h-3" />, bg: "bg-amber-50", color: "text-amber-700" },
    { label: "High Risk", value: kpi?.highRiskCount ?? "—", icon: <ShieldAlert className="w-3 h-3" />, bg: "bg-rose-50", color: "text-rose-700" },
    { label: "Appointments", value: kpi?.upcomingAppointments ?? "—", icon: <CalendarDays className="w-3 h-3" />, bg: "bg-purple-50", color: "text-purple-700" },
    { label: "Escalations", value: kpi?.escalationsPending ?? "—", icon: <Bell className="w-3 h-3" />, bg: "bg-orange-50", color: "text-orange-700" },
    { label: "Total Leads", value: kpi?.totalLeads ?? "—", icon: <TrendingUp className="w-3 h-3" />, bg: "bg-indigo-50", color: "text-indigo-700" },
    { label: "Staff", value: kpi?.totalStaff ?? "—", icon: <HeartPulse className="w-3 h-3" />, bg: "bg-pink-50", color: "text-pink-700" },
  ];

  const staffByRole = {
    physician: (staff as any[]).filter(s => s.role === "physician"),
    dietician: (staff as any[]).filter(s => s.role === "dietician"),
    caretaker: (staff as any[]).filter(s => s.role === "caretaker"),
  };

  return (
    <StaffLayout type="ops">
      {/* Patient detail panel */}
      {selectedPatient && (
        <PatientDetailPanel
          patient={selectedPatient}
          staff={staff as any[]}
          onClose={() => setSelectedPatient(null)}
          onRefresh={() => refetchPatients()}
        />
      )}

      <div className="p-4 md:p-5 max-w-7xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Operations Command Centre</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5"
              onClick={() => navigate("/patient/signup")}>
              <Plus className="w-3.5 h-3.5" /> Add Patient
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5"
              onClick={() => exportCSV(patients as any[])}>
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
            {(kpi?.highRiskCount ?? 0) > 0 && (
              <Button size="sm" variant="destructive" className="h-8 text-xs gap-1.5">
                <Bell className="w-3.5 h-3.5" /> {kpi?.highRiskCount} Alert{kpi?.highRiskCount > 1 ? "s" : ""}
              </Button>
            )}
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {metrics.map((m, i) => (
            <Card key={i} className={`border shadow-sm ${m.bg}`}>
              <CardContent className="p-4">
                <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  {m.icon}<span className="truncate">{m.label}</span>
                </div>
                <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border/60 overflow-x-auto">
          {(["patients", "registrations", "leads", "staff", "credentials"] as TabType[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${tab === t ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              {t === "patients" ? `Patient Roster (${(patients as any[]).length})`
                : t === "registrations" ? `Registrations (${(patients as any[]).length})`
                : t === "leads" ? `Leads (${(leads as any[]).length})`
                : t === "staff" ? `Care Team (${(staff as any[]).length})`
                : "Credentials"}
            </button>
          ))}
        </div>

        {/* ── PATIENTS TAB ─────────────────────────────────────────── */}
        {tab === "patients" && (
          <div className="space-y-4">
            <Card className="border-border shadow-sm overflow-hidden">
              <CardHeader className="border-b bg-muted/20 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="text-base text-foreground flex items-center gap-2">
                    Patient Care Roster
                    <span className="flex items-center gap-1.5 ml-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <Badge variant="outline" className="font-mono text-[10px]">Live</Badge>
                    </span>
                  </CardTitle>
                  <div className="relative w-full sm:w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input placeholder="Search name, phone, email..." value={search} onChange={e => setSearch(e.target.value)}
                      className="pl-8 h-8 text-xs rounded-lg border-border/60" />
                  </div>
                </div>
              </CardHeader>

              <div className="flex items-center gap-5 px-5 py-2.5 border-b bg-muted/10 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Low Risk</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Medium Risk</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> High Risk</span>
                <span className="ml-auto text-[10px]">Click any row to view full patient details & assign care team</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground bg-muted/20 border-b uppercase">
                    <tr>
                      <th className="px-4 py-3 font-medium">Patient</th>
                      <th className="px-4 py-3 font-medium">Plan / Risk</th>
                      <th className="px-4 py-3 font-medium">Adherence</th>
                      <th className="px-4 py-3 font-medium">Physician</th>
                      <th className="px-4 py-3 font-medium">Dietician</th>
                      <th className="px-4 py-3 font-medium">Caretaker</th>
                      <th className="px-4 py-3 font-medium">Last Check-in</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {pLoading && (
                      <tr><td colSpan={8} className="px-5 py-10 text-center text-muted-foreground text-sm">Loading patients...</td></tr>
                    )}
                    {!pLoading && filteredPatients.map((p: any) => (
                      <tr key={p.id}
                        className={`transition-colors cursor-pointer ${p.escalated ? "bg-rose-50/40 hover:bg-rose-50/60" : "hover:bg-muted/30"}`}
                        onClick={() => setSelectedPatient(p)}>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${getRiskDot(p.riskLevel)}`} />
                            {p.fullName}
                            {p.escalated && <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5 ml-4 flex items-center gap-2">
                            <span className="flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" />{p.phone}</span>
                            <span>Wk {p.weekNumber}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <Badge variant="outline" className={`capitalize text-[10px] px-2 py-0.5 border ${planColor(p.plan)}`}>{p.plan}</Badge>
                            <Badge variant="outline" className={`uppercase text-[10px] px-2 py-0.5 border block ${getRiskStyle(p.riskLevel)}`}>{p.riskLevel}</Badge>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${p.adherencePct >= 70 ? "bg-emerald-500" : p.adherencePct >= 40 ? "bg-amber-500" : "bg-rose-500"}`}
                                style={{ width: `${p.adherencePct}%` }} />
                            </div>
                            <span className={`text-xs font-semibold ${p.adherencePct >= 70 ? "text-emerald-600" : p.adherencePct >= 40 ? "text-amber-600" : "text-rose-600"}`}>
                              {p.adherencePct}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {p.assignedPhysician ? <span className="text-foreground font-medium">{p.assignedPhysician.split(" ").slice(0, 2).join(" ")}</span> : <span className="text-rose-400 italic">Unassigned</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {p.assignedDietician ? <span className="text-foreground font-medium">{p.assignedDietician.split(" ")[0]}</span> : <span className="text-amber-400 italic">Unassigned</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {p.assignedCaretaker ? <span className="text-foreground font-medium">{p.assignedCaretaker.split(" ")[0]}</span> : <span className="text-amber-400 italic">Unassigned</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{p.lastCheckinAt}</td>
                        <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-[10px] px-2"
                              onClick={() => setSelectedPatient(p)}>
                              View
                            </Button>
                            {!p.escalated && (
                              <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 text-rose-600 border-rose-200 hover:bg-rose-50"
                                onClick={() => escalateMutation.mutate(p.id)}>
                                Escalate
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!pLoading && filteredPatients.length === 0 && (
                      <tr><td colSpan={8} className="px-5 py-12 text-center text-muted-foreground text-sm">No patients found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Plan distribution */}
              <Card className="border-border shadow-sm">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Plan Distribution</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {["basic", "comprehensive", "premium"].map(plan => {
                    const count = (patients as any[]).filter((p: any) => p.plan === plan).length;
                    const pct = (patients as any[]).length > 0 ? Math.round((count / (patients as any[]).length) * 100) : 0;
                    return (
                      <div key={plan}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="capitalize font-medium text-foreground">{plan}</span>
                          <span className="text-muted-foreground">{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${plan === "premium" ? "bg-amber-500" : plan === "comprehensive" ? "bg-sky-500" : "bg-slate-400"}`}
                            style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Risk summary */}
              <Card className="border-border shadow-sm">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-rose-500" /> Risk Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
                  {["high", "medium", "low"].map(risk => {
                    const count = (patients as any[]).filter((p: any) => p.riskLevel === risk).length;
                    return (
                      <div key={risk} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${getRiskDot(risk)}`} />
                          <span className="text-sm capitalize text-foreground">{risk} risk</span>
                        </div>
                        <Badge variant="outline" className={`text-xs ${getRiskStyle(risk)}`}>{count}</Badge>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Unassigned */}
              <Card className="border-border shadow-sm">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Unassigned Patients</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
                  {[
                    { label: "No Physician", count: (patients as any[]).filter((p: any) => !p.assignedPhysician).length, icon: <Stethoscope className="w-3.5 h-3.5 text-sky-500" /> },
                    { label: "No Dietician", count: (patients as any[]).filter((p: any) => !p.assignedDietician).length, icon: <Salad className="w-3.5 h-3.5 text-emerald-500" /> },
                    { label: "No Caretaker", count: (patients as any[]).filter((p: any) => !p.assignedCaretaker).length, icon: <UserCheck className="w-3.5 h-3.5 text-amber-500" /> },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">{item.icon}<span className="text-sm text-foreground">{item.label}</span></div>
                      <Badge variant="outline" className={`text-xs ${item.count > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-green-50 text-green-700 border-green-200"}`}>
                        {item.count > 0 ? `${item.count} patients` : "All assigned"}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ── REGISTRATIONS TAB ────────────────────────────────────── */}
        {tab === "registrations" && (
          <div className="space-y-4">
            <Card className="border-border shadow-sm overflow-hidden">
              <CardHeader className="border-b bg-muted/20 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-base text-foreground">New Member Registrations</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">All registered patients, newest first. Phone and email verified at signup.</p>
                  </div>
                  <div className="relative w-full sm:w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input placeholder="Search..." value={regSearch} onChange={e => setRegSearch(e.target.value)}
                      className="pl-8 h-8 text-xs rounded-lg border-border/60" />
                  </div>
                </div>
              </CardHeader>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground bg-muted/20 border-b uppercase">
                    <tr>
                      <th className="px-5 py-3 font-medium">Name</th>
                      <th className="px-5 py-3 font-medium">Phone</th>
                      <th className="px-5 py-3 font-medium">Email</th>
                      <th className="px-5 py-3 font-medium">City</th>
                      <th className="px-5 py-3 font-medium">Plan</th>
                      <th className="px-5 py-3 font-medium">Goal</th>
                      <th className="px-5 py-3 font-medium">Joined</th>
                      <th className="px-5 py-3 font-medium">Care Team</th>
                      <th className="px-5 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {pLoading && (
                      <tr><td colSpan={9} className="px-5 py-10 text-center text-muted-foreground text-sm">Loading...</td></tr>
                    )}
                    {!pLoading && registrations.map((p: any, i: number) => {
                      const teamComplete = !!p.assignedPhysician && !!p.assignedDietician && !!p.assignedCaretaker;
                      return (
                        <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-3">
                            <div className="font-semibold text-foreground">{p.fullName}</div>
                            <div className="text-[10px] text-muted-foreground">ID #{p.id}</div>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1.5 text-xs">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              <span className="font-mono">{p.phone}</span>
                              <CheckCircle className="w-3 h-3 text-emerald-500" title="Phone verified at signup" />
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1.5 text-xs">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              <span className="truncate max-w-[160px]">{p.email}</span>
                              <CheckCircle className="w-3 h-3 text-emerald-500" title="Email verified at signup" />
                            </div>
                          </td>
                          <td className="px-5 py-3 text-xs text-muted-foreground">{p.city}</td>
                          <td className="px-5 py-3">
                            <Badge variant="outline" className={`capitalize text-[10px] ${planColor(p.plan)}`}>{p.plan}</Badge>
                          </td>
                          <td className="px-5 py-3 text-xs text-muted-foreground">{goalLabel(p.primaryGoal)}</td>
                          <td className="px-5 py-3 text-xs text-muted-foreground">
                            {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }) : "—"}
                          </td>
                          <td className="px-5 py-3">
                            <Badge variant="outline" className={`text-[10px] ${teamComplete ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                              {teamComplete ? "✓ Full team" : "⚠ Incomplete"}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Button size="sm" variant="outline" className="h-7 text-[10px] px-2"
                              onClick={() => { setSelectedPatient(p); setTab("patients"); }}>
                              Assign Team
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {!pLoading && registrations.length === 0 && (
                      <tr><td colSpan={9} className="px-5 py-12 text-center text-muted-foreground text-sm">No registrations found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Verification note */}
            <Card className="border-amber-200 bg-amber-50/60 shadow-sm">
              <CardContent className="pt-4 pb-4">
                <p className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Phone & Email Verification
                </p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Phone numbers are validated as 10-digit at signup (format checked, duplicate blocked). Emails are validated for format and uniqueness. Both are stored against the user record and visible here for manual verification if needed.
                  <br /><br />
                  The <span className="font-semibold">✓</span> badge indicates the field passed format validation and was unique in the system at time of registration. For OTP-based verification, this can be integrated via SMS/email service.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── LEADS TAB ────────────────────────────────────────────── */}
        {tab === "leads" && (
          <div className="space-y-4">
            <Card className="border-border shadow-sm overflow-hidden">
              <CardHeader className="border-b bg-muted/20 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-base text-foreground flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-primary" /> Inbound Leads
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Prospective patients from the website lead form. Convert to active patients by clicking "Onboard".</p>
                  </div>
                  <div className="relative w-full sm:w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input placeholder="Search leads..." value={leadSearch} onChange={e => setLeadSearch(e.target.value)}
                      className="pl-8 h-8 text-xs rounded-lg border-border/60" />
                  </div>
                </div>
              </CardHeader>

              {lLoading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Loading leads...</div>
              ) : (leads as any[]).length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <ClipboardList className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                  <p className="text-sm font-medium text-muted-foreground">No leads yet</p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Leads are created when a prospective patient fills out the website enquiry form. They'll appear here for follow-up and onboarding.
                  </p>
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate("/connect")}>
                    View Lead Form →
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground bg-muted/20 border-b uppercase">
                      <tr>
                        <th className="px-5 py-3 font-medium">Name</th>
                        <th className="px-5 py-3 font-medium">Phone</th>
                        <th className="px-5 py-3 font-medium">Email</th>
                        <th className="px-5 py-3 font-medium">City</th>
                        <th className="px-5 py-3 font-medium">Goal</th>
                        <th className="px-5 py-3 font-medium">Callback Time</th>
                        <th className="px-5 py-3 font-medium">Submitted</th>
                        <th className="px-5 py-3 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {(leads as any[]).filter((l: any) =>
                        !leadSearch || l.fullName?.toLowerCase().includes(leadSearch.toLowerCase()) ||
                        l.phone?.includes(leadSearch) || l.email?.toLowerCase().includes(leadSearch.toLowerCase())
                      ).map((l: any) => (
                        <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-3 font-semibold text-foreground">{l.fullName}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1.5 text-xs font-mono">
                              <Phone className="w-3 h-3 text-muted-foreground" />{l.phone}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-xs text-muted-foreground">{l.email || "—"}</td>
                          <td className="px-5 py-3 text-xs text-muted-foreground">{l.city}</td>
                          <td className="px-5 py-3"><Badge variant="outline" className="text-[10px] capitalize">{goalLabel(l.primaryGoal)}</Badge></td>
                          <td className="px-5 py-3 text-xs text-muted-foreground">{l.preferredCallbackTime || "Any time"}</td>
                          <td className="px-5 py-3 text-xs text-muted-foreground">
                            {l.createdAt ? new Date(l.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Button size="sm" className="h-7 text-[10px] px-3 bg-primary hover:bg-primary/90"
                              onClick={() => navigate(`/patient/signup`)}>
                              Onboard
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Summary card */}
            <Card className="border-indigo-200 bg-indigo-50/50 shadow-sm">
              <CardContent className="pt-4 pb-4">
                <p className="text-sm font-semibold text-indigo-800 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Lead Pipeline Summary
                </p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-indigo-700">{(leads as any[]).length}</p>
                    <p className="text-xs text-indigo-600">Total Leads</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-700">{(patients as any[]).length}</p>
                    <p className="text-xs text-emerald-600">Active Patients</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-sky-700">
                      {(leads as any[]).length + (patients as any[]).length > 0
                        ? Math.round(((patients as any[]).length / ((leads as any[]).length + (patients as any[]).length)) * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-sky-600">Conversion Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── STAFF TAB ────────────────────────────────────────────── */}
        {tab === "staff" && (
          <div className="space-y-4">
            <Card className="border-border shadow-sm overflow-hidden">
              <CardHeader className="border-b bg-muted/20 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="text-base text-foreground">Care Team Management</CardTitle>
                  <div className="relative w-full sm:w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input placeholder="Search staff..." value={staffSearch} onChange={e => setStaffSearch(e.target.value)}
                      className="pl-8 h-8 text-xs rounded-lg border-border/60" />
                  </div>
                </div>
              </CardHeader>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground bg-muted/20 border-b uppercase">
                    <tr>
                      <th className="px-5 py-3 font-medium">ID</th>
                      <th className="px-5 py-3 font-medium">Name</th>
                      <th className="px-5 py-3 font-medium">Role</th>
                      <th className="px-5 py-3 font-medium">Specialty</th>
                      <th className="px-5 py-3 font-medium">Email / Login</th>
                      <th className="px-5 py-3 font-medium">Patients</th>
                      <th className="px-5 py-3 font-medium">Password</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {sLoading && (
                      <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground text-sm">Loading care team...</td></tr>
                    )}
                    {!sLoading && filteredStaff.map((s: any) => (
                      <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-4"><span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">#{s.id}</span></td>
                        <td className="px-5 py-4"><div className="font-semibold text-foreground">{s.fullName}</div></td>
                        <td className="px-5 py-4">
                          <Badge variant="outline" className={`capitalize text-[10px] px-2 py-0.5 border flex items-center gap-1 w-fit ${roleColor(s.role)}`}>
                            {roleIcon(s.role)} {s.role}
                          </Badge>
                        </td>
                        <td className="px-5 py-4"><span className="text-xs text-muted-foreground">{s.specialty || "—"}</span></td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-foreground/80">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />{s.email}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-primary">{s.patientCount}</span>
                          <span className="text-xs text-muted-foreground ml-1">assigned</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs bg-muted/60 border border-border/40 px-2 py-0.5 rounded text-muted-foreground">demo123</span>
                        </td>
                      </tr>
                    ))}
                    {!sLoading && filteredStaff.length === 0 && (
                      <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground text-sm">No staff found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Demo Credentials Quick-ref */}
            <Card className="border-blue-200 bg-blue-50/60 shadow-sm">
              <CardContent className="pt-5 pb-5">
                <p className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Demo Credentials Reference (all password: demo123)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { role: "Operations", email: "ops@cloudberry.health" },
                    { role: "Physician", email: "dr.mehta@cloudberry.health" },
                    { role: "Dietician", email: "priya.diet@cloudberry.health" },
                    { role: "Caretaker", email: "ranjit.care@cloudberry.health" },
                  ].map(c => (
                    <div key={c.role} className="bg-white/80 rounded-xl border border-blue-200 p-3">
                      <p className="text-[10px] text-blue-600 font-semibold uppercase">{c.role}</p>
                      <p className="text-xs text-foreground mt-1 font-mono break-all">{c.email}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Password: <span className="font-mono">demo123</span></p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-blue-600 mt-3">
                  See the <button onClick={() => setTab("credentials")} className="underline font-semibold">🔑 Credentials tab</button> for the complete list of all patients and staff accounts.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── CREDENTIALS TAB ──────────────────────────────────────── */}
        {tab === "credentials" && (
          <div className="space-y-6">
            {/* Patient credentials (live from DB) */}
            <Card className="border-border shadow-sm overflow-hidden">
              <CardHeader className="border-b bg-muted/20 py-4">
                <CardTitle className="text-base text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" /> Patient Login Credentials
                  <Badge variant="outline" className="ml-2 text-[10px] font-mono">Password: demo123 · Login field: phone number</Badge>
                </CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground bg-muted/20 border-b uppercase">
                    <tr>
                      <th className="px-5 py-3 font-medium">Patient Name</th>
                      <th className="px-5 py-3 font-medium">Phone (Login ID)</th>
                      <th className="px-5 py-3 font-medium">Email</th>
                      <th className="px-5 py-3 font-medium">Plan</th>
                      <th className="px-5 py-3 font-medium">Password</th>
                      <th className="px-5 py-3 font-medium">Care Team Complete?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {(patients as any[]).map((p: any) => {
                      const teamComplete = !!p.assignedPhysician && !!p.assignedDietician && !!p.assignedCaretaker;
                      return (
                        <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-3 font-semibold text-foreground">{p.fullName}</td>
                          <td className="px-5 py-3"><span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{p.phone}</span></td>
                          <td className="px-5 py-3 text-xs text-muted-foreground">{p.email}</td>
                          <td className="px-5 py-3">
                            <Badge variant="outline" className={`capitalize text-[10px] px-2 py-0.5 ${planColor(p.plan)}`}>{p.plan}</Badge>
                          </td>
                          <td className="px-5 py-3">
                            <span className="font-mono text-xs bg-green-50 border border-green-200 text-green-800 px-2 py-0.5 rounded">demo123</span>
                          </td>
                          <td className="px-5 py-3">
                            <Badge variant="outline" className={`text-[10px] ${teamComplete ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                              {teamComplete ? "✓ Complete" : "⚠ Incomplete"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Staff credentials — live from DB */}
            <Card className="border-border shadow-sm overflow-hidden">
              <CardHeader className="border-b bg-muted/20 py-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base text-foreground flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-primary" /> Staff Portal Credentials
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Live from DB · {(staff as any[]).length} accounts</Badge>
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] font-mono">Sign in at /physician/signin</Badge>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground bg-muted/20 border-b uppercase">
                    <tr>
                      <th className="px-5 py-3 font-medium">Name</th>
                      <th className="px-5 py-3 font-medium">Role</th>
                      <th className="px-5 py-3 font-medium">Email</th>
                      <th className="px-5 py-3 font-medium">Specialty</th>
                      <th className="px-5 py-3 font-medium">Password</th>
                      <th className="px-5 py-3 font-medium">Patients</th>
                      <th className="px-5 py-3 font-medium text-right">Portal Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {sLoading ? (
                      <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground text-sm">Loading staff from database…</td></tr>
                    ) : (staff as any[]).map((s: any) => {
                      const dest = s.role === "physician" ? "/physician/dashboard"
                        : s.role === "dietician" ? "/dietician/dashboard"
                        : s.role === "caretaker" ? "/caretaker/dashboard"
                        : "/ops/dashboard";
                      const isOpsRole = s.role === "ops";
                      const accessPortal = () => {
                        if (isOpsRole) return;
                        const currentToken = localStorage.getItem("cloudberry_token");
                        const currentRole = localStorage.getItem("cloudberry_role");
                        const currentName = localStorage.getItem("cloudberry_name");
                        localStorage.setItem("cloudberry_ops_backup", JSON.stringify({ token: currentToken, role: currentRole, name: currentName }));
                        const previewToken = btoa(JSON.stringify({ userId: s.id, role: s.role }));
                        localStorage.setItem("cloudberry_token", previewToken);
                        localStorage.setItem("cloudberry_role", s.role);
                        localStorage.setItem("cloudberry_name", s.fullName);
                        if (s.specialty) localStorage.setItem("cloudberry_specialty", s.specialty);
                        navigate(dest);
                      };
                      return (
                        <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-3 font-semibold text-foreground">{s.fullName}</td>
                          <td className="px-5 py-3">
                            <Badge variant="outline" className={`capitalize text-[10px] px-2 py-0.5 flex items-center gap-1 w-fit ${roleColor(s.role)}`}>
                              {roleIcon(s.role)} {s.role}
                            </Badge>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5 text-xs text-foreground/80">
                              <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />{s.email}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-xs text-muted-foreground">{s.specialty || "—"}</td>
                          <td className="px-5 py-3">
                            <span className="font-mono text-xs bg-green-50 border border-green-200 text-green-800 px-2 py-0.5 rounded">demo123</span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-sm font-medium text-primary">{s.patientCount ?? 0}</span>
                            <span className="text-xs text-muted-foreground ml-1">assigned</span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            {!isOpsRole ? (
                              <Button size="sm" variant="outline" className="h-7 text-[10px] px-3 border-primary/30 text-primary hover:bg-primary/5"
                                onClick={accessPortal}>
                                <ExternalLink className="w-3 h-3 mr-1" /> Open Portal
                              </Button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">current portal</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Quick-start guide */}
            <Card className="border-blue-200 bg-blue-50/60 shadow-sm">
              <CardContent className="pt-5 pb-5">
                <p className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2"><Shield className="w-4 h-4" /> Quick Demo Guide</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-blue-900">
                  <div className="space-y-1.5">
                    <p className="font-semibold text-blue-700">Patient Portal</p>
                    <p>→ Sign in at <span className="font-mono">/patient/signin</span></p>
                    <p>→ Phone: any number from list above (e.g. 9876543210)</p>
                    <p>→ Password: <span className="font-mono">demo123</span></p>
                    <p>→ New patients see: Assessment → Check-in → Dashboard</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-semibold text-blue-700">Staff Portals (Physician / Dietician / Caretaker / Ops)</p>
                    <p>→ All sign in at <span className="font-mono">/physician/signin</span></p>
                    <p>→ Email: any from list above</p>
                    <p>→ Password: <span className="font-mono">demo123</span></p>
                    <p>→ Role-based auto-redirect to correct portal</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
