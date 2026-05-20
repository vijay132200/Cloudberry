import { StaffLayout } from "@/components/layout/staff-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from "recharts";
import { TrendingUp, Users, Activity, AlertTriangle, BarChart3, Target, Heart, Calendar } from "lucide-react";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";

async function fetchJson(path: string) {
  const token = localStorage.getItem("cloudberry_token") || "";
  const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <Card className="border-border shadow-sm">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className="text-3xl font-extrabold text-foreground mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OpsAnalytics() {
  const { data: kpis } = useQuery({ queryKey: ["ops-dashboard-kpi"], queryFn: () => fetchJson("/ops/dashboard"), refetchInterval: 30000 });
  const { data: patients = [], isLoading } = useQuery<any[]>({ queryKey: ["ops-patients-analytics"], queryFn: () => fetchJson("/ops/patients"), refetchInterval: 30000 });

  const pts = patients as any[];

  const riskDist = [
    { name: "Low Risk", value: pts.filter(p => p.riskLevel === "low").length, color: "#22c55e" },
    { name: "Medium Risk", value: pts.filter(p => p.riskLevel === "medium").length, color: "#f59e0b" },
    { name: "High Risk", value: pts.filter(p => p.riskLevel === "high").length, color: "#ef4444" },
  ].filter(d => d.value > 0);

  const planDist = [
    { name: "Premium", value: pts.filter(p => p.plan === "premium").length, color: "#f59e0b" },
    { name: "Comprehensive", value: pts.filter(p => p.plan === "comprehensive").length, color: "#3b82f6" },
    { name: "Basic", value: pts.filter(p => p.plan === "basic").length, color: "#94a3b8" },
  ].filter(d => d.value > 0);

  const goalDist = Object.entries(
    pts.reduce((acc: any, p: any) => { if (p.primaryGoal) acc[p.primaryGoal] = (acc[p.primaryGoal] || 0) + 1; return acc; }, {})
  ).map(([k, v]: any) => ({
    name: k.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
    value: v,
  })).sort((a: any, b: any) => b.value - a.value);

  const adherenceBuckets = [
    { range: "0-25%", count: pts.filter(p => p.adherencePct <= 25).length },
    { range: "26-50%", count: pts.filter(p => p.adherencePct > 25 && p.adherencePct <= 50).length },
    { range: "51-75%", count: pts.filter(p => p.adherencePct > 50 && p.adherencePct <= 75).length },
    { range: "76-100%", count: pts.filter(p => p.adherencePct > 75).length },
  ];

  const weeklyAdherence = [
    { week: "Wk 1", adherence: Math.round(pts.filter(p => p.weekNumber === 1).reduce((a: number, p: any) => a + p.adherencePct, 0) / Math.max(1, pts.filter(p => p.weekNumber === 1).length)) },
    { week: "Wk 2", adherence: Math.round(pts.filter(p => p.weekNumber === 2).reduce((a: number, p: any) => a + p.adherencePct, 0) / Math.max(1, pts.filter(p => p.weekNumber === 2).length)) },
    { week: "Wk 3", adherence: Math.round(pts.filter(p => p.weekNumber === 3).reduce((a: number, p: any) => a + p.adherencePct, 0) / Math.max(1, pts.filter(p => p.weekNumber === 3).length)) },
    { week: "Wk 4+", adherence: Math.round(pts.filter(p => p.weekNumber >= 4).reduce((a: number, p: any) => a + p.adherencePct, 0) / Math.max(1, pts.filter(p => p.weekNumber >= 4).length)) },
  ].filter(d => !isNaN(d.adherence) && d.adherence > 0);

  const cityDist = Object.entries(
    pts.reduce((acc: any, p: any) => { if (p.city) acc[p.city] = (acc[p.city] || 0) + 1; return acc; }, {})
  ).map(([k, v]: any) => ({ city: k, count: v })).sort((a: any, b: any) => b.count - a.count).slice(0, 8);

  const avgAdherence = pts.length > 0 ? Math.round(pts.reduce((a, p) => a + (p.adherencePct || 0), 0) / pts.length) : 0;

  return (
    <StaffLayout type="ops">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" /> Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Live data from Neon database · auto-refreshes every 30s</p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Patients" value={kpis?.activePatients ?? pts.length} sub="enrolled in program" color="bg-blue-50 text-blue-600" />
          <StatCard icon={AlertTriangle} label="High Risk" value={kpis?.highRiskCount ?? riskDist.find(r => r.name === "High Risk")?.value ?? 0} sub="need attention" color="bg-rose-50 text-rose-600" />
          <StatCard icon={Activity} label="Avg Adherence" value={`${avgAdherence}%`} sub="across all patients" color="bg-emerald-50 text-emerald-600" />
          <StatCard icon={Calendar} label="Upcoming Appts" value={kpis?.upcomingAppointments ?? "—"} sub="scheduled" color="bg-violet-50 text-violet-600" />
        </div>

        {/* Row 1: Risk + Plan */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" /> Patient Risk Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">Loading…</div> : (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="55%" height={200}>
                    <PieChart>
                      <Pie data={riskDist} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${value}`}>
                        {riskDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [v, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 flex-1">
                    {riskDist.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                          <span className="text-foreground">{d.name}</span>
                        </div>
                        <span className="font-bold text-foreground">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> Plan Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">Loading…</div> : (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="55%" height={200}>
                    <PieChart>
                      <Pie data={planDist} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ value }) => value}>
                        {planDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 flex-1">
                    {planDist.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                          <span className="text-foreground">{d.name}</span>
                        </div>
                        <span className="font-bold text-foreground">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Adherence distribution + Weekly trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" /> Adherence Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">Loading…</div> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={adherenceBuckets} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="Patients" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                      {adherenceBuckets.map((_, i) => (
                        <Cell key={i} fill={i === 3 ? "#22c55e" : i === 2 ? "#3b82f6" : i === 1 ? "#f59e0b" : "#ef4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Adherence by Program Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">Loading…</div> :
                weeklyAdherence.length === 0 ? <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">Not enough data</div> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={weeklyAdherence} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                      <Tooltip formatter={(v: any) => [`${v}%`, "Avg Adherence"]} />
                      <Line type="monotone" dataKey="adherence" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 5, fill: "#3b82f6" }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
            </CardContent>
          </Card>
        </div>

        {/* Row 3: Goals + Cities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-violet-500" /> Primary Goal Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">Loading…</div> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={goalDist} layout="vertical" margin={{ top: 0, right: 24, left: 80, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="value" name="Patients" radius={[0, 4, 4, 0]}>
                      {goalDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" /> Patients by City
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">Loading…</div> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={cityDist} margin={{ top: 8, right: 8, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="city" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="Patients" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary table */}
        <Card className="border-border shadow-sm overflow-hidden">
          <CardHeader className="border-b bg-muted/20 py-4">
            <CardTitle className="text-sm font-semibold text-foreground">Patient Performance Summary (Live)</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/20 border-b uppercase">
                <tr>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Week</th>
                  <th className="px-4 py-3">Adherence</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">Streak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {pts.slice(0, 20).map((p: any) => (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-foreground text-xs">{p.fullName}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{p.city}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className={`text-[10px] capitalize ${p.plan === "premium" ? "bg-amber-50 text-amber-700 border-amber-200" : p.plan === "comprehensive" ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-muted text-muted-foreground"}`}>{p.plan}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">Wk {p.weekNumber}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-1.5 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${p.adherencePct}%`, backgroundColor: p.adherencePct >= 70 ? "#22c55e" : p.adherencePct >= 40 ? "#f59e0b" : "#ef4444" }} />
                        </div>
                        <span className="text-xs font-medium">{p.adherencePct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className={`text-[10px] capitalize ${p.riskLevel === "low" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : p.riskLevel === "medium" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>{p.riskLevel}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">🔥 {p.streak ?? 0}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </StaffLayout>
  );
}
