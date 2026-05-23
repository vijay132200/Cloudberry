import { PatientLayout } from "@/components/layout/patient-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, XCircle, MinusCircle, TrendingDown, TrendingUp,
  Activity, Star, CalendarDays, Scale, Salad, Footprints, Dumbbell,
  ClipboardCheck, Flame, User, HeartPulse, Droplets, Stethoscope, ChevronRight,
} from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine,
} from "recharts";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

async function fetchDashboard() {
  const token = localStorage.getItem("cloudberry_token") || "";
  const r = await fetch(`${API}/patients/me/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error("Failed");
  return r.json();
}

function getPlan(): "basic" | "comprehensive" | "premium" {
  const p = localStorage.getItem("cloudberry_plan");
  return (p === "basic" || p === "comprehensive" || p === "premium") ? p : "basic";
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

/* ─── Adherence Day Cell ─────────────────────────────────── */
function AdherenceDayCell({ day }: { day: { date: string; dow: string; completed: boolean | null } }) {
  const today = new Date().toISOString().slice(0, 10);
  const ring = day.date === today ? "ring-2 ring-primary ring-offset-1" : "";
  if (day.completed === true) return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-9 h-9 rounded-full bg-emerald-50 border-2 border-emerald-400 flex items-center justify-center ${ring}`}>
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
      </div>
      <span className="text-[10px] text-muted-foreground font-medium">{day.dow}</span>
    </div>
  );
  if (day.completed === false) return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-9 h-9 rounded-full bg-rose-50 border-2 border-rose-300 flex items-center justify-center ${ring}`}>
        <XCircle className="w-4 h-4 text-rose-500" />
      </div>
      <span className="text-[10px] text-muted-foreground font-medium">{day.dow}</span>
    </div>
  );
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-9 h-9 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center ${ring}`}>
        <MinusCircle className="w-4 h-4 text-slate-400" />
      </div>
      <span className="text-[10px] text-muted-foreground font-medium">{day.dow}</span>
    </div>
  );
}

