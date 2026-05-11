import { Router } from "express";
import { db } from "@workspace/db";
import { checkinsTable, patientsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

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
    const checkins = await db.select().from(checkinsTable)
      .where(eq(checkinsTable.patientId, patient.id))
      .orderBy(desc(checkinsTable.createdAt))
      .limit(30);
    res.json(checkins.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })));
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
    const { mealsFollowed, activityCompleted, energyLevel, mood, glucoseReading, notes } = req.body;
    const [checkin] = await db.insert(checkinsTable).values({
      patientId: patient.id,
      mealsFollowed,
      activityCompleted: !!activityCompleted,
      energyLevel,
      mood,
      glucoseReading: glucoseReading ?? null,
      notes: notes ?? null,
    }).returning();
    res.status(201).json({ ...checkin, createdAt: checkin.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
