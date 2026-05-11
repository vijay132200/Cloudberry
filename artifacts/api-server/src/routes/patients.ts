import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  patientsTable,
  checkinsTable,
  metricsTable,
  tipsTable,
  appointmentsTable,
} from "@workspace/db";
import { eq, desc, and, gte } from "drizzle-orm";

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

router.get("/me/dashboard", async (req, res) => {
  try {
    const parsed = parseToken(req.headers.authorization);
    if (!parsed) { res.status(401).json({ error: "Unauthorized" }); return; }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, parsed.userId)).limit(1);
    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.userId, parsed.userId)).limit(1);
    if (!user || !patient) { res.status(404).json({ error: "Not found" }); return; }

    const recentMetrics = await db.select().from(metricsTable)
      .where(eq(metricsTable.patientId, patient.id))
      .orderBy(desc(metricsTable.createdAt))
      .limit(10);

    const recentCheckins = await db.select().from(checkinsTable)
      .where(eq(checkinsTable.patientId, patient.id))
      .orderBy(desc(checkinsTable.createdAt))
      .limit(7);

    const nextAppt = await db.select().from(appointmentsTable)
      .where(and(eq(appointmentsTable.patientId, patient.id), eq(appointmentsTable.status, "upcoming")))
      .orderBy(appointmentsTable.scheduledAt)
      .limit(1);

    const weightMetrics = recentMetrics.filter(m => m.type === "weight");
    const weightChange = weightMetrics.length >= 2
      ? weightMetrics[0].value - weightMetrics[weightMetrics.length - 1].value
      : null;

    const adherencePct = recentCheckins.length > 0
      ? Math.round((recentCheckins.filter(c => c.mealsFollowed === "yes").length / recentCheckins.length) * 100)
      : null;

    const streak = recentCheckins.length;

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
      weekNumber: patient.weekNumber,
      todayGoals: ["Walk 30 min", "Log meals", "Stay hydrated"],
      weightChange,
      glucoseScore: 82,
      nutritionAdherence: adherencePct,
      activityAdherence: adherencePct,
      mood: recentCheckins[0]?.mood ?? null,
      streak,
      nextConsultation: nextAppt[0]?.scheduledAt.toISOString() ?? null,
      medicationNote: "Next dose in 2 days",
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
