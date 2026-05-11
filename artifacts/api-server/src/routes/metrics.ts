import { Router } from "express";
import { db } from "@workspace/db";
import { metricsTable, patientsTable } from "@workspace/db";
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
    const metrics = await db.select().from(metricsTable)
      .where(eq(metricsTable.patientId, patient.id))
      .orderBy(desc(metricsTable.createdAt))
      .limit(60);
    res.json(metrics.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })));
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
    const { type, value, date, notes } = req.body;
    const [metric] = await db.insert(metricsTable).values({
      patientId: patient.id,
      type,
      value,
      date,
      notes: notes ?? null,
    }).returning();
    res.status(201).json({ ...metric, createdAt: metric.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
