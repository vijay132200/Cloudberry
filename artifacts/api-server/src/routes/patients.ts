import { Router } from "express";
import { createHash } from "crypto";
import { db } from "@workspace/db";
import {
  usersTable,
  staffTable,
  patientsTable,
  patientPlansTable,
  patientNotesTable,
  checkinsTable,
  metricsTable,
  appointmentsTable,
} from "@workspace/db";
import { eq, desc, and, asc, gte, sql } from "drizzle-orm";
import { computeConsistency } from "../lib/consistency";

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

async function loadStaff(id: number | null) {
  if (!id) return null;
  const [s] = await db.select().from(staffTable).where(eq(staffTable.id, id)).limit(1);
  return s ? { id: s.id, name: s.fullName, role: s.role, email: s.email ?? null, specialty: s.specialty ?? null } : null;
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

router.patch("/me", async (req, res) => {
  try {
    const parsed = parseToken(req.headers.authorization);
    if (!parsed) { res.status(401).json({ error: "Unauthorized" }); return; }
    const { fullName, email, city, targetWeight, currentWeight } = req.body ?? {};

    const userUpdate: Record<string, unknown> = {};
    if (typeof fullName === "string" && fullName.trim()) userUpdate.fullName = fullName.trim();
    if (typeof email === "string") userUpdate.email = email.trim() || null;
    if (typeof city === "string") userUpdate.city = city.trim();
    if (Object.keys(userUpdate).length) {
      await db.update(usersTable).set(userUpdate).where(eq(usersTable.id, parsed.userId));
    }

    const patientUpdate: Record<string, unknown> = {};
    if (typeof targetWeight === "number" && !Number.isNaN(targetWeight)) patientUpdate.targetWeight = targetWeight;
    if (typeof currentWeight === "number" && !Number.isNaN(currentWeight)) patientUpdate.currentWeight = currentWeight;
    if (Object.keys(patientUpdate).length) {
      await db.update(patientsTable).set(patientUpdate).where(eq(patientsTable.userId, parsed.userId));
    }

    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/me/password", async (req, res) => {
  try {
    const parsed = parseToken(req.headers.authorization);
    if (!parsed) { res.status(401).json({ error: "Unauthorized" }); return; }
    const { currentPassword, newPassword } = req.body ?? {};
    if (!newPassword || newPassword.length < 8) {
      res.status(400).json({ error: "New password must be at least 8 characters" }); return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, parsed.userId)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    const DEMO_PW_HASH = createHash("sha256").update("demo123").digest("hex");
    if (currentPassword) {
      const hashed = createHash("sha256").update(currentPassword).digest("hex");
      const isDemo = user.passwordHash === DEMO_PW_HASH && currentPassword === "demo123";
      if (user.passwordHash !== hashed && !isDemo) {
        res.status(401).json({ error: "Current password is incorrect" }); return;
      }
    }
    const newHash = createHash("sha256").update(newPassword).digest("hex");
    await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, parsed.userId));
    res.json({ ok: true });
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

    const [physician, dietician, caretaker] = await Promise.all([
      loadStaff(patient.assignedPhysicianId),
      loadStaff(patient.assignedDieticianId),
      loadStaff(patient.assignedCaretakerId ?? patient.assignedCoachId),
    ]);
    const careAssigned = Boolean(physician || dietician || caretaker);

    // Last 30 days of metrics (weight + glucose, asc by date)
    const allMetrics = await db.select().from(metricsTable)
      .where(eq(metricsTable.patientId, patient.id))
      .orderBy(asc(metricsTable.createdAt))
      .limit(200);

    const weightSeries = allMetrics
      .filter(m => m.type === "weight")
      .map(m => ({ date: m.date, value: m.value }));
    const glucoseSeries = allMetrics
      .filter(m => m.type === "glucose")
      .map(m => ({ date: m.date, value: m.value }));
    const postGlucoseSeries = allMetrics
      .filter(m => m.type === "post_glucose")
      .map(m => ({ date: m.date, value: m.value }));

    // Recent 30 check-ins for trend math
    const allCheckins = await db.select().from(checkinsTable)
      .where(eq(checkinsTable.patientId, patient.id))
      .orderBy(desc(checkinsTable.createdAt))
      .limit(30);
    // True total count (not truncated)
    const [{ count: totalCheckinsRow }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(checkinsTable)
      .where(eq(checkinsTable.patientId, patient.id));
    const totalCheckins = Number(totalCheckinsRow ?? 0);

    // Energy series — last 7 check-ins chronological
    const energyMap: Record<string, number> = { high: 3, good: 3, moderate: 2, medium: 2, low: 1, tired: 1 };
    const recent7 = [...allCheckins].slice(0, 7).reverse();
    const energySeries = recent7.map(c => ({
      date: c.createdAt.toISOString().slice(0, 10),
      dow: new Date(c.createdAt).toLocaleDateString("en-US", { weekday: "short" }),
      value: energyMap[c.energyLevel?.toLowerCase()] ?? 2,
      label: c.energyLevel,
    }));

    // Behavioral Consistency — enrollment-aware (denominator starts from patient.createdAt)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sleepMetrics = allMetrics.filter(m => m.type === "sleep_hours");
    const { adherence7Day, adherencePct, consistencyBreakdown, streak } = computeConsistency(
      allCheckins, sleepMetrics, patient.createdAt,
    );

    // Today check-in done?
    const todayIso = today.toISOString().slice(0, 10);
    const checkinDoneToday = allCheckins.some(c => c.createdAt.toISOString().slice(0, 10) === todayIso);

    // Weight change
    const weightChange = weightSeries.length >= 2
      ? +(weightSeries[weightSeries.length - 1].value - weightSeries[0].value).toFixed(1)
      : null;

    // Glucose stats (fasting)
    const last7Glucose = glucoseSeries.slice(-7).map(g => g.value);
    const avgGlucose = last7Glucose.length > 0
      ? Math.round(last7Glucose.reduce((a, b) => a + b, 0) / last7Glucose.length)
      : null;
    const timeInRange = last7Glucose.length > 0
      ? Math.round((last7Glucose.filter(g => g >= 80 && g <= 140).length / last7Glucose.length) * 100)
      : null;
    // Post-meal glucose stats
    const last7PostGlucose = postGlucoseSeries.slice(-7).map(g => g.value);
    const avgPostGlucose = last7PostGlucose.length > 0
      ? Math.round(last7PostGlucose.reduce((a, b) => a + b, 0) / last7PostGlucose.length)
      : null;

    // Messages — patient_notes with category='message' (patient-facing notes from care team)
    const allNotes = await db.select().from(patientNotesTable)
      .where(eq(patientNotesTable.patientId, patient.id))
      .orderBy(desc(patientNotesTable.createdAt))
      .limit(10);
    const messageNotes = allNotes.filter(n => n.category === "message");
    const messages = await Promise.all(messageNotes.slice(0, 5).map(async n => {
      const author = await loadStaff(n.coachId);
      return {
        id: n.id,
        from: author?.name ?? "Care Team",
        role: author?.role ?? "care",
        content: n.content,
        createdAt: n.createdAt.toISOString(),
      };
    }));

    // Next appointment
    const upcoming = await db.select().from(appointmentsTable)
      .where(and(
        eq(appointmentsTable.patientId, patient.id),
        eq(appointmentsTable.status, "upcoming"),
        gte(appointmentsTable.scheduledAt, new Date()),
      ))
      .orderBy(asc(appointmentsTable.scheduledAt))
      .limit(1);
    const nextAppointment = upcoming[0] ? {
      ...upcoming[0],
      scheduledAt: upcoming[0].scheduledAt.toISOString(),
      createdAt: upcoming[0].createdAt.toISOString(),
    } : null;

    // Care plan
    const [planRow] = await db.select().from(patientPlansTable)
      .where(eq(patientPlansTable.patientId, patient.id)).limit(1);
    const carePlan = planRow ? {
      nutritionPlan: planRow.nutritionPlan,
      activityPlan: planRow.activityPlan,
      weeklyGoals: planRow.weeklyGoals,
    } : null;

    // Ops content — fetch most recent ops_content note for this patient
    const [opsNote] = await db.select().from(patientNotesTable)
      .where(and(eq(patientNotesTable.patientId, patient.id), eq(patientNotesTable.category, "ops_content")))
      .orderBy(desc(patientNotesTable.createdAt)).limit(1);
    let opsContent: any = null;
    if (opsNote) {
      try { opsContent = JSON.parse(opsNote.content); } catch { opsContent = null; }
    }

    const hasEnoughData = allCheckins.length >= 5;

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
      careTeam: { physician, dietician, caretaker },
      careAssigned,
      weekNumber: patient.weekNumber,
      weightSeries,
      glucoseSeries,
      postGlucoseSeries,
      energySeries,
      adherence7Day,
      adherencePct,
      consistencyBreakdown,
      streak,
      checkinDoneToday,
      weightChange,
      avgGlucose,
      avgPostGlucose,
      timeInRange,
      mood: allCheckins[0]?.mood ?? null,
      messages,
      nextAppointment,
      carePlan,
      opsContent,
      hasEnoughData,
      totalCheckins,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
