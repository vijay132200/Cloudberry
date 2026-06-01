/**
 * SINGLE SOURCE OF TRUTH for Behavioral Consistency calculations.
 *
 * Rule: Only days with actual submitted check-in data count toward the score.
 * Missing days are excluded from the denominator entirely.
 * Pre-enrollment days never participate.
 */

export type ConsistencyBreakdown = {
  mealLogging: number;
  activity: number;
  sleep: number;
  checkIns: number;
  dataPoints: number;
};

export type WeeklyScore = {
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  score: number;
  breakdown: ConsistencyBreakdown;
};

type CheckinLike = {
  createdAt: Date;
  mealsFollowed: string | null;
  activityCompleted: boolean | null;
};

type SleepMetricLike = {
  date: string;
  value: number;
};

/**
 * Compute behavioral consistency from a list of check-ins.
 * The denominator is always checkins.length — missing days do NOT count.
 */
export function computeConsistency(
  checkins: CheckinLike[],
  sleepMetrics: SleepMetricLike[],
): ConsistencyBreakdown | null {
  const n = checkins.length;
  if (n === 0) return null;

  const mealOk = checkins.filter(
    c => c.mealsFollowed === "yes" || c.mealsFollowed === "mostly" || c.mealsFollowed === "partially",
  ).length;

  const actOk = checkins.filter(c => c.activityCompleted).length;

  let goodSleep = 0;
  for (const c of checkins) {
    const dateStr = c.createdAt.toISOString().slice(0, 10);
    const sm = sleepMetrics.find(m => m.date === dateStr);
    if (sm && sm.value >= 7) goodSleep++;
  }

  return {
    mealLogging: Math.round((mealOk / n) * 100),
    activity: Math.round((actOk / n) * 100),
    sleep: Math.round((goodSleep / n) * 100),
    checkIns: 100,
    dataPoints: n,
  };
}

/**
 * Return the ISO date string of the Monday that starts the week containing `date`.
 */
function getMondayOf(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

/**
 * Group check-ins by ISO week (Mon–Sun) and compute per-week consistency scores.
 * Returns weeks sorted newest-first.
 */
export function computeWeeklyHistory(
  checkins: CheckinLike[],
  sleepMetrics: SleepMetricLike[],
): WeeklyScore[] {
  if (checkins.length === 0) return [];

  const byWeek = new Map<string, CheckinLike[]>();
  for (const c of checkins) {
    const key = getMondayOf(c.createdAt);
    if (!byWeek.has(key)) byWeek.set(key, []);
    byWeek.get(key)!.push(c);
  }

  const results: WeeklyScore[] = [];

  for (const [weekStart, wCheckins] of byWeek) {
    const startDate = new Date(weekStart + "T00:00:00Z");
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 6);

    const breakdown = computeConsistency(wCheckins, sleepMetrics);
    if (!breakdown) continue;

    const score = Math.round((breakdown.mealLogging + breakdown.activity + breakdown.sleep) / 3);

    const fmt = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

    results.push({
      weekStart,
      weekEnd: endDate.toISOString().slice(0, 10),
      weekLabel: `${fmt(startDate)} – ${fmt(endDate)}`,
      score,
      breakdown,
    });
  }

  results.sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  return results;
}
