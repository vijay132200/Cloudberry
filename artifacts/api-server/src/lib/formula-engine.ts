import { db } from "@workspace/db";
import {
  formulaDefinitionsTable,
  formulaVersionsTable,
  formulaPatientOverridesTable,
  formulaAuditLogTable,
  staffTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

export const FORMULA_DEFAULTS: Record<string, Record<string, number>> = {
  behavioral_consistency_score: {
    nutrition_weight: 34,
    activity_weight: 33,
    sleep_weight: 33,
    min_sleep_hours: 7,
    lookback_days: 7,
  },
  adherence_score: {
    window_days: 7,
  },
  risk_score: {
    consistency_low_threshold: 45,
    consistency_high_threshold: 70,
    missed_days_threshold: 3,
    escalation_consecutive_days: 2,
  },
  alert_thresholds: {
    glucose_high_mg: 140,
    glucose_low_mg: 70,
    weight_change_alert_kg: 2,
  },
  escalation_triggers: {
    consecutive_missed_days: 2,
    consistency_drop_pct: 15,
    glucose_spike_mg: 50,
  },
  checkin_window: {
    daily_window_hours: 24,
    grace_period_hours: 0,
    lookback_days: 7,
  },
};

const paramCache = new Map<string, { params: Record<string, number>; expiresAt: number }>();
const CACHE_TTL_MS = 60_000;

export async function getActiveParams(
  formulaSlug: string,
  patientId?: number,
): Promise<Record<string, number>> {
  const cacheKey = `${formulaSlug}:${patientId ?? "global"}`;
  const cached = paramCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.params;

  try {
    const [def] = await db
      .select()
      .from(formulaDefinitionsTable)
      .where(eq(formulaDefinitionsTable.slug, formulaSlug))
      .limit(1);

    if (!def || !def.currentVersionId) {
      const fallback = FORMULA_DEFAULTS[formulaSlug] ?? {};
      paramCache.set(cacheKey, { params: fallback, expiresAt: Date.now() + CACHE_TTL_MS });
      return fallback;
    }

    const [version] = await db
      .select()
      .from(formulaVersionsTable)
      .where(eq(formulaVersionsTable.id, def.currentVersionId))
      .limit(1);

    let params: Record<string, number> = version
      ? (version.parameters as Record<string, number>)
      : (FORMULA_DEFAULTS[formulaSlug] ?? {});

    if (patientId) {
      const [override] = await db
        .select()
        .from(formulaPatientOverridesTable)
        .where(
          and(
            eq(formulaPatientOverridesTable.formulaId, def.id),
            eq(formulaPatientOverridesTable.patientId, patientId),
            eq(formulaPatientOverridesTable.active, true),
          ),
        )
        .limit(1);
      if (override) {
        params = { ...params, ...(override.parameters as Record<string, number>) };
      }
    }

    paramCache.set(cacheKey, { params, expiresAt: Date.now() + CACHE_TTL_MS });
    return params;
  } catch {
    return FORMULA_DEFAULTS[formulaSlug] ?? {};
  }
}

export function invalidateCache(formulaSlug?: string) {
  if (formulaSlug) {
    for (const key of paramCache.keys()) {
      if (key.startsWith(formulaSlug + ":")) paramCache.delete(key);
    }
  } else {
    paramCache.clear();
  }
}

export function validateFormulaParams(
  templateType: string,
  inputs: string[],
  params: Record<string, unknown>,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const input of inputs) {
    if (params[input] === undefined || params[input] === null) {
      errors.push(`Missing required parameter: ${input}`);
    }
  }

  for (const [key, val] of Object.entries(params)) {
    if (typeof val !== "number" || isNaN(val as number)) {
      errors.push(`Parameter "${key}" must be a number`);
    } else if ((val as number) < 0) {
      errors.push(`Parameter "${key}" must be non-negative`);
    } else if ((key.endsWith("_days") || key.endsWith("_hours")) && (val as number) < 1) {
      errors.push(`Parameter "${key}" must be at least 1`);
    }
  }

  if (templateType === "weighted_average") {
    const weightKeys = inputs.filter(k => k.endsWith("_weight"));
    if (weightKeys.length > 0) {
      const total = weightKeys.reduce((sum, k) => sum + ((params[k] as number) ?? 0), 0);
      if (Math.abs(total - 100) > 0.5) {
        errors.push(`Weights must sum to 100. Current sum: ${total}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export const FORMULA_CATALOG = [
  {
    name: "Behavioral Consistency Score",
    slug: "behavioral_consistency_score",
    description: "Measures how consistently a patient follows their prescribed behavioral plan across meal logging, physical activity, and sleep quality.",
    purpose: "Tracks patient adherence to daily behavioral targets. Used in risk stratification, physician dashboard, and patient portal.",
    category: "scoring",
    templateType: "weighted_average",
    inputs: ["nutrition_weight", "activity_weight", "sleep_weight", "min_sleep_hours", "lookback_days"],
    outputMin: 0,
    outputMax: 100,
    humanReadable: "Weighted average of meal compliance, activity completion, and sleep quality over actual check-in days. Missing days are excluded from the denominator.",
    mathRepresentation: "Score = (mealLogging% × nutrition_weight + activity% × activity_weight + sleep% × sleep_weight) / 100",
    exampleCalculation: "Patient checked in 5 days. Meals: 4/5 (80%), Activity: 3/5 (60%), Sleep ≥7h: 4/5 (80%). Score = (80×34 + 60×33 + 80×33) / 100 = (2720 + 1980 + 2640) / 100 = 73",
    defaultParams: { nutrition_weight: 34, activity_weight: 33, sleep_weight: 33, min_sleep_hours: 7, lookback_days: 7 },
  },
  {
    name: "Adherence Score",
    slug: "adherence_score",
    description: "Percentage of days in the lookback window where the patient completed their daily check-in.",
    purpose: "Measures engagement and data completeness. Used in the ops dashboard and coach portal.",
    category: "scoring",
    templateType: "window_avg",
    inputs: ["window_days"],
    outputMin: 0,
    outputMax: 100,
    humanReadable: "Percentage of days in the window where a check-in was submitted, out of the total window length.",
    mathRepresentation: "Score = (check-ins completed / window_days) × 100",
    exampleCalculation: "Patient completed 5 check-ins in a 7-day window. Score = (5/7) × 100 = 71%",
    defaultParams: { window_days: 7 },
  },
  {
    name: "Risk Score",
    slug: "risk_score",
    description: "Classifies patients into Low, Medium, or High risk based on their consistency score and missed day streak.",
    purpose: "Drives escalation alerts, risk badges in ops dashboard, and priority ordering of the patient list.",
    category: "threshold",
    templateType: "threshold",
    inputs: ["consistency_low_threshold", "consistency_high_threshold", "missed_days_threshold", "escalation_consecutive_days"],
    outputMin: 0,
    outputMax: 2,
    humanReadable: "If consistency score < low_threshold OR missed days ≥ missed_days_threshold → High Risk. If consistency between thresholds → Medium. Otherwise → Low.",
    mathRepresentation: "risk = score < low_threshold ? 'high' : score < high_threshold ? 'medium' : 'low'",
    exampleCalculation: "Patient score = 40, low_threshold = 45. 40 < 45 → High Risk",
    defaultParams: { consistency_low_threshold: 45, consistency_high_threshold: 70, missed_days_threshold: 3, escalation_consecutive_days: 2 },
  },
  {
    name: "Alert Thresholds",
    slug: "alert_thresholds",
    description: "Defines the numeric boundaries that trigger clinical alerts for glucose and weight metrics.",
    purpose: "Drives alert badges and escalation flags on physician and ops dashboards when metabolic markers exceed safe ranges.",
    category: "threshold",
    templateType: "threshold",
    inputs: ["glucose_high_mg", "glucose_low_mg", "weight_change_alert_kg"],
    outputMin: 0,
    outputMax: 1,
    humanReadable: "If fasting glucose > glucose_high_mg or < glucose_low_mg → alert. If weight change > alert_kg in 30 days → alert.",
    mathRepresentation: "alert = glucose > glucose_high_mg || glucose < glucose_low_mg || |weight_delta| > weight_change_alert_kg",
    exampleCalculation: "Glucose = 155 mg/dL, glucose_high_mg = 140 → 155 > 140 → Alert triggered",
    defaultParams: { glucose_high_mg: 140, glucose_low_mg: 70, weight_change_alert_kg: 2 },
  },
  {
    name: "Escalation Triggers",
    slug: "escalation_triggers",
    description: "Conditions that automatically escalate a patient to high-priority review by ops and the care team.",
    purpose: "Ensures high-risk patients are flagged before their condition deteriorates. Feeds the escalation queue in the ops command center.",
    category: "trigger",
    templateType: "threshold",
    inputs: ["consecutive_missed_days", "consistency_drop_pct", "glucose_spike_mg"],
    outputMin: 0,
    outputMax: 1,
    humanReadable: "Escalate if: consecutive missed check-ins ≥ threshold, OR weekly consistency dropped by ≥ drop_pct%, OR glucose increased by ≥ spike_mg in 24 hours.",
    mathRepresentation: "escalate = missed_streak >= consecutive_missed_days || week_drop >= consistency_drop_pct || glucose_delta >= glucose_spike_mg",
    exampleCalculation: "Patient missed 3 consecutive days, threshold = 2. 3 >= 2 → Escalate",
    defaultParams: { consecutive_missed_days: 2, consistency_drop_pct: 15, glucose_spike_mg: 50 },
  },
  {
    name: "Check-in Window",
    slug: "checkin_window",
    description: "Defines the time window and lookback period used when fetching and scoring check-in data.",
    purpose: "Controls how many days of history are included in dashboard calculations and what grace period is allowed for late submissions.",
    category: "window",
    templateType: "window",
    inputs: ["daily_window_hours", "grace_period_hours", "lookback_days"],
    outputMin: 1,
    outputMax: 365,
    humanReadable: "Check-ins submitted within daily_window_hours of midnight count for that day. Lookback covers the last lookback_days days.",
    mathRepresentation: "valid = submittedAt <= midnight + grace_period_hours && date >= today - lookback_days",
    exampleCalculation: "lookback_days = 7, grace = 0. Only check-ins from the last 7 complete days are included.",
    defaultParams: { daily_window_hours: 24, grace_period_hours: 0, lookback_days: 7 },
  },
];

export async function seedFormulasIfEmpty(systemStaffId: number): Promise<void> {
  const existing = await db.select().from(formulaDefinitionsTable).limit(1);
  if (existing.length > 0) return;

  for (const formula of FORMULA_CATALOG) {
    const [def] = await db
      .insert(formulaDefinitionsTable)
      .values({
        name: formula.name,
        slug: formula.slug,
        description: formula.description,
        purpose: formula.purpose,
        category: formula.category,
        templateType: formula.templateType,
        inputs: formula.inputs,
        outputMin: formula.outputMin,
        outputMax: formula.outputMax,
        createdBy: systemStaffId,
      })
      .returning();

    const [version] = await db
      .insert(formulaVersionsTable)
      .values({
        formulaId: def.id,
        version: 1,
        parameters: formula.defaultParams,
        humanReadable: formula.humanReadable,
        mathRepresentation: formula.mathRepresentation,
        exampleCalculation: formula.exampleCalculation,
        status: "deployed",
        reason: "Initial formula definition — system baseline values",
        proposedBy: systemStaffId,
        approvedBy: systemStaffId,
        proposedAt: new Date(),
        approvedAt: new Date(),
        deployedAt: new Date(),
      })
      .returning();

    await db
      .update(formulaDefinitionsTable)
      .set({ currentVersionId: version.id })
      .where(eq(formulaDefinitionsTable.id, def.id));

    await db.insert(formulaAuditLogTable).values({
      formulaId: def.id,
      versionId: version.id,
      action: "deploy",
      actorId: systemStaffId,
      newValue: formula.defaultParams as any,
      notes: "System initialization — baseline formula seeded",
    });
  }
}
