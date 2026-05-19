import { PatientLayout } from "@/components/layout/patient-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity, TrendingDown, Calendar, Clock, CheckCircle2, ArrowUp, AlertCircle,
  TrendingUp, MessageSquare, Video, Lock, ChevronRight, Star
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceArea, BarChart, Bar, Cell
} from "recharts";
import { Link, useLocation } from "wouter";
import { AssessmentModal } from "./assessment";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

type Plan = "basic" | "comprehensive" | "premium";

async function fetchDashboard() {
  const token = localStorage.getItem("cloudberry_token");
  const r = await fetch(`${API}/patients/me/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error("Failed");
  return r.json();
}

function getPlan(): Plan {
  const p = localStorage.getItem("cloudberry_plan");
  return (p === "basic" || p === "comprehensive" || p === "premium") ? p : "comprehensive";
}

/* ─── Static demo data ────────────────────────────────────────── */
const weightData = [
  { label: "Apr 14", w: 82.0 }, { label: "Apr 21", w: 81.3 }, { label: "Apr 28", w: 80.8 },
  { label: "May 5", w: 80.1 }, { label: "May 12", w: 79.4 },
];
const glucoseData = [
  { day: "Mon", g: 118 }, { day: "Tue", g: 132 }, { day: "Wed", g: 107 },
  { day: "Thu", g: 124 }, { day: "Fri", g: 99 }, { day: "Sat", g: 138 }, { day: "Sun", g: 104 },
];
const energyData = [
  { day: "Mon", v: 3 }, { day: "Tue", v: 3 }, { day: "Wed", v: 2 },
  { day: "Thu", v: 3 }, { day: "Fri", v: 1 }, { day: "Sat", v: 2 }, { day: "Sun", v: 1 },
];
const energyColor = (v: number) => v === 3 ? "#22c55e" : v === 2 ? "#f59e0b" : "#ef4444";
const energyLabel = (v: number) => v === 3 ? "High" : v === 2 ? "Moderate" : "Low";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const adherenceDays = [true, true, true, true, false, true, false];

/* ─── Small chart components ─────────────────────────────────── */
function WeightMiniChart() {
  return (
    <ResponsiveContainer width="100%" height={80}>
      <LineChart data={weightData} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
        <XAxis dataKey="label" tick={{ fontSize: 9 }} />
        <YAxis domain={[79, 83]} tick={{ fontSize: 9 }} />
        <Tooltip formatter={(v: number) => [`${v} kg`, "Weight"]} />
        <Line type="monotone" dataKey="w" stroke="hsl(218 91% 50%)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function GlucoseChart({ zones = false }: { zones?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <LineChart data={glucoseData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="day" tick={{ fontSize: 9 }} />
        <YAxis domain={[70, 160]} tick={{ fontSize: 9 }} />
        <Tooltip formatter={(v: number) => [`${v} mg/dL`, "Glucose"]} />
        {zones && <>
          <ReferenceArea y1={80} y2={120} fill="#22c55e0d" />
          <ReferenceArea y1={120} y2={140} fill="#f59e0b0d" />
          <ReferenceArea y1={140} y2={160} fill="#ef44440d" />
        </>}
        <Line type="monotone" dataKey="g" stroke="hsl(218 91% 50%)" strokeWidth={2}
          dot={({ cx, cy, payload }: any) => {
            const c = payload.g < 120 ? "#22c55e" : payload.g < 140 ? "#f59e0b" : "#ef4444";
            return <circle key={cx} cx={cx} cy={cy} r={3.5} fill={c} stroke="white" strokeWidth={1} />;
          }} activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function EnergyBarChart() {
  return (
    <ResponsiveContainer width="100%" height={80}>
      <BarChart data={energyData} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
        <XAxis dataKey="day" tick={{ fontSize: 9 }} />
        <YAxis domain={[0, 3]} ticks={[1, 2, 3]} tickFormatter={v => ["", "Lo", "Mid", "Hi"][v]} tick={{ fontSize: 9 }} />
        <Tooltip formatter={(v: number) => [energyLabel(v), "Energy"]} />
        <Bar dataKey="v" radius={[3, 3, 0, 0]}>
          {energyData.map((d, i) => <Cell key={i} fill={energyColor(d.v)} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ─── Weekly Adherence Grid ─────────────────────────────────── */
function WeeklyAdherence({ adherence }: { adherence: boolean[] }) {
  const pct = Math.round((adherence.filter(Boolean).length / adherence.length) * 100);
  return (
    <Card className="border-border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-foreground">Weekly Adherence</p>
          <span className="text-lg font-extrabold text-primary">{pct}%</span>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((d, i) => (
            <div key={d} className="flex flex-col items-center gap-1">
              <span className="text-[9px] text-muted-foreground font-medium">{d}</span>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                adherence[i] === undefined
                  ? "bg-muted text-muted-foreground"
                  : adherence[i]
                  ? "bg-green-100 text-green-700"
                  : "bg-red-50 text-red-500"
              }`}>
                {adherence[i] === undefined ? "–" : adherence[i] ? "✓" : "✕"}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" /> Met goals</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> Did not meet</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted" /> No data</span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Messages Card ─────────────────────────────────────────── */
const demoMessages = [
  { from: "Dr. Arjun Mehta", role: "Physician", msg: "Your glucose trend looks much better this week. Keep up the dinner timing improvements.", time: "2h ago", color: "bg-blue-100 text-blue-700" },
  { from: "Priya Sharma", role: "Dietician", msg: "Try adding 1 tablespoon of chia seeds to your breakfast yogurt — great for satiety and blood sugar.", time: "Yesterday", color: "bg-green-100 text-green-700" },
  { from: "Rajesh Kumar", role: "Caretaker", msg: "Remember your check-in this evening! You've been great at consistency this week.", time: "9am", color: "bg-purple-100 text-purple-700" },
];

function MessagesCard() {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" /> Messages from Care Team
          </CardTitle>
          <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{demoMessages.length} new</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {demoMessages.map((m, i) => (
          <div key={i} className="flex gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${m.color}`}>
              {m.from.split(" ").map(w => w[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-foreground">{m.from}</p>
                <span className="text-[10px] text-muted-foreground">{m.role}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{m.time}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{m.msg}</p>
            </div>
          </div>
        ))}
        <Button variant="ghost" size="sm" className="w-full text-xs text-primary h-8 rounded-lg">
          View all messages <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

/* ─── BASIC Dashboard ────────────────────────────────────────── */
function BasicDashboard({ weekNum, streak, adherence }: { weekNum: number; streak: number; adherence: boolean[] }) {
  const currentW = weightData[weightData.length - 1].w;
  const startW = weightData[0].w;
  const todayEnergy = energyData[energyData.length - 1].v;
  return (
    <div className="space-y-4">
      <WeeklyAdherence adherence={adherence} />

      {/* Metric row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border shadow-sm">
          <CardContent className="p-3 text-center">
            <TrendingDown className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-extrabold text-foreground">{currentW}<span className="text-xs font-normal"> kg</span></p>
            <p className="text-[10px] text-green-600 font-semibold">↓ {(startW - currentW).toFixed(1)} kg</p>
            <p className="text-[9px] text-muted-foreground">since start</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="p-3 text-center">
            <CheckCircle2 className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-extrabold text-primary">74%</p>
            <p className="text-[10px] text-muted-foreground">consistency</p>
            <p className="text-[9px] text-muted-foreground">this week</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="p-3 text-center">
            <Activity className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className={`text-lg font-extrabold ${todayEnergy === 3 ? "text-green-600" : todayEnergy === 2 ? "text-amber-500" : "text-red-500"}`}>
              {energyLabel(todayEnergy)}
            </p>
            <p className="text-[10px] text-muted-foreground">energy</p>
            <p className="text-[9px] text-muted-foreground">today</p>
          </CardContent>
        </Card>
      </div>

      {/* Weight trend */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><TrendingDown className="w-4 h-4 text-primary" /> Weight Trend</CardTitle>
          <CardDescription className="text-xs">−{(startW - currentW).toFixed(1)} kg from start</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pb-3"><WeightMiniChart /></CardContent>
      </Card>

      {/* Energy */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Energy & Daily Wellbeing</CardTitle>
            <Badge className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
              {energyLabel(energyData.reduce((a, d) => a + d.v, 0) > 14 ? 3 : 2)}
            </Badge>
          </div>
          <CardDescription className="text-xs">Self-reported energy levels</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pb-3">
          <EnergyBarChart />
          <div className="flex justify-center gap-4 mt-1">
            {[{ c: "#22c55e", l: "High" }, { c: "#f59e0b", l: "Moderate" }, { c: "#ef4444", l: "Low" }].map(x => (
              <div key={x.l} className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ backgroundColor: x.c }} /><span className="text-[9px] text-muted-foreground">{x.l}</span></div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Insight */}
      <Card className="border-amber-200/80 bg-amber-50/50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Weekly Insight · From Your Coach</p>
              <p className="text-sm text-foreground/80 leading-relaxed">Evening cravings and inconsistent dinner timing were the main challenge this week.</p>
              <div className="mt-2 space-y-1">
                <p className="text-xs font-semibold text-amber-800">Next week focus:</p>
                {["Protein-rich evening snack", "Short post-dinner walk"].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-foreground/75">
                    <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />{f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Review */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Next Coach Review</p>
            <p className="font-semibold text-foreground text-sm">Sunday · 6:00 PM</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {["Dinner consistency", "Evening cravings", "Activity completion"].map(f => (
                <span key={f} className="text-[9px] border border-border rounded-full px-2 py-0.5 text-muted-foreground">{f}</span>
              ))}
            </div>
          </div>
          <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs gap-1 shrink-0">
            <Video className="w-3 h-3" /> Join
          </Button>
        </CardContent>
      </Card>

      <MessagesCard />
    </div>
  );
}

/* ─── COMPREHENSIVE Dashboard ────────────────────────────────── */
function ComprehensiveDashboard({ weekNum, streak, adherence }: { weekNum: number; streak: number; adherence: boolean[] }) {
  const currentW = weightData[weightData.length - 1].w;
  const startW = weightData[0].w;
  return (
    <div className="space-y-4">
      <WeeklyAdherence adherence={adherence} />

      {/* Row of 3 metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Weight */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Weight Trend</p>
              <TrendingDown className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-green-600">↓ {(startW - currentW).toFixed(1)} kg</span>
              <Badge className="text-[9px] bg-green-50 text-green-700 border-green-200">−{(((startW - currentW) / startW) * 100).toFixed(1)}%</Badge>
            </div>
            <p className="text-[10px] text-muted-foreground mb-2">since program start</p>
            <WeightMiniChart />
            <p className="text-[10px] text-muted-foreground mt-1">Current: {currentW} kg · Start: {startW} kg</p>
          </CardContent>
        </Card>

        {/* Behavioral Consistency */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Behavioral Consistency</p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-primary">74%</span>
              <Badge className="text-[10px] bg-green-50 text-green-700 border-green-200">● Strong</Badge>
            </div>
            <p className="text-[10px] text-muted-foreground mb-3">adherence this week</p>
            <div className="space-y-1.5">
              {[["Meal logging", 0.86], ["Check-ins", 0.71], ["Activity completion", 0.71]].map(([label, val]) => (
                <div key={label as string}>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                    <span>{label}</span><span>{Math.round((val as number) * 7)}/7</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(val as number) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">5 of 7 days met program goals</p>
          </CardContent>
        </Card>

        {/* Energy */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Energy & Wellbeing</p>
              <Badge className="text-[9px] bg-amber-50 text-amber-700 border-amber-200">Moderate</Badge>
            </div>
            <p className="text-[10px] text-muted-foreground mb-2">Self-reported energy levels</p>
            <EnergyBarChart />
            <div className="flex justify-center gap-3 mt-1">
              {[{ c: "#22c55e", l: "High" }, { c: "#f59e0b", l: "Mod" }, { c: "#ef4444", l: "Low" }].map(x => (
                <div key={x.l} className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ backgroundColor: x.c }} /><span className="text-[9px] text-muted-foreground">{x.l}</span></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fasting Glucose Trend */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Fasting Glucose Trend</CardTitle>
            <Badge className="text-[10px] bg-green-50 text-green-700 border-green-200">↓ −10% vs baseline</Badge>
          </div>
          <CardDescription className="text-xs">Fasting glucose readings improving with more consistent dinner timing and evening walks</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pb-3">
          <GlucoseChart zones />
          <div className="flex justify-center gap-4 mt-2">
            {[{ c: "#22c55e", l: "Target (80–120)" }, { c: "#f59e0b", l: "Caution (120–140)" }, { c: "#ef4444", l: "High (140+)" }].map(z => (
              <div key={z.l} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm opacity-60" style={{ backgroundColor: z.c }} />
                <span className="text-[9px] text-muted-foreground">{z.l}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Insights row */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" /> Weekly Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-red-50/60 rounded-xl p-3">
              <p className="text-[10px] font-bold text-red-700 uppercase tracking-wide mb-1">⚠ Observed Challenge</p>
              <p className="text-xs text-foreground/80">Evening cravings and inconsistent dinner timing.</p>
            </div>
            <div className="bg-green-50/60 rounded-xl p-3">
              <p className="text-[10px] font-bold text-green-700 uppercase tracking-wide mb-1">📈 Positive Correlation</p>
              <p className="text-xs text-foreground/80">Glucose readings improved on days with structured dinners and walks.</p>
            </div>
            <div className="bg-blue-50/60 rounded-xl p-3">
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-1">🎯 Focus for Next Week</p>
              <ul className="text-xs text-foreground/80 space-y-0.5">
                <li>• Protein-rich evening snack</li>
                <li>• Short post-dinner walk</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Review + Messages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Next Coach Review</p>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">Sunday, May 18</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> 6:00 PM</p>
              </div>
            </div>
            <div className="space-y-1 mb-3">
              <p className="text-[10px] font-semibold text-muted-foreground">Focus Areas</p>
              {["Dinner consistency", "Evening cravings", "Activity completion"].map(f => (
                <div key={f} className="flex items-center gap-1.5 text-xs text-foreground/75">
                  <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />{f}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">Patient responded to 5 of 7 check-ins this week</p>
            <Button size="sm" className="w-full mt-3 h-8 rounded-lg text-xs gap-1.5">
              <Video className="w-3.5 h-3.5" /> Join Call
            </Button>
          </CardContent>
        </Card>
        <MessagesCard />
      </div>
    </div>
  );
}

/* ─── PREMIUM Dashboard ───────────────────────────────────────── */
function PremiumDashboard({ weekNum, streak, adherence }: { weekNum: number; streak: number; adherence: boolean[] }) {
  const currentW = weightData[weightData.length - 1].w;
  const startW = weightData[0].w;
  const goalW = 72.0;

  return (
    <div className="space-y-4">
      {/* Row 1: Adherence */}
      <WeeklyAdherence adherence={adherence} />

      {/* Row 2: 4 metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Weight */}
        <Card className="border-border shadow-sm col-span-1">
          <CardContent className="p-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Weight Trend</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-green-600">↓ {(startW - currentW).toFixed(1)} kg</span>
            </div>
            <Badge className="text-[9px] bg-green-50 text-green-700 border-green-200 mb-2">−{(((startW - currentW) / startW) * 100).toFixed(1)}%</Badge>
            <WeightMiniChart />
            <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
              <span>Current: {currentW} kg</span>
              <span>Goal: {goalW} kg</span>
            </div>
          </CardContent>
        </Card>

        {/* Behavioral Consistency */}
        <Card className="border-border shadow-sm col-span-1">
          <CardContent className="p-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Consistency</p>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-extrabold text-primary">74%</span>
              <Badge className="text-[9px] bg-green-50 text-green-700 border-green-200">Strong</Badge>
            </div>
            <div className="space-y-1 mt-2">
              {[["Meal logging", 86], ["Check-ins", 71], ["Activity", 71]].map(([l, v]) => (
                <div key={l}>
                  <div className="flex justify-between text-[9px] text-muted-foreground"><span>{l}</span><span>{Math.round((v as number) * 7 / 100)}/7</span></div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${v}%` }} /></div>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-muted-foreground mt-2">6 of 7 days met goals</p>
          </CardContent>
        </Card>

        {/* Energy */}
        <Card className="border-border shadow-sm col-span-1">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Energy</p>
              <Badge className="text-[9px] bg-amber-50 text-amber-700 border-amber-200">Moderate</Badge>
            </div>
            <EnergyBarChart />
            <p className="text-[9px] text-muted-foreground mt-1 text-center">Self-reported levels</p>
          </CardContent>
        </Card>

        {/* Glucose */}
        <Card className="border-border shadow-sm col-span-1">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Glucose</p>
              <Badge className="text-[9px] bg-green-50 text-green-700 border-green-200">↓ −10%</Badge>
            </div>
            <GlucoseChart zones />
            <p className="text-[9px] text-muted-foreground mt-1 text-center">Fasting & Post-Meal</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Insight Banner */}
      <Card className="border-primary/25 bg-gradient-to-r from-primary/5 via-white to-blue-50/40 shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-primary uppercase tracking-wide mb-1">Interpreted Insight</p>
              <p className="text-sm font-semibold text-foreground leading-snug">Fasting glucose improved this week, but post-meal variability remains elevated after later dinners.</p>
              <div className="mt-3 space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Recommended Focus</p>
                {[["Structured dinner timing", "Aim for dinner before 8:00 PM"], ["Post-meal walking", "10–15 min walk after dinner"], ["Protein intake consistency", "Target 20–30g per meal"]].map(([title, sub]) => (
                  <div key={title} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                    <div><span className="text-xs font-medium text-foreground">{title}</span><span className="text-xs text-muted-foreground"> — {sub}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Insights + Next Review */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-border shadow-sm sm:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Daily Insights</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {[
              { icon: "📈", label: "Great Progress", desc: "Your consistency is creating measurable improvement.", color: "text-green-700 bg-green-50" },
              { icon: "🎯", label: "Focus This Week", desc: "Structured dinner timing and protein consistency will accelerate results.", color: "text-blue-700 bg-blue-50" },
              { icon: "⚠️", label: "Pattern Detected", desc: "Higher evening glucose spikes were observed on low-sleep days.", color: "text-red-700 bg-red-50" },
            ].map((ins, i) => (
              <div key={i} className={`flex items-start gap-3 rounded-xl px-3 py-2.5 ${ins.color.split(" ")[1]}`}>
                <span className="text-base shrink-0">{ins.icon}</span>
                <div>
                  <p className={`text-xs font-semibold ${ins.color.split(" ")[0]}`}>{ins.label}</p>
                  <p className="text-xs text-foreground/75 mt-0.5">{ins.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Next Comprehensive Review</p>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-primary" />
              <div>
                <p className="font-bold text-foreground text-sm">Sunday, May 18</p>
                <p className="text-xs text-muted-foreground">6:00 PM · 45 min</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mb-2">with Dr. Priya Nair</p>
            <div className="space-y-1 mb-3">
              {["Dinner consistency", "Evening cravings", "Activity completion", "Post-meal glucose variability"].map(f => (
                <div key={f} className="flex items-center gap-1.5 text-[10px] text-foreground/75">
                  <CheckCircle2 className="w-2.5 h-2.5 text-primary shrink-0" />{f}
                </div>
              ))}
            </div>
            <Button size="sm" className="w-full h-8 rounded-lg text-xs gap-1">
              <Video className="w-3 h-3" /> Join Call
            </Button>
            <p className="text-[9px] text-muted-foreground text-center mt-2">Patient responded to 6 of 7 check-ins</p>
          </CardContent>
        </Card>
      </div>

      {/* Bottom stats bar */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-3">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {[
              { label: "Avg Glucose (7d)", val: "106", unit: "mg/dL", delta: "↓ 7", good: true },
              { label: "Time in Range (7d)", val: "78", unit: "%", delta: "↑ 11%", good: true },
              { label: "Glucose Variability", val: "24", unit: "mg/dL", delta: "↓ 3", good: true },
              { label: "Steps (7d avg)", val: "7,842", unit: "", delta: "↑ 1,236", good: true },
              { label: "Active Minutes", val: "186", unit: "min", delta: "↑ 36", good: true },
              { label: "Sleep (7d avg)", val: "6h 42m", unit: "", delta: "↓ 28m", good: false },
            ].map(stat => (
              <div key={stat.label} className="text-center border border-border/40 rounded-xl p-2">
                <p className="text-[9px] text-muted-foreground leading-tight mb-1">{stat.label}</p>
                <p className="text-sm font-extrabold text-foreground">{stat.val}<span className="text-[9px] font-normal text-muted-foreground ml-0.5">{stat.unit}</span></p>
                <p className={`text-[9px] font-semibold ${stat.good ? "text-green-600" : "text-red-500"}`}>{stat.delta}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <MessagesCard />
    </div>
  );
}

/* ─── MAIN EXPORT ─────────────────────────────────────────────── */
export default function PatientDashboard() {
  const plan = useMemo(() => getPlan(), []);
  const [, navigate] = useLocation();
  const [assessmentDone, setAssessmentDone] = useState(() => {
    return localStorage.getItem("cloudberry_assessment_done") === "1";
  });
  const [showAssessment, setShowAssessment] = useState(false);
  const [checkinRequired, setCheckinRequired] = useState(() => {
    return localStorage.getItem("cloudberry_first_checkin_done") !== "1";
  });

  const { data: dash } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    retry: 1,
    staleTime: 60000,
  });

  const storedName = localStorage.getItem("cloudberry_name") || "Rahul Sharma";
  const firstName = storedName.split(" ")[0];

  const weekNum = dash?.weekNumber ?? 3;
  const streak = dash?.streak ?? 12;
  const isNewPatient = dash?.streak === 0 || dash?.streak == null;

  // Auto-launch assessment for new users the first time their data loads
  useEffect(() => {
    if (dash && isNewPatient && !assessmentDone) {
      setShowAssessment(true);
    }
  }, [dash, isNewPatient, assessmentDone]);

  const adherence = useMemo(() => {
    if (dash?.recentCheckins?.length > 0) {
      const days = Array(7).fill(undefined);
      dash.recentCheckins.slice(0, 7).forEach((c: any, i: number) => {
        days[6 - i] = c.mealsFollowed === "yes";
      });
      return days;
    }
    return adherenceDays;
  }, [dash]);

  const planLabel: Record<Plan, string> = {
    basic: "Accountability Program",
    comprehensive: "Structured Coaching",
    premium: "Advanced Monitoring",
  };
  const planColor: Record<Plan, string> = {
    basic: "bg-slate-100 text-slate-700 border-slate-200",
    comprehensive: "bg-primary/10 text-primary border-primary/20",
    premium: "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <PatientLayout>
      {/* Initial Assessment Modal — auto-shown for new patients */}
      {showAssessment && !assessmentDone && (
        <AssessmentModal
          plan={plan}
          onComplete={() => {
            localStorage.setItem("cloudberry_assessment_done", "1");
            setAssessmentDone(true);
            setShowAssessment(false);
            // New-user flow: assessment → first check-in → dashboard
            navigate("/patient/checkin");
          }}
        />
      )}

      {/* First check-in gate: after assessment but before first check-in */}
      {assessmentDone && checkinRequired && isNewPatient && (
        <div className="fixed inset-0 z-40 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-border p-8 max-w-md w-full text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Assessment complete! 🎉</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Your health profile is set up. Complete your first daily check-in to unlock your personalised dashboard.
              </p>
            </div>
            <Button className="w-full rounded-xl" onClick={() => navigate("/patient/checkin")}>
              Do Your First Check-in <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <button
              className="text-xs text-muted-foreground underline underline-offset-2"
              onClick={() => {
                localStorage.setItem("cloudberry_first_checkin_done", "1");
                setCheckinRequired(false);
              }}
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      <div className="p-4 md:p-5 max-w-5xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">
                {new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening"}, {firstName}!
              </h1>
              {streak > 0 && (
                <span className="text-base font-bold text-orange-500 flex items-center gap-1">
                  🔥 {streak} day streak
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">Week {weekNum} of your journey · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`text-xs px-3 py-1 font-medium border ${planColor[plan]}`}>
              {plan === "premium" && <Star className="w-3 h-3 mr-1 fill-amber-500 text-amber-500" />}
              {planLabel[plan]}
            </Badge>
          </div>
        </div>

        {/* Assessment prompt for new patients */}
        {!assessmentDone && (
          <div className="bg-gradient-to-r from-primary/8 to-blue-50/60 border border-primary/20 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Complete your initial health assessment</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">Before your first session, we need to understand your health background. Takes ~5 minutes.</p>
              </div>
              <Button size="sm" className="shrink-0 rounded-xl text-xs" onClick={() => setShowAssessment(true)}>
                Start Assessment <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Welcome card + Quick Check-in CTA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/8 to-blue-50/40">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {firstName.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-foreground">Welcome back, {firstName}!</p>
                  <p className="text-xs text-muted-foreground">Week {weekNum} of your journey</p>
                  {streak > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 bg-white/70 rounded-full px-3 py-1 w-fit">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-semibold text-foreground">Excellent consistency — {streak} active days</span>
                    </div>
                  )}
                  <div className="mt-3">
                    <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">This week's focus</p>
                    <div className="flex flex-wrap gap-1.5">
                      {["Protein-rich breakfast", "20-min evening walk"].map(f => (
                        <span key={f} className="flex items-center gap-1 text-[10px] bg-white/80 border border-primary/15 text-foreground/80 rounded-full px-2.5 py-1">
                          <CheckCircle2 className="w-2.5 h-2.5 text-primary" />{f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Check-in CTA */}
          <Link href="/patient/checkin">
            <Card className="border-border shadow-sm cursor-pointer hover:shadow-md hover:border-primary/30 transition-all h-full group">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Daily Check-in</p>
                      <p className="text-[10px] text-muted-foreground">Not done today</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">Answer 5 quick questions with sliders — takes under 2 minutes.</p>
                </div>
                <Button size="sm" className="mt-3 w-full rounded-xl text-xs group-hover:bg-primary/90">
                  Start Check-in <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Plan-specific dashboard sections */}
        {plan === "basic" && <BasicDashboard weekNum={weekNum} streak={streak} adherence={adherence} />}
        {plan === "comprehensive" && <ComprehensiveDashboard weekNum={weekNum} streak={streak} adherence={adherence} />}
        {plan === "premium" && <PremiumDashboard weekNum={weekNum} streak={streak} adherence={adherence} />}

        {/* Upgrade banner for basic */}
        {plan === "basic" && (
          <div className="bg-gradient-to-r from-primary/8 to-blue-50/40 border border-primary/20 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-semibold text-foreground text-sm">Unlock Nutrition & Fitness Coaching</p>
              <p className="text-xs text-muted-foreground mt-0.5">Upgrade to Comprehensive for personalised meal plans and movement guidance.</p>
            </div>
            <Button asChild size="sm" className="rounded-full shrink-0 text-xs">
              <a href="/#pricing">Upgrade Plan →</a>
            </Button>
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
