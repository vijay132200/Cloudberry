import { StaffLayout } from "@/components/layout/staff-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  FlaskConical, BarChart2, AlertTriangle, Zap, Clock, ChevronRight,
  CheckCircle2, Play, RefreshCw, History, FileText, Users, Settings2,
  TrendingUp, TrendingDown, Minus, ShieldCheck, GitBranch, Eye, ArrowLeft,
  RotateCcw, Info,
} from "lucide-react";

const BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
const hdr = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("cloudberry_token") ?? ""}`,
});

const PARAM_META: Record<string, { label: string; unit: string; min: number; max: number; step: number; hint: string }> = {
  nutrition_weight:          { label: "Nutrition Weight",             unit: "%",    min: 0, max: 100, step: 1,   hint: "Fraction of the score contributed by meal compliance" },
  activity_weight:           { label: "Activity Weight",              unit: "%",    min: 0, max: 100, step: 1,   hint: "Fraction contributed by physical activity completion" },
  sleep_weight:              { label: "Sleep Weight",                 unit: "%",    min: 0, max: 100, step: 1,   hint: "Fraction contributed by adequate sleep duration" },
  min_sleep_hours:           { label: "Min Sleep Hours",              unit: "hrs",  min: 4, max: 12,  step: 0.5, hint: "Minimum hours of sleep to count a night as 'good'" },
  lookback_days:             { label: "Lookback Window",              unit: "days", min: 1, max: 30,  step: 1,   hint: "Number of past days included in score calculations" },
  window_days:               { label: "Check-in Window",              unit: "days", min: 1, max: 30,  step: 1,   hint: "Days of check-in history to assess adherence" },
  consistency_low_threshold: { label: "Low Threshold → High Risk",    unit: "/100", min: 0, max: 100, step: 1,   hint: "Score below this marks a patient as High Risk" },
  consistency_high_threshold:{ label: "High Threshold → Low Risk",    unit: "/100", min: 0, max: 100, step: 1,   hint: "Score above this marks a patient as Low Risk" },
  missed_days_threshold:     { label: "Max Missed Days (High Risk)",  unit: "days", min: 1, max: 14,  step: 1,   hint: "Consecutive missed days that trigger High Risk status" },
  escalation_consecutive_days:{ label: "Consecutive Missed (Escalate)", unit: "days", min: 1, max: 14, step: 1,  hint: "Missed days in a row before auto-escalation fires" },
  glucose_high_mg:           { label: "High Glucose Alert",           unit: "mg/dL",min: 80,max: 300, step: 1,   hint: "Fasting glucose above this triggers a clinical alert" },
  glucose_low_mg:            { label: "Low Glucose Alert",            unit: "mg/dL",min: 40,max: 100, step: 1,   hint: "Fasting glucose below this triggers a hypoglycemia alert" },
  weight_change_alert_kg:    { label: "Weight Change Alert",          unit: "kg",   min: 0.5,max:10,  step: 0.5, hint: "Change in weight in 30 days that triggers an alert" },
  consecutive_missed_days:   { label: "Consecutive Missed Days",      unit: "days", min: 1, max: 14,  step: 1,   hint: "Escalation fires after this many missed days in a row" },
  consistency_drop_pct:      { label: "Consistency Drop % (Escalate)", unit: "%",   min: 1, max: 50,  step: 1,   hint: "Week-over-week drop that triggers an escalation" },
  glucose_spike_mg:          { label: "Glucose Spike",                unit: "mg/dL",min: 10,max: 200, step: 5,   hint: "24-hour glucose rise that triggers an escalation" },
  daily_window_hours:        { label: "Daily Window",                 unit: "hrs",  min: 1, max: 48,  step: 1,   hint: "Hours per day during which a check-in can be submitted" },
  grace_period_hours:        { label: "Grace Period",                 unit: "hrs",  min: 0, max: 24,  step: 1,   hint: "Extra hours after midnight before a day is marked missed" },
};

const CATEGORY_STYLES: Record<string, { bg: string; badge: string; icon: any }> = {
  scoring:   { bg: "bg-blue-50 border-blue-200",   badge: "bg-blue-100 text-blue-700 border-blue-200",   icon: BarChart2 },
  threshold: { bg: "bg-amber-50 border-amber-200", badge: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertTriangle },
  trigger:   { bg: "bg-rose-50 border-rose-200",   badge: "bg-rose-100 text-rose-700 border-rose-200",   icon: Zap },
  window:    { bg: "bg-slate-50 border-slate-200", badge: "bg-slate-100 text-slate-700 border-slate-200", icon: Clock },
};

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  deploy:         { label: "Deployed",        color: "text-emerald-600" },
  propose:        { label: "Proposed",        color: "text-blue-600" },
  override:       { label: "Patient Override", color: "text-violet-600" },
  override_remove:{ label: "Override Removed", color: "text-rose-600" },
};

function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ParamInput({
  paramKey, value, onChange, disabled,
}: { paramKey: string; value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const meta = PARAM_META[paramKey] ?? { label: paramKey, unit: "", min: 0, max: 1000, step: 1, hint: "" };
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground">{meta.label}</label>
        <span className="text-[10px] text-muted-foreground">{meta.unit}</span>
      </div>
      {meta.hint && <p className="text-[10px] text-muted-foreground">{meta.hint}</p>}
      <Input
        type="number"
        min={meta.min}
        max={meta.max}
        step={meta.step}
        value={value}
        disabled={disabled}
        onChange={e => onChange(Number(e.target.value))}
        className="h-9 text-sm w-full rounded-lg"
      />
    </div>
  );
}

function WeightSumBadge({ params, inputs }: { params: Record<string, number>; inputs: string[] }) {
  const weightKeys = inputs.filter(k => k.endsWith("_weight"));
  if (weightKeys.length === 0) return null;
  const total = weightKeys.reduce((s, k) => s + (params[k] ?? 0), 0);
  const ok = Math.abs(total - 100) <= 0.5;
  return (
    <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${ok ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
      {ok ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
      Weights sum: {total}% {ok ? "(✓)" : `(must = 100%)`}
    </div>
  );
}

export default function FormulaManagement() {
  const { toast } = useToast();
  const [formulas, setFormulas] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<"params" | "propose" | "versions" | "audit" | "overrides">("params");

  // Propose flow
  const [proposedParams, setProposedParams] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [proposing, setProposing] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);
  const [draftVersionId, setDraftVersionId] = useState<number | null>(null);
  const [approving, setApproving] = useState(false);

  // Overrides
  const [patients, setPatients] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [patientOverrides, setPatientOverrides] = useState<any[]>([]);
  const [overrideParams, setOverrideParams] = useState<Record<string, number>>({});
  const [overrideReason, setOverrideReason] = useState("");
  const [savingOverride, setSavingOverride] = useState(false);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    try {
      const r = await fetch(`${BASE}/api/ops/formulas`, { headers: hdr() });
      if (r.ok) setFormulas(await r.json());
    } catch { /* demo-safe */ }
    setLoadingList(false);
  }, []);

  const loadDetail = useCallback(async (id: number) => {
    setLoadingDetail(true);
    setDetail(null);
    setSimulationResult(null);
    setDraftVersionId(null);
    try {
      const r = await fetch(`${BASE}/api/ops/formulas/${id}`, { headers: hdr() });
      if (r.ok) {
        const d = await r.json();
        setDetail(d);
        setProposedParams(d.currentVersion?.parameters ?? {});
      }
    } catch { /* demo-safe */ }
    setLoadingDetail(false);
  }, []);

  const loadPatients = useCallback(async () => {
    if (patients.length > 0) return;
    setLoadingPatients(true);
    try {
      const r = await fetch(`${BASE}/api/ops/patients`, { headers: hdr() });
      if (r.ok) setPatients(await r.json());
    } catch { /* demo-safe */ }
    setLoadingPatients(false);
  }, [patients.length]);

  const loadPatientOverrides = useCallback(async (patientId: number) => {
    try {
      const r = await fetch(`${BASE}/api/ops/formulas/patient/${patientId}`, { headers: hdr() });
      if (r.ok) setPatientOverrides(await r.json());
    } catch { /* demo-safe */ }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);
  useEffect(() => { if (selectedId) loadDetail(selectedId); }, [selectedId, loadDetail]);
  useEffect(() => {
    if (activeTab === "overrides") loadPatients();
  }, [activeTab, loadPatients]);

  const handleSelectPatient = (p: any) => {
    setSelectedPatient(p);
    loadPatientOverrides(p.id);
    // Pre-fill with current global params
    const globalParams = detail?.currentVersion?.parameters ?? {};
    const existingOverride = patientOverrides.find(o => o.formulaId === selectedId);
    setOverrideParams(existingOverride?.parameters ?? { ...globalParams });
    setOverrideReason("");
  };

  const runSimulation = async () => {
    if (!selectedId || !proposedParams) return;
    setSimulating(true);
    setSimulationResult(null);
    try {
      const r = await fetch(`${BASE}/api/ops/formulas/${selectedId}/simulate`, {
        method: "POST", headers: hdr(), body: JSON.stringify({ parameters: proposedParams }),
      });
      if (r.ok) setSimulationResult(await r.json());
      else toast({ title: "Simulation failed", description: "Could not run impact simulation.", variant: "destructive" });
    } catch { toast({ title: "Simulation failed", variant: "destructive" }); }
    setSimulating(false);
  };

  const handlePropose = async () => {
    if (!selectedId || !reason.trim()) return;
    setProposing(true);
    setValidationErrors([]);
    try {
      const r = await fetch(`${BASE}/api/ops/formulas/${selectedId}/propose`, {
        method: "POST", headers: hdr(), body: JSON.stringify({ parameters: proposedParams, reason }),
      });
      const data = await r.json();
      if (r.ok) {
        setDraftVersionId(data.version.id);
        toast({ title: "Draft version created", description: `Version ${data.version.version} is ready to review and approve.` });
        loadDetail(selectedId);
      } else if (data.errors) {
        setValidationErrors(data.errors);
      } else {
        toast({ title: "Propose failed", description: data.error, variant: "destructive" });
      }
    } catch { toast({ title: "Propose failed", variant: "destructive" }); }
    setProposing(false);
  };

  const handleApprove = async (vid?: number) => {
    if (!selectedId) return;
    const targetVid = vid ?? draftVersionId;
    if (!targetVid) return;
    setApproving(true);
    try {
      const r = await fetch(`${BASE}/api/ops/formulas/${selectedId}/versions/${targetVid}/approve`, {
        method: "POST", headers: hdr(), body: JSON.stringify({}),
      });
      const data = await r.json();
      if (r.ok) {
        toast({ title: "Formula deployed!", description: `Version is now live. All score calculations updated.` });
        setDraftVersionId(null);
        setActiveTab("params");
        loadDetail(selectedId);
        loadList();
      } else {
        toast({ title: "Approval failed", description: data.error, variant: "destructive" });
      }
    } catch { toast({ title: "Approval failed", variant: "destructive" }); }
    setApproving(false);
  };

  const handleSaveOverride = async () => {
    if (!selectedId || !selectedPatient) return;
    setSavingOverride(true);
    try {
      const r = await fetch(`${BASE}/api/ops/formulas/patient/${selectedPatient.id}/override`, {
        method: "POST", headers: hdr(),
        body: JSON.stringify({ formulaId: selectedId, parameters: overrideParams, reason: overrideReason }),
      });
      const data = await r.json();
      if (r.ok) {
        toast({ title: "Override saved", description: `Patient-specific parameters updated for ${selectedPatient.fullName ?? selectedPatient.name}.` });
        loadPatientOverrides(selectedPatient.id);
      } else {
        toast({ title: "Save failed", description: data.error, variant: "destructive" });
      }
    } catch { toast({ title: "Save failed", variant: "destructive" }); }
    setSavingOverride(false);
  };

  const handleRemoveOverride = async (formulaId: number) => {
    if (!selectedPatient) return;
    try {
      const r = await fetch(`${BASE}/api/ops/formulas/patient/${selectedPatient.id}/override/${formulaId}`, {
        method: "DELETE", headers: hdr(),
      });
      if (r.ok) {
        toast({ title: "Override removed" });
        loadPatientOverrides(selectedPatient.id);
      }
    } catch { toast({ title: "Remove failed", variant: "destructive" }); }
  };

  const filteredPatients = patients.filter(p =>
    patientSearch.length < 2 ||
    (p.fullName ?? p.name ?? "").toLowerCase().includes(patientSearch.toLowerCase()) ||
    (p.phone ?? "").includes(patientSearch)
  ).slice(0, 20);

  const TABS = [
    { key: "params",    label: "Current Formula", icon: Eye },
    { key: "propose",   label: "Propose Change",  icon: Settings2 },
    { key: "versions",  label: "Version History", icon: History },
    { key: "audit",     label: "Audit Log",        icon: FileText },
    { key: "overrides", label: "Patient Overrides",icon: Users },
  ] as const;

  return (
    <StaffLayout type="ops">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FlaskConical className="w-6 h-6 text-primary" /> Formula Management
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Govern scoring formulas, thresholds, and calculation parameters with full audit trail.
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={loadList}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>

        <div className="flex gap-4 min-h-[calc(100vh-200px)]">
          {/* ── LEFT: Formula list ── */}
          <div className="w-72 shrink-0 space-y-2">
            {loadingList ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-muted/40 animate-pulse" />
              ))
            ) : formulas.map(f => {
              const cs = CATEGORY_STYLES[f.category] ?? CATEGORY_STYLES.window;
              const Icon = cs.icon;
              const isSelected = selectedId === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => { setSelectedId(f.id); setActiveTab("params"); }}
                  className={`w-full text-left rounded-xl border p-3.5 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-xs font-semibold truncate ${isSelected ? "text-primary" : "text-foreground"}`}>
                        {f.name}
                      </span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium shrink-0 ${cs.badge}`}>
                      {f.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5 line-clamp-2">{f.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {f.currentVersion ? (
                      <>
                        <span className="text-[10px] font-mono text-muted-foreground">v{f.currentVersion.version}</span>
                        <span className="text-[10px] text-emerald-600 font-medium">● Deployed</span>
                      </>
                    ) : (
                      <span className="text-[10px] text-amber-600">Not deployed</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── RIGHT: Detail panel ── */}
          <div className="flex-1 min-w-0">
            {!selectedId ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-3 text-muted-foreground">
                  <FlaskConical className="w-12 h-12 mx-auto opacity-20" />
                  <p className="text-sm">Select a formula to view details, propose changes, or manage patient overrides.</p>
                </div>
              </div>
            ) : loadingDetail ? (
              <div className="space-y-3">
                {[200, 160, 120].map(h => <div key={h} className={`h-${h} rounded-xl bg-muted/40 animate-pulse`} />)}
              </div>
            ) : detail ? (
              <div className="space-y-4">
                {/* Header */}
                <Card className="border-border shadow-sm">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-lg font-bold text-foreground">{detail.name}</h2>
                          {(() => {
                            const cs = CATEGORY_STYLES[detail.category] ?? CATEGORY_STYLES.window;
                            return <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${cs.badge}`}>{detail.category}</span>;
                          })()}
                          {detail.currentVersion && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md border font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
                              v{detail.currentVersion.version} deployed
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground max-w-2xl">{detail.purpose}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabs */}
                <div className="flex gap-1 border-b border-border pb-0">
                  {TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
                          isActive
                            ? "border-primary text-primary bg-primary/5"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" /> {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* ── Tab: Current Params ── */}
                {activeTab === "params" && (
                  <div className="space-y-4">
                    {detail.currentVersion ? (
                      <>
                        <Card className="border-border shadow-sm">
                          <CardHeader className="border-b bg-muted/20 pb-3">
                            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                              <Settings2 className="w-4 h-4 text-primary" /> Active Parameters
                              <Badge variant="outline" className="text-[10px] ml-auto font-mono">
                                v{detail.currentVersion.version} — deployed {fmtDate(detail.currentVersion.deployedAt)}
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4 pb-5">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                              {(detail.inputs as string[]).map(k => (
                                <ParamInput
                                  key={k}
                                  paramKey={k}
                                  value={detail.currentVersion.parameters[k] ?? 0}
                                  onChange={() => {}}
                                  disabled
                                />
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-border shadow-sm">
                          <CardHeader className="border-b bg-muted/20 pb-3">
                            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                              <GitBranch className="w-4 h-4 text-blue-500" /> Formula Logic
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4 pb-5 space-y-3">
                            <p className="text-xs text-muted-foreground leading-relaxed">{detail.humanReadable}</p>
                            {detail.mathRepresentation && (
                              <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 font-mono text-xs text-slate-700">
                                {detail.mathRepresentation}
                              </div>
                            )}
                            {detail.exampleCalculation && (
                              <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 text-xs text-blue-800">
                                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-500" />
                                <span>{detail.exampleCalculation}</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground text-sm">No deployed version yet.</div>
                    )}
                  </div>
                )}

                {/* ── Tab: Propose Change ── */}
                {activeTab === "propose" && (
                  <div className="space-y-4">
                    <Card className="border-border shadow-sm">
                      <CardHeader className="border-b bg-muted/20 pb-3">
                        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <Settings2 className="w-4 h-4 text-primary" /> Proposed Parameters
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          Adjust parameters below. Run simulation to see impact before proposing.
                        </p>
                      </CardHeader>
                      <CardContent className="pt-4 pb-5 space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {(detail.inputs as string[]).map(k => (
                            <ParamInput
                              key={k}
                              paramKey={k}
                              value={proposedParams[k] ?? 0}
                              onChange={v => setProposedParams(p => ({ ...p, [k]: v }))}
                            />
                          ))}
                        </div>

                        {detail.templateType === "weighted_average" && (
                          <WeightSumBadge params={proposedParams} inputs={detail.inputs as string[]} />
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline" size="sm" className="gap-1.5"
                            onClick={runSimulation} disabled={simulating}
                          >
                            {simulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                            Run Simulation
                          </Button>
                          <Button
                            variant="outline" size="sm" className="gap-1.5"
                            onClick={() => setProposedParams(detail.currentVersion?.parameters ?? {})}
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Reset to Current
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Simulation results */}
                    {simulationResult && (
                      <Card className="border-border shadow-sm">
                        <CardHeader className="border-b bg-muted/20 pb-3">
                          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-500" /> Impact Simulation
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 pb-5 space-y-4">
                          {simulationResult.type === "score_comparison" ? (
                            <>
                              <div className="grid grid-cols-3 gap-3">
                                {[
                                  { label: "Avg Current", value: simulationResult.summary.avgCurrent, color: "text-foreground" },
                                  { label: "Avg Proposed", value: simulationResult.summary.avgProposed, color: "text-primary" },
                                  {
                                    label: "Delta",
                                    value: `${simulationResult.summary.delta > 0 ? "+" : ""}${simulationResult.summary.delta}`,
                                    color: simulationResult.summary.delta > 0 ? "text-emerald-600" : simulationResult.summary.delta < 0 ? "text-rose-600" : "text-muted-foreground"
                                  },
                                ].map(s => (
                                  <div key={s.label} className="text-center border border-border rounded-xl py-3">
                                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                                  </div>
                                ))}
                              </div>
                              <div className="space-y-2.5">
                                {simulationResult.patients.map((p: any) => (
                                  <div key={p.patientId} className="border border-border rounded-xl px-4 py-3 space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="font-semibold">{p.patientName}</span>
                                      <span className={`flex items-center gap-1 font-semibold text-xs ${p.delta > 0 ? "text-emerald-600" : p.delta < 0 ? "text-rose-600" : "text-muted-foreground"}`}>
                                        {p.delta > 0 ? <TrendingUp className="w-3 h-3" /> : p.delta < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                        {p.delta > 0 ? "+" : ""}{p.delta} pts
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <ScoreBar label="Current" value={p.currentScore} color="bg-muted-foreground/40" />
                                      <ScoreBar label="Proposed" value={p.proposedScore} color="bg-primary/60" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground">{simulationResult.message}</p>
                              {simulationResult.changes?.map((c: any) => (
                                <div key={c.param} className="flex items-center justify-between text-xs border border-border rounded-lg px-3 py-2">
                                  <span className="font-medium text-muted-foreground">{PARAM_META[c.param]?.label ?? c.param}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono bg-muted rounded px-1.5 py-0.5">{c.before ?? "—"}</span>
                                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                    <span className={`font-mono rounded px-1.5 py-0.5 font-semibold ${c.after !== c.before ? "bg-primary/10 text-primary" : "bg-muted"}`}>{c.after ?? "—"}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Submit */}
                    <Card className="border-border shadow-sm">
                      <CardHeader className="border-b bg-muted/20 pb-3">
                        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-violet-500" /> Governance
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 pb-5 space-y-4">
                        {validationErrors.length > 0 && (
                          <div className="bg-rose-50 border border-rose-200 rounded-lg px-3 py-2.5 space-y-1">
                            {validationErrors.map((e, i) => (
                              <p key={i} className="text-xs text-rose-700">• {e}</p>
                            ))}
                          </div>
                        )}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-foreground">Reason for change <span className="text-rose-500">*</span></label>
                          <Textarea
                            placeholder="Describe why these parameters are being changed and what clinical outcome is expected..."
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            rows={3}
                            className="text-xs resize-none rounded-lg"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            size="sm" className="gap-1.5"
                            onClick={handlePropose}
                            disabled={proposing || !reason.trim() || reason.trim().length < 5}
                          >
                            {proposing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <GitBranch className="w-3.5 h-3.5" />}
                            Create Draft Version
                          </Button>
                          {draftVersionId && (
                            <Button
                              size="sm" variant="default" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => handleApprove(draftVersionId)}
                              disabled={approving}
                            >
                              {approving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              Approve & Deploy
                            </Button>
                          )}
                        </div>
                        {draftVersionId && (
                          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            Draft version created. Review carefully before deploying — this will affect all live score calculations.
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ── Tab: Version History ── */}
                {activeTab === "versions" && (
                  <div className="space-y-3">
                    {(detail.versions ?? []).length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground text-sm">No versions yet.</div>
                    ) : (detail.versions as any[]).map((v: any) => {
                      const statusStyles: Record<string, string> = {
                        deployed:   "bg-emerald-50 text-emerald-700 border-emerald-200",
                        draft:      "bg-amber-50 text-amber-700 border-amber-200",
                        superseded: "bg-slate-50 text-slate-500 border-slate-200",
                      };
                      return (
                        <Card key={v.id} className={`border shadow-sm ${v.status === "deployed" ? "border-emerald-200" : "border-border"}`}>
                          <CardContent className="pt-4 pb-4">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-foreground font-mono">v{v.version}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${statusStyles[v.status] ?? "bg-muted text-muted-foreground border-border"}`}>
                                  {v.status}
                                </span>
                              </div>
                              <div className="text-right text-[10px] text-muted-foreground space-y-0.5">
                                <p>Proposed by <span className="font-semibold">{v.proposedByName}</span> · {fmtDate(v.proposedAt)}</p>
                                {v.approvedByName && <p>Approved by <span className="font-semibold">{v.approvedByName}</span> · {fmtDate(v.approvedAt)}</p>}
                              </div>
                            </div>
                            {v.reason && <p className="text-xs text-muted-foreground mb-3 italic">"{v.reason}"</p>}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {Object.entries(v.parameters as Record<string, number>).map(([k, val]) => (
                                <div key={k} className="bg-muted/40 rounded-lg px-2.5 py-1.5">
                                  <p className="text-[10px] text-muted-foreground truncate">{PARAM_META[k]?.label ?? k}</p>
                                  <p className="text-xs font-semibold font-mono">{val} <span className="font-normal text-muted-foreground">{PARAM_META[k]?.unit}</span></p>
                                </div>
                              ))}
                            </div>
                            {v.status === "draft" && (
                              <div className="mt-3">
                                <Button
                                  size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                                  onClick={() => handleApprove(v.id)} disabled={approving}
                                >
                                  {approving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                  Approve & Deploy This Version
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* ── Tab: Audit Log ── */}
                {activeTab === "audit" && (
                  <Card className="border-border shadow-sm">
                    <CardContent className="pt-4 pb-4">
                      {(detail.audit ?? []).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">No audit entries.</div>
                      ) : (
                        <div className="space-y-0 divide-y divide-border">
                          {(detail.audit as any[]).map((a: any) => {
                            const al = ACTION_LABELS[a.action] ?? { label: a.action, color: "text-foreground" };
                            return (
                              <div key={a.id} className="flex items-start justify-between gap-4 py-3">
                                <div className="space-y-0.5">
                                  <span className={`text-xs font-semibold ${al.color}`}>{al.label}</span>
                                  {a.notes && <p className="text-[10px] text-muted-foreground">{a.notes}</p>}
                                </div>
                                <div className="text-right text-[10px] text-muted-foreground shrink-0">
                                  <p className="font-semibold">{a.actorName}</p>
                                  <p>{fmtDate(a.createdAt)}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* ── Tab: Patient Overrides ── */}
                {activeTab === "overrides" && (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Patient search */}
                    <Card className="border-border shadow-sm">
                      <CardHeader className="border-b bg-muted/20 pb-3">
                        <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-primary" /> Select Patient
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-3 pb-3 space-y-2">
                        <Input
                          placeholder="Search by name or phone..."
                          value={patientSearch}
                          onChange={e => setPatientSearch(e.target.value)}
                          className="h-8 text-xs rounded-lg"
                        />
                        {loadingPatients ? (
                          <div className="space-y-1.5">
                            {Array(4).fill(0).map((_, i) => <div key={i} className="h-10 bg-muted/40 rounded-lg animate-pulse" />)}
                          </div>
                        ) : (
                          <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                            {filteredPatients.map(p => {
                              const hasOverride = patientOverrides.some(o => o.patientId === p.id && o.formulaId === selectedId);
                              return (
                                <button
                                  key={p.id}
                                  onClick={() => handleSelectPatient(p)}
                                  className={`w-full text-left rounded-lg px-3 py-2 text-xs transition-colors ${
                                    selectedPatient?.id === p.id
                                      ? "bg-primary/10 text-primary border border-primary/30"
                                      : "bg-muted/30 hover:bg-muted/60 border border-transparent"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold">{p.fullName ?? p.name}</span>
                                    {hasOverride && (
                                      <span className="text-[9px] px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded-md border border-violet-200 font-medium">override</span>
                                    )}
                                  </div>
                                  <p className="text-muted-foreground font-mono">{p.phone}</p>
                                </button>
                              );
                            })}
                            {filteredPatients.length === 0 && (
                              <p className="text-xs text-muted-foreground text-center py-4">No patients found</p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Override form */}
                    <Card className="border-border shadow-sm">
                      <CardHeader className="border-b bg-muted/20 pb-3">
                        <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-2">
                          <Settings2 className="w-3.5 h-3.5 text-violet-500" />
                          {selectedPatient ? `Override for ${selectedPatient.fullName ?? selectedPatient.name}` : "Override Parameters"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-3 pb-4 space-y-4">
                        {!selectedPatient ? (
                          <p className="text-xs text-muted-foreground py-4 text-center">Select a patient to configure overrides.</p>
                        ) : (
                          <>
                            {/* Show existing override if any */}
                            {patientOverrides.filter(o => o.formulaId === selectedId).map(o => (
                              <div key={o.id} className="bg-violet-50 border border-violet-200 rounded-lg px-3 py-2.5 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-violet-800">Active Override</span>
                                  <button
                                    onClick={() => handleRemoveOverride(o.formulaId)}
                                    className="text-[10px] text-rose-600 hover:underline"
                                  >
                                    Remove
                                  </button>
                                </div>
                                <p className="text-[10px] text-violet-600">Set by {o.createdByName} · {fmtDate(o.createdAt)}</p>
                                {o.reason && <p className="text-[10px] text-violet-700 italic">"{o.reason}"</p>}
                              </div>
                            ))}

                            <div className="grid grid-cols-1 gap-3">
                              {(detail.inputs as string[]).map(k => (
                                <ParamInput
                                  key={k}
                                  paramKey={k}
                                  value={overrideParams[k] ?? detail.currentVersion?.parameters[k] ?? 0}
                                  onChange={v => setOverrideParams(p => ({ ...p, [k]: v }))}
                                />
                              ))}
                            </div>
                            {detail.templateType === "weighted_average" && (
                              <WeightSumBadge params={overrideParams} inputs={detail.inputs as string[]} />
                            )}
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-foreground">Reason</label>
                              <Input
                                placeholder="e.g. Adjusted for diabetic profile"
                                value={overrideReason}
                                onChange={e => setOverrideReason(e.target.value)}
                                className="h-8 text-xs rounded-lg"
                              />
                            </div>
                            <Button
                              size="sm" className="w-full gap-1.5"
                              onClick={handleSaveOverride}
                              disabled={savingOverride}
                            >
                              {savingOverride ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              Save Patient Override
                            </Button>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
