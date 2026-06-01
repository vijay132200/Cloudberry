import { Router } from "express";
import { createHash } from "crypto";
import { db } from "@workspace/db";
import { usersTable, staffTable, patientsTable, checkinsTable, metricsTable, appointmentsTable, patientNotesTable, patientPlansTable } from "@workspace/db";
import { eq, desc, and, or, gte, asc, sql } from "drizzle-orm";
import { computeConsistency, computeWeeklyHistory } from "../lib/consistency";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

const router = Router();

function parseToken(authHeader: string | undefined): { userId: number; role: string } | null {
  if (!authHeader) return null;
  try { return JSON.parse(Buffer.from(authHeader.replace("Bearer ", ""), "base64").toString("utf-8")); }
  catch { return null; }
}

async function requirePhysician(req: any, res: any): Promise<{ staffId: number } | null> {
  const parsed = parseToken(req.headers.authorization);
  if (!parsed) { res.status(401).json({ error: "Unauthorized" }); return null; }
  if (parsed.role !== "physician") { res.status(403).json({ error: "Forbidden" }); return null; }
  const [staff] = await db.select().from(staffTable).where(eq(staffTable.id, parsed.userId)).limit(1);
  if (!staff || staff.role !== "physician") { res.status(403).json({ error: "Forbidden" }); return null; }
  return { staffId: staff.id };
}

router.get("/me", async (req, res) => {
  try {
    const parsed = parseToken(req.headers.authorization);
    if (!parsed || parsed.role !== "physician") { res.status(403).json({ error: "Forbidden" }); return; }
    const [staff] = await db.select().from(staffTable).where(eq(staffTable.id, parsed.userId)).limit(1);
    if (!staff || staff.role !== "physician") { res.status(403).json({ error: "Forbidden" }); return; }
    res.json({ id: staff.id, fullName: staff.fullName, email: staff.email, specialty: staff.specialty, role: staff.role });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

router.get("/patients", async (req, res) => {
  try {
    const auth = await requirePhysician(req, res);
    if (!auth) return;

    const allPatients = await db.select({
      id: patientsTable.id, userId: patientsTable.userId, plan: patientsTable.plan,
      primaryGoal: patientsTable.primaryGoal, weekNumber: patientsTable.weekNumber,
      startingWeight: patientsTable.startingWeight, currentWeight: patientsTable.currentWeight,
      targetWeight: patientsTable.targetWeight, status: patientsTable.status,
      riskLevel: patientsTable.riskLevel, assignedCoachId: patientsTable.assignedCoachId,
      createdAt: patientsTable.createdAt,
    }).from(patientsTable).where(
      or(
        eq(patientsTable.assignedPhysicianId, auth.staffId),
        eq(patientsTable.assignedCoachId, auth.staffId)
      )!
    );

    const result = await Promise.all(allPatients.map(async (p) => {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, p.userId)).limit(1);
      const recentCheckins = await db.select().from(checkinsTable)
        .where(eq(checkinsTable.patientId, p.id)).orderBy(desc(checkinsTable.createdAt)).limit(7);
      const adherencePct = recentCheckins.length > 0
        ? Math.round((recentCheckins.filter(c => c.mealsFollowed === "yes" || c.mealsFollowed === "mostly").length / recentCheckins.length) * 100) : null;
      const lastCheckin = recentCheckins[0];
      return {
        id: p.id, userId: p.userId, fullName: user?.fullName ?? "Unknown",
        phone: user?.phone, email: user?.email, city: user?.city,
        plan: p.plan, primaryGoal: p.primaryGoal, weekNumber: p.weekNumber,
        currentWeight: p.currentWeight, startingWeight: p.startingWeight, targetWeight: p.targetWeight,
        status: p.status, riskLevel: p.riskLevel,
        adherencePct, streak: recentCheckins.length,
        lastCheckinAt: lastCheckin?.createdAt?.toISOString() ?? null,
        lastMood: lastCheckin?.mood ?? null, lastEnergy: lastCheckin?.energyLevel ?? null,
        createdAt: p.createdAt.toISOString(),
      };
    }));

    res.json(result);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

router.get("/patients/:id", async (req, res) => {
  try {
    const auth = await requirePhysician(req, res);
    if (!auth) return;
    const patientId = parseInt(req.params.id);

    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, patientId)).limit(1);
    if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, patient.userId)).limit(1);
    const [plan] = await db.select().from(patientPlansTable).where(eq(patientPlansTable.patientId, patientId)).limit(1);
    const checkins = await db.select().from(checkinsTable).where(eq(checkinsTable.patientId, patientId)).orderBy(desc(checkinsTable.createdAt)).limit(14);
    const metrics = await db.select().from(metricsTable).where(eq(metricsTable.patientId, patientId)).orderBy(desc(metricsTable.createdAt)).limit(30);
    const appointments = await db.select().from(appointmentsTable).where(eq(appointmentsTable.patientId, patientId)).orderBy(desc(appointmentsTable.scheduledAt)).limit(5);
    const notes = await db.select().from(patientNotesTable).where(eq(patientNotesTable.patientId, patientId)).orderBy(desc(patientNotesTable.createdAt)).limit(10);

    res.json({
      patient: { ...patient, fullName: user?.fullName, phone: user?.phone, email: user?.email, city: user?.city, createdAt: patient.createdAt.toISOString() },
      plan: plan ?? null,
      checkins: checkins.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })),
      metrics: metrics.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })),
      appointments: appointments.map(a => ({ ...a, scheduledAt: a.scheduledAt.toISOString(), createdAt: a.createdAt.toISOString() })),
      notes: notes.map(n => ({ ...n, createdAt: n.createdAt.toISOString() })),
    });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

