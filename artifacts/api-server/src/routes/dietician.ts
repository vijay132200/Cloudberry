import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, staffTable, patientsTable, checkinsTable, metricsTable, appointmentsTable, patientNotesTable, patientPlansTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";

const router = Router();

function parseToken(h: string | undefined) {
  if (!h) return null;
  try { return JSON.parse(Buffer.from(h.replace("Bearer ", ""), "base64").toString("utf-8")); } catch { return null; }
}

async function requireDietician(req: any, res: any) {
  const parsed = parseToken(req.headers.authorization);
  if (!parsed) { res.status(401).json({ error: "Unauthorized" }); return null; }
  if (parsed.role !== "dietician") { res.status(403).json({ error: "Forbidden" }); return null; }
  const [staff] = await db.select().from(staffTable).where(eq(staffTable.id, parsed.userId)).limit(1);
  if (!staff || staff.role !== "dietician") { res.status(403).json({ error: "Forbidden" }); return null; }
  return { staffId: staff.id, fullName: staff.fullName };
}

router.get("/me", async (req, res) => {
  try {
    const parsed = parseToken(req.headers.authorization);
    if (!parsed || parsed.role !== "dietician") { res.status(403).json({ error: "Forbidden" }); return; }
    const [staff] = await db.select().from(staffTable).where(eq(staffTable.id, parsed.userId)).limit(1);
    if (!staff || staff.role !== "dietician") { res.status(403).json({ error: "Forbidden" }); return; }
    res.json({ id: staff.id, fullName: staff.fullName, email: staff.email, specialty: staff.specialty, role: staff.role });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

router.get("/dashboard", async (req, res) => {
  try {
    const auth = await requireDietician(req, res);
    if (!auth) return;
    const patients = await db.select().from(patientsTable)
      .where(eq(patientsTable.assignedDieticianId, auth.staffId));
    const total = patients.length;
    const highAdherence = await Promise.all(patients.map(async p => {
      const checkins = await db.select().from(checkinsTable)
        .where(eq(checkinsTable.patientId, p.id)).limit(7);
      return checkins.length > 0
        ? checkins.filter(c => c.mealsFollowed === "yes" || c.mealsFollowed === "mostly").length / checkins.length
        : 0;
    }));
    const avgAdherence = total > 0
      ? Math.round((highAdherence.reduce((a, b) => a + b, 0) / total) * 100)
      : 0;
    const highRisk = patients.filter(p => p.riskLevel === "high").length;
    res.json({ totalPatients: total, avgNutritionAdherence: avgAdherence, highRisk });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

router.get("/patients", async (req, res) => {
  try {
    const auth = await requireDietician(req, res);
    if (!auth) return;
    const allPatients = await db.select().from(patientsTable)
      .where(eq(patientsTable.assignedDieticianId, auth.staffId));
    const result = await Promise.all(allPatients.map(async (p) => {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, p.userId)).limit(1);
      const recentCheckins = await db.select().from(checkinsTable).where(eq(checkinsTable.patientId, p.id)).orderBy(desc(checkinsTable.createdAt)).limit(7);
      const nutritionAdherence = recentCheckins.length > 0
        ? Math.round((recentCheckins.filter(c => c.mealsFollowed === "yes" || c.mealsFollowed === "mostly").length / recentCheckins.length) * 100) : null;
      const [plan] = await db.select().from(patientPlansTable).where(eq(patientPlansTable.patientId, p.id)).limit(1);
      return {
        id: p.id, fullName: user?.fullName, phone: user?.phone, email: user?.email, city: user?.city,
        plan: p.plan, primaryGoal: p.primaryGoal, weekNumber: p.weekNumber,
        currentWeight: p.currentWeight, startingWeight: p.startingWeight, targetWeight: p.targetWeight,
        status: p.status, riskLevel: p.riskLevel, nutritionAdherence, streak: recentCheckins.length,
        lastCheckinAt: recentCheckins[0]?.createdAt?.toISOString() ?? null,
        nutritionPlan: plan?.nutritionPlan ?? null,
      };
    }));
    res.json(result);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

router.get("/patients/:id", async (req, res) => {
  try {
    const auth = await requireDietician(req, res);
    if (!auth) return;
    const patientId = parseInt(req.params.id);
    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, patientId)).limit(1);
    if (!patient) { res.status(404).json({ error: "Not found" }); return; }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, patient.userId)).limit(1);
    const [plan] = await db.select().from(patientPlansTable).where(eq(patientPlansTable.patientId, patientId)).limit(1);
    const checkins = await db.select().from(checkinsTable).where(eq(checkinsTable.patientId, patientId)).orderBy(desc(checkinsTable.createdAt)).limit(14);
    const metrics = await db.select().from(metricsTable).where(eq(metricsTable.patientId, patientId)).orderBy(desc(metricsTable.createdAt)).limit(20);
    const notes = await db.select().from(patientNotesTable).where(eq(patientNotesTable.patientId, patientId)).orderBy(desc(patientNotesTable.createdAt)).limit(10);
    res.json({
      patient: { ...patient, fullName: user?.fullName, phone: user?.phone, email: user?.email, city: user?.city, createdAt: patient.createdAt.toISOString() },
      plan: plan ?? null,
      checkins: checkins.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })),
      metrics: metrics.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })),
      notes: notes.map(n => ({ ...n, createdAt: n.createdAt.toISOString() })),
    });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

router.post("/patients/:id/notes", async (req, res) => {
  try {
    const auth = await requireDietician(req, res);
    if (!auth) return;
    const { content, category } = req.body;
    if (!content?.trim()) { res.status(400).json({ error: "Content required" }); return; }
    const [note] = await db.insert(patientNotesTable).values({
      patientId: parseInt(req.params.id), coachId: auth.staffId,
      content, category: category ?? "nutrition",
    }).returning();
    res.status(201).json({ ...note, createdAt: note.createdAt.toISOString() });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

router.post("/appointments", async (req, res) => {
  try {
    const auth = await requireDietician(req, res);
    if (!auth) return;
    const { patientId, scheduledAt, type, notes } = req.body ?? {};
    if (!patientId || !scheduledAt) { res.status(400).json({ error: "patientId and scheduledAt required" }); return; }
    const [appt] = await db.insert(appointmentsTable).values({
      patientId: parseInt(patientId),
      careTeamMember: auth.fullName,
      role: "dietician",
      scheduledAt: new Date(scheduledAt),
      status: "upcoming",
      notes: notes ?? type ?? null,
    }).returning();
    res.status(201).json({ ...appt, scheduledAt: appt.scheduledAt.toISOString(), createdAt: appt.createdAt.toISOString() });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

router.patch("/patients/:id/plan", async (req, res) => {
  try {
    const auth = await requireDietician(req, res);
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

export default router;
