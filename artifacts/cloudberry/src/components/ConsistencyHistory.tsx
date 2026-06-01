import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, TrendingDown, Minus, History } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

export type WeeklyScore = {
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  score: number;
  breakdown: {
    mealLogging: number;
    activity: number;
    sleep: number;
    checkIns: number;
    dataPoints: number;
  };
};

function scoreColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 45) return "#f59e0b";
  return "#ef4444";
}

function scoreBadge(score: number) {
  if (score >= 70) return { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Strong" };
  if (score >= 45) return { cls: "bg-amber-50 text-amber-700 border-amber-200", label: "Moderate" };
  return { cls: "bg-rose-50 text-rose-700 border-rose-200", label: "Needs Work" };
}

function TrendIcon({ current, previous }: { current: number; previous: number | undefined }) {
  if (previous === undefined) return <Minus className="w-3 h-3 text-muted-foreground" />;
  const diff = current - previous;
  if (diff > 2) return <TrendingUp className="w-3 h-3 text-emerald-600" />;
  if (diff < -2) return <TrendingDown className="w-3 h-3 text-rose-500" />;
  return <Minus className="w-3 h-3 text-slate-400" />;
}

/* ─── Shared chart + list ─────────────────────────────────── */
export function ConsistencyHistoryPanel({
  history,
  compact = false,
}: {
  history: WeeklyScore[];
  compact?: boolean;
}) {
  if (history.length === 0) {
    return (
      <div className="text-xs text-muted-foreground text-center py-6 italic">
        No check-in history yet. Scores appear after your first week.
      </div>
    );
  }

  const chartData = [...history].reverse().map(w => ({
    label: w.weekLabel.split("–")[0].trim(),
    score: w.score,
    fullLabel: w.weekLabel,
  }));

  return (
    <div className="space-y-4">
      {/* Trend chart */}
      <ResponsiveContainer width="100%" height={compact ? 80 : 110}>
        <BarChart data={chartData} barCategoryGap="25%" margin={{ top: 4, right: 8, bottom: 4, left: -12 }}>
          <XAxis dataKey="label" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={28} />
          <Tooltip
            formatter={(v: number, _: string, props: any) => [
              `${v}/100`,
              props.payload?.fullLabel ?? "Week",
            ]}
            contentStyle={{ fontSize: 11, borderRadius: 8 }}
          />
          <Bar dataKey="score" radius={[3, 3, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={scoreColor(entry.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Weekly list */}
      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
        {history.map((w, i) => {
          const badge = scoreBadge(w.score);
          const prevScore = history[i + 1]?.score;
          return (
            <div
              key={w.weekStart}
              className={`rounded-xl border px-3 py-2 text-xs flex items-center gap-3 ${
                i === 0 ? "border-primary/30 bg-primary/5" : "border-border/50 bg-muted/20"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {i === 0 && (
                    <span className="text-[9px] font-bold text-primary uppercase tracking-wide shrink-0">
                      This week
                    </span>
                  )}
                  <span className="text-muted-foreground truncate">{w.weekLabel}</span>
                  <TrendIcon current={w.score} previous={prevScore} />
                </div>
                {!compact && (
                  <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                    <span>😴 {w.breakdown.sleep}%</span>
                    <span>🥗 {w.breakdown.mealLogging}%</span>
                    <span>🏃 {w.breakdown.activity}%</span>
                    <span className="text-foreground/50">{w.breakdown.dataPoints}d data</span>
                  </div>
                )}
              </div>
              <div className="shrink-0 text-right">
                <div className="text-base font-extrabold leading-none" style={{ color: scoreColor(w.score) }}>
                  {w.score}
                </div>
                <div className={`text-[9px] font-medium mt-0.5 px-1.5 py-0.5 rounded border ${badge.cls}`}>
                  {badge.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/30">
        Scores are calculated from actual submitted check-in data only. Missing days are excluded.
      </p>
    </div>
  );
}

/* ─── Patient portal hook + card ─────────────────────────── */
export function PatientConsistencyHistory() {
  const token = localStorage.getItem("cloudberry_token") || "";
  const { data: history = [], isLoading } = useQuery<WeeklyScore[]>({
    queryKey: ["consistency-history"],
    queryFn: async () => {
      const r = await fetch(`${API}/patients/me/consistency-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) return [];
      return r.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Behavioral Consistency History</h3>
        {history.length > 0 && (
          <span className="ml-auto text-[10px] text-muted-foreground">{history.length} week{history.length !== 1 ? "s" : ""}</span>
        )}
      </div>
      {isLoading ? (
        <div className="h-24 flex items-center justify-center text-xs text-muted-foreground">Loading…</div>
      ) : (
        <ConsistencyHistoryPanel history={history} />
      )}
    </div>
  );
}

/* ─── Staff portal hook (physician / ops) ─────────────────── */
export function StaffConsistencyHistory({
  patientId,
  role,
  compact = false,
}: {
  patientId: number;
  role: "physician" | "ops";
  compact?: boolean;
}) {
  const token = localStorage.getItem("cloudberry_token") || "";
  const endpoint =
    role === "physician"
      ? `${API}/physician/patients/${patientId}/consistency-history`
      : `${API}/ops/patients/${patientId}/consistency-history`;

  const { data: history = [], isLoading } = useQuery<WeeklyScore[]>({
    queryKey: ["consistency-history", role, patientId],
    queryFn: async () => {
      const r = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) return [];
      return r.json();
    },
    enabled: Boolean(patientId),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="h-16 flex items-center justify-center text-xs text-muted-foreground">
        Loading history…
      </div>
    );
  }

  return <ConsistencyHistoryPanel history={history} compact={compact} />;
}
