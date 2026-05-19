import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, staffTable, patientsTable, checkinsTable, metricsTable, appointmentsTable, patientNotesTable, patientPlansTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

function parseToken(h: string | undefined) {
  if (!h) return null;
  try { return JSON.parse(Buffer.from(h.replace("Bearer ", ""), "base64").toString("utf-8")); } catch { return null; }
}

async function requireDietician(req: any, res: any) {
  const parsed = parseToken(req.headers.authorization);
  if (!parsed) { res.status(401).json({ error: "Unauthorized" }); return null; }
  const [staff] = await db.select().from(staffTable).where(eq(staffTable.id, parsed.userId)).limit(1);
  if (!staff || staff.role !== "dietician") { res.status(403).json({ error: "Forbidden" }); return null; }
  return { staffId: staff.id, fullName: staff.fullName };
}

router.get("/me", async (req, res) => {
  try {
    const parsed = parseToken(req.headers.authorization);
    if (!parsed) { res.status(401).json({ error: "Unauthorized" }); return; }
    const [staff] = await db.select().from(staffTable).where(eq(staffTable.id, parsed.userId)).limit(1);
    if (!staff || staff.role !== "dietician") { res.status(403).json({ error: "Forbidden" }); return; }
    res.json({ id: staff.id, fullName: staff.fullName, email: staff.email, specialty: staff.specialty, role: staff.role });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

router.get("/patients", async (req, res) => {
  try {
    const auth = await requireDietician(req, res);
    if (!auth) return;
    const allPatients = await db.select().from(patientsTable).where(eq(patientsTable.status, "active"));
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
    res.json({
      patient: { ...patient, fullName: user?.fullName, phone: user?.phone, email: user?.email, city: user?.city, createdAt: patient.createdAt.toISOString() },
      plan, checkins: checkins.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })),
      metrics: metrics.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })),
    });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

router.post("/patients/:id/notes", async (req, res) => {
  try {
    const auth = await requireDietician(req, res);
    if (!auth) return;
    const { content, category } = req.body;
    const [note] = await db.insert(patientNotesTable).values({
      patientId: parseInt(req.params.id), coachId: auth.staffId,
      content, category: category ?? "nutrition",
    }).returning();
    res.status(201).json({ ...note, createdAt: note.createdAt.toISOString() });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

export default router;
