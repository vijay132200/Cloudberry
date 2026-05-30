import { Router } from "express";
import { db } from "@workspace/db";
import { checkinsTable, patientsTable, metricsTable } from "@workspace/db";
import { eq, desc, and, gte, lt } from "drizzle-orm";

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

function getDayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

// GET /api/checkins — recent check-ins for this patient
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

// GET /api/checkins/today — server-authoritative check for today's check-in
router.get("/today", async (req, res) => {
  try {
    const parsed = parseToken(req.headers.authorization);
    if (!parsed) { res.status(401).json({ error: "Unauthorized" }); return; }
    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.userId, parsed.userId)).limit(1);
    if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }
    const { start, end } = getDayBounds();
    const [checkin] = await db.select().from(checkinsTable)
      .where(and(
        eq(checkinsTable.patientId, patient.id),
        gte(checkinsTable.createdAt, start),
        lt(checkinsTable.createdAt, end),
      ))
      .orderBy(desc(checkinsTable.createdAt))
      .limit(1);
    res.json({
      done: !!checkin,
      checkin: checkin ? { ...checkin, createdAt: checkin.createdAt.toISOString() } : null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/checkins — submit today's check-in (one per calendar day per patient)
router.post("/", async (req, res) => {
  try {
    const parsed = parseToken(req.headers.authorization);
    if (!parsed) { res.status(401).json({ error: "Unauthorized" }); return; }
    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.userId, parsed.userId)).limit(1);
    if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }

    // Enforce one check-in per calendar day
    const { start, end } = getDayBounds();
    const [existing] = await db.select({ id: checkinsTable.id }).from(checkinsTable)
      .where(and(
        eq(checkinsTable.patientId, patient.id),
        gte(checkinsTable.createdAt, start),
        lt(checkinsTable.createdAt, end),
      ))
      .limit(1);
    if (existing) {
      res.status(409).json({ error: "Check-in already submitted for today", alreadyDone: true });
      return;
    }

    const { mealsFollowed, activityCompleted, energyLevel, mood, glucoseReading, postGlucose, notes, weight, sleepHours } = req.body;
    const [checkin] = await db.insert(checkinsTable).values({
      patientId: patient.id,
      mealsFollowed,
      activityCompleted: !!activityCompleted,
      energyLevel,
      mood,
      glucoseReading: glucoseReading ?? null,
      notes: notes ?? null,
    }).returning();

    const todayIso = start.toISOString().slice(0, 10);

    // Persist fasting glucose reading as a metric
    if (glucoseReading != null && !isNaN(Number(glucoseReading)) && Number(glucoseReading) > 0) {
      await db.insert(metricsTable).values({
        patientId: patient.id,
        type: "glucose",
        value: Number(glucoseReading),
        date: todayIso,
      }).onConflictDoNothing();
    }

    // Persist post-meal glucose as a separate metric (type: post_glucose)
    if (postGlucose != null && !isNaN(Number(postGlucose)) && Number(postGlucose) > 0) {
      await db.insert(metricsTable).values({
        patientId: patient.id,
        type: "post_glucose",
        value: Number(postGlucose),
        date: todayIso,
      }).onConflictDoNothing();
    }

    // Persist weight as a metric and update patient's currentWeight
    const weightNum = Number(weight);
    if (weight != null && !isNaN(weightNum) && weightNum > 0) {
      await db.insert(metricsTable).values({
        patientId: patient.id,
        type: "weight",
        value: weightNum,
        date: todayIso,
      });
      await db.update(patientsTable)
        .set({ currentWeight: weightNum })
        .where(eq(patientsTable.id, patient.id));
    }

    // Persist sleep hours as a metric (used by behavioral consistency score)
    const sleepNum = Number(sleepHours);
    if (sleepHours != null && !isNaN(sleepNum) && sleepNum > 0) {
      const existing = await db.select({ id: metricsTable.id }).from(metricsTable)
        .where(and(eq(metricsTable.patientId, patient.id), eq(metricsTable.type, "sleep_hours"), eq(metricsTable.date, todayIso)))
        .limit(1);
      if (existing.length === 0) {
        await db.insert(metricsTable).values({
          patientId: patient.id,
          type: "sleep_hours",
          value: sleepNum,
          date: todayIso,
        });
      }
    }

    res.status(201).json({ ...checkin, createdAt: checkin.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
