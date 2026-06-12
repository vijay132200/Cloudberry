import { PatientLayout } from "@/components/layout/patient-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Upload, FileText, Eye, Trash2, Download, FolderOpen, Plus, X,
  Salad, Clock, User, ChevronDown, ChevronUp, Activity, CheckCircle2,
  TrendingDown, Droplets, Moon, Calendar, ClipboardList, HeartPulse,
  ListChecks, BarChart3, Dumbbell, Utensils, Scale,
} from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart,
} from "recharts";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
async function fetchJson(path: string) {
  const token = localStorage.getItem("cloudberry_token") || "";
  const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ── Time range helpers ────────────────────────────────────────────────────────
const TIME_RANGES = [
  { key: "7d", label: "7 Days", days: 7 },
  { key: "30d", label: "30 Days", days: 30 },
  { key: "90d", label: "90 Days", days: 90 },
  { key: "all", label: "All Time", days: null },
] as const;
type TimeRangeKey = typeof TIME_RANGES[number]["key"];

function getFromDate(key: TimeRangeKey): string | undefined {
  const range = TIME_RANGES.find(r => r.key === key);
  if (!range || range.days === null) return undefined;
  const d = new Date();
  d.setDate(d.getDate() - range.days);
  return d.toISOString();
}

// ── Overview / Historical Dashboard ──────────────────────────────────────────
function OverviewTab() {
  const [timeRange, setTimeRange] = useState<TimeRangeKey>("30d");
  const from = getFromDate(timeRange);
  const to = new Date().toISOString();

  const { data: rec, isLoading } = useQuery({
    queryKey: ["patient-records", timeRange],
    queryFn: () => fetchJson(`/patients/me/records${from ? `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}` : ""}`),
    staleTime: 60000,
  });

  const stats = [
    {
      label: "Check-ins",
      value: rec?.totalCheckins ?? "—",
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      color: "text-emerald-700",
      bg: "bg-emerald-50 border-emerald-100",
    },
    {
      label: "Meal Adherence",
      value: rec?.adherencePct !== null && rec?.adherencePct !== undefined ? `${rec.adherencePct}%` : "—",
      icon: <Utensils className="w-4 h-4 text-sky-600" />,
      color: "text-sky-700",
      bg: "bg-sky-50 border-sky-100",
    },
    {
      label: "Activity Rate",
      value: rec?.activityPct !== null && rec?.activityPct !== undefined ? `${rec.activityPct}%` : "—",
      icon: <Dumbbell className="w-4 h-4 text-violet-600" />,
      color: "text-violet-700",
      bg: "bg-violet-50 border-violet-100",
    },
    {
      label: "Avg Weight",
      value: rec?.avgWeight ? `${rec.avgWeight} kg` : "—",
      icon: <Scale className="w-4 h-4 text-amber-600" />,
      color: "text-amber-700",
      bg: "bg-amber-50 border-amber-100",
    },
    {
      label: "Avg Glucose",
      value: rec?.avgGlucose ? `${rec.avgGlucose} mg/dL` : "—",
      icon: <Droplets className="w-4 h-4 text-rose-500" />,
      color: "text-rose-700",
      bg: "bg-rose-50 border-rose-100",
    },
    {
      label: "Avg Sleep",
      value: rec?.avgSleep ? `${rec.avgSleep} hrs` : "—",
      icon: <Moon className="w-4 h-4 text-indigo-500" />,
      color: "text-indigo-700",
      bg: "bg-indigo-50 border-indigo-100",
    },
  ];

  const weightData = (rec?.weightSeries ?? []).map((p: any) => ({
    date: new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    value: p.value,
  }));
  const glucoseData = (rec?.glucoseSeries ?? []).map((p: any) => ({
    date: new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    value: p.value,
  }));

  return (
    <div className="space-y-5">
      {/* Time range selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground mr-1">Period:</span>
        {TIME_RANGES.map(r => (
          <button
            key={r.key}
            onClick={() => setTimeRange(r.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              timeRange === r.key
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-muted-foreground border-border/60 hover:text-foreground"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Stats grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {stats.map(s => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
              <div className="flex items-center gap-2 mb-1.5">
                {s.icon}
                <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
              </div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Consistency breakdown */}
      {rec?.consistencyBreakdown && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="border-b pb-3 pt-4">
            <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Consistency Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {[
              { label: "Meal Logging", value: rec.consistencyBreakdown.mealLogging ?? 0, color: "bg-emerald-500" },
              { label: "Activity", value: rec.consistencyBreakdown.activity ?? 0, color: "bg-sky-500" },
              { label: "Sleep", value: rec.consistencyBreakdown.sleep ?? 0, color: "bg-indigo-500" },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className="text-muted-foreground">{item.value}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Weight chart */}
      {weightData.length > 1 && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="border-b pb-3 pt-4">
            <CardTitle className="text-sm flex items-center gap-2"><TrendingDown className="w-4 h-4 text-amber-500" /> Weight Trend (kg)</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={weightData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={36} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                  formatter={(v: any) => [`${v} kg`, "Weight"]}
                />
                <Area type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} fill="url(#weightGrad)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Glucose chart */}
      {glucoseData.length > 1 && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="border-b pb-3 pt-4">
            <CardTitle className="text-sm flex items-center gap-2"><Droplets className="w-4 h-4 text-rose-500" /> Fasting Glucose (mg/dL)</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={glucoseData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="glucoseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                  formatter={(v: any) => [`${v} mg/dL`, "Glucose"]}
                />
                <Area type="monotone" dataKey="value" stroke="#f43f5e" strokeWidth={2} fill="url(#glucoseGrad)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent check-ins */}
      {rec?.checkins && rec.checkins.length > 0 && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="border-b pb-3 pt-4">
            <CardTitle className="text-sm flex items-center gap-2"><ListChecks className="w-4 h-4 text-primary" /> Recent Check-ins</CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-2">
            {rec.checkins.slice(0, 7).map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Energy: {c.energyLevel} · Mood: {c.mood}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Badge variant="outline" className={`text-[10px] ${c.mealsFollowed === "yes" || c.mealsFollowed === "mostly" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                    {c.mealsFollowed === "yes" ? "Meals ✓" : c.mealsFollowed === "mostly" ? "Mostly ✓" : "Meals ✗"}
                  </Badge>
                  {c.activityCompleted && (
                    <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200">Active</Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!isLoading && !rec?.totalCheckins && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BarChart3 className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-foreground">No data for this period</p>
          <p className="text-xs text-muted-foreground mt-1">Try a wider time range or complete your daily check-ins.</p>
        </div>
      )}
    </div>
  );
}

// ── Activity Timeline ─────────────────────────────────────────────────────────
const EVENT_STYLES: Record<string, { bg: string; icon: React.ReactNode; label: string }> = {
  checkin: { bg: "bg-emerald-50 border-emerald-200", icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />, label: "Check-in" },
  appointment: { bg: "bg-sky-50 border-sky-200", icon: <Calendar className="w-3.5 h-3.5 text-sky-600" />, label: "Appointment" },
  diet_plan: { bg: "bg-teal-50 border-teal-200", icon: <Salad className="w-3.5 h-3.5 text-teal-600" />, label: "Diet Plan" },
  care_plan: { bg: "bg-violet-50 border-violet-200", icon: <ClipboardList className="w-3.5 h-3.5 text-violet-600" />, label: "Care Plan" },
  metric: { bg: "bg-amber-50 border-amber-100", icon: <Activity className="w-3.5 h-3.5 text-amber-600" />, label: "Metric" },
  note: { bg: "bg-indigo-50 border-indigo-200", icon: <HeartPulse className="w-3.5 h-3.5 text-indigo-600" />, label: "Care Note" },
};

function ActivityTab() {
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: events = [], isLoading } = useQuery<any[]>({
    queryKey: ["patient-activity", typeFilter],
    queryFn: () => fetchJson(`/patients/me/activity${typeFilter !== "all" ? `?type=${typeFilter}` : ""}`),
    staleTime: 60000,
  });

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "checkin", label: "Check-ins" },
    { value: "appointment", label: "Appointments" },
    { value: "diet_plan", label: "Diet Plans" },
    { value: "care_plan", label: "Care Plan" },
    { value: "metric", label: "Metrics" },
  ];

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground mr-1">Filter:</span>
        {filterOptions.map(o => (
          <button
            key={o.value}
            onClick={() => setTypeFilter(o.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              typeFilter === o.value
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-muted-foreground border-border/60 hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : (events as any[]).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Activity className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-foreground">No activity yet</p>
          <p className="text-xs text-muted-foreground mt-1">Your check-ins, appointments, and updates will appear here.</p>
        </div>
      ) : (
        <div className="relative space-y-3">
          {/* Timeline line */}
          <div className="absolute left-[18px] top-0 bottom-0 w-px bg-border/40 z-0" />

          {(events as any[]).map((event: any) => {
            const style = EVENT_STYLES[event.type] ?? EVENT_STYLES.note;
            return (
              <div key={event.id} className="relative flex gap-3 items-start z-10">
                {/* Dot */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${style.bg}`}>
                  {style.icon}
                </div>
                {/* Card */}
                <div className={`flex-1 rounded-xl border p-3 ${style.bg}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground leading-snug">{event.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">{event.summary}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {new Date(event.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                      <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {new Date(event.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Diet Plan Tab ─────────────────────────────────────────────────────────────
function DietPlanTab() {
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();
  const { data: plans = [], isLoading } = useQuery<any[]>({
    queryKey: ["patient-diet-plans"],
    queryFn: () => fetchJson("/patients/me/diet-plan"),
  });
  const activePlan = (plans as any[]).find((p: any) => p.isActive);
  const historyPlans = (plans as any[]).filter((p: any) => !p.isActive);
  const displayPlan = activePlan ?? plans[0];

  const handlePdfDownload = async (plan: any) => {
    try {
      const data = await fetchJson(`/patients/me/diet-plans/${plan.id}/pdf`);
      const byteChars = atob(data.pdfData);
      const arr = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) arr[i] = byteChars.charCodeAt(i);
      const blob = new Blob([arr], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = data.pdfFilename ?? `diet-plan-v${plan.version}.pdf`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch {
      toast({ title: "No PDF attached to this plan", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}</div>;

  if (!displayPlan && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Salad className="w-10 h-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-foreground">No diet plan assigned yet</p>
        <p className="text-xs text-muted-foreground mt-1">Your dietician will add your personalised diet plan here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayPlan && (
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-teal-50/40">
          <CardHeader className="pb-2 pt-4 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-emerald-800">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Salad className="w-4 h-4 text-emerald-700" />
                </div>
                Current Diet Plan
              </CardTitle>
              <div className="flex items-center gap-2">
                {displayPlan.hasPdf && (
                  <Button size="sm" variant="outline"
                    className="h-7 text-[10px] gap-1 rounded-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 px-2.5"
                    onClick={() => handlePdfDownload(displayPlan)}>
                    <Download className="w-3 h-3" />Download PDF
                  </Button>
                )}
                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                  {activePlan ? "Active" : "Archived"} · v{displayPlan.version}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <p className="font-semibold text-sm text-foreground mb-1">{displayPlan.title}</p>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3">
              <span className="flex items-center gap-1"><User className="w-3 h-3" />{displayPlan.authorName ?? "Care Team"}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(displayPlan.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{displayPlan.content}</p>
          </CardContent>
        </Card>
      )}

      {historyPlans.length > 0 && (
        <div>
          <button
            className="flex items-center gap-1.5 text-xs text-primary font-medium hover:text-primary/80 mb-3"
            onClick={() => setShowHistory(v => !v)}
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showHistory ? "rotate-180" : ""}`} />
            Previous versions ({historyPlans.length})
          </button>
          {showHistory && (
            <div className="space-y-3">
              {historyPlans.map((plan: any) => (
                <Card key={plan.id} className="border-border/50 bg-muted/20">
                  <CardContent className="px-4 py-3">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-xs font-semibold text-foreground">{plan.title}</p>
                      <div className="flex items-center gap-1.5 ml-2">
                        {plan.hasPdf && (
                          <Button size="sm" variant="ghost" className="h-5 text-[9px] gap-0.5 px-1.5 text-emerald-700 hover:bg-emerald-50"
                            onClick={() => handlePdfDownload(plan)}>
                            <Download className="w-2.5 h-2.5" />PDF
                          </Button>
                        )}
                        <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-500 border-slate-200 shrink-0">v{plan.version}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2">
                      <span className="flex items-center gap-0.5"><User className="w-2.5 h-2.5" />{plan.authorName ?? "Care Team"}</span>
                      <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{new Date(plan.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    <p className="text-xs text-foreground/70 whitespace-pre-wrap line-clamp-3 leading-relaxed">{plan.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Document types ────────────────────────────────────────────────────────────
type DocCategory = "prescription" | "report" | "lab_test" | "discharge" | "other";
type DocEntry = { id: string; name: string; category: DocCategory; date: string; size: string; mimeType: string; data: string; };
const CATEGORY_LABELS: Record<DocCategory, string> = {
  prescription: "Prescription", report: "Medical Report", lab_test: "Lab Test",
  discharge: "Discharge Summary", other: "Other",
};
const CATEGORY_COLORS: Record<DocCategory, string> = {
  prescription: "bg-blue-50 text-blue-700 border-blue-200",
  report: "bg-emerald-50 text-emerald-700 border-emerald-200",
  lab_test: "bg-purple-50 text-purple-700 border-purple-200",
  discharge: "bg-amber-50 text-amber-700 border-amber-200",
  other: "bg-slate-50 text-slate-600 border-slate-200",
};
const STORAGE_KEY = "cloudberry_patient_documents";
function loadDocs(): DocEntry[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveDocs(docs: DocEntry[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(docs)); } catch { }
}
function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

// ── Documents Tab ─────────────────────────────────────────────────────────────
function DocumentsTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<DocCategory | "all">("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState<any | null>(null);
  const [viewUrl, setViewUrl] = useState<string>("");
  const [form, setForm] = useState({ name: "", category: "prescription" as DocCategory });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
  const token = () => localStorage.getItem("cloudberry_token") || "";

  const { data: docs = [], isLoading } = useQuery<any[]>({
    queryKey: ["patient-documents"],
    queryFn: async () => {
      const r = await fetch(`${API}/patients/me/documents`, { headers: { Authorization: `Bearer ${token()}` } });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    staleTime: 30000,
  });

  const uploadMut = useMutation({
    mutationFn: async ({ filename, fileData, fileType, category, label }: any) => {
      const r = await fetch(`${API}/patients/me/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ filename, fileData, fileType, category, label }),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patient-documents"] });
      closeUpload();
      toast({ title: "Document saved", description: "Your document has been securely stored." });
    },
    onError: () => toast({ title: "Upload failed", description: "Could not save the file. Please try again.", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`${API}/patients/me/documents/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patient-documents"] });
      toast({ title: "Document removed" });
    },
    onError: () => toast({ title: "Failed to delete document", variant: "destructive" }),
  });

  useEffect(() => {
    if (!viewDoc) { setViewUrl(""); return; }
    let cleanup: (() => void) | undefined;
    const fetchAndView = async () => {
      try {
        const r = await fetch(`${API}/patients/me/documents/${viewDoc.id}`, { headers: { Authorization: `Bearer ${token()}` } });
        if (!r.ok) return;
        const full = await r.json();
        const byteChars = atob(full.fileData);
        const arr = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) arr[i] = byteChars.charCodeAt(i);
        const blob = new Blob([arr], { type: full.fileType });
        const url = URL.createObjectURL(blob);
        setViewUrl(url);
        cleanup = () => URL.revokeObjectURL(url);
      } catch { setViewUrl(""); }
    };
    fetchAndView();
    return () => cleanup?.();
  }, [viewDoc?.id]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setForm(f => ({ ...f, name: file.name.replace(/\.[^/.]+$/, "") }));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) { handleFileSelect(file); setUploadOpen(true); }
  }, []);

  const closeUpload = () => { setUploadOpen(false); setSelectedFile(null); setForm({ name: "", category: "prescription" }); };

  const handleUpload = () => {
    if (!selectedFile || !form.name.trim()) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const fileData = dataUrl.split(",")[1];
      uploadMut.mutate({
        filename: `${form.name.trim()}.${selectedFile.name.split(".").pop() ?? "bin"}`,
        fileData,
        fileType: selectedFile.type || "application/octet-stream",
        category: form.category,
        label: form.name.trim(),
      });
    };
    reader.onerror = () => toast({ title: "Upload failed", description: "Could not read the file.", variant: "destructive" });
    reader.readAsDataURL(selectedFile);
  };

  const filtered = filter === "all" ? docs : docs.filter((d: any) => d.category === filter);
  const counts: Record<string, number> = { all: docs.length };
  (Object.keys(CATEGORY_LABELS) as DocCategory[]).forEach(c => { counts[c] = docs.filter((d: any) => d.category === c).length; });

  const filterTabs: [string, string][] = [
    ["all", "All"], ["prescription", "Prescriptions"], ["report", "Reports"],
    ["lab_test", "Lab Tests"], ["discharge", "Discharge"], ["other", "Other"],
  ];

  const handleDownload = async (doc: any) => {
    try {
      const r = await fetch(`${API}/patients/me/documents/${doc.id}`, { headers: { Authorization: `Bearer ${token()}` } });
      if (!r.ok) throw new Error();
      const full = await r.json();
      const byteChars = atob(full.fileData);
      const arr = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) arr[i] = byteChars.charCodeAt(i);
      const blob = new Blob([arr], { type: full.fileType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = full.filename; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch { toast({ title: "Download failed", variant: "destructive" }); }
  };

  return (
    <div className="space-y-5">
      {/* Header with upload */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Your prescriptions, reports, and medical documents — stored securely in the cloud.</p>
        </div>
        <Button className="rounded-full shadow-sm gap-2 shrink-0" onClick={() => setUploadOpen(true)}>
          <Plus className="w-4 h-4" /> Upload Document
        </Button>
      </div>

      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-border/50 rounded-2xl p-7 flex flex-col items-center justify-center gap-2.5 text-center bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer"
        onClick={() => setUploadOpen(true)} onDrop={handleDrop} onDragOver={e => e.preventDefault()}
      >
        <Upload className="w-7 h-7 text-muted-foreground/50" />
        <p className="text-sm font-medium text-foreground">Drag & drop a file here, or click to browse</p>
        <p className="text-xs text-muted-foreground">PDF, JPG, PNG supported · Files synced across devices</p>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {filterTabs.map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val as DocCategory | "all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${filter === val ? "bg-primary text-white border-primary shadow-sm" : "bg-white text-muted-foreground border-border/60 hover:text-foreground hover:border-border"}`}>
            {label}{counts[val] > 0 && <span className="ml-1.5 opacity-70">{counts[val]}</span>}
          </button>
        ))}
      </div>

      {/* Document list */}
      {isLoading ? (
        <div className="space-y-2.5">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FolderOpen className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-foreground">
            {filter === "all" ? "No documents uploaded yet" : `No ${CATEGORY_LABELS[filter as DocCategory] || filter} documents yet`}
          </p>
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed mt-1">
            {filter === "all" ? "Keep your prescriptions, lab reports, and medical documents in one place." : "Click 'Upload Document' to add files to this category."}
          </p>
          <Button variant="outline" className="mt-4 rounded-full gap-2 text-sm" onClick={() => setUploadOpen(true)}>
            <Upload className="w-4 h-4" /> Upload Document
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((doc: any) => (
            <div key={doc.id} className="flex items-center gap-4 p-4 rounded-xl border border-border/60 bg-white hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 border border-primary/15">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{doc.label ?? doc.filename}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(doc.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {doc.fileType?.split("/")[1]?.toUpperCase() ?? "FILE"}
                </p>
              </div>
              <Badge variant="outline" className={`text-[10px] shrink-0 hidden sm:inline-flex ${CATEGORY_COLORS[doc.category as DocCategory] ?? ""}`}>
                {CATEGORY_LABELS[doc.category as DocCategory] ?? doc.category}
              </Badge>
              <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={() => setViewDoc(doc)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="View">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => handleDownload(doc)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Download">
                  <Download className="w-4 h-4" />
                </button>
                <button onClick={() => deleteMut.mutate(doc.id)} disabled={deleteMut.isPending} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp,.gif"
        onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }} />

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={open => { if (!open) closeUpload(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {!selectedFile ? (
              <div className="border-2 border-dashed border-border/60 rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]); }}
                onDragOver={e => e.preventDefault()}>
                <Upload className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground text-center">Click or drag file here</p>
                <p className="text-xs text-muted-foreground">PDF, JPG, PNG — up to 10 MB</p>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{fmtSize(selectedFile.size)}</p>
                </div>
                <button onClick={() => setSelectedFile(null)} className="text-muted-foreground hover:text-foreground p-1 rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="space-y-2">
              <Label>Document Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Dr. Mehta Prescription — May 2026" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as DocCategory }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="prescription">Prescription</SelectItem>
                  <SelectItem value="report">Medical Report</SelectItem>
                  <SelectItem value="lab_test">Lab Test / Blood Work</SelectItem>
                  <SelectItem value="discharge">Discharge Summary</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeUpload}>Cancel</Button>
            <Button onClick={handleUpload} disabled={!selectedFile || !form.name.trim() || uploadMut.isPending}>
              {uploadMut.isPending ? "Saving…" : "Save Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={!!viewDoc} onOpenChange={open => { if (!open) setViewDoc(null); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileText className="w-4 h-4 text-primary shrink-0" />
              <span className="truncate">{viewDoc?.label ?? viewDoc?.filename}</span>
              {viewDoc && <Badge variant="outline" className={`ml-1 text-[10px] shrink-0 ${CATEGORY_COLORS[viewDoc.category as DocCategory] ?? ""}`}>{CATEGORY_LABELS[viewDoc.category as DocCategory] ?? viewDoc.category}</Badge>}
            </DialogTitle>
          </DialogHeader>
          {viewDoc && (
            <div className="rounded-xl overflow-hidden border border-border/60 max-h-[60vh] overflow-y-auto">
              {viewDoc.fileType?.startsWith("image/") && viewUrl ? (
                <img src={viewUrl} alt={viewDoc.label ?? viewDoc.filename} className="w-full object-contain max-h-[55vh]" />
              ) : viewDoc.fileType === "application/pdf" || !viewDoc.fileType?.startsWith("image/") ? (
                viewUrl ? <embed src={viewUrl} type="application/pdf" className="w-full" style={{ height: "55vh" }} /> : <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Loading…</div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <FileText className="w-10 h-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Preview not available for this file type</p>
                  <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={() => handleDownload(viewDoc)}><Download className="w-4 h-4" /> Download to view</Button>
                </div>
              )}
            </div>
          )}
          {viewDoc && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted-foreground">Added {new Date(viewDoc.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-full h-8 text-xs" onClick={() => handleDownload(viewDoc)}><Download className="w-3.5 h-3.5" /> Download</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
type RecordsTab = "overview" | "activity" | "diet-plan" | "documents";

const TABS: { key: RecordsTab; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
  { key: "activity", label: "Activity", icon: <Activity className="w-4 h-4" /> },
  { key: "diet-plan", label: "Diet Plan", icon: <Salad className="w-4 h-4" /> },
  { key: "documents", label: "Documents", icon: <FileText className="w-4 h-4" /> },
];

export default function PatientRecords() {
  const [tab, setTab] = useState<RecordsTab>("overview");

  return (
    <PatientLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Records Center</h1>
          <p className="text-muted-foreground text-sm mt-1">Your complete health history — metrics, activity, diet, and documents.</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-0 border-b border-border/50 mb-6 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                tab === t.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "overview" && <OverviewTab />}
        {tab === "activity" && <ActivityTab />}
        {tab === "diet-plan" && <DietPlanTab />}
        {tab === "documents" && <DocumentsTab />}

      </div>
    </PatientLayout>
  );
}