/* ─── Weight Card ────────────────────────────────────────── */
function WeightCard({ weightSeries, weightChange, patient }: { weightSeries: any[]; weightChange: number | null; patient: any }) {
  const lost = weightChange !== null && weightChange < 0;
  const pctChange = (patient?.startingWeight && weightChange !== null)
    ? Math.abs(Math.round((weightChange / patient.startingWeight) * 1000) / 10) : null;
  return (
    <Card className="border-border/50 rounded-2xl shadow-sm bg-white">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><Scale className="w-4 h-4 text-sky-600" /><h3 className="text-sm font-bold text-foreground">Weight Trend</h3></div>
          {weightChange !== null && (
            <div className="flex items-center gap-1">
              {lost ? <TrendingDown className="w-3.5 h-3.5 text-emerald-600" /> : <TrendingUp className="w-3.5 h-3.5 text-rose-500" />}
              <span className={`text-sm font-bold ${lost ? "text-emerald-600" : "text-rose-500"}`}>{lost ? "" : "+"}{weightChange} kg</span>
            </div>
          )}
        </div>
        {pctChange !== null && <p className="text-xs text-muted-foreground mb-2">{lost ? "↓" : "↑"} {pctChange}% vs starting weight</p>}
        {weightSeries.length > 1 ? (
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={weightSeries}>
              <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={fmt} />
              <YAxis tick={{ fontSize: 9 }} domain={["auto", "auto"]} width={32} />
              <Tooltip formatter={(v: number) => [`${v} kg`, "Weight"]} labelFormatter={fmt} />
              <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : <div className="h-20 flex items-center justify-center text-xs text-muted-foreground">Not enough data yet</div>}
        <div className="flex justify-between text-xs text-muted-foreground mt-2 pt-2 border-t border-border/40">
          {patient?.startingWeight && <span>Start: <strong className="text-foreground">{patient.startingWeight} kg</strong></span>}
          {patient?.currentWeight && <span>Current: <strong className="text-foreground">{patient.currentWeight} kg</strong></span>}
          {patient?.targetWeight && <span>Goal: <strong className="text-foreground">{patient.targetWeight} kg</strong></span>}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Unified Consistency Card (all plans) ───────────────── */
function ConsistencyCard({ consistencyBreakdown }: { consistencyBreakdown: any }) {
  const sleep = consistencyBreakdown?.sleep ?? 0;
  const nutrition = consistencyBreakdown?.mealLogging ?? 0;
  const activity = consistencyBreakdown?.activity ?? 0;
  const overall = consistencyBreakdown
    ? Math.round((sleep + nutrition + activity) / 3)
    : null;

  const scoreColor = overall === null ? "#94a3b8"
    : overall >= 70 ? "#22c55e"
    : overall >= 45 ? "#f59e0b"
    : "#ef4444";
  const scoreBg = overall === null ? "bg-slate-50 text-slate-500 border-slate-200"
    : overall >= 70 ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : overall >= 45 ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-rose-50 text-rose-700 border-rose-200";
  const scoreLabel = overall === null ? "No data"
    : overall >= 70 ? "Strong"
    : overall >= 45 ? "Moderate"
    : "Needs Work";

  const bars = [
    { icon: <HeartPulse className="w-3.5 h-3.5 text-indigo-500" />, label: "Sleep", value: sleep, color: "bg-indigo-500" },
    { icon: <Salad className="w-3.5 h-3.5 text-emerald-600" />, label: "Nutrition", value: nutrition, color: "bg-emerald-500" },
    { icon: <Dumbbell className="w-3.5 h-3.5 text-violet-600" />, label: "Activity", value: activity, color: "bg-violet-500" },
  ];

  return (
    <Card className="border-border/50 rounded-2xl shadow-sm bg-white">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-foreground">Behavioral Consistency</h3>
        </div>

        {/* Overall score */}
        <div className="flex items-end gap-3 mb-4 pb-4 border-b border-border/40">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Overall Score</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold leading-none" style={{ color: scoreColor }}>
                {overall ?? "—"}
              </span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
          </div>
          <Badge variant="outline" className={`text-xs border mb-0.5 ${scoreBg}`}>{scoreLabel}</Badge>
        </div>

        {/* Individual metric bars */}
        <div className="space-y-3">
          {bars.map(b => (
            <div key={b.label}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="flex items-center gap-1.5 text-foreground/80 font-medium">{b.icon}{b.label}</span>
                <span className="font-bold text-foreground tabular-nums">
                  {b.value}<span className="text-muted-foreground font-normal text-[10px]">/100</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${b.color}`}
                  style={{ width: `${b.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground mt-3 pt-3 border-t border-border/40">
          Score = average of Sleep, Nutrition & Activity · last 7 days
        </p>
      </CardContent>
    </Card>
  );
}

/* ─── Energy Card ────────────────────────────────────────── */
function EnergyCard({ energySeries }: { energySeries: any[] }) {
  const last = energySeries[energySeries.length - 1];
  const labelCls = !last?.label ? "bg-slate-50 text-slate-600 border-slate-200"
    : /high|good/i.test(last.label) ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : /low|tired/i.test(last.label) ? "bg-rose-50 text-rose-700 border-rose-200"
    : "bg-amber-50 text-amber-700 border-amber-200";
  return (
    <Card className="border-border/50 rounded-2xl shadow-sm bg-white">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><Flame className="w-4 h-4 text-amber-500" /><h3 className="text-sm font-bold text-foreground">Energy & Daily Wellbeing</h3></div>
          {last?.label && <Badge variant="outline" className={`text-xs border capitalize ${labelCls}`}>{last.label}</Badge>}
        </div>
        <p className="text-[10px] text-muted-foreground mb-2">Self-reported · last 7 check-ins</p>
        {energySeries.length > 0 ? (
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={energySeries} barCategoryGap="30%">
              <XAxis dataKey="dow" tick={{ fontSize: 9 }} />
              <YAxis tick={false} domain={[0, 3]} hide />
              <Tooltip formatter={(v: number) => [v === 3 ? "High" : v === 2 ? "Moderate" : "Low", "Energy"]} labelFormatter={(_label: string, payload: any[]) => payload?.[0]?.payload?.date ? fmt(payload[0].payload.date) : ""} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {energySeries.map((e: any, i: number) => <Cell key={i} fill={energyColor(e.value)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <div className="h-20 flex items-center justify-center text-xs text-muted-foreground">No energy data yet</div>}
        <div className="flex justify-between mt-1">
          {energySeries.map((e: any, i: number) => (
            <span key={i} className="text-[9px] text-muted-foreground capitalize" style={{ width: "14.28%", textAlign: "center" }}>
              {e.label ? (e.label.length > 3 ? e.label.slice(0, 3) : e.label) : ""}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Glucose Card ───────────────────────────────────────── */
function GlucoseCard({ glucoseSeries, avgGlucose, compact }: { glucoseSeries: any[]; avgGlucose: number | null; compact?: boolean }) {
  const improving = avgGlucose !== null && avgGlucose < 120;
  return (
    <Card className="border-border/50 rounded-2xl shadow-sm bg-white">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2"><Droplets className="w-4 h-4 text-rose-500" /><h3 className="text-sm font-bold text-foreground">Glucose Readings</h3></div>
          {avgGlucose !== null && (
            <Badge variant="outline" className={`text-xs border ${improving ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
              {improving ? "In Range" : "Above Range"}
            </Badge>
          )}
        </div>
        {avgGlucose !== null && <p className="text-xs text-muted-foreground mb-2">7-day avg: <strong className="text-foreground">{avgGlucose} mg/dL</strong></p>}
        {glucoseSeries.length > 1 ? (
          <ResponsiveContainer width="100%" height={compact ? 110 : 140}>
            <LineChart data={glucoseSeries} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <ReferenceArea y1={80} y2={100} fill="#d1fae5" fillOpacity={0.45} />
              <ReferenceArea y1={100} y2={140} fill="#fef3c7" fillOpacity={0.35} />
              <ReferenceArea y1={140} y2={200} fill="#fee2e2" fillOpacity={0.3} />
              {/* Normal fasting threshold */}
              <ReferenceLine
                y={100}
                stroke="#16a34a"
                strokeWidth={1.5}
                strokeDasharray="5 3"
                label={{ value: "Normal fasting (100)", position: "insideTopRight", fill: "#16a34a", fontSize: 9 }}
              />
              {/* Post-meal target threshold */}
              <ReferenceLine
                y={140}
                stroke="#d97706"
                strokeWidth={1.5}
                strokeDasharray="5 3"
                label={{ value: "Post-meal target (140)", position: "insideTopRight", fill: "#d97706", fontSize: 9 }}
              />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={fmt} />
              <YAxis tick={{ fontSize: 9 }} domain={[60, 190]} width={30} />
              <Tooltip
                formatter={(v: number) => [`${Number(v).toFixed(0)} mg/dL`, "Fasting glucose"]}
                labelFormatter={fmt}
              />
              <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : <div className={`${compact ? "h-20" : "h-28"} flex items-center justify-center text-xs text-muted-foreground`}>Not enough glucose data yet</div>}
        <div className="flex flex-wrap gap-3 mt-2 pt-2 border-t border-border/40">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-200" />Normal (≤100)
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-200" />Elevated (100–140)
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-200" />High (&gt;140)
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
            <span className="inline-block w-6 border-t-2 border-dashed border-amber-600" />Post-meal limit
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Ops Insights Card (from care team only) ────────────── */
function OpsInsightsCard({ opsContent }: { opsContent: any }) {
  const insights: any[] = opsContent?.insights || [];
  const kindMap: Record<string, { bg: string; label: string }> = {
    challenge: { bg: "bg-rose-50 border-rose-200", label: "Observed Challenge" },
    positive: { bg: "bg-emerald-50 border-emerald-200", label: "Positive Note" },
    recommended: { bg: "bg-blue-50 border-blue-200", label: "Recommended Focus" },
  };
  return (
    <Card className="border-border/50 rounded-2xl shadow-sm bg-white">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><HeartPulse className="w-4 h-4 text-primary" /><h3 className="text-sm font-bold text-foreground">Weekly Insights</h3></div>
          <span className="text-[10px] text-muted-foreground bg-slate-50 border border-border/40 rounded-full px-2 py-0.5">From your care team</span>
        </div>
        {insights.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <HeartPulse className="w-8 h-8 text-muted-foreground/30 mx-auto" />
            <p className="text-sm text-muted-foreground">Your care team will publish insights for this week soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {insights.slice(0, 3).map((ins: any, i: number) => {
              const style = kindMap[ins.kind] || { bg: "bg-muted/50 border-border", label: ins.kind };
              return (
                <div key={i} className={`rounded-xl border p-3 ${style.bg}`}>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">{style.label}</p>
                  <p className="text-xs font-semibold text-foreground mb-1">{ins.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{ins.body}</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Premium Insights Card ──────────────────────────────── */
function PremiumInsightsCard({ opsContent, avgGlucose, glucoseVariability }: {
  opsContent: any; avgGlucose: number | null; glucoseVariability: number | null;
}) {
  const insights: any[] = opsContent?.insights || [];
  const primary = insights.find((i: any) => i.kind === "positive") || insights[0];
  const focuses = insights.filter((i: any) => i.kind === "recommended" || i.kind === "challenge").slice(0, 2);
  return (
    <Card className="border-border/50 rounded-2xl shadow-sm bg-white">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><HeartPulse className="w-4 h-4 text-primary" /><h3 className="text-sm font-bold text-foreground">Daily Insights</h3></div>
          <span className="text-[10px] text-muted-foreground bg-slate-50 border border-border/40 rounded-full px-2 py-0.5">From your care team</span>
        </div>
        {primary ? (
          <div className="bg-primary/5 rounded-xl p-3">
            <p className="text-[10px] font-bold text-primary uppercase tracking-wide mb-1">Interpreted Insight</p>
            <p className="text-xs font-semibold text-foreground mb-0.5">{primary.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{primary.body}</p>
          </div>
        ) : (
          <div className="text-center py-4">
            <HeartPulse className="w-7 h-7 text-muted-foreground/30 mx-auto mb-1" />
            <p className="text-sm text-muted-foreground">Your care team will publish insights soon.</p>
          </div>
        )}
        {focuses.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Recommended Focus</p>
            <div className="space-y-1.5">
              {focuses.map((ins: any, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground/80">{ins.body}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {(avgGlucose !== null || glucoseVariability !== null) && (
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Key Patterns</p>
            <div className="grid grid-cols-2 gap-2">
              {avgGlucose !== null && (
                <div className="bg-slate-50 rounded-xl p-2.5 border border-border/40">
                  <p className="text-[10px] text-muted-foreground">7-day avg glucose</p>
                  <p className="font-bold text-foreground text-sm mt-0.5">{avgGlucose} mg/dL</p>
                </div>
              )}
              {glucoseVariability !== null && (
                <div className="bg-slate-50 rounded-xl p-2.5 border border-border/40">
                  <p className="text-[10px] text-muted-foreground">Glucose variability</p>
                  <p className="font-bold text-foreground text-sm mt-0.5">{glucoseVariability} mg/dL</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Next Review Card ───────────────────────────────────── */
function NextReviewCard({ nextAppointment, totalCheckins, checkinCount, careTeam, isPremium, opsContent }: {
  nextAppointment: any; totalCheckins: number; checkinCount: number; careTeam: any; isPremium?: boolean; opsContent?: any;
}) {
  const cr = opsContent?.coachReview;
  const focusAreas: string[] = cr?.focusAreas?.length > 0
    ? cr.focusAreas
    : (nextAppointment?.notes ? nextAppointment.notes.split(/[\n\r•]/).filter(Boolean).slice(0, 4).map((s: string) => s.trim()) : []);

  const reviewDate = cr?.date
    ? new Date(cr.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })
    : nextAppointment
    ? new Date(nextAppointment.scheduledAt).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })
    : null;

  const reviewTime = cr?.time
    ? (() => {
        const [h, m] = cr.time.split(":");
        const d = new Date(); d.setHours(parseInt(h), parseInt(m));
        return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) + (cr.duration ? ` · ${cr.duration}` : "");
      })()
    : nextAppointment
    ? new Date(nextAppointment.scheduledAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) + (nextAppointment.careTeamMember ? ` · with ${nextAppointment.careTeamMember}` : "")
    : null;

  const providerName = cr?.providerName || nextAppointment?.careTeamMember || null;

  return (
    <Card className="border-border/50 rounded-2xl shadow-sm bg-white">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">{isPremium ? "Next Comprehensive Review" : "Next Coach Review"}</h3>
        </div>
        {reviewDate ? (
          <div className="space-y-3">
            <div className="bg-primary/5 rounded-xl p-3">
              <p className="text-sm font-semibold text-foreground">{reviewDate}</p>
              {reviewTime && <p className="text-xs text-muted-foreground mt-0.5">{reviewTime}</p>}
              {providerName && <p className="text-xs text-muted-foreground">with {providerName}</p>}
            </div>
            {focusAreas.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Focus Areas</p>
                <div className="space-y-1">
                  {focusAreas.map((area: string, i: number) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-foreground/80">
                      <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />{area}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <CalendarDays className="w-6 h-6 text-muted-foreground/40 mx-auto mb-1.5" />
            <p className="text-xs text-muted-foreground">Your care team will schedule your next review soon.</p>
          </div>
        )}
        {(careTeam?.physician || careTeam?.dietician || careTeam?.caretaker) && (
          <div className="mt-3 pt-3 border-t border-border/40">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Your Care Team</p>
            <div className="space-y-1.5">
              {careTeam.physician && <div className="flex items-center gap-2 text-xs"><Stethoscope className="w-3 h-3 text-sky-600" /><span className="text-foreground">{careTeam.physician.name}</span><span className="text-muted-foreground ml-1">Physician</span></div>}
              {careTeam.dietician && <div className="flex items-center gap-2 text-xs"><Salad className="w-3 h-3 text-emerald-600" /><span className="text-foreground">{careTeam.dietician.name}</span><span className="text-muted-foreground ml-1">Dietician</span></div>}
              {careTeam.caretaker && <div className="flex items-center gap-2 text-xs"><User className="w-3 h-3 text-violet-600" /><span className="text-foreground">{careTeam.caretaker.name}</span><span className="text-muted-foreground ml-1">Care Coordinator</span></div>}
            </div>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/40">
          You responded to <strong className="text-foreground">{checkinCount} of 7</strong> check-ins this week
          {totalCheckins > 0 && <span> · {totalCheckins} total check-ins</span>}
        </p>
      </CardContent>
    </Card>
  );
}

/* ═══════════════ MAIN COMPONENT ═══════════════════════════ */
export default function PatientDashboard() {
  const plan = useMemo(getPlan, []);
  const { data: dash, isLoading, error } = useQuery({
    queryKey: ["patient-dashboard"],
    queryFn: fetchDashboard,
    staleTime: 60_000,
    retry: 1,
  });

  const glucoseVariability = useMemo(() => {
    const vals = (dash?.glucoseSeries || []).map((g: any) => g.value);
    const avg = dash?.avgGlucose ?? null;
    if (vals.length < 2 || avg === null) return null;
    const variance = vals.reduce((s: number, v: number) => s + (v - avg) ** 2, 0) / vals.length;
    return Math.round(Math.sqrt(variance));
  }, [dash?.glucoseSeries, dash?.avgGlucose]);

  if (isLoading) {
    return (
      <PatientLayout>
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-border/40" />)}
        </div>
      </PatientLayout>
    );
  }

  if (error || !dash) {
    return (
      <PatientLayout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <HeartPulse className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Dashboard unavailable</h2>
          <p className="text-muted-foreground text-sm">We couldn't load your dashboard. Please try refreshing.</p>
        </div>
      </PatientLayout>
    );
  }

  /* ── Derived data ─────────────────────────────────── */
  const adherence7Day: any[] = dash.adherence7Day || [];
  const adherencePct: number | null = dash.adherencePct ?? null;
  const weightSeries: any[] = dash.weightSeries || [];
  const glucoseSeries: any[] = dash.glucoseSeries || [];
  const energySeries: any[] = dash.energySeries || [];
  const consistencyBreakdown = dash.consistencyBreakdown || {};
  const opsContent = dash.opsContent ?? null;
  const carePlan = dash.carePlan;
  const weightChange: number | null = dash.weightChange ?? null;
  const avgGlucose: number | null = dash.avgGlucose ?? null;
  const timeInRange: number | null = dash.timeInRange ?? null;
  const streak: number = dash.streak ?? 0;
  const completedCount = adherence7Day.filter(d => d.completed === true).length;
  const checkinCount = adherence7Day.filter(d => d.completed !== null).length;
  const missedCount = 7 - completedCount;
  const mealCount = Math.round(((consistencyBreakdown.mealLogging ?? 0) / 100) * 7);
  const activityCount = Math.round(((consistencyBreakdown.activity ?? 0) / 100) * 7);
  const sleepCount = Math.round(((consistencyBreakdown.sleep ?? 0) / 100) * 7);


  /* ── Shared adherence grid + legend ──────────────── */
  const AdherenceGrid = () => (
    <>
      <div className="flex justify-between gap-1 mb-3">
        {adherence7Day.map((day: any, i: number) => <AdherenceDayCell key={i} day={day} />)}
      </div>
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" />Met goals</span>
        <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-rose-400" />Not met</span>
        <span className="flex items-center gap-1"><MinusCircle className="w-3 h-3 text-slate-400" />No data</span>
      </div>
    </>
  );

  return (
    <PatientLayout>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-foreground">Patient Accountability Dashboard</h1>
              {plan === "premium" && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">Premium Plan</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {plan === "basic" ? "Simple behavioral reinforcement for continuity of care"
                : plan === "comprehensive" ? "Structured coaching with behavioral & metabolic tracking"
                : "Advanced monitoring with full metabolic & behavioral analysis"}
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground shrink-0">
            <p className="font-semibold text-foreground text-sm">{dash.patient.fullName}</p>
            <p>Patient ID #{dash.patient.id}</p>
            <p>Data as of {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
          </div>
        </div>

        {/* ── Check-in prompt ──────────────────────────── */}
        {!dash.checkinDoneToday && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-primary shrink-0" />
              <p className="text-sm font-medium text-foreground">You haven't done today's check-in yet</p>
            </div>
            <Link href="/patient/checkin"><Button size="sm" className="rounded-full text-xs h-7 shrink-0">Check in now</Button></Link>
          </div>
        )}

        {/* ══════════ PREMIUM PLAN ══════════════════════ */}
        {plan === "premium" && (
          <div className="space-y-6">

            {/* Section 1: Activity & Adherence */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Activity & Program Adherence</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Welcome + Today's Focus */}
                <div className="lg:col-span-2 bg-gradient-to-br from-primary to-blue-600 rounded-2xl p-5 text-white flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white/70 text-xs uppercase tracking-wide">Week {dash.weekNumber}</p>
                      <h3 className="text-xl font-bold mt-1">{dash.patient.fullName.split(" ")[0]}</h3>
                    </div>
                    {streak > 0 && (
                      <div className="flex flex-col items-center bg-white/15 rounded-xl px-3 py-2 shrink-0">
                        <Flame className="w-4 h-4 text-amber-300" />
                        <p className="text-xs font-bold text-white mt-0.5">{streak}d</p>
                        <p className="text-[10px] text-white/70">streak</p>
                      </div>
                    )}
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 space-y-1.5 flex-1">
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-wide">This Week's Focus</p>
                    {(opsContent?.thisWeekFocus || []).length > 0 ? (opsContent.thisWeekFocus as any[]).map((item: any, i: number) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-white/90">
                        <CheckCircle2 className="w-3 h-3 text-white/50 shrink-0 mt-0.5" />{item.text}
                      </div>
                    )) : (
                      <p className="text-xs text-white/60 italic">Your care team will set your weekly focus soon.</p>
                    )}
                  </div>
                </div>
                {/* Adherence with stats */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-border/50 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-primary" /><h3 className="text-sm font-bold text-foreground">Weekly Adherence</h3></div>
                    {adherencePct !== null && <span className="text-sm font-bold text-primary">{adherencePct}% this week</span>}
                  </div>
                  <AdherenceGrid />
                  <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-border/40">
                    {[
                      { label: "Active days", value: completedCount },
                      { label: "Check-ins", value: `${checkinCount}/7` },
                      { label: "Adherence", value: `${adherencePct ?? "—"}%` },
                      { label: "Missed", value: missedCount },
                    ].map(s => (
                      <div key={s.label} className="text-center">
                        <p className="text-base font-bold text-foreground">{s.value}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Behavioral Patterns */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Behavioral Patterns & Metabolic Markers</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <WeightCard weightSeries={weightSeries} weightChange={weightChange} patient={dash.patient} />
                <ConsistencyCard consistencyBreakdown={consistencyBreakdown} />
                <EnergyCard energySeries={energySeries} />
              </div>
            </div>

            {/* Section 3: Glucose */}
            {glucoseSeries.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
                  <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Glucose Readings</h2>
                </div>
                <GlucoseCard glucoseSeries={glucoseSeries} avgGlucose={avgGlucose} />
              </div>
            )}

            {/* Section 4: Insights */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {glucoseSeries.length > 0 ? "4" : "3"}
                </span>
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Daily Insights & Care Review</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <PremiumInsightsCard opsContent={opsContent} avgGlucose={avgGlucose} glucoseVariability={glucoseVariability} />
                <NextReviewCard nextAppointment={dash.nextAppointment} totalCheckins={dash.totalCheckins ?? 0} checkinCount={checkinCount} careTeam={dash.careTeam} isPremium opsContent={opsContent} />
              </div>
            </div>

            {/* Bottom stats bar */}
            {(avgGlucose !== null || timeInRange !== null) && (
              <div className="bg-slate-900 rounded-2xl p-4">
                <div className="flex flex-wrap gap-8 justify-around">
                  {avgGlucose !== null && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{avgGlucose} <span className="text-sm font-normal text-white/60">mg/dL</span></p>
                      <p className="text-xs text-white/50 mt-0.5">Avg Glucose (7d)</p>
                    </div>
                  )}
                  {timeInRange !== null && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-400">{timeInRange}<span className="text-sm font-normal text-white/60">%</span></p>
                      <p className="text-xs text-white/50 mt-0.5">Time in Range (7d)</p>
                    </div>
                  )}
                  {glucoseVariability !== null && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-amber-400">{glucoseVariability} <span className="text-sm font-normal text-white/60">mg/dL</span></p>
                      <p className="text-xs text-white/50 mt-0.5">Glucose Variability</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════ BASIC & COMPREHENSIVE ══════════════ */}
        {(plan === "basic" || plan === "comprehensive") && (
          <div className="space-y-5">
            {/* Row 1: Welcome + Adherence */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-primary to-blue-600 rounded-2xl p-5 text-white flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white/70 text-xs uppercase tracking-wide">Week {dash.weekNumber}</p>
                    <h3 className="text-xl font-bold mt-1">{dash.patient.fullName}</h3>
                  </div>
                  {streak > 0 && (
                    <div className="flex flex-col items-center bg-white/15 rounded-xl px-3 py-2 shrink-0">
                      <Star className="w-4 h-4 text-amber-300" />
                      <p className="text-xs font-bold text-white mt-0.5">{streak}</p>
                      <p className="text-[10px] text-white/70">streak</p>
                    </div>
                  )}
                </div>
                <div className="bg-white/10 rounded-xl p-3 space-y-2">
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-wide">This Week's Focus</p>
                  {(opsContent?.thisWeekFocus || []).length > 0 ? (opsContent.thisWeekFocus as any[]).map((item: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-white/90">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white/50 shrink-0 mt-0.5" /><span>{item.text}</span>
                    </div>
                  )) : (
                    <p className="text-xs text-white/60 italic">Your care team will set your weekly focus soon.</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-border/50 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-primary" /><h3 className="text-sm font-bold text-foreground">Weekly Adherence</h3></div>
                  {adherencePct !== null && <span className="text-sm font-bold text-primary">{adherencePct}% this week</span>}
                </div>
                <AdherenceGrid />
              </div>
            </div>

            {/* Row 2: Metrics */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${plan === "comprehensive" && glucoseSeries.length > 0 ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-4`}>
              <WeightCard weightSeries={weightSeries} weightChange={weightChange} patient={dash.patient} />
              <ConsistencyCard consistencyBreakdown={consistencyBreakdown} />
              <EnergyCard energySeries={energySeries} />
              {plan === "comprehensive" && glucoseSeries.length > 0 && (
                <GlucoseCard glucoseSeries={glucoseSeries} avgGlucose={avgGlucose} compact />
              )}
            </div>

            {/* Row 3: Insights + Review */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <OpsInsightsCard opsContent={opsContent} />
              <NextReviewCard nextAppointment={dash.nextAppointment} totalCheckins={dash.totalCheckins ?? 0} checkinCount={checkinCount} careTeam={dash.careTeam} opsContent={opsContent} />
            </div>
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
