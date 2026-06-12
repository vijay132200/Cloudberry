import { Router } from "express";
import { createHash } from "crypto";
import { db } from "@workspace/db";
import {
  usersTable,
  staffTable,
  patientsTable,
  patientPlansTable,
  patientNotesTable,
  checkinsTable,
  metricsTable,
  appointmentsTable,
  dietPlansTable,
  patientPlanHistoryTable,
  patientDocumentsTable,
} from "@workspace/db";
import { eq, desc, and, asc, gte, lte, sql } from "drizzle-orm";
import { computeConsistency, computeWeeklyHistory, toConsistencyParams } from "../lib/consistency";
import { getActiveParams } from "../lib/formula-engine";

const router = Router();

function parseToken(authHeader: string | undefined): { userId: number; role: string } | null {
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  try {
    return JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

async function loadStaff(id: number | null) {
  if (!id) return null;
  const [s] = await db.select().from(staffTable).where(eq(staffTable.id, id)).limit(1);
  return s ? { id: s.id, name: s.fullName, role: s.role, email: s.email ?? null, specialty: s.specialty ?? null } : null;
}

router.get("/me", async (req, res) => {
  try {
    const parsed = parseToken(req.headers.authorization);
    if (!parsed) { res.status(401).json({ error: "Unauthorized" }); return; }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, parsed.userId)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.userId, parsed.userId)).limit(1);
    if (!patient) { res.status(404).json({ error: "Patient record not found" }); return; }
    res.json({
      id: patient.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email ?? null,
      city: user.city ?? "",
      primaryGoal: patient.primaryGoal,
      plan: patient.plan,
      weekNumber: patient.weekNumber,
      startingWeight: patient.startingWeight ?? null,
      currentWeight: patient.currentWeight ?? null,
      targetWeight: patient.targetWeight ?? null,
      createdAt: patient.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/me", async (req, res) => {
  try {
    const parsed = parseToken(req.headers.authorization);
    if (!parsed) { res.status(401).json({ error: "Unauthorized" }); return; }
    const { fullName, email, city, targetWeight, currentWeight } = req.body ?? {};

    const userUpdate: Record<string, unknown> = {};
    if (typeof fullName === "string" && fullName.trim()) userUpdate.fullName = fullName.trim();
    if (typeof email === "string") userUpdate.email = email.trim() || null;
    if (typeof city === "string") userUpdate.city = city.trim();
    if (Object.keys(userUpdate).length) {
      await db.update(usersTable).set(userUpdate).where(eq(usersTable.id, parsed.userId));
    }

    const patientUpdate: Record<string, unknown> = {};
    if (typeof targetWeight === "number" && !Number.isNaN(targetWeight)) patientUpdate.targetWeight = targetWeight;
    if (typeof currentWeight === "number" && !Number.isNaN(currentWeight)) patientUpdate.currentWeight = currentWeight;
    if (Object.keys(patientUpdate).length) {
      await db.update(patientsTable).set(patientUpdate).where(eq(patientsTable.userId, parsed.userId));
    }

    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/me/password", async (req, res) => {
  try {
    const parsed = parseToken(req.headers.authorization);
    if (!parsed) { res.status(401).json({ error: "Unauthorized" }); return; }
    const { currentPassword, newPassword } = req.body ?? {};
    if (!newPassword || newPassword.length < 8) {
      res.status(400).json({ error: "New password must be at least 8 characters" }); return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, parsed.userId)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    const DEMO_PW_HASH = createHash("sha256").update("demo123").digest("hex");
    if (currentPassword) {
      const hashed = createHash("sha256").update(currentPassword).digest("hex");
      const isDemo = user.passwordHash === DEMO_PW_HASH && currentPassword === "demo123";
      if (user.passwordHash !== hashed && !isDemo) {
        res.status(401).json({ error: "Current password is incorrect" }); return;
      }
    }
    const newHash = createHash("sha256").update(newPassword).digest("hex");
    await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, parsed.userId));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me/dashboard", async (req, res) => {
  try {
    const parsed = parseToken(req.headers.authorization);
    if (!parsed) { res.status(401).json({ error: "Unauthorized" }); return; }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, parsed.userId)).limit(1);
    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.userId, parsed.userId)).limit(1);
    if (!user || !patient) { res.status(404).json({ error: "Not found" }); return; }

    const [physician, dietician, caretaker] = await Promise.all([
      loadStaff(patient.assignedPhysicianId),
      loadStaff(patient.assignedDieticianId),
      loadStaff(patient.assignedCaretakerId ?? patient.assignedCoachId),
    ]);
    const careAssigned = Boolean(physician || dietician || caretaker);

    // Last 30 days of metrics (weight + glucose, asc by date)
    const allMetrics = await db.select().from(metricsTable)
      .where(eq(metricsTable.patientId, patient.id))
      .orderBy(asc(metricsTable.createdAt))
      .limit(200);

    const weightSeries = allMetrics
      .filter(m => m.type === "weight")
      .map(m => ({ date: m.date, value: m.value }));
    // Include legacy "glucose" type for backward compat with seed data
    const fastingGlucoseSeries = allMetrics
      .filter(m => m.type === "glucose_fasting" || m.type === "glucose")
      .map(m => ({ date: m.date, value: m.value }));
    const postMealGlucoseSeries = allMetrics
      .filter(m => m.type === "glucose_postmeal")
      .map(m => ({ date: m.date, value: m.value }));
    // Keep glucoseSeries as alias for backward compat
    const glucoseSeries = fastingGlucoseSeries;

    // Recent 30 check-ins for trend math
    const allCheckins = await db.select().from(checkinsTable)
      .where(eq(checkinsTable.patientId, patient.id))
      .orderBy(desc(checkinsTable.createdAt))
      .limit(30);
    // True total count (not truncated)
    const [{ count: totalCheckinsRow }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(checkinsTable)
      .where(eq(checkinsTable.patientId, patient.id));
    const totalCheckins = Number(totalCheckinsRow ?? 0);

    // Energy series — last 7 check-ins chronological
    const energyMap: Record<string, number> = { high: 3, good: 3, moderate: 2, medium: 2, low: 1, tired: 1 };
    const recent7 = [...allCheckins].slice(0, 7).reverse();
    const energySeries = recent7.map(c => ({
      date: c.createdAt.toISOString().slice(0, 10),
      dow: new Date(c.createdAt).toLocaleDateString("en-US", { weekday: "short" }),
      value: energyMap[c.energyLevel?.toLowerCase()] ?? 2,
      label: c.energyLevel,
    }));

    // Adherence: last 7 calendar days, true if a check-in exists that day with mealsFollowed=yes
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const adherence7Day: Array<{ date: string; dow: string; completed: boolean | null }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const dow = d.toLocaleDateString("en-US", { weekday: "short" });
      const ci = allCheckins.find(c => c.createdAt.toISOString().slice(0, 10) === iso);
      adherence7Day.push({ date: iso, dow, completed: ci ? ci.mealsFollowed === "yes" : null });
    }

    const completedCount = adherence7Day.filter(d => d.completed === true).length;
    const dataCount = adherence7Day.filter(d => d.completed !== null).length;
    const adherencePct = dataCount > 0 ? Math.round((completedCount / 7) * 100) : null;

    // Consistency breakdown: last 7 check-ins only — missing days excluded from denominator
    const last7 = allCheckins.slice(0, 7);
    const sleepMetrics = allMetrics.filter(m => m.type === "sleep_hours");
    const rawCParams = await getActiveParams("behavioral_consistency_score", patient.id);
    const consistencyBreakdown = computeConsistency(
      last7,
      sleepMetrics.map(m => ({ date: m.date, value: m.value })),
      toConsistencyParams(rawCParams),
    );

    // Streak: consecutive days from today backwards with a check-in
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      if (allCheckins.find(c => c.createdAt.toISOString().slice(0, 10) === iso)) streak++;
      else if (i > 0) break;
    }

    // Today check-in done?
    const todayIso = today.toISOString().slice(0, 10);
    const checkinDoneToday = allCheckins.some(c => c.createdAt.toISOString().slice(0, 10) === todayIso);

    // Weight change
    const weightChange = weightSeries.length >= 2
      ? +(weightSeries[weightSeries.length - 1].value - weightSeries[0].value).toFixed(1)
      : null;

    // Glucose stats
    const last7Glucose = glucoseSeries.slice(-7).map(g => g.value);
    const avgGlucose = last7Glucose.length > 0
      ? Math.round(last7Glucose.reduce((a, b) => a + b, 0) / last7Glucose.length)
      : null;
    const timeInRange = last7Glucose.length > 0
      ? Math.round((last7Glucose.filter(g => g >= 80 && g <= 140).length / last7Glucose.length) * 100)
      : null;

    // Messages — patient_notes with category='message' (patient-facing notes from care team)
    const allNotes = await db.select().from(patientNotesTable)
      .where(eq(patientNotesTable.patientId, patient.id))
      .orderBy(desc(patientNotesTable.createdAt))
      .limit(10);
    const messageNotes = allNotes.filter(n => n.category === "message");
    const messages = await Promise.all(messageNotes.slice(0, 5).map(async n => {
      const author = await loadStaff(n.coachId);
      return {
        id: n.id,
        from: author?.name ?? "Care Team",
        role: author?.role ?? "care",
        content: n.content,
        createdAt: n.createdAt.toISOString(),
      };
    }));

    // Next appointment
    const upcoming = await db.select().from(appointmentsTable)
      .where(and(
        eq(appointmentsTable.patientId, patient.id),
        eq(appointmentsTable.status, "upcoming"),
        gte(appointmentsTable.scheduledAt, new Date()),
      ))
      .orderBy(asc(appointmentsTable.scheduledAt))
      .limit(1);
    const nextAppointment = upcoming[0] ? {
      ...upcoming[0],
      scheduledAt: upcoming[0].scheduledAt.toISOString(),
      createdAt: upcoming[0].createdAt.toISOString(),
    } : null;

    // Care plan
    const [planRow] = await db.select().from(patientPlansTable)
      .where(eq(patientPlansTable.patientId, patient.id)).limit(1);
    const carePlan = planRow ? {
      nutritionPlan: planRow.nutritionPlan,
      activityPlan: planRow.activityPlan,
      weeklyGoals: planRow.weeklyGoals,
    } : null;

    // Ops content — fetch most recent ops_content note for this patient
    const [opsNote] = await db.select().from(patientNotesTable)
      .where(and(eq(patientNotesTable.patientId, patient.id), eq(patientNotesTable.category, "ops_content")))
      .orderBy(desc(patientNotesTable.createdAt)).limit(1);
    let opsContent: any = null;
    if (opsNote) {
      try { opsContent = JSON.parse(opsNote.content); } catch { opsContent = null; }
    }

    const hasEnoughData = allCheckins.length >= 5;

    res.json({
      patient: {
        id: patient.id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email ?? null,
        city: user.city ?? "",
        primaryGoal: patient.primaryGoal,
        plan: patient.plan,
        weekNumber: patient.weekNumber,
        startingWeight: patient.startingWeight ?? null,
        currentWeight: patient.currentWeight ?? null,
        targetWeight: patient.targetWeight ?? null,
        createdAt: patient.createdAt.toISOString(),
      },
      careTeam: { physician, dietician, caretaker },
      careAssigned,
      weekNumber: patient.weekNumber,
      weightSeries,
      glucoseSeries,
      fastingGlucoseSeries,
      postMealGlucoseSeries,
      energySeries,
      adherence7Day,
      adherencePct,
      consistencyBreakdown,
      streak,
      checkinDoneToday,
      weightChange,
      avgGlucose,
      timeInRange,
      mood: allCheckins[0]?.mood ?? null,
      messages,
      nextAppointment,
      carePlan,
      opsContent,
      hasEnoughData,
      totalCheckins,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/patients/me/consistency-history — weekly history of behavioral consistency
router.get("/me/consistency-history", async (req, res) => {
  try {
    const parsed = parseToken(req.headers.authorization);
    if (!parsed) { res.status(401).json({ error: "Unauthorized" }); return; }
    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.userId, parsed.userId)).limit(1);
    if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }

    const [allCheckins, sleepMetrics] = await Promise.all([
      db.select().from(checkinsTable)
        .where(eq(checkinsTable.patientId, patient.id))
        .orderBy(desc(checkinsTable.createdAt)),
      db.select().from(metricsTable)
        .where(and(eq(metricsTable.patientId, patient.id), eq(metricsTable.type, "sleep_hours"))),
    ]);

    const rawHParams = await getActiveParams("behavioral_consistency_score", patient.id);
    const history = computeWeeklyHistory(
      allCheckins,
      sleepMetrics.map(m => ({ date: m.date, value: m.value })),
      toConsistencyParams(rawHParams),
    );
    res.json(history);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/patients/me/diet-plan — get current active diet plan for patient
router.get("/me/diet-plan", async (req, res) => {
  try {
    const parsed = parseToken(req.headers.authorization);
    if (!parsed) { res.status(401).json({ error: "Unauthorized" }); return; }
    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.userId, parsed.userId)).limit(1);
    if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }

    const plans = await db.select().from(dietPlansTable)
      .where(eq(dietPlansTable.patientId, patient.id))
      .orderBy(desc(dietPlansTable.version)).limit(10);

    const result = await Promise.all(plans.map(async p => {
      const [author] = await db.select().from(staffTable).where(eq(staffTable.id, p.authorId)).limit(1);
      return { ...p, pdfData: undefined, hasPdf: !!p.pdfData, authorName: author?.fullName ?? "Care Team", createdAt: p.createdAt.toISOString() };
    }));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/patients/me/diet-plans/:id/pdf — patient PDF download
router.get("/me/diet-plans/:id/pdf", async (req, res) => {
  try {
    const parsed = parseToken(req.headers.authorization);
    if (!parsed) { res.status(401).json({ error: "Unauthorized" }); return; }
    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.userId, parsed.userId)).limit(1);
    if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }
    const planId = parseInt(req.params.id);
    if (Number.isNaN(planId)) { res.status(400).json({ error: "Invalid plan id" }); return; }
    const [plan] = await db.select().from(dietPlansTable)
      .where(and(eq(dietPlansTable.id, planId), eq(dietPlansTable.patientId, patient.id))).limit(1);
    if (!plan) { res.status(404).json({ error: "Diet plan not found" }); return; }
    if (!plan.pdfData) { res.status(404).json({ error: "No PDF attached to this plan" }); return; }
    res.json({ pdfData: plan.pdfData, pdfFilename: plan.pdfFilename ?? `diet-plan-v${plan.version}.pdf` });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/patients/me/records — historical records dashboard with optional time range
router.get("/me/records", async (req, res) => {
  try {
    const parsed = parseToken(req.headers.authorization);
    if (!parsed) { res.status(401).json({ error: "Unauthorized" }); return; }
    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.userId, parsed.userId)).limit(1);
    if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }

    const { from, to } = req.query as { from?: string; to?: string };

    const ciConditions: any[] = [eq(checkinsTable.patientId, patient.id)];
    if (from) ciConditions.push(gte(checkinsTable.createdAt, new Date(from)));
    if (to) ciConditions.push(lte(checkinsTable.createdAt, new Date(to)));
    const checkins = await db.select().from(checkinsTable)
      .where(and(...ciConditions)).orderBy(desc(checkinsTable.createdAt)).limit(200);

    const mConditions: any[] = [eq(metricsTable.patientId, patient.id)];
    if (from) mConditions.push(gte(metricsTable.createdAt, new Date(from)));
    if (to) mConditions.push(lte(metricsTable.createdAt, new Date(to)));
    const metrics = await db.select().from(metricsTable)
      .where(and(...mConditions)).orderBy(asc(metricsTable.createdAt)).limit(500);

    const weightSeries = metrics.filter(m => m.type === "weight").map(m => ({ date: m.date, value: m.value }));
    const glucoseSeries = metrics.filter(m => m.type === "glucose" || m.type === "glucose_fasting").map(m => ({ date: m.date, value: m.value }));
    const sleepSeries = metrics.filter(m => m.type === "sleep_hours").map(m => ({ date: m.date, value: m.value }));

    const totalCheckins = checkins.length;
    const adherentCount = checkins.filter(c => c.mealsFollowed === "yes" || c.mealsFollowed === "mostly").length;
    const adherencePct = totalCheckins > 0 ? Math.round((adherentCount / totalCheckins) * 100) : null;
    const activityCount = checkins.filter(c => c.activityCompleted).length;
    const activityPct = totalCheckins > 0 ? Math.round((activityCount / totalCheckins) * 100) : null;
    const avgWeight = weightSeries.length > 0 ? +(weightSeries.reduce((a, b) => a + b.value, 0) / weightSeries.length).toFixed(1) : null;
    const avgGlucose = glucoseSeries.length > 0 ? Math.round(glucoseSeries.reduce((a, b) => a + b.value, 0) / glucoseSeries.length) : null;
    const avgSleep = sleepSeries.length > 0 ? +(sleepSeries.reduce((a, b) => a + b.value, 0) / sleepSeries.length).toFixed(1) : null;
    const sleepAvg = sleepSeries.length > 0 ? Math.round(sleepSeries.reduce((a, b) => a + b.value, 0) / sleepSeries.length * 100 / 8) : null;
    const consistencyBreakdown = totalCheckins > 0 ? {
      mealLogging: adherencePct ?? 0,
      activity: activityPct ?? 0,
      sleep: sleepAvg !== null ? Math.min(100, sleepAvg) : 0,
    } : null;

    res.json({
      from: from ?? null, to: to ?? null, totalCheckins,
      adherencePct, activityPct, avgWeight, avgGlucose, avgSleep,
      consistencyBreakdown, weightSeries, glucoseSeries, sleepSeries,
      checkins: checkins.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/patients/me/activity — patient-safe activity timeline
// Includes: check-ins, appointments, diet plans, care plan updates, metrics
// Excludes: clinical notes, critical notes, escalations (internal staff records)
router.get("/me/activity", async (req, res) => {
  try {
    const parsed = parseToken(req.headers.authorization);
    if (!parsed) { res.status(401).json({ error: "Unauthorized" }); return; }
    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.userId, parsed.userId)).limit(1);
    if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }

    const { from, to, type } = req.query as { from?: string; to?: string; type?: string };
    const events: any[] = [];

    // Check-ins
    if (!type || type === "checkin" || type === "all") {
      const ciConds: any[] = [eq(checkinsTable.patientId, patient.id)];
      if (from) ciConds.push(gte(checkinsTable.createdAt, new Date(from)));
      if (to) ciConds.push(lte(checkinsTable.createdAt, new Date(to)));
      const checkins = await db.select().from(checkinsTable).where(and(...ciConds)).orderBy(desc(checkinsTable.createdAt)).limit(30);
      for (const c of checkins) {
        const moodStr = c.mood ? ` · Mood: ${c.mood}` : "";
        events.push({ id: `ci-${c.id}`, type: "checkin", title: "Daily Check-in", summary: `Meals: ${c.mealsFollowed} · Energy: ${c.energyLevel}${moodStr}`, content: { ...c, createdAt: c.createdAt.toISOString() }, createdAt: c.createdAt.toISOString(), author: "You" });
      }
    }

    // Appointments
    if (!type || type === "appointment" || type === "all") {
      const appts = await db.select().from(appointmentsTable).where(eq(appointmentsTable.patientId, patient.id)).orderBy(desc(appointmentsTable.scheduledAt)).limit(10);
      for (const a of appts) {
        if (from && a.scheduledAt < new Date(from)) continue;
        if (to && a.scheduledAt > new Date(to)) continue;
        events.push({ id: `appt-${a.id}`, type: "appointment", title: "Appointment", summary: `with ${a.careTeamMember || "Care Team"} · ${a.status}`, content: { ...a, scheduledAt: a.scheduledAt.toISOString(), createdAt: a.createdAt.toISOString() }, createdAt: a.scheduledAt.toISOString(), author: a.careTeamMember || "Care Team" });
      }
    }

    // Diet plans
    if (!type || type === "diet_plan" || type === "all") {
      const dplans = await db.select().from(dietPlansTable).where(eq(dietPlansTable.patientId, patient.id)).orderBy(desc(dietPlansTable.createdAt)).limit(10);
      for (const p of dplans) {
        if (from && p.createdAt < new Date(from)) continue;
        if (to && p.createdAt > new Date(to)) continue;
        const [author] = await db.select().from(staffTable).where(eq(staffTable.id, p.authorId)).limit(1);
        const authorName = author?.fullName ?? "Care Team";
        events.push({ id: `dp-${p.id}`, type: "diet_plan", title: `Diet Plan v${p.version}: ${p.title}`, summary: p.content.slice(0, 100), content: { id: p.id, title: p.title, version: p.version, isActive: p.isActive, authorName, createdAt: p.createdAt.toISOString() }, createdAt: p.createdAt.toISOString(), author: authorName });
      }
    }

    // Care plan updates
    if (!type || type === "care_plan" || type === "all") {
      const planHistory = await db.select().from(patientPlanHistoryTable).where(eq(patientPlanHistoryTable.patientId, patient.id)).orderBy(desc(patientPlanHistoryTable.editedAt)).limit(20);
      for (const h of planHistory) {
        if (from && h.editedAt < new Date(from)) continue;
        if (to && h.editedAt > new Date(to)) continue;
        const [author] = await db.select().from(staffTable).where(eq(staffTable.id, h.editedById)).limit(1);
        const authorName = author?.fullName ?? "Physician";
        const parts: string[] = [];
        if (h.nutritionPlan) parts.push("Nutrition");
        if (h.activityPlan) parts.push("Activity");
        if (h.weeklyGoals) parts.push("Goals");
        events.push({ id: `cp-${h.id}`, type: "care_plan", title: "Care Plan Updated", summary: `Sections: ${parts.join(", ") || "General"}`, content: { ...h, editedAt: h.editedAt.toISOString() }, createdAt: h.editedAt.toISOString(), author: authorName });
      }
    }

    // Metrics
    if (!type || type === "metric" || type === "all") {
      const mConds: any[] = [eq(metricsTable.patientId, patient.id)];
      if (from) mConds.push(gte(metricsTable.createdAt, new Date(from)));
      if (to) mConds.push(lte(metricsTable.createdAt, new Date(to)));
      const metrics = await db.select().from(metricsTable).where(and(...mConds)).orderBy(desc(metricsTable.createdAt)).limit(50);
      for (const m of metrics) {
        const label = m.type === "weight" ? `${m.value} kg` : m.type === "glucose" || m.type === "glucose_fasting" ? `${m.value} mg/dL` : m.type === "sleep_hours" ? `${m.value} hrs` : `${m.value}`;
        events.push({ id: `metric-${m.id}`, type: "metric", title: `${m.type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())} Reading`, summary: label, content: { ...m, createdAt: m.createdAt.toISOString() }, createdAt: m.createdAt.toISOString(), author: "You" });
      }
    }

    events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(events.slice(0, 100));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Document management for patients ──────────────────────────────────────────

router.get("/me/documents", async (req, res) => {
  try {
    const parsed = parseToken(req.headers.authorization);
    if (!parsed || parsed.role !== "patient") { res.status(403).json({ error: "Forbidden" }); return; }
    const [patient] = await db.select({ id: patientsTable.id }).from(patientsTable).where(eq(patientsTable.userId, parsed.userId)).limit(1);
    if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }
    const docs = await db.select({
      id: patientDocumentsTable.id,
      patientId: patientDocumentsTable.patientId,
      filename: patientDocumentsTable.filename,
      fileType: patientDocumentsTable.fileType,
      category: patientDocumentsTable.category,
      label: patientDocumentsTable.label,
      uploadedByPatient: patientDocumentsTable.uploadedByPatient,
      createdAt: patientDocumentsTable.createdAt,
    }).from(patientDocumentsTable).where(eq(patientDocumentsTable.patientId, patient.id)).orderBy(desc(patientDocumentsTable.createdAt));
    res.json(docs.map(d => ({ ...d, createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : d.createdAt })));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

router.get("/me/documents/:id", async (req, res) => {
  try {
    const parsed = parseToken(req.headers.authorization);
    if (!parsed || parsed.role !== "patient") { res.status(403).json({ error: "Forbidden" }); return; }
    const [patient] = await db.select({ id: patientsTable.id }).from(patientsTable).where(eq(patientsTable.userId, parsed.userId)).limit(1);
    if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }
    const docId = parseInt(req.params.id);
    const [doc] = await db.select().from(patientDocumentsTable).where(and(eq(patientDocumentsTable.id, docId), eq(patientDocumentsTable.patientId, patient.id))).limit(1);
    if (!doc) { res.status(404).json({ error: "Document not found" }); return; }
    res.json({ ...doc, createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

router.post("/me/documents", async (req, res) => {
  try {
    const parsed = parseToken(req.headers.authorization);
    if (!parsed || parsed.role !== "patient") { res.status(403).json({ error: "Forbidden" }); return; }
    const [patient] = await db.select({ id: patientsTable.id }).from(patientsTable).where(eq(patientsTable.userId, parsed.userId)).limit(1);
    if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }
    const { filename, fileData, fileType, category, label } = req.body;
    if (!filename || !fileData) { res.status(400).json({ error: "filename and fileData required" }); return; }
    const [doc] = await db.insert(patientDocumentsTable).values({
      patientId: patient.id, uploadedByPatient: true, filename,
      fileData, fileType: fileType ?? "application/octet-stream",
      category: category ?? "general", label: label ?? null,
    }).returning({
      id: patientDocumentsTable.id, patientId: patientDocumentsTable.patientId,
      filename: patientDocumentsTable.filename, fileType: patientDocumentsTable.fileType,
      category: patientDocumentsTable.category, label: patientDocumentsTable.label,
      uploadedByPatient: patientDocumentsTable.uploadedByPatient, createdAt: patientDocumentsTable.createdAt,
    });
    res.status(201).json({ ...doc, createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

router.delete("/me/documents/:id", async (req, res) => {
  try {
    const parsed = parseToken(req.headers.authorization);
    if (!parsed || parsed.role !== "patient") { res.status(403).json({ error: "Forbidden" }); return; }
    const [patient] = await db.select({ id: patientsTable.id }).from(patientsTable).where(eq(patientsTable.userId, parsed.userId)).limit(1);
    if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }
    const docId = parseInt(req.params.id);
    const [doc] = await db.select({ id: patientDocumentsTable.id }).from(patientDocumentsTable).where(and(eq(patientDocumentsTable.id, docId), eq(patientDocumentsTable.patientId, patient.id))).limit(1);
    if (!doc) { res.status(404).json({ error: "Document not found" }); return; }
    await db.delete(patientDocumentsTable).where(eq(patientDocumentsTable.id, docId));
    res.json({ ok: true });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

export default router;