router.patch("/patients/:id/escalate", async (req, res) => {
  try {
    const auth = await requirePhysician(req, res);
    if (!auth) return;
    const [patient] = await db.update(patientsTable).set({ riskLevel: "high" })
      .where(eq(patientsTable.id, parseInt(req.params.id))).returning();
    res.json(patient);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

router.patch("/patients/:id/deescalate", async (req, res) => {
  try {
    const auth = await requirePhysician(req, res);
    if (!auth) return;
    const [patient] = await db.update(patientsTable).set({ riskLevel: "low" })
      .where(eq(patientsTable.id, parseInt(req.params.id))).returning();
    res.json(patient);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

router.post("/patients/:id/notes", async (req, res) => {
  try {
    const auth = await requirePhysician(req, res);
    if (!auth) return;
    const { content, category } = req.body;
    if (!content?.trim()) { res.status(400).json({ error: "Content required" }); return; }
    const [note] = await db.insert(patientNotesTable).values({
      patientId: parseInt(req.params.id), coachId: auth.staffId,
      content, category: category ?? "physician",
    }).returning();
    res.status(201).json({ ...note, createdAt: note.createdAt.toISOString() });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

router.patch("/patients/:id/plan", async (req, res) => {
  try {
    const auth = await requirePhysician(req, res);
    if (!auth) return;
    const patientId = parseInt(req.params.id);
    const { nutritionPlan, activityPlan, weeklyGoals } = req.body;

    const [existing] = await db.select().from(patientPlansTable).where(eq(patientPlansTable.patientId, patientId)).limit(1);
    let plan;
    if (existing) {
      const updateData: any = {};
      if (nutritionPlan !== undefined) updateData.nutritionPlan = nutritionPlan;
      if (activityPlan !== undefined) updateData.activityPlan = activityPlan;
      if (weeklyGoals !== undefined) updateData.weeklyGoals = weeklyGoals;
      [plan] = await db.update(patientPlansTable).set(updateData)
        .where(eq(patientPlansTable.patientId, patientId)).returning();
    } else {
      [plan] = await db.insert(patientPlansTable).values({
        patientId,
        nutritionPlan: nutritionPlan ?? null,
        activityPlan: activityPlan ?? null,
        weeklyGoals: weeklyGoals ?? null,
      }).returning();
    }
    res.json(plan);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

router.patch("/me", async (req, res) => {
  try {
    const parsed = parseToken(req.headers.authorization);
    if (!parsed || parsed.role !== "physician") { res.status(403).json({ error: "Forbidden" }); return; }
    const [staff] = await db.select().from(staffTable).where(eq(staffTable.id, parsed.userId)).limit(1);
    if (!staff || staff.role !== "physician") { res.status(403).json({ error: "Forbidden" }); return; }
    const { fullName, specialty, phone, password } = req.body ?? {};
    const update: any = {};
    if (typeof fullName === "string" && fullName.trim()) update.fullName = fullName.trim();
    if (typeof specialty === "string") update.specialty = specialty.trim() || null;
    if (typeof phone === "string") update.phone = phone.trim() || null;
    if (typeof password === "string" && password.length >= 6) update.passwordHash = hashPassword(password);
    if (Object.keys(update).length) {
      await db.update(staffTable).set(update).where(eq(staffTable.id, parsed.userId));
    }
    res.json({ ok: true });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

router.get("/dashboard", async (req, res) => {
  try {
    const auth = await requirePhysician(req, res);
    if (!auth) return;
    const patients = await db.select().from(patientsTable).where(
      or(
        eq(patientsTable.assignedPhysicianId, auth.staffId),
        eq(patientsTable.assignedCoachId, auth.staffId)
      )!
    );
    const total = patients.length;
    const highRisk = patients.filter(p => p.riskLevel === "high").length;
    const activeCount = patients.filter(p => p.status === "active").length;
    const patientIds = patients.map(p => p.id);
    let upcomingAppts = 0;
    if (patientIds.length > 0) {
      const now = new Date();
      const appts = await db.select().from(appointmentsTable)
        .where(and(eq(appointmentsTable.status, "upcoming"), gte(appointmentsTable.scheduledAt, now)))
        .limit(100);
      upcomingAppts = appts.filter(a => patientIds.includes(a.patientId)).length;
    }
    res.json({ totalPatients: total, highRisk, activeCount, upcomingAppointments: upcomingAppts });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/physician/patients/:id/dashboard — full patient dashboard for physician view
router.get("/patients/:id/dashboard", async (req, res) => {
  try {
    const auth = await requirePhysician(req, res);
    if (!auth) return;
    const patientId = parseInt(req.params.id);
    if (Number.isNaN(patientId)) { res.status(400).json({ error: "Invalid patient id" }); return; }

    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, patientId)).limit(1);
    if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, patient.userId)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    async function loadS(id: number | null | undefined) {
      if (!id) return null;
      const [s] = await db.select().from(staffTable).where(eq(staffTable.id, id)).limit(1);
      return s ? { name: s.fullName, role: s.role } : null;
    }
    const [physician, dietician, caretaker] = await Promise.all([
      loadS(patient.assignedPhysicianId),
      loadS(patient.assignedDieticianId),
      loadS(patient.assignedCaretakerId ?? patient.assignedCoachId),
    ]);

    const allMetrics = await db.select().from(metricsTable)
      .where(eq(metricsTable.patientId, patient.id))
      .orderBy(asc(metricsTable.createdAt)).limit(200);
    const weightSeries = allMetrics.filter(m => m.type === "weight").map(m => ({ date: m.date, value: m.value }));
    const glucoseSeries = allMetrics.filter(m => m.type === "glucose").map(m => ({ date: m.date, value: m.value }));

    const allCheckins = await db.select().from(checkinsTable)
      .where(eq(checkinsTable.patientId, patient.id))
      .orderBy(desc(checkinsTable.createdAt)).limit(30);
    const [{ count: tcRow }] = await db.select({ count: sql<number>`count(*)::int` }).from(checkinsTable).where(eq(checkinsTable.patientId, patient.id));
    const totalCheckins = Number(tcRow ?? 0);

    const energyMap: Record<string, number> = { high: 3, good: 3, moderate: 2, medium: 2, low: 1, tired: 1 };
    const energySeries = [...allCheckins].slice(0, 7).reverse().map(c => ({
      date: c.createdAt.toISOString().slice(0, 10), value: energyMap[c.energyLevel?.toLowerCase()] ?? 2, label: c.energyLevel,
    }));

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const adherence7Day: Array<{ date: string; dow: string; completed: boolean | null }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const ci = allCheckins.find(c => c.createdAt.toISOString().slice(0, 10) === iso);
      adherence7Day.push({ date: iso, dow: d.toLocaleDateString("en-US", { weekday: "short" }), completed: ci ? ci.mealsFollowed === "yes" : null });
    }
    const completedCount = adherence7Day.filter(d => d.completed === true).length;
    const dataCount = adherence7Day.filter(d => d.completed !== null).length;
    const adherencePct = dataCount > 0 ? Math.round((completedCount / 7) * 100) : null;
    // Consistency breakdown: last 7 check-ins only — missing days excluded from denominator
    const last7 = allCheckins.slice(0, 7);
    const sleepMets = allMetrics.filter(m => m.type === "sleep_hours");
    const consistencyBreakdown = computeConsistency(
      last7,
      sleepMets.map(m => ({ date: m.date, value: m.value })),
    );

    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      if (allCheckins.find(c => c.createdAt.toISOString().slice(0, 10) === d.toISOString().slice(0, 10))) streak++;
      else if (i > 0) break;
    }
    const weightChange = weightSeries.length >= 2 ? +(weightSeries[weightSeries.length - 1].value - weightSeries[0].value).toFixed(1) : null;
    const last7Glu = glucoseSeries.slice(-7).map(g => g.value);
    const avgGlucose = last7Glu.length > 0 ? Math.round(last7Glu.reduce((a, b) => a + b, 0) / last7Glu.length) : null;
    const timeInRange = last7Glu.length > 0 ? Math.round((last7Glu.filter(g => g >= 80 && g <= 140).length / last7Glu.length) * 100) : null;

    const upcoming = await db.select().from(appointmentsTable)
      .where(and(eq(appointmentsTable.patientId, patient.id), eq(appointmentsTable.status, "upcoming"), gte(appointmentsTable.scheduledAt, new Date())))
      .orderBy(asc(appointmentsTable.scheduledAt)).limit(1);
    const nextAppointment = upcoming[0] ? { ...upcoming[0], scheduledAt: upcoming[0].scheduledAt.toISOString(), createdAt: upcoming[0].createdAt.toISOString() } : null;

    const [planRow] = await db.select().from(patientPlansTable).where(eq(patientPlansTable.patientId, patient.id)).limit(1);
    const carePlan = planRow ? { nutritionPlan: planRow.nutritionPlan, activityPlan: planRow.activityPlan, weeklyGoals: planRow.weeklyGoals } : null;

    const hasEnoughData = allCheckins.length >= 5;
    let insights: Array<{ kind: string; title: string; body: string }> | null = null;
    if (hasEnoughData) {
      insights = [];
      const lowE = last7.filter(c => energyMap[c.energyLevel?.toLowerCase()] === 1).length;
      const skipped = last7.filter(c => !c.activityCompleted).length;
      if (lowE >= 2) insights.push({ kind: "challenge", title: "Energy dip pattern", body: `Low energy on ${lowE} of last 7 days.` });
      if (weightChange !== null && weightChange < 0) insights.push({ kind: "positive", title: "Weight trending down", body: `Down ${Math.abs(weightChange).toFixed(1)} kg.` });
      if (skipped >= 3) insights.push({ kind: "focus", title: "Activity consistency", body: `Activity ${7 - skipped}/7 days.` });
      if (avgGlucose !== null && avgGlucose < 120) insights.push({ kind: "positive", title: "Glucose in range", body: `Avg ${avgGlucose} mg/dL.` });
      if (insights.length === 0) insights = null;
    }

    res.json({
      patient: { id: patient.id, fullName: user.fullName, phone: user.phone, email: user.email ?? null, city: user.city ?? "", primaryGoal: patient.primaryGoal, plan: patient.plan, weekNumber: patient.weekNumber, startingWeight: patient.startingWeight ?? null, currentWeight: patient.currentWeight ?? null, targetWeight: patient.targetWeight ?? null },
      careTeam: { physician, dietician, caretaker },
      careAssigned: Boolean(physician || dietician || caretaker),
      weekNumber: patient.weekNumber,
      weightSeries, glucoseSeries, energySeries,
      adherence7Day, adherencePct, consistencyBreakdown,
      streak, weightChange, avgGlucose, timeInRange,
      nextAppointment, carePlan, insights, hasEnoughData, totalCheckins,
    });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/physician/patients/:id/consistency-history
router.get("/patients/:id/consistency-history", async (req, res) => {
  try {
    const auth = await requirePhysician(req, res); if (!auth) return;
    const patientId = parseInt(req.params.id);
    if (Number.isNaN(patientId)) { res.status(400).json({ error: "Invalid id" }); return; }

    const [allCheckins, sleepMetrics] = await Promise.all([
      db.select().from(checkinsTable)
        .where(eq(checkinsTable.patientId, patientId))
        .orderBy(desc(checkinsTable.createdAt)),
      db.select().from(metricsTable)
        .where(and(eq(metricsTable.patientId, patientId), eq(metricsTable.type, "sleep_hours"))),
    ]);

    const history = computeWeeklyHistory(
      allCheckins,
      sleepMetrics.map(m => ({ date: m.date, value: m.value })),
    );
    res.json(history);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

export default router;
