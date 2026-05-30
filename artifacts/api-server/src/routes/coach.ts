import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  patientsTable,
  checkinsTable,
  metricsTable,
  patientNotesTable,
  patientPlansTable,
  appointmentsTable,
} from "@workspace/db";
import { eq, desc, and, gte, asc, or } from "drizzle-orm";

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

router.get("/patients", async (req, res) => {
  try {
    const parsed = parseToken(req.headers.authorization);
    if (!parsed || !["physician","dietician","caretaker","ops"].includes(parsed.role)) {
      res.status(403).json({ error: "Forbidden" }); return;
    }

    const staffId = parsed.userId;

    // Build filter: each role sees only patients assigned to them via the appropriate field
    // Ops sees all patients; others see only their assigned patients
    const assignmentFilter = parsed.role === "ops" ? undefined :
      or(
        eq(patientsTable.assignedPhysicianId, staffId),
        eq(patientsTable.assignedDieticianId, staffId),
        eq(patientsTable.assignedCaretakerId, staffId),
        eq(patientsTable.assignedCoachId, staffId),
      )!;

    const query = db.select({
      patientId: patientsTable.id,
      userId: patientsTable.userId,
      plan: patientsTable.plan,
      status: patientsTable.status,
      riskLevel: patientsTable.riskLevel,
      weekNumber: patientsTable.weekNumber,
      fullName: usersTable.fullName,
      createdAt: patientsTable.createdAt,
    })
      .from(patientsTable)
      .innerJoin(usersTable, eq(patientsTable.userId, usersTable.id));

    const patients = assignmentFilter
      ? await query.where(assignmentFilter).limit(100)
      : await query.limit(100);

    const rows = await Promise.all(patients.map(async (p) => {
      const [lastCheckin] = await db.select().from(checkinsTable)
        .where(eq(checkinsTable.patientId, p.patientId))
        .orderBy(desc(checkinsTable.createdAt))
        .limit(1);
      const checkins = await db.select().from(checkinsTable)
        .where(eq(checkinsTable.patientId, p.patientId))
        .limit(14);
      // Enrollment-aware adherence: use min(14, daysSinceEnrollment+1) as denominator
      const _coachToday = new Date(); _coachToday.setHours(0, 0, 0, 0);
      const _coachEnroll = new Date(p.createdAt); _coachEnroll.setHours(0, 0, 0, 0);
      const _coachDays = Math.max(0, Math.floor((_coachToday.getTime() - _coachEnroll.getTime()) / 86_400_000));
      const _coachWindow = Math.min(14, _coachDays + 1);
      const adherencePct = _coachWindow > 0
        ? Math.round((checkins.filter(c => c.mealsFollowed === "yes").length / _coachWindow) * 100)
        : 0;
      const [nextAppt] = await db.select().from(appointmentsTable)
        .where(and(
          eq(appointmentsTable.patientId, p.patientId),
          eq(appointmentsTable.status, "upcoming"),
          gte(appointmentsTable.scheduledAt, new Date()),
        ))
        .orderBy(asc(appointmentsTable.scheduledAt))
        .limit(1);
      return {
        id: p.patientId,
        fullName: p.fullName,
        plan: p.plan,
        status: p.status,
        riskLevel: p.riskLevel,
        lastCheckinAt: lastCheckin?.createdAt.toISOString() ?? null,
        nextSessionAt: nextAppt?.scheduledAt?.toISOString() ?? null,
        adherencePct,
        weekNumber: p.weekNumber,
      };
    }));
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/patients/:id", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, patientId)).limit(1);
    if (!patient) { res.status(404).json({ error: "Not found" }); return; }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, patient.userId)).limit(1);

    const checkins = await db.select().from(checkinsTable)
      .where(eq(checkinsTable.patientId, patientId))
      .orderBy(desc(checkinsTable.createdAt))
      .limit(14);
    const metrics = await db.select().from(metricsTable)
      .where(eq(metricsTable.patientId, patientId))
      .orderBy(desc(metricsTable.createdAt))
      .limit(30);
    const notes = await db.select().from(patientNotesTable)
      .where(eq(patientNotesTable.patientId, patientId))
      .orderBy(desc(patientNotesTable.createdAt))
      .limit(20);
    const [plan] = await db.select().from(patientPlansTable)
      .where(eq(patientPlansTable.patientId, patientId))
      .limit(1);

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
      checkins: checkins.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })),
      metrics: metrics.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })),
      notes: notes.map(n => ({ ...n, createdAt: n.createdAt.toISOString() })),
      plan: plan ? { ...plan, updatedAt: plan.updatedAt.toISOString() } : {
        id: 0, patientId, nutritionPlan: null, activityPlan: null, weeklyGoals: null, updatedAt: new Date().toISOString()
      },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/patients/:id/notes", async (req, res) => {
  try {
    const parsed = parseToken(req.headers.authorization);
    const patientId = parseInt(req.params.id);
    const { content, category } = req.body;
    const [note] = await db.insert(patientNotesTable).values({
      patientId,
      coachId: parsed?.userId ?? null,
      content,
      category: category ?? null,
    }).returning();
    res.status(201).json({ ...note, createdAt: note.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/patients/:id/plan", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const { nutritionPlan, activityPlan, weeklyGoals } = req.body;
    const existing = await db.select().from(patientPlansTable).where(eq(patientPlansTable.patientId, patientId)).limit(1);
    let plan;
    if (existing.length > 0) {
      [plan] = await db.update(patientPlansTable)
        .set({ nutritionPlan: nutritionPlan ?? null, activityPlan: activityPlan ?? null, weeklyGoals: weeklyGoals ?? null })
        .where(eq(patientPlansTable.patientId, patientId))
        .returning();
    } else {
      [plan] = await db.insert(patientPlansTable).values({ patientId, nutritionPlan, activityPlan, weeklyGoals }).returning();
    }
    res.json({ ...plan, updatedAt: plan.updatedAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
