import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, staffTable, patientsTable, checkinsTable, metricsTable, appointmentsTable, patientNotesTable, patientPlansTable } from "@workspace/db";
import { eq, desc, and, or, gte } from "drizzle-orm";

const router = Router();

function parseToken(authHeader: string | undefined): { userId: number; role: string } | null {
  if (!authHeader) return null;
  try { return JSON.parse(Buffer.from(authHeader.replace("Bearer ", ""), "base64").toString("utf-8")); }
  catch { return null; }
}

async function requirePhysician(req: any, res: any): Promise<{ staffId: number } | null> {
  const parsed = parseToken(req.headers.authorization);
  if (!parsed) { res.status(401).json({ error: "Unauthorized" }); return null; }
  const [staff] = await db.select().from(staffTable).where(eq(staffTable.id, parsed.userId)).limit(1);
  if (!staff || staff.role !== "physician") { res.status(403).json({ error: "Forbidden" }); return null; }
  return { staffId: staff.id };
}

router.get("/me", async (req, res) => {
  try {
    const parsed = parseToken(req.headers.authorization);
    if (!parsed) { res.status(401).json({ error: "Unauthorized" }); return; }
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
    if (!parsed) { res.status(401).json({ error: "Unauthorized" }); return; }
    const [staff] = await db.select().from(staffTable).where(eq(staffTable.id, parsed.userId)).limit(1);
    if (!staff || staff.role !== "physician") { res.status(403).json({ error: "Forbidden" }); return; }
    const { fullName, specialty, phone } = req.body ?? {};
    const update: any = {};
    if (typeof fullName === "string" && fullName.trim()) update.fullName = fullName.trim();
    if (typeof specialty === "string") update.specialty = specialty.trim() || null;
    if (typeof phone === "string") update.phone = phone.trim() || null;
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

export default router;
