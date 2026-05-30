/**
 * Shared behavioral consistency calculation.
 *
 * Denominator is capped at 7 days but STARTS from the patient's enrollment
 * (patient.createdAt). Days before enrollment are marked null (N/A) and never
 * counted against the score.
 *
 *   windowDays = min(7, daysSinceEnrollment + 1)
 *
 * Used identically by every portal: Patient, Ops, Physician, Coach.
 */

type CheckinLike = {
  createdAt: Date;
  mealsFollowed: string;
  activityCompleted: boolean;
};

type MetricLike = {
  date: string;
  value: number;
};

export type ConsistencyResult = {
  adherence7Day: Array<{ date: string; dow: string; completed: boolean | null }>;
  adherencePct: number | null;
  consistencyBreakdown: {
    mealLogging: number;
    checkIns: number;
    activity: number;
    sleep: number;
  } | null;
  streak: number;
  windowDays: number;
};

export function computeConsistency(
  allCheckins: CheckinLike[],
  sleepMetrics: MetricLike[],
  enrollmentDate: Date,
  now: Date = new Date(),
): ConsistencyResult {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const enrollment = new Date(enrollmentDate);
  enrollment.setHours(0, 0, 0, 0);

  const enrollmentIso = enrollment.toISOString().slice(0, 10);

  // Days since enrollment (0 = enrolled today, 6 = enrolled 6 days ago)
  const daysSinceEnrollment = Math.max(
    0,
    Math.floor((today.getTime() - enrollment.getTime()) / 86_400_000),
  );

  // Denominator: at most 7, never exceeds days since enrollment + 1
  const windowDays = Math.min(7, daysSinceEnrollment + 1);

  // Build 7-cell adherence grid.
  // Cells before enrollment date are null (not applicable — not counted).
  const adherence7Day: Array<{ date: string; dow: string; completed: boolean | null }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const dow = d.toLocaleDateString("en-US", { weekday: "short" });

    if (iso < enrollmentIso) {
      // Pre-enrollment: mark N/A, never penalize
      adherence7Day.push({ date: iso, dow, completed: null });
      continue;
    }

    const ci = allCheckins.find(
      (c) => c.createdAt.toISOString().slice(0, 10) === iso,
    );
    adherence7Day.push({
      date: iso,
      dow,
      completed: ci ? ci.mealsFollowed === "yes" : null,
    });
  }

  // adherencePct: completed days / windowDays (NEVER divides by 7 for new patients)
  const completedCount = adherence7Day.filter((d) => d.completed === true).length;
  const dataCount = adherence7Day.filter((d) => d.completed !== null).length;
  const adherencePct =
    dataCount > 0 ? Math.round((completedCount / windowDays) * 100) : null;

  // Sleep quality: count enrolled days in window with ≥7 hours recorded
  let goodSleepDays = 0;
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    if (iso < enrollmentIso) continue;
    const sm = sleepMetrics.find((m) => m.date === iso);
    if (sm && sm.value >= 7) goodSleepDays++;
  }

  // Only look at checkins within the window
  const windowCheckins = allCheckins.slice(0, windowDays);

  const consistencyBreakdown =
    windowCheckins.length === 0
      ? null
      : {
          mealLogging: Math.round(
            (windowCheckins.filter(
              (c) =>
                c.mealsFollowed === "yes" ||
                c.mealsFollowed === "mostly" ||
                c.mealsFollowed === "partially",
            ).length /
              windowDays) *
              100,
          ),
          checkIns: Math.round((windowCheckins.length / windowDays) * 100),
          activity: Math.round(
            (windowCheckins.filter((c) => c.activityCompleted).length /
              windowDays) *
              100,
          ),
          sleep: Math.round((goodSleepDays / windowDays) * 100),
        };

  // Streak: consecutive days backwards from today; stop at enrollment
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    if (iso < enrollmentIso) break; // never count pre-enrollment days
    if (allCheckins.find((c) => c.createdAt.toISOString().slice(0, 10) === iso))
      streak++;
    else if (i > 0) break;
  }

  return { adherence7Day, adherencePct, consistencyBreakdown, streak, windowDays };
}
