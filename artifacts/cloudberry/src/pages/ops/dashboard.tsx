import { StaffLayout } from "@/components/layout/staff-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Users, AlertTriangle, CheckCircle, Clock, ShieldAlert, HeartPulse,
  Download, Search, Phone, Mail, TrendingUp, Activity, Star,
  Stethoscope, Target, Dumbbell, Salad, UserCheck, Shield, ChevronRight,
  X, ChevronDown, Weight, MapPin, CalendarCheck, User, FileText,
  MessageSquare, Plus, ExternalLink, ArrowUp, ArrowDown, CalendarPlus, ClipboardList,
  UserPlus, Lock, History,
} from "lucide-react";
import { StaffConsistencyHistory } from "@/components/ConsistencyHistory";
import { ClinicalNotesTab, CriticalNotesTab, EscalationsTab, DietPlanTab, RecordsTab, ActivityFeedTab, PatientDocumentsTab } from "@/components/clinical/ClinicalTabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

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

type TabType = "pending" | "patients" | "registrations" | "staff" | "credentials";
type DetailTab = "dashboard" | "profile" | "checkins" | "team" | "content" | "plan" | "clinical-notes" | "critical-notes" | "escalations" | "diet-plan" | "records" | "activity" | "documents";

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
  const [detailTab, setDetailTab] = useState<DetailTab>("dashboard");
  const [noteText, setNoteText] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  const { data: detail, isLoading } = useQuery({
    queryKey: ["ops-patient-detail", patient.id],
    queryFn: () => fetchJson(`/ops/patients/${patient.id}/detail`),
    staleTime: 30000,
  });

  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ["ops-patient-dashboard", patient.id],
    queryFn: () => fetchJson(`/ops/patients/${patient.id}/dashboard`),
    staleTime: 60000,
    enabled: detailTab === "dashboard",
  });

  const physicians = staff.filter(s => s.role === "physician");
  const dieticians = staff.filter(s => s.role === "dietician");
  const caretakers = staff.filter(s => s.role === "caretaker");

  const [selPhysician, setSelPhysician] = useState<string>("");
  const [selDietician, setSelDietician] = useState<string>("");
  const [selCaretaker, setSelCaretaker] = useState<string>("");
  const [targetWeightInput, setTargetWeightInput] = useState("");

  useEffect(() => {
    if (detail) {
      setSelPhysician(detail.assignedPhysicianId ? String(detail.assignedPhysicianId) : "none");
      setSelDietician(detail.assignedDieticianId ? String(detail.assignedDieticianId) : "none");
      setSelCaretaker(detail.assignedCaretakerId ? String(detail.assignedCaretakerId) : "none");
      setTargetWeightInput(detail.targetWeight ? String(detail.targetWeight) : "");
    }
  }, [detail]);

  const targetWeightMut = useMutation({
    mutationFn: (weight: number) => patchJson(`/ops/patients/${patient.id}/target-weight`, { targetWeight: weight }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ops-patients"] });
      qc.invalidateQueries({ queryKey: ["ops-patient-detail", patient.id] });
      toast({ title: "Target weight updated" });
      onRefresh();
    },
    onError: () => toast({ title: "Failed to update target weight", variant: "destructive" }),
  });

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
          <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${p.riskLevel === "high" ? "bg-rose-100 text-rose-700" : "bg-primary/10 text-primary"}`}>
              {p.fullName?.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-foreground flex items-center gap-1.5 min-w-0">
                <span className="truncate">{p.fullName}</span>
                {p.riskLevel === "high" && <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />}
              </h2>
              <p className="text-xs text-muted-foreground truncate">Patient ID #{p.id} · {p.city}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
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
        </div>

        {/* Tabs */}
        <div className="flex border-b px-2 overflow-x-auto shrink-0">
          {([
            { key: "dashboard", label: "Dashboard" },
            { key: "profile", label: "Profile" },
            { key: "checkins", label: "Check-ins" },
            { key: "team", label: "Care Team" },
            { key: "content", label: "Content" },
            { key: "plan", label: "Care Plan" },
            { key: "clinical-notes", label: "Clinical Notes" },
            { key: "critical-notes", label: "Critical" },
            { key: "escalations", label: "Escalations" },
            { key: "diet-plan", label: "Diet Plan" },
            { key: "documents", label: "Documents" },
            { key: "records", label: "Records" },
            { key: "activity", label: "Activity" },
          ] as { key: DetailTab; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setDetailTab(t.key)}
              className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${detailTab === t.key ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading && <div className="text-center text-sm text-muted-foreground py-10">Loading patient data...</div>}

          {/* Dashboard */}
          {detailTab === "dashboard" && (
            <div className="space-y-4">
              {(isLoading || dashLoading) && !dashData && (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
              )}
              {dashData && (() => {
                const d = dashData;
                const adherence = d.adherence7Day || [];
                const energyMap: Record<number, string> = {3:"#22c55e",2:"#f59e0b",1:"#ef4444"};
                const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day:"numeric", month:"short" });
                const completedDays = adherence.filter((a: any) => a.completed === true).length;
                return (
                  <>
                    {/* KPI row */}
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: "Plan", value: p.plan ? p.plan.charAt(0).toUpperCase() + p.plan.slice(1) : "—" },
                        { label: "Week", value: `Week ${p.weekNumber ?? "—"}` },
                        { label: "Adherence", value: `${d.adherencePct ?? "—"}%` },
                        { label: "Check-ins", value: `${completedDays}/7` },
                      ].map(s => (
                        <div key={s.label} className="bg-muted/40 rounded-xl p-2.5 min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5 truncate">{s.label}</p>
                          <p className="font-bold text-foreground text-xs leading-snug break-words">{s.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* 7-day adherence grid */}
                    <Card className="border-border">
                      <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Weekly Adherence</CardTitle></CardHeader>
                      <CardContent className="pb-3">
                        <div className="flex justify-between gap-1">
                          {adherence.map((day: any, i: number) => (
                            <div key={i} className="flex flex-col items-center gap-1">
                              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${day.completed === true ? "bg-emerald-50 border-emerald-400" : day.completed === false ? "bg-rose-50 border-rose-300" : "bg-slate-100 border-slate-200"}`}>
                                {day.completed === true ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : day.completed === false ? <span className="w-3 h-0.5 bg-rose-400 rounded" /> : <span className="w-3 h-0.5 bg-slate-300 rounded" />}
                              </div>
                              <span className="text-[10px] text-muted-foreground">{day.dow}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Behavioral Consistency */}
                    {(() => {
                      const cb = d.consistencyBreakdown;
                      const sleep = cb?.sleep ?? 0;
                      const nutrition = cb?.mealLogging ?? 0;
                      const activity = cb?.activity ?? 0;
                      const overall = cb ? Math.round((sleep + nutrition + activity) / 3) : null;
                      const scoreColor = overall === null ? "#94a3b8" : overall >= 70 ? "#22c55e" : overall >= 45 ? "#f59e0b" : "#ef4444";
                      const scoreBg = overall === null ? "bg-slate-50 text-slate-500 border-slate-200"
                        : overall >= 70 ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : overall >= 45 ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200";
                      const scoreLabel = overall === null ? "No data" : overall >= 70 ? "Strong" : overall >= 45 ? "Moderate" : "Needs Work";
                      const bars = [
                        { label: "Sleep", value: sleep, color: "bg-indigo-500" },
                        { label: "Nutrition", value: nutrition, color: "bg-emerald-500" },
                        { label: "Activity", value: activity, color: "bg-violet-500" },
                      ];
                      return (
                        <Card className="border-border">
                          <CardHeader className="pb-1">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                              <Activity className="w-3.5 h-3.5 text-emerald-600" /> Behavioral Consistency
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pb-3">
                            <div className="flex items-end gap-3 mb-3 pb-2.5 border-b border-border/40">
                              <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Overall Score</p>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-3xl font-extrabold leading-none" style={{ color: scoreColor }}>{overall ?? "—"}</span>
                                  <span className="text-xs text-muted-foreground">/100</span>
                                </div>
                              </div>
                              <Badge variant="outline" className={`text-[10px] border mb-0.5 ${scoreBg}`}>{scoreLabel}</Badge>
                            </div>
                            <div className="space-y-2.5">
                              {bars.map(b => (
                                <div key={b.label}>
                                  <div className="flex items-center justify-between text-[10px] mb-1">
                                    <span className="text-foreground/80 font-medium">{b.label}</span>
                                    <span className="font-bold text-foreground tabular-nums">{b.value}<span className="text-muted-foreground font-normal">/100</span></span>
                                  </div>
                                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-500 ${b.color}`} style={{ width: `${b.value}%` }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })()}

                    {/* Consistency history */}
                    <Card className="border-border">
                      <CardHeader className="pb-1">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                          <History className="w-3.5 h-3.5 text-primary" /> Consistency History
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <StaffConsistencyHistory patientId={p.id} role="ops" compact />
                      </CardContent>
                    </Card>

                    {/* Weight trend */}
                    {d.weightSeries?.length > 1 && (
                      <Card className="border-border">
                        <CardHeader className="pb-1"><CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-primary" /> Weight Trend {d.weightChange !== null && <span className={`ml-1 ${d.weightChange < 0 ? "text-emerald-600" : "text-rose-500"}`}>{d.weightChange < 0 ? "↓" : "↑"}{Math.abs(d.weightChange)} kg</span>}</CardTitle></CardHeader>
                        <CardContent className="pb-3">
                          <ResponsiveContainer width="100%" height={90}>
                            <LineChart data={d.weightSeries} margin={{ top: 4, right: 10, bottom: 4, left: -10 }}>
                              <XAxis dataKey="date" tick={{ fontSize: 8 }} tickFormatter={fmt} />
                              <YAxis tick={{ fontSize: 8 }} domain={["auto","auto"]} width={28} />
                              <Tooltip formatter={(v: number) => [`${v} kg`, "Weight"]} labelFormatter={fmt} />
                              <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 2 }} />
                            </LineChart>
                          </ResponsiveContainer>
                          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                            {p.startingWeight && <span>Start: <strong className="text-foreground">{p.startingWeight} kg</strong></span>}
                            {p.currentWeight && <span>Now: <strong className="text-foreground">{p.currentWeight} kg</strong></span>}
                            {p.targetWeight && <span>Goal: <strong className="text-foreground">{p.targetWeight} kg</strong></span>}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Energy trend */}
                    {d.energySeries?.length > 0 && (
                      <Card className="border-border">
                        <CardHeader className="pb-1"><CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Energy & Wellbeing (Self-Reported)</CardTitle></CardHeader>
                        <CardContent className="pb-3">
                          <ResponsiveContainer width="100%" height={80}>
                            <BarChart data={d.energySeries} barCategoryGap="30%">
                              <XAxis dataKey="date" tick={{ fontSize: 8 }} tickFormatter={fmt} />
                              <YAxis tick={false} domain={[0,3]} hide />
                              <Tooltip formatter={(v: number) => [v===3?"High":v===2?"Moderate":"Low","Energy"]} labelFormatter={fmt} />
                              <Bar dataKey="value" radius={[3,3,0,0]}>
                                {d.energySeries.map((e: any, i: number) => (
                                  <Cell key={i} fill={energyMap[e.value as number] || "#94a3b8"} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}

                    {/* Glucose */}
                    {(d.fastingGlucoseSeries?.length > 1 || d.postMealGlucoseSeries?.length > 1 || d.glucoseSeries?.length > 1) && (() => {
                      const fasting: any[] = d.fastingGlucoseSeries || d.glucoseSeries || [];
                      const postMeal: any[] = d.postMealGlucoseSeries || [];
                      const map: Record<string, any> = {};
                      for (const p of fasting) map[p.date] = { ...map[p.date], date: p.date, fasting: p.value };
                      for (const p of postMeal) map[p.date] = { ...map[p.date], date: p.date, postMeal: p.value };
                      const merged = Object.values(map).sort((a: any, b: any) => a.date.localeCompare(b.date));
                      return (
                        <Card className="border-border">
                          <CardHeader className="pb-1"><CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">Glucose Trend {d.avgGlucose && <span className="ml-1 text-foreground">avg {d.avgGlucose} mg/dL</span>}</CardTitle></CardHeader>
                          <CardContent className="pb-3">
                            <ResponsiveContainer width="100%" height={90}>
                              <LineChart data={merged} margin={{ top: 4, right: 10, bottom: 4, left: -10 }}>
                                <XAxis dataKey="date" tick={{ fontSize: 8 }} tickFormatter={fmt} />
                                <YAxis tick={{ fontSize: 8 }} domain={[60,200]} width={28} />
                                <Tooltip formatter={(v: number, name: string) => [`${v} mg/dL`, name === "fasting" ? "Fasting" : "Post-Meal"]} labelFormatter={fmt} />
                                <Line type="monotone" dataKey="fasting" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} connectNulls />
                                <Line type="monotone" dataKey="postMeal" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} connectNulls />
                              </LineChart>
                            </ResponsiveContainer>
                            <div className="flex gap-3 mt-1">
                              <span className="flex items-center gap-1 text-[9px] text-muted-foreground"><span className="inline-block w-3 h-0.5 bg-rose-500 rounded" />Fasting</span>
                              <span className="flex items-center gap-1 text-[9px] text-muted-foreground"><span className="inline-block w-3 h-0.5 bg-blue-500 rounded" />Post-Meal</span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })()}

                    {/* Ops Content Summary */}
                    {d.opsContent && (
                      <Card className="border-border">
                        <CardHeader className="pb-1"><CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1"><ClipboardList className="w-3.5 h-3.5 text-primary" /> Care Content Published</CardTitle></CardHeader>
                        <CardContent className="pb-3 space-y-2">
                          {d.opsContent.weeklyMessage && <p className="text-xs text-foreground italic break-words">"{d.opsContent.weeklyMessage}"</p>}
                          {(d.opsContent.insights || []).length > 0 && (
                            <div className="text-xs text-muted-foreground">{d.opsContent.insights.length} insight(s) published · {(d.opsContent.thisWeekFocus || []).length} focus item(s)</div>
                          )}
                          <button className="text-xs text-primary underline" onClick={() => setDetailTab("content")}>Edit care content →</button>
                        </CardContent>
                      </Card>
                    )}

                    {/* Next appointment */}
                    {d.nextAppointment && (
                      <Card className="border-border">
                        <CardHeader className="pb-1"><CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Next Appointment</CardTitle></CardHeader>
                        <CardContent className="pb-3 text-xs">
                          <p className="font-semibold text-foreground">{new Date(d.nextAppointment.scheduledAt).toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long" })}</p>
                          <p className="text-muted-foreground">{new Date(d.nextAppointment.scheduledAt).toLocaleTimeString("en-IN", { hour:"numeric", minute:"2-digit" })}{d.nextAppointment.careTeamMember ? ` · ${d.nextAppointment.careTeamMember}` : ""}</p>
                        </CardContent>
                      </Card>
                    )}
                  </>
                );
              })()}
              {!dashData && !dashLoading && (
                <div className="text-center py-8 text-sm text-muted-foreground">Dashboard data unavailable</div>
              )}
            </div>
          )}

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
                  { icon: <Lock className="w-3.5 h-3.5" />, label: "Password", val: p.password },
                ].map(item => (
                  <div key={item.label} className="bg-muted/40 rounded-xl p-3">
                    <div className="text-[10px] text-muted-foreground uppercase flex items-center gap-1 mb-1">{item.icon} {item.label}</div>
                    <div className={`text-sm font-semibold text-foreground break-all leading-snug ${item.label !== "Password" ? "capitalize" : "font-mono"}`}>{item.val || "—"}</div>
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

              {/* Target weight editor */}
              <Card className="border-border">
                <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1"><Target className="w-3.5 h-3.5 text-primary" /> Set Target Weight</CardTitle></CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input type="number" value={targetWeightInput} onChange={e => setTargetWeightInput(e.target.value)}
                        placeholder={p.targetWeight ? String(p.targetWeight) : "e.g. 72"}
                        className="flex h-9 w-full rounded-xl border border-border/60 bg-muted/30 px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">kg</span>
                    </div>
                    <Button size="sm" className="h-9 rounded-xl"
                      disabled={targetWeightMut.isPending || !targetWeightInput}
                      onClick={() => targetWeightMut.mutate(Number(targetWeightInput))}>
                      {targetWeightMut.isPending ? "Saving…" : "Update"}
                    </Button>
                  </div>
                  {p.targetWeight && <p className="text-xs text-muted-foreground mt-1.5">Current target: <strong className="text-foreground">{p.targetWeight} kg</strong></p>}
                </CardContent>
              </Card>

              {/* Joined date */}
              <div className="text-xs text-muted-foreground text-center pt-1">
                Joined: {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}
              </div>
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
                  {c.notes && <p className="text-muted-foreground italic break-words">"{c.notes}"</p>}
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
                      <span className={`font-medium truncate flex-1 ${item.val ? "text-foreground" : "text-muted-foreground italic"}`}>
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

          {/* Care Content Editor */}
          {!isLoading && detailTab === "content" && (
            <OpsContentEditor patient={p} />
          )}


          {/* Care Plan */}
          {!isLoading && detailTab === "plan" && (
            <div className="space-y-4">
              <OpsPlanEditor patient={p} detail={detail} />
            </div>
          )}

          {/* Clinical Notes tab */}
          {!isLoading && detailTab === "clinical-notes" && (
            <ClinicalNotesTab patientId={patient.id} prefix="ops" />
          )}

          {/* Critical Notes tab */}
          {!isLoading && detailTab === "critical-notes" && (
            <CriticalNotesTab patientId={patient.id} prefix="ops" />
          )}

          {/* Escalations tab */}
          {!isLoading && detailTab === "escalations" && (
            <EscalationsTab patientId={patient.id} prefix="ops" isOps={true} />
          )}

          {/* Diet Plan tab */}
          {!isLoading && detailTab === "diet-plan" && (
            <DietPlanTab patientId={patient.id} prefix="ops" canUpload={true} canComment={true} />
          )}

          {/* Documents tab */}
          {!isLoading && detailTab === "documents" && (
            <PatientDocumentsTab patientId={patient.id} prefix="ops" />
          )}

          {/* Records tab */}
          {!isLoading && detailTab === "records" && (
            <RecordsTab patientId={patient.id} prefix="ops" enrolledAt={p.createdAt} />
          )}

          {/* Activity Feed tab */}
          {!isLoading && detailTab === "activity" && (
            <ActivityFeedTab patientId={patient.id} prefix="ops" />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Ops Content Editor ──────────────────────────────────────────── */
const EMPTY_CONTENT = {
  thisWeekFocus: [{ icon: "salad", text: "" }, { icon: "walk", text: "" }],
  insights: [
    { kind: "challenge", title: "", body: "" },
    { kind: "positive", title: "", body: "" },
    { kind: "recommended", title: "", body: "" },
  ],
  coachReview: { date: "", time: "", duration: "30 min", providerName: "", focusAreas: [] as string[] },
  weeklyMessage: "",
};

function OpsContentEditor({ patient }: { patient: any }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: content, isLoading } = useQuery({
    queryKey: ["ops-patient-content", patient.id],
    queryFn: () => fetchJson(`/ops/patients/${patient.id}/content`),
    staleTime: 30000,
  });
  const [form, setForm] = useState<any>(null);
  useEffect(() => {
    if (content !== undefined && form === null) {
      setForm(content ? JSON.parse(JSON.stringify(content)) : JSON.parse(JSON.stringify(EMPTY_CONTENT)));
    }
  }, [content]);

  const save = useMutation({
    mutationFn: () => postJson(`/ops/patients/${patient.id}/content`, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ops-patient-content", patient.id] });
      qc.invalidateQueries({ queryKey: ["ops-patient-dashboard", patient.id] });
      toast({ title: "Care content saved", description: "Patient dashboard will reflect the updated content." });
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  if (isLoading || !form) return <div className="text-sm text-muted-foreground text-center py-8">Loading care content...</div>;

  const setFocus = (idx: number, field: string, value: string) => {
    const arr = [...(form.thisWeekFocus || [])];
    arr[idx] = { ...arr[idx], [field]: value };
    setForm({ ...form, thisWeekFocus: arr });
  };
  const setInsight = (idx: number, field: string, value: string) => {
    const arr = [...(form.insights || [])];
    arr[idx] = { ...arr[idx], [field]: value };
    setForm({ ...form, insights: arr });
  };
  const setCR = (field: string, value: any) => setForm({ ...form, coachReview: { ...form.coachReview, [field]: value } });

  const kindCls: Record<string, string> = {
    challenge: "bg-rose-50 border-rose-200",
    positive: "bg-emerald-50 border-emerald-200",
    recommended: "bg-blue-50 border-blue-200",
  };

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
        This content appears directly on the patient's dashboard. Fill in all sections and save when ready.
      </div>

      {/* This Week's Focus */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">This Week's Focus</h3>
        {(form.thisWeekFocus || []).map((item: any, i: number) => (
          <div key={i} className="flex gap-2">
            <Select value={item.icon} onValueChange={v => setFocus(i, "icon", v)}>
              <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[["salad","🥗 Meal"],["walk","🚶 Walk"],["sleep","😴 Sleep"],["water","💧 Water"],["medicine","💊 Medicine"]].map(([v,l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input value={item.text} onChange={e => setFocus(i, "text", e.target.value)}
              placeholder={`Focus item ${i + 1}`} className="h-8 text-xs flex-1" />
            <Button size="sm" variant="ghost" className="h-8 px-2 text-rose-500 hover:text-rose-700" onClick={() => {
              setForm({ ...form, thisWeekFocus: (form.thisWeekFocus || []).filter((_: any, j: number) => j !== i) });
            }}><X className="w-3 h-3" /></Button>
          </div>
        ))}
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() =>
          setForm({ ...form, thisWeekFocus: [...(form.thisWeekFocus || []), { icon: "walk", text: "" }] })}>
          + Add Focus Item
        </Button>
      </div>

      {/* Weekly Insights */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">Weekly Insights</h3>
        {(form.insights || []).map((ins: any, i: number) => (
          <div key={i} className={`rounded-xl border p-3 space-y-2 ${kindCls[ins.kind] || "bg-muted/40 border-border"}`}>
            <div className="flex gap-2 items-center">
              <Select value={ins.kind} onValueChange={v => setInsight(i, "kind", v)}>
                <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="challenge">Challenge</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="recommended">Recommended</SelectItem>
                </SelectContent>
              </Select>
              <Input value={ins.title} onChange={e => setInsight(i, "title", e.target.value)}
                placeholder="Insight title" className="h-7 text-xs flex-1" />
            </div>
            <Textarea value={ins.body} onChange={e => setInsight(i, "body", e.target.value)}
              placeholder="Insight detail..." className="text-xs min-h-[50px] resize-none" />
          </div>
        ))}
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() =>
          setForm({ ...form, insights: [...(form.insights || []), { kind: "recommended", title: "", body: "" }] })}>
          + Add Insight
        </Button>
      </div>

      {/* Coach Review */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">Coach Review Details</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Date", type: "date", field: "date", val: form.coachReview?.date || "" },
            { label: "Time", type: "time", field: "time", val: form.coachReview?.time || "" },
            { label: "Duration", type: "text", field: "duration", val: form.coachReview?.duration || "", ph: "e.g. 30 min" },
          ].map(f => (
            <div key={f.field} className="space-y-0.5">
              <label className="text-[10px] text-muted-foreground">{f.label}</label>
              <Input type={f.type} value={f.val} placeholder={(f as any).ph}
                onChange={e => setCR(f.field, e.target.value)} className="h-8 text-xs" />
            </div>
          ))}
          <div className="space-y-0.5">
            <label className="text-[10px] text-muted-foreground">Provider (Caretaker)</label>
            <div className="h-8 text-xs flex items-center px-3 rounded-md border border-border/40 bg-muted/30 text-foreground/70">
              {patient.assignedCaretaker || <span className="italic text-muted-foreground">Not assigned</span>}
            </div>
          </div>
        </div>
        <div className="space-y-0.5">
          <label className="text-[10px] text-muted-foreground">Focus Areas (one per line)</label>
          <Textarea
            value={(form.coachReview?.focusAreas || []).join("\n")}
            onChange={e => setCR("focusAreas", e.target.value.split("\n"))}
            placeholder={"Dinner consistency\nEvening cravings\nActivity completion"}
            className="text-xs min-h-[70px] resize-none" />
        </div>
      </div>

      {/* Motivational Message */}
      <div className="space-y-1">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">Motivational Message</h3>
        <Textarea value={form.weeklyMessage || ""}
          onChange={e => setForm({ ...form, weeklyMessage: e.target.value })}
          placeholder="A short motivational message for the patient..."
          className="text-xs min-h-[70px] resize-none" />
      </div>

      <Button className="w-full rounded-xl" onClick={() => save.mutate()} disabled={save.isPending}>
        {save.isPending ? "Saving..." : "Save Care Content to Dashboard"}
      </Button>
    </div>
  );
}

/* ── Ops Plan Editor ─────────────────────────────────────────────── */
function OpsPlanEditor({ patient, detail }: { patient: any; detail: any }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [nutrition, setNutrition] = useState(detail?.nutritionPlan || "");
  const [activity, setActivity] = useState(detail?.activityPlan || "");
  const [goals, setGoals] = useState(detail?.weeklyGoals || "");

  useEffect(() => {
    setNutrition(detail?.nutritionPlan || "");
    setActivity(detail?.activityPlan || "");
    setGoals(detail?.weeklyGoals || "");
  }, [detail?.nutritionPlan, detail?.activityPlan, detail?.weeklyGoals]);

  const save = useMutation({
    mutationFn: () => patchJson(`/ops/patients/${patient.id}/plan`, { nutritionPlan: nutrition, activityPlan: activity, weeklyGoals: goals }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ops-patient-detail", patient.id] });
      qc.invalidateQueries({ queryKey: ["ops-patient-dashboard", patient.id] });
      toast({ title: "Care plan updated", description: "Changes saved successfully." });
    },
    onError: () => toast({ title: "Failed to save plan", variant: "destructive" }),
  });

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Salad className="w-3.5 h-3.5 text-emerald-500" /> Nutrition Plan</label>
        <Textarea value={nutrition} onChange={e => setNutrition(e.target.value)}
          placeholder="Describe the nutrition plan..." className="text-xs min-h-[80px] resize-none rounded-xl" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Activity className="w-3.5 h-3.5 text-sky-500" /> Activity Plan</label>
        <Textarea value={activity} onChange={e => setActivity(e.target.value)}
          placeholder="Describe the activity plan..." className="text-xs min-h-[80px] resize-none rounded-xl" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Target className="w-3.5 h-3.5 text-primary" /> Weekly Goals</label>
        <Textarea value={goals} onChange={e => setGoals(e.target.value)}
          placeholder="List the weekly goals..." className="text-xs min-h-[60px] resize-none rounded-xl" />
      </div>
      <Button className="w-full rounded-xl" onClick={() => save.mutate()} disabled={save.isPending}>
        {save.isPending ? "Saving..." : "Save Care Plan"}
      </Button>
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
  const [tab, setTab] = useState<TabType>("pending");
  const [credentialsUnlocked, setCredentialsUnlocked] = useState(false);
  const [credGatePass, setCredGatePass] = useState("");
  const [credGateError, setCredGateError] = useState(false);
  const [staffSearch, setStaffSearch] = useState("");
  const [regSearch, setRegSearch] = useState("");
  const [addingStaff, setAddingStaff] = useState(false);
  const [staffForm, setStaffForm] = useState({ fullName: "", email: "", phone: "", role: "physician", specialty: "", password: "" });
  const [addCoachDietOpen, setAddCoachDietOpen] = useState(false);
  const [coachDietStep, setCoachDietStep] = useState<1 | 2>(1);
  const [coachDietRole, setCoachDietRole] = useState<"dietician" | "coach">("dietician");
  const [coachDietForm, setCoachDietForm] = useState({ fullName: "", email: "", phone: "", specialty: "", password: "" });
  const closeCoachDiet = () => {
    setAddCoachDietOpen(false);
    setCoachDietStep(1);
    setCoachDietForm({ fullName: "", email: "", phone: "", specialty: "", password: "" });
  };

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

  const { data: staff = [], isLoading: sLoading, refetch: refetchStaff } = useQuery({
    queryKey: ["ops-staff"],
    queryFn: () => fetchJson("/ops/staff"),
    refetchInterval: 60000,
  });

  const { data: credentialsData = {} as any } = useQuery({
    queryKey: ["ops-credentials"],
    queryFn: () => fetchJson("/ops/credentials"),
    enabled: tab === "credentials",
    staleTime: 30000,
  });
  const credStaff: any[] = credentialsData?.staff || [];
  const credPatients: any[] = credentialsData?.patients || [];

  const addStaffMutation = useMutation({
    mutationFn: (data: any) => postJson("/ops/staff", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ops-staff"] });
      refetchStaff();
      setAddingStaff(false);
      setStaffForm({ fullName: "", email: "", phone: "", role: "physician", specialty: "", password: "" });
      toast({ title: "Staff member added successfully" });
    },
    onError: () => toast({ title: "Failed to add staff member", variant: "destructive" }),
  });

  const { data: pendingPatients = [], isLoading: pendingLoading, refetch: refetchPending } = useQuery({
    queryKey: ["ops-pending"],
    queryFn: () => fetchJson("/ops/pending-approvals"),
    refetchInterval: 15000,
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => postJson(`/ops/patients/${id}/approve`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ops-pending"] });
      qc.invalidateQueries({ queryKey: ["ops-patients"] });
      qc.invalidateQueries({ queryKey: ["ops-dashboard"] });
      toast({ title: "Patient approved", description: "Their portal has been activated." });
    },
    onError: () => toast({ title: "Failed to approve", variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => postJson(`/ops/patients/${id}/reject`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ops-pending"] });
      toast({ title: "Application rejected", variant: "destructive" });
    },
    onError: () => toast({ title: "Failed to reject", variant: "destructive" }),
  });

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
    { label: "Daily Adherence", value: kpi?.dailyAdherencePct !== undefined ? `${kpi.dailyAdherencePct}%` : "—", icon: <CheckCircle className="w-3 h-3" />, bg: "bg-emerald-50", color: "text-emerald-700" },
    { label: "Missed Check-ins", value: kpi?.missedCheckins ?? "—", icon: <AlertTriangle className="w-3 h-3" />, bg: "bg-amber-50", color: "text-amber-700" },
    { label: "High Risk", value: kpi?.highRiskCount ?? "—", icon: <ShieldAlert className="w-3 h-3" />, bg: "bg-rose-50", color: "text-rose-700" },
    { label: "Total Leads", value: kpi?.totalLeads ?? "—", icon: <TrendingUp className="w-3 h-3" />, bg: "bg-violet-50", color: "text-violet-700" },
    { label: "Conversion", value: kpi?.conversionRate !== undefined ? `${kpi.conversionRate}%` : "—", icon: <Activity className="w-3 h-3" />, bg: "bg-teal-50", color: "text-teal-700" },
    { label: "Upcoming Appts", value: kpi?.upcomingAppointments ?? "—", icon: <CalendarCheck className="w-3 h-3" />, bg: "bg-indigo-50", color: "text-indigo-700" },
    { label: "Care Team", value: kpi?.totalStaff ?? "—", icon: <HeartPulse className="w-3 h-3" />, bg: "bg-pink-50", color: "text-pink-700" },
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

      {/* Add Dietician / Fitness Coach Dialog */}
      <Dialog open={addCoachDietOpen} onOpenChange={open => { if (!open) closeCoachDiet(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {coachDietStep === 1 ? "Add Dietician or Fitness Coach" : `Add ${coachDietRole === "dietician" ? "Dietician" : "Fitness Coach"}`}
            </DialogTitle>
          </DialogHeader>

          {coachDietStep === 1 ? (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">Choose the role you want to add to the care team:</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setCoachDietRole("dietician"); setCoachDietStep(2); }}
                  className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-border/60 hover:border-emerald-400 hover:bg-emerald-50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                    <Salad className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">Dietician</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Nutrition specialist</p>
                  </div>
                </button>
                <button
                  onClick={() => { setCoachDietRole("coach"); setCoachDietStep(2); }}
                  className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-border/60 hover:border-blue-400 hover:bg-blue-50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Dumbbell className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">Fitness Coach</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Movement & activity</p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${coachDietRole === "dietician" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
                {coachDietRole === "dietician" ? <Salad className="w-3.5 h-3.5" /> : <Dumbbell className="w-3.5 h-3.5" />}
                {coachDietRole === "dietician" ? "Dietician — Nutrition Specialist" : "Fitness Coach — Movement & Activity"}
                <button onClick={() => setCoachDietStep(1)} className="ml-auto underline text-[10px] opacity-70 hover:opacity-100">Change</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-[10px] text-muted-foreground mb-1 block font-medium">Full Name *</label>
                  <Input value={coachDietForm.fullName} onChange={e => setCoachDietForm(f => ({ ...f, fullName: e.target.value }))}
                    placeholder={coachDietRole === "dietician" ? "Priya Sharma" : "Vikram Singh"} className="h-9 text-sm rounded-lg" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block font-medium">Email *</label>
                  <Input type="email" value={coachDietForm.email} onChange={e => setCoachDietForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="name@cloudberry.health" className="h-9 text-sm rounded-lg" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block font-medium">Phone</label>
                  <Input value={coachDietForm.phone} onChange={e => setCoachDietForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+91 99999 00000" className="h-9 text-sm rounded-lg" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block font-medium">Specialty</label>
                  <Input value={coachDietForm.specialty} onChange={e => setCoachDietForm(f => ({ ...f, specialty: e.target.value }))}
                    placeholder={coachDietRole === "dietician" ? "Clinical Nutrition" : "Strength & Conditioning"} className="h-9 text-sm rounded-lg" />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={closeCoachDiet} className="text-sm">Cancel</Button>
            {coachDietStep === 2 && (
              <Button
                onClick={() => {
                  addStaffMutation.mutate({ ...coachDietForm, role: coachDietRole }, {
                    onSuccess: closeCoachDiet,
                  });
                }}
                disabled={addStaffMutation.isPending || !coachDietForm.fullName || !coachDietForm.email}
                className="text-sm"
              >
                {addStaffMutation.isPending ? "Adding…" : `Add ${coachDietRole === "dietician" ? "Dietician" : "Coach"}`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <Button size="sm" className="h-8 text-xs gap-1.5"
              onClick={() => { setCoachDietStep(1); setAddCoachDietOpen(true); }}>
              <UserPlus className="w-3.5 h-3.5" /> Add Dietician / Coach
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5"
              onClick={() => exportCSV(patients as any[])}>
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
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
          {(["pending", "patients", "registrations", "staff", "credentials"] as TabType[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${tab === t ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              {t === "pending" ? (
                <span className="flex items-center gap-1.5">
                  Pending Approvals
                  {(pendingPatients as any[]).length > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                      {(pendingPatients as any[]).length}
                    </span>
                  )}
                </span>
              ) : t === "patients" ? `Patient Roster (${(patients as any[]).length})`
                : t === "registrations" ? `Registrations (${(patients as any[]).length})`
                : t === "staff" ? `Care Team (${(staff as any[]).length})`
                : "Credentials"}
            </button>
          ))}
        </div>

        {/* ── PENDING APPROVALS TAB ────────────────────────────────── */}
        {tab === "pending" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Pending Patient Applications</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Review and approve or reject new patient sign-ups before their portal is activated.</p>
              </div>
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => refetchPending()}>
                Refresh
              </Button>
            </div>

            {pendingLoading && (
              <div className="text-center text-sm text-muted-foreground py-12">Loading pending applications...</div>
            )}

            {!pendingLoading && (pendingPatients as any[]).length === 0 && (
              <Card className="border-border shadow-sm">
                <CardContent className="py-16 text-center">
                  <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                  <p className="text-base font-semibold text-foreground">All clear!</p>
                  <p className="text-sm text-muted-foreground mt-1">No pending applications at this time.</p>
                </CardContent>
              </Card>
            )}

            {!pendingLoading && (pendingPatients as any[]).length > 0 && (
              <div className="space-y-3">
                {(pendingPatients as any[]).map((p: any) => (
                  <Card key={p.id} className="border-amber-200/70 shadow-sm bg-amber-50/20">
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center font-bold text-sm text-amber-700 shrink-0">
                            {p.fullName?.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground text-sm">{p.fullName}</h3>
                              <Badge variant="outline" className={`text-[10px] ${planColor(p.plan)}`}>{p.plan}</Badge>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{p.phone}</span>
                              <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{p.email}</span>
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.city || "—"}</span>
                              <span className="flex items-center gap-1"><Target className="w-3 h-3" />{goalLabel(p.primaryGoal)}</span>
                            </div>
                            {p.preferredCallbackTime && (
                              <p className="text-xs text-muted-foreground mt-1">
                                <span className="font-medium">Preferred callback:</span> {p.preferredCallbackTime}
                              </p>
                            )}
                            <p className="text-[10px] text-muted-foreground mt-1.5">
                              Applied {p.createdAt ? new Date(p.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0 sm:flex-col sm:items-end">
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                            onClick={() => approveMutation.mutate(p.id)}
                            disabled={approveMutation.isPending || rejectMutation.isPending}
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 gap-1.5"
                            onClick={() => rejectMutation.mutate(p.id)}
                            disabled={approveMutation.isPending || rejectMutation.isPending}
                          >
                            <X className="w-3.5 h-3.5" /> Reject
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
                      <th className="px-4 py-3 font-medium">Program</th>
                      <th className="px-4 py-3 font-medium">Consistency</th>
                      <th className="px-4 py-3 font-medium">Date Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {pLoading && (
                      <tr><td colSpan={4} className="px-5 py-10 text-center text-muted-foreground text-sm">Loading patients...</td></tr>
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
                          <div className="text-[10px] text-muted-foreground mt-0.5 ml-4">{p.city} · Week {p.weekNumber}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`capitalize text-[10px] px-2 py-0.5 border whitespace-nowrap ${planColor(p.plan)}`}>{p.plan}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${p.adherencePct >= 70 ? "bg-emerald-500" : p.adherencePct >= 40 ? "bg-amber-500" : "bg-rose-500"}`}
                                style={{ width: `${p.adherencePct ?? 0}%` }} />
                            </div>
                            <span className={`text-xs font-semibold ${p.adherencePct >= 70 ? "text-emerald-600" : p.adherencePct >= 40 ? "text-amber-600" : "text-rose-600"}`}>
                              {p.adherencePct ?? "—"}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </td>
                      </tr>
                    ))}
                    {!pLoading && filteredPatients.length === 0 && (
                      <tr><td colSpan={4} className="px-5 py-12 text-center text-muted-foreground text-sm">No patients found.</td></tr>
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
                              <CheckCircle className="w-3 h-3 text-emerald-500" />
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1.5 text-xs">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              <span className="truncate max-w-[160px]">{p.email}</span>
                              <CheckCircle className="w-3 h-3 text-emerald-500" />
                            </div>
                          </td>
                          <td className="px-5 py-3 text-xs text-muted-foreground">{p.city}</td>
                          <td className="px-5 py-3">
                            <Badge variant="outline" className={`capitalize text-[10px] whitespace-nowrap ${planColor(p.plan)}`}>{p.plan}</Badge>
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

        {/* ── STAFF TAB ────────────────────────────────────────────── */}
        {tab === "staff" && (
          <div className="space-y-4">
            <Card className="border-border shadow-sm overflow-hidden">
              <CardHeader className="border-b bg-muted/20 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="text-base text-foreground">Care Team Management</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-48">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input placeholder="Search staff..." value={staffSearch} onChange={e => setStaffSearch(e.target.value)}
                        className="pl-8 h-8 text-xs rounded-lg border-border/60" />
                    </div>
                    <Button size="sm" className="h-8 text-xs gap-1.5 whitespace-nowrap" onClick={() => setAddingStaff(v => !v)}>
                      <Plus className="w-3.5 h-3.5" /> Add Staff
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Add Staff Form */}
              {addingStaff && (
                <div className="border-b bg-primary/5 px-5 py-4">
                  <p className="text-xs font-semibold text-foreground mb-3">New Staff Member</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">Full Name *</label>
                      <Input value={staffForm.fullName} onChange={e => setStaffForm(f => ({ ...f, fullName: e.target.value }))}
                        placeholder="Dr. Jane Doe" className="h-8 text-xs rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">Email *</label>
                      <Input type="email" value={staffForm.email} onChange={e => setStaffForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="jane@cloudberry.health" className="h-8 text-xs rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">Phone</label>
                      <Input value={staffForm.phone} onChange={e => setStaffForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="+91 99999 00000" className="h-8 text-xs rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">Role *</label>
                      <select value={staffForm.role} onChange={e => setStaffForm(f => ({ ...f, role: e.target.value }))}
                        className="flex h-8 w-full rounded-lg border border-border/60 bg-white px-3 text-xs outline-none focus:ring-2 focus:ring-primary/30">
                        <option value="physician">Physician</option>
                        <option value="dietician">Dietician</option>
                        <option value="caretaker">Caretaker</option>
                        <option value="ops">Ops</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">Specialty</label>
                      <Input value={staffForm.specialty} onChange={e => setStaffForm(f => ({ ...f, specialty: e.target.value }))}
                        placeholder="Endocrinology" className="h-8 text-xs rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">Password *</label>
                      <Input type="password" value={staffForm.password} onChange={e => setStaffForm(f => ({ ...f, password: e.target.value }))}
                        placeholder="Set initial password" className="h-8 text-xs rounded-lg" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-8 text-xs" disabled={addStaffMutation.isPending || !staffForm.fullName || !staffForm.email || !staffForm.password}
                      onClick={() => addStaffMutation.mutate(staffForm)}>
                      {addStaffMutation.isPending ? "Adding..." : "Add Staff Member"}
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setAddingStaff(false)}>Cancel</Button>
                  </div>
                </div>
              )}

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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {sLoading && (
                      <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground text-sm">Loading care team...</td></tr>
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
                      </tr>
                    ))}
                    {!sLoading && filteredStaff.length === 0 && (
                      <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground text-sm">No staff found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

          </div>
        )}

        {/* ── CREDENTIALS TAB ──────────────────────────────────────── */}
        {tab === "credentials" && !credentialsUnlocked && (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-full max-w-sm bg-white border border-border rounded-2xl shadow-sm p-8 space-y-5 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-base text-foreground">Restricted Access</p>
                <p className="text-sm text-muted-foreground mt-1">This tab contains sensitive credentials. Enter the platform password to continue.</p>
              </div>
              <div className="space-y-2 text-left">
                <label className="text-xs font-medium text-muted-foreground">Platform Password</label>
                <input
                  type="password"
                  value={credGatePass}
                  onChange={e => { setCredGatePass(e.target.value); setCredGateError(false); }}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      if (credGatePass === "Cloudberry_ViewIt@$123") { setCredentialsUnlocked(true); setCredGatePass(""); }
                      else setCredGateError(true);
                    }
                  }}
                  placeholder="Enter password…"
                  className={`w-full h-9 rounded-xl border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition ${credGateError ? "border-rose-400 bg-rose-50" : "border-border bg-background"}`}
                />
                {credGateError && <p className="text-xs text-rose-600">Incorrect password. Please try again.</p>}
              </div>
              <Button className="w-full rounded-xl" onClick={() => {
                if (credGatePass === "Cloudberry_ViewIt@$123") { setCredentialsUnlocked(true); setCredGatePass(""); }
                else setCredGateError(true);
              }}>Unlock</Button>
            </div>
          </div>
        )}

        {tab === "credentials" && credentialsUnlocked && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Credentials unlocked for this session</p>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => setCredentialsUnlocked(false)}>Lock</Button>
            </div>
            {/* Patient credentials (live from DB) */}
            <Card className="border-border shadow-sm overflow-hidden">
              <CardHeader className="border-b bg-muted/20 py-4">
                <CardTitle className="text-base text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" /> Patient Accounts
                  <Badge variant="outline" className="ml-2 text-[10px]">Login field: phone number</Badge>
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

            {/* Staff credentials — live from DB with passwords */}
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
                      <th className="px-5 py-3 font-medium">Phone</th>
                      <th className="px-5 py-3 font-medium">Password</th>
                      <th className="px-5 py-3 font-medium text-right">Portal Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {sLoading ? (
                      <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground text-sm">Loading staff from database…</td></tr>
                    ) : (staff as any[]).map((s: any) => {
                      const credRow = credStaff.find((c: any) => c.id === s.id);
                      const isPhysician = s.role === "physician";
                      const accessPortal = () => {
                        if (!isPhysician) return;
                        const currentToken = localStorage.getItem("cloudberry_token");
                        const currentRole = localStorage.getItem("cloudberry_role");
                        const currentName = localStorage.getItem("cloudberry_name");
                        localStorage.setItem("cloudberry_ops_backup", JSON.stringify({ token: currentToken, role: currentRole, name: currentName }));
                        const previewToken = btoa(JSON.stringify({ userId: s.id, role: s.role }));
                        localStorage.setItem("cloudberry_token", previewToken);
                        localStorage.setItem("cloudberry_role", s.role);
                        localStorage.setItem("cloudberry_name", s.fullName);
                        if (s.specialty) localStorage.setItem("cloudberry_specialty", s.specialty);
                        navigate("/physician/dashboard");
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
                          <td className="px-5 py-3 text-xs text-muted-foreground font-mono">{credRow?.phone || s.phone || "—"}</td>
                          <td className="px-5 py-3">
                            {credRow?.password ? (
                              <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded select-all">{credRow.password}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right">
                            {isPhysician ? (
                              <Button size="sm" variant="outline" className="h-7 text-[10px] px-3 border-primary/30 text-primary hover:bg-primary/5"
                                onClick={accessPortal}>
                                <ExternalLink className="w-3 h-3 mr-1" /> Open Portal
                              </Button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

          </div>
        )}
      </div>
    </StaffLayout>
  );
}
