import { StaffLayout } from "@/components/layout/staff-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Users, AlertTriangle, CheckCircle, Clock, ShieldAlert, HeartPulse, CalendarDays,
  Bell, Download, Search, Phone, Mail, TrendingUp, Activity, Star,
  Stethoscope, Target, Dumbbell, Salad, UserCheck, Shield, ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

type TabType = "patients" | "staff" | "credentials";

export default function OpsDashboard() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [tab, setTab] = useState<TabType>("patients");
  const [staffSearch, setStaffSearch] = useState("");

  const { data: kpi } = useQuery({
    queryKey: ["ops-dashboard"],
    queryFn: () => fetchJson("/ops/dashboard"),
    refetchInterval: 30000,
  });

  const { data: patients = [], isLoading: pLoading } = useQuery({
    queryKey: ["ops-patients"],
    queryFn: () => fetchJson("/ops/patients"),
    refetchInterval: 30000,
  });

  const { data: staff = [], isLoading: sLoading } = useQuery({
    queryKey: ["ops-staff"],
    queryFn: () => fetchJson("/ops/staff"),
    refetchInterval: 60000,
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, coachId }: { id: number; coachId: number }) =>
      patchJson(`/ops/patients/${id}/assign`, { coachId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ops-patients"] }); toast({ title: "Coach assigned" }); },
  });

  const escalateMutation = useMutation({
    mutationFn: (id: number) => patchJson(`/ops/patients/${id}/escalate`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ops-patients"] });
      qc.invalidateQueries({ queryKey: ["ops-dashboard"] });
      toast({ title: "Patient escalated", description: "Clinical team notified.", variant: "destructive" });
    },
  });

  const physicians = (staff as any[]).filter(s => ["physician", "coach", "dietician", "caretaker"].includes(s.role));

  const filteredPatients = (patients as any[]).filter((p: any) =>
    !search ||
    p.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    p.plan?.toLowerCase().includes(search.toLowerCase()) ||
    p.riskLevel?.toLowerCase().includes(search.toLowerCase()) ||
    p.city?.toLowerCase().includes(search.toLowerCase()) ||
    String(p.id).includes(search)
  );

  const filteredStaff = (staff as any[]).filter(s =>
    !staffSearch ||
    s.fullName?.toLowerCase().includes(staffSearch.toLowerCase()) ||
    s.email?.toLowerCase().includes(staffSearch.toLowerCase()) ||
    s.role?.toLowerCase().includes(staffSearch.toLowerCase()) ||
    String(s.id).includes(staffSearch)
  );

  const metrics = [
    { label: "Active Patients", value: kpi?.activePatients ?? "—", icon: <Users className="w-4 h-4 text-primary" />, color: "text-foreground", bg: "bg-primary/5 border-primary/20" },
    { label: "Daily Adherence", value: kpi ? `${kpi.dailyAdherencePct}%` : "—", icon: <CheckCircle className="w-4 h-4 text-emerald-600" />, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
    { label: "Missed Check-ins", value: kpi?.missedCheckins ?? "—", icon: <Clock className="w-4 h-4 text-amber-600" />, color: "text-amber-700", bg: "bg-amber-50 border-amber-100" },
    { label: "High Risk", value: kpi?.highRiskCount ?? "—", icon: <HeartPulse className="w-4 h-4 text-rose-600" />, color: "text-rose-700", bg: "bg-rose-50 border-rose-100" },
    { label: "Appointments", value: kpi?.upcomingAppointments ?? "—", icon: <CalendarDays className="w-4 h-4 text-sky-600" />, color: "text-sky-700", bg: "bg-sky-50 border-sky-100" },
    { label: "Escalations", value: kpi?.escalationsPending ?? "—", icon: <AlertTriangle className="w-4 h-4 text-orange-600" />, color: "text-orange-700", bg: "bg-orange-50 border-orange-100" },
    { label: "Care Team", value: kpi?.totalStaff ?? "—", icon: <Star className="w-4 h-4 text-violet-600" />, color: "text-violet-700", bg: "bg-violet-50 border-violet-100" },
    { label: "Avg Adherence", value: kpi ? `${kpi.dailyAdherencePct}%` : "—", icon: <Activity className="w-4 h-4 text-teal-600" />, color: "text-teal-700", bg: "bg-teal-50 border-teal-100" },
  ];

  return (
    <StaffLayout type="ops">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Operations Dashboard</h1>
            <p className="text-muted-foreground text-sm">Live monitoring, care team management, and escalation tracking.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" className="gap-2 text-xs rounded-full"
              onClick={() => toast({ title: "Reminders Sent", description: "WhatsApp reminders sent to all patients with missed check-ins." })}>
              <Bell className="w-3.5 h-3.5" /> Send Reminders
            </Button>
            <Button size="sm" variant="outline" className="gap-2 text-xs rounded-full"
              onClick={() => toast({ title: "Export Started", description: "Generating CSV report..." })}>
              <Download className="w-3.5 h-3.5" /> Export Report
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
        <div className="flex gap-1 border-b border-border/60">
          {(["patients", "staff", "credentials"] as TabType[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-medium transition-colors capitalize ${tab === t ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t === "patients" ? `Patient Roster (${(patients as any[]).length})`
                : t === "staff" ? `Care Team (${(staff as any[]).length})`
                : "🔑 Demo Credentials"}
            </button>
          ))}
        </div>

        {tab === "patients" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Patient Table */}
            <div className="lg:col-span-2 space-y-4">
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
                    <div className="relative w-full sm:w-48">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input placeholder="Search patients..." value={search} onChange={e => setSearch(e.target.value)}
                        className="pl-8 h-8 text-xs rounded-lg border-border/60" />
                    </div>
                  </div>
                </CardHeader>

                <div className="flex items-center gap-5 px-5 py-2.5 border-b bg-muted/10 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Low Risk</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Medium Risk</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> High Risk</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground bg-muted/20 border-b uppercase">
                      <tr>
                        <th className="px-4 py-3 font-medium">ID / Patient</th>
                        <th className="px-4 py-3 font-medium">Plan</th>
                        <th className="px-4 py-3 font-medium">Risk</th>
                        <th className="px-4 py-3 font-medium">Adherence</th>
                        <th className="px-4 py-3 font-medium">Coach</th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {pLoading && (
                        <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground text-sm">Loading patients...</td></tr>
                      )}
                      {!pLoading && filteredPatients.map((p: any) => (
                        <tr key={p.id} className={`transition-colors ${p.escalated ? "bg-rose-50/40" : "hover:bg-muted/30"}`}>
                          <td className="px-4 py-3">
                            <button onClick={() => setSelectedPatient(p)} className="text-left group w-full">
                              <div className="font-semibold text-foreground flex items-center gap-2 group-hover:text-primary transition-colors">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${getRiskDot(p.riskLevel)}`} />
                                {p.fullName}
                                {p.escalated && <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />}
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-0.5 ml-4">
                                ID #{p.id} · Wk {p.weekNumber} · {p.lastCheckinAt}
                              </div>
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={`capitalize text-[10px] px-2 py-0.5 border ${planColor(p.plan)}`}>
                              {p.plan}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={`uppercase text-[10px] px-2 py-0.5 border ${getRiskStyle(p.riskLevel)}`}>
                              {p.riskLevel}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${p.adherencePct >= 75 ? "bg-emerald-500" : p.adherencePct >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                                  style={{ width: `${p.adherencePct}%` }} />
                              </div>
                              <span className={`text-xs font-semibold ${p.adherencePct < 50 ? "text-rose-600" : p.adherencePct < 75 ? "text-amber-600" : "text-emerald-600"}`}>
                                {p.adherencePct}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {p.assignedCoach ? (
                              <span className="text-xs text-foreground/70">{p.assignedCoach}</span>
                            ) : (
                              <Select onValueChange={(val) => assignMutation.mutate({ id: p.id, coachId: parseInt(val) })}>
                                <SelectTrigger className="h-7 w-32 text-xs border-border/60">
                                  <SelectValue placeholder="Assign..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {physicians.map((ph: any) => (
                                    <SelectItem key={ph.id} value={String(ph.id)}>{ph.fullName}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm"
                                onClick={() => toast({ title: "Reminder Sent", description: `Reminder sent to ${p.fullName}.` })}
                                className="text-muted-foreground hover:text-sky-600 hover:bg-sky-50 h-7 w-7 p-0">
                                <Bell className="w-3.5 h-3.5" />
                              </Button>
                              {!p.escalated ? (
                                <Button variant="outline" size="sm"
                                  onClick={() => escalateMutation.mutate(p.id)}
                                  disabled={escalateMutation.isPending}
                                  className="hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-xs h-7 px-2">
                                  Escalate
                                </Button>
                              ) : (
                                <Badge className="bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-50 font-medium text-xs px-2">
                                  Escalated
                                </Badge>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!pLoading && filteredPatients.length === 0 && (
                        <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground text-sm">No patients match your search.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-border shadow-sm bg-emerald-50/60">
                  <CardContent className="p-4 text-center">
                    <Target className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-emerald-700">{kpi ? `${kpi.dailyAdherencePct}%` : "—"}</p>
                    <p className="text-xs text-emerald-600 mt-0.5">Avg Adherence</p>
                  </CardContent>
                </Card>
                <Card className="border-border shadow-sm bg-sky-50/60">
                  <CardContent className="p-4 text-center">
                    <Stethoscope className="w-5 h-5 text-sky-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-sky-700">{kpi?.upcomingAppointments ?? "—"}</p>
                    <p className="text-xs text-sky-600 mt-0.5">Upcoming Sessions</p>
                  </CardContent>
                </Card>
                <Card className="border-border shadow-sm bg-violet-50/60">
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="w-5 h-5 text-violet-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-violet-700">{(patients as any[]).length}</p>
                    <p className="text-xs text-violet-600 mt-0.5">Total Patients</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right Column — Patient Detail or Stats */}
            <div className="space-y-5">
              {selectedPatient ? (
                <Card className="border-border shadow-sm">
                  <CardHeader className="border-b pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-foreground">{selectedPatient.fullName}</CardTitle>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setSelectedPatient(null)}>
                      <span className="text-muted-foreground text-xs">✕</span>
                    </Button>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-muted/30 rounded-lg p-2">
                        <p className="text-muted-foreground text-[10px]">Patient ID</p>
                        <p className="font-bold text-foreground">#{selectedPatient.id}</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-2">
                        <p className="text-muted-foreground text-[10px]">User ID</p>
                        <p className="font-bold text-foreground">#{selectedPatient.userId}</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-2">
                        <p className="text-muted-foreground text-[10px]">Plan</p>
                        <p className="font-semibold capitalize">{selectedPatient.plan}</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-2">
                        <p className="text-muted-foreground text-[10px]">Week</p>
                        <p className="font-semibold">Week {selectedPatient.weekNumber}</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-2">
                        <p className="text-muted-foreground text-[10px]">Adherence</p>
                        <p className="font-bold text-primary">{selectedPatient.adherencePct}%</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-2">
                        <p className="text-muted-foreground text-[10px]">Streak</p>
                        <p className="font-bold text-emerald-600">{selectedPatient.streak} days</p>
                      </div>
                    </div>
                    {selectedPatient.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{selectedPatient.email}</span>
                      </div>
                    )}
                    {selectedPatient.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span>{selectedPatient.phone}</span>
                      </div>
                    )}
                    {selectedPatient.city && (
                      <div className="text-muted-foreground">City: {selectedPatient.city}</div>
                    )}
                    {selectedPatient.startingWeight && (
                      <div className="bg-muted/20 rounded-lg p-3 space-y-1">
                        <p className="text-muted-foreground text-[10px] uppercase font-medium">Weight Progress</p>
                        <p>Start: <span className="font-semibold">{selectedPatient.startingWeight} kg</span></p>
                        <p>Current: <span className="font-semibold text-primary">{selectedPatient.currentWeight} kg</span></p>
                        <p>Target: <span className="font-semibold">{selectedPatient.targetWeight} kg</span></p>
                      </div>
                    )}
                    <div className="text-muted-foreground">
                      Total check-ins: <span className="font-semibold text-foreground">{selectedPatient.totalCheckins}</span>
                    </div>
                    {selectedPatient.assignedCoach && (
                      <div className="text-muted-foreground">
                        Coach: <span className="font-semibold text-foreground">{selectedPatient.assignedCoach}</span>
                      </div>
                    )}
                    <div className="text-muted-foreground">
                      Last check-in: <span className="font-semibold text-foreground">{selectedPatient.lastCheckinAt}</span>
                    </div>
                    {!selectedPatient.escalated && (
                      <Button variant="destructive" size="sm" className="w-full text-xs h-8"
                        onClick={() => { escalateMutation.mutate(selectedPatient.id); setSelectedPatient(null); }}>
                        <ShieldAlert className="w-3.5 h-3.5 mr-1.5" /> Escalate Patient
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-border shadow-sm">
                  <CardHeader className="border-b pb-3">
                    <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" /> Plan Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    {["basic", "comprehensive", "premium"].map(plan => {
                      const count = (patients as any[]).filter((p: any) => p.plan === plan).length;
                      const pct = (patients as any[]).length > 0 ? Math.round((count / (patients as any[]).length) * 100) : 0;
                      return (
                        <div key={plan}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="capitalize font-medium text-foreground">{plan}</span>
                            <span className="text-muted-foreground">{count} patients ({pct}%)</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${plan === "premium" ? "bg-amber-500" : plan === "comprehensive" ? "bg-sky-500" : "bg-slate-400"}`}
                              style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    <p className="text-[10px] text-muted-foreground pt-1">Click a patient to view their full profile</p>
                  </CardContent>
                </Card>
              )}

              {/* Risk Summary */}
              <Card className="border-border shadow-sm">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-500" /> Risk Summary
                  </CardTitle>
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
            </div>
          </div>
        )}

        {tab === "credentials" && (
          <div className="space-y-6">
            {/* Patient credentials */}
            <Card className="border-border shadow-sm overflow-hidden">
              <CardHeader className="border-b bg-muted/20 py-4">
                <CardTitle className="text-base text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" /> Patient Login Credentials
                  <Badge variant="outline" className="ml-2 text-[10px] font-mono">Password: demo123</Badge>
                </CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground bg-muted/20 border-b uppercase">
                    <tr>
                      <th className="px-5 py-3 font-medium">Patient Name</th>
                      <th className="px-5 py-3 font-medium">Phone (Login ID)</th>
                      <th className="px-5 py-3 font-medium">Plan</th>
                      <th className="px-5 py-3 font-medium">Password</th>
                      <th className="px-5 py-3 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {[
                      { name: "Rahul Sharma", phone: "9876543210", plan: "comprehensive" },
                      { name: "Ananya Patel", phone: "9765432109", plan: "premium" },
                      { name: "Vikram Singh", phone: "9654321098", plan: "basic" },
                      { name: "Meera Iyer", phone: "9543210987", plan: "premium" },
                      { name: "Karan Malhotra", phone: "9432109876", plan: "comprehensive" },
                      { name: "Divya Reddy", phone: "9321098765", plan: "basic" },
                      { name: "Arjun Nair", phone: "9210987654", plan: "comprehensive" },
                      { name: "Preethi Menon", phone: "9109876543", plan: "premium" },
                    ].map((p, i) => (
                      <tr key={i} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3 font-semibold text-foreground">{p.name}</td>
                        <td className="px-5 py-3">
                          <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{p.phone}</span>
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant="outline" className={`capitalize text-[10px] px-2 py-0.5 ${p.plan === "premium" ? "border-amber-300 text-amber-700 bg-amber-50" : p.plan === "comprehensive" ? "border-sky-300 text-sky-700 bg-sky-50" : "border-slate-300 text-slate-600 bg-slate-50"}`}>
                            {p.plan}
                          </Badge>
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-mono text-xs bg-green-50 border border-green-200 text-green-800 px-2 py-0.5 rounded">demo123</span>
                        </td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">
                          {i === 0 ? "Primary demo account" : i <= 2 ? "Active, has check-ins" : "Seeded with history"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Staff credentials */}
            <Card className="border-border shadow-sm overflow-hidden">
              <CardHeader className="border-b bg-muted/20 py-4">
                <CardTitle className="text-base text-foreground flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-primary" /> Staff Portal Credentials
                  <Badge variant="outline" className="ml-2 text-[10px] font-mono">Password: demo123 · Sign in at /physician/signin</Badge>
                </CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground bg-muted/20 border-b uppercase">
                    <tr>
                      <th className="px-5 py-3 font-medium">Name</th>
                      <th className="px-5 py-3 font-medium">Role</th>
                      <th className="px-5 py-3 font-medium">Email</th>
                      <th className="px-5 py-3 font-medium">Password</th>
                      <th className="px-5 py-3 font-medium">Redirects to</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {[
                      { name: "Dr. Sneha Mehta", role: "physician", email: "dr.mehta@cloudberry.health", dest: "/physician/dashboard" },
                      { name: "Dr. Raj Patel", role: "physician", email: "dr.raj@cloudberry.health", dest: "/physician/dashboard" },
                      { name: "Dr. Priya Singh", role: "physician", email: "dr.priya@cloudberry.health", dest: "/physician/dashboard" },
                      { name: "Priya Sharma", role: "dietician", email: "priya.diet@cloudberry.health", dest: "/dietician/dashboard" },
                      { name: "Kavya Nair", role: "dietician", email: "kavya.diet@cloudberry.health", dest: "/dietician/dashboard" },
                      { name: "Rohan Verma", role: "dietician", email: "rohan.diet@cloudberry.health", dest: "/dietician/dashboard" },
                      { name: "Ranjit Kumar", role: "caretaker", email: "ranjit.care@cloudberry.health", dest: "/caretaker/dashboard" },
                      { name: "Sunita Rao", role: "caretaker", email: "sunita.care@cloudberry.health", dest: "/caretaker/dashboard" },
                      { name: "Mahesh Iyer", role: "caretaker", email: "mahesh.care@cloudberry.health", dest: "/caretaker/dashboard" },
                      { name: "Priya Nair", role: "ops", email: "ops@cloudberry.health", dest: "/ops/dashboard" },
                      { name: "Arjun Kapoor", role: "ops", email: "ops2@cloudberry.health", dest: "/ops/dashboard" },
                    ].map((s, i) => (
                      <tr key={i} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3 font-semibold text-foreground">{s.name}</td>
                        <td className="px-5 py-3">
                          <Badge variant="outline" className={`capitalize text-[10px] px-2 py-0.5 flex items-center gap-1 w-fit ${roleColor(s.role)}`}>
                            {roleIcon(s.role)} {s.role}
                          </Badge>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5 text-xs text-foreground/80">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            {s.email}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-mono text-xs bg-green-50 border border-green-200 text-green-800 px-2 py-0.5 rounded">demo123</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-mono text-xs text-muted-foreground">{s.dest}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Quick-start guide */}
            <Card className="border-blue-200 bg-blue-50/60 shadow-sm">
              <CardContent className="pt-5 pb-5">
                <p className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Quick Demo Guide
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-blue-900">
                  <div className="space-y-1.5">
                    <p className="font-semibold text-blue-700">Patient Portal</p>
                    <p>→ Sign in at <span className="font-mono">/patient/signin</span></p>
                    <p>→ Phone: any number above (e.g. 9876543210)</p>
                    <p>→ Password: <span className="font-mono">demo123</span></p>
                    <p>→ New patients see Assessment → Check-in → Dashboard flow</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-semibold text-blue-700">Staff Portals</p>
                    <p>→ All sign in at <span className="font-mono">/physician/signin</span></p>
                    <p>→ Email: any from the list above</p>
                    <p>→ Password: <span className="font-mono">demo123</span></p>
                    <p>→ Role-based auto-redirect to the correct portal</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">#{s.id}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-foreground">{s.fullName}</div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant="outline" className={`capitalize text-[10px] px-2 py-0.5 border flex items-center gap-1 w-fit ${roleColor(s.role)}`}>
                            {roleIcon(s.role)} {s.role}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs text-muted-foreground">{s.specialty || "—"}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-foreground/80">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            {s.email}
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

            {/* Demo Credentials Quick-ref Card */}
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
                  Patient logins use phone numbers (e.g. 9876543210 for Rahul Sharma). See the <button
                    onClick={() => setTab("credentials")}
                    className="underline font-semibold"
                  >🔑 Demo Credentials tab</button> for the full list.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
