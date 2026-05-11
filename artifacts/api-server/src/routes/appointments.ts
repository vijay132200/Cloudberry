import { Router } from "express";
import { db } from "@workspace/db";
import { appointmentsTable, patientsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

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

router.get("/", async (req, res) => {
  try {
    const parsed = parseToken(req.headers.authorization);
    if (!parsed) { res.status(401).json({ error: "Unauthorized" }); return; }
    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.userId, parsed.userId)).limit(1);
    if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }
    const appts = await db.select().from(appointmentsTable)
      .where(eq(appointmentsTable.patientId, patient.id))
      .orderBy(asc(appointmentsTable.scheduledAt))
      .limit(10);
    res.json(appts.map(a => ({ ...a, scheduledAt: a.scheduledAt.toISOString(), createdAt: a.createdAt.toISOString() })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = parseToken(req.headers.authorization);
    if (!parsed) { res.status(401).json({ error: "Unauthorized" }); return; }
    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.userId, parsed.userId)).limit(1);
    if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }
    const { careTeamMember, preferredDate, notes } = req.body;
    const [appt] = await db.insert(appointmentsTable).values({
      patientId: patient.id,
      careTeamMember,
      role: "Doctor",
      scheduledAt: new Date(preferredDate),
      status: "upcoming",
      notes: notes ?? null,
    }).returning();
    res.status(201).json({ ...appt, scheduledAt: appt.scheduledAt.toISOString(), createdAt: appt.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id/reschedule", async (req, res) => {
  try {
    const { newDate } = req.body;
    const id = parseInt(req.params.id);
    const [appt] = await db.update(appointmentsTable)
      .set({ scheduledAt: new Date(newDate) })
      .where(eq(appointmentsTable.id, id))
      .returning();
    res.json({ ...appt, scheduledAt: appt.scheduledAt.toISOString(), createdAt: appt.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
