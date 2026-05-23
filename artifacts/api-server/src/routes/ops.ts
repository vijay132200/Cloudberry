import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, patientsTable, checkinsTable, leadsTable, staffTable, appointmentsTable, patientNotesTable, patientPlansTable, metricsTable } from "@workspace/db";
import { eq, desc, sql, or, and, asc, gte } from "drizzle-orm";

const router = Router();

function parseToken(h: string | undefined) {
  if (!h) return null;
  try { return JSON.parse(Buffer.from(h.replace("Bearer ", ""), "base64").toString("utf-8")); } catch { return null; }
}

async function requireOps(req: any, res: any) {
  const parsed = parseToken(req.headers.authorization);
  if (!parsed) { res.status(401).json({ error: "Unauthorized" }); return null; }
  const [staff] = await db.select().from(staffTable).where(eq(staffTable.id, parsed.userId)).limit(1);
  if (!staff || staff.role !== "ops") { res.status(403).json({ error: "Forbidden" }); return null; }
  return { staffId: staff.id };
}

async function getStaffName(id: number | null | undefined): Promise<string | null> {
  if (!id) return null;
  const [s] = await db.select().from(staffTable).where(eq(staffTable.id, id)).limit(1);
  return s?.fullName ?? null;
}

async function buildPatientRow(p: any) {
  const [lastCheckin] = await db.select().from(checkinsTable)
    .where(eq(checkinsTable.patientId, p.patientId ?? p.id))
    .orderBy(desc(checkinsTable.createdAt)).limit(1);

  const checkins = await db.select().from(checkinsTable)
    .where(eq(checkinsTable.patientId, p.patientId ?? p.id))
    .orderBy(desc(checkinsTable.createdAt)).limit(14);

  const adherencePct = checkins.length > 0
    ? Math.round((checkins.filter((c: any) => c.mealsFollowed === "yes").length / checkins.length) * 100) : 0;

  const streak = (() => {
    if (!checkins.length) return 0;
    let s = 0;
    for (const c of checkins) { if (c.activityCompleted) s++; else break; }
    return s;
  })();

  const lastCheckinAt = lastCheckin?.createdAt
    ? (() => {
      const diff = Date.now() - new Date(lastCheckin.createdAt).getTime();
      const hours = Math.floor(diff / 3600000);
      if (hours < 1) return "Just now";
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return days === 1 ? "Yesterday" : `${days} days ago`;
    })() : "Never";

  const [physician, dietician, caretaker, coach] = await Promise.all([
    getStaffName(p.assignedPhysicianId),
    getStaffName(p.assignedDieticianId),
    getStaffName(p.assignedCaretakerId),
    getStaffName(p.assignedCoachId),
  ]);

  return {
    id: p.patientId ?? p.id,
    userId: p.userId,
    fullName: p.fullName,
    email: p.email,
    phone: p.phone,
    city: p.city,
    plan: p.plan,
    status: p.status,
    riskLevel: p.riskLevel,
    adherencePct,
    weekNumber: p.weekNumber,
    lastCheckinAt,
    assignedCoach: physician ?? coach,
    assignedCoachId: p.assignedCoachId,
    assignedPhysicianId: p.assignedPhysicianId,
    assignedDieticianId: p.assignedDieticianId,
    assignedCaretakerId: p.assignedCaretakerId,
    assignedPhysician: physician,
    assignedDietician: dietician,
    assignedCaretaker: caretaker,
    escalated: p.riskLevel === "high",
    streak,
    primaryGoal: p.primaryGoal,
    startingWeight: p.startingWeight,
    currentWeight: p.currentWeight,
    targetWeight: p.targetWeight,
    totalCheckins: checkins.length,
    createdAt: p.createdAt,
  };
}

router.get("/dashboard", async (req, res) => {
  try {
    const [{ count: activePatients }] = await db.select({ count: sql<number>`count(*)::int` })
      .from(patientsTable).where(eq(patientsTable.status, "active"));
    const [{ count: highRiskCount }] = await db.select({ count: sql<number>`count(*)::int` })
      .from(patientsTable).where(eq(patientsTable.riskLevel, "high"));
    const [{ count: totalLeads }] = await db.select({ count: sql<number>`count(*)::int` }).from(leadsTable);
    const [{ count: totalStaff }] = await db.select({ count: sql<number>`count(*)::int` }).from(staffTable);
    const [{ count: upcomingAppts }] = await db.select({ count: sql<number>`count(*)::int` })
      .from(appointmentsTable).where(eq(appointmentsTable.status, "upcoming"));

    const allPatients = await db.select({ id: patientsTable.id }).from(patientsTable);
    let totalAdherence = 0;
    let missedCheckins = 0;
    const allPatientsFull = await db.select().from(patientsTable);
    for (const p of allPatientsFull) {
      const checkins = await db.select().from(checkinsTable)
        .where(eq(checkinsTable.patientId, p.id)).limit(14);
      if (checkins.length === 0) {
        missedCheckins++;
      } else {
        const pct = checkins.filter(c => c.mealsFollowed === "yes").length / checkins.length;
        totalAdherence += pct * 100;
      }
    }

    res.json({
      activePatients,
      dailyAdherencePct: allPatients.length > 0 ? Math.round(totalAdherence / allPatients.length) : 0,
      missedCheckins,
      highRiskCount,
      upcomingAppointments: upcomingAppts,
      escalationsPending: highRiskCount,
      totalLeads,
      totalStaff,
      conversionRate: totalLeads > 0 ? Math.round((activePatients / totalLeads) * 100) : 0,
    });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

router.get("/patients", async (req, res) => {
  try {
    const patients = await db.select({
      patientId: patientsTable.id,
      userId: patientsTable.userId,
      plan: patientsTable.plan,
      status: patientsTable.status,
      riskLevel: patientsTable.riskLevel,
      weekNumber: patientsTable.weekNumber,
      assignedCoachId: patientsTable.assignedCoachId,
      assignedPhysicianId: patientsTable.assignedPhysicianId,
      assignedDieticianId: patientsTable.assignedDieticianId,
      assignedCaretakerId: patientsTable.assignedCaretakerId,
      fullName: usersTable.fullName,
      email: usersTable.email,
      phone: usersTable.phone,
      city: usersTable.city,
      primaryGoal: patientsTable.primaryGoal,
      startingWeight: patientsTable.startingWeight,
      currentWeight: patientsTable.currentWeight,
      targetWeight: patientsTable.targetWeight,
      createdAt: patientsTable.createdAt,
    }).from(patientsTable)
      .innerJoin(usersTable, eq(patientsTable.userId, usersTable.id))
      .limit(200);

    const rows = await Promise.all(patients.map(buildPatientRow));
    res.json(rows);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// Full patient detail for ops
router.get("/patients/:id/detail", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const [pat] = await db.select().from(patientsTable).where(eq(patientsTable.id, patientId)).limit(1);
    if (!pat) { res.status(404).json({ error: "Patient not found" }); return; }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, pat.userId)).limit(1);

    const checkins = await db.select().from(checkinsTable)
      .where(eq(checkinsTable.patientId, patientId))
      .orderBy(desc(checkinsTable.createdAt)).limit(21);

    const notes = await db.select().from(patientNotesTable)
      .where(eq(patientNotesTable.patientId, patientId))
      .orderBy(desc(patientNotesTable.createdAt)).limit(15);

    const [plan] = await db.select().from(patientPlansTable)
      .where(eq(patientPlansTable.patientId, patientId)).limit(1);

    const metrics = await db.select().from(metricsTable)
      .where(eq(metricsTable.patientId, patientId))
      .orderBy(desc(metricsTable.createdAt)).limit(14);

    const appointments = await db.select().from(appointmentsTable)
      .where(eq(appointmentsTable.patientId, patientId))
      .orderBy(desc(appointmentsTable.scheduledAt)).limit(10);

    const [physician, dietician, caretaker, coach] = await Promise.all([
      getStaffName(pat.assignedPhysicianId),
      getStaffName(pat.assignedDieticianId),
      getStaffName(pat.assignedCaretakerId),
      getStaffName(pat.assignedCoachId),
    ]);

    res.json({
      id: pat.id,
      userId: pat.userId,
      fullName: user?.fullName,
      email: user?.email,
      phone: user?.phone,
      city: user?.city,
      plan: pat.plan,
      status: pat.status,
      riskLevel: pat.riskLevel,
      primaryGoal: pat.primaryGoal,
      weekNumber: pat.weekNumber,
      startingWeight: pat.startingWeight,
      currentWeight: pat.currentWeight,
      targetWeight: pat.targetWeight,
      assignedCoachId: pat.assignedCoachId,
      assignedPhysicianId: pat.assignedPhysicianId,
      assignedDieticianId: pat.assignedDieticianId,
      assignedCaretakerId: pat.assignedCaretakerId,
      assignedPhysician: physician,
      assignedDietician: dietician,
      assignedCaretaker: caretaker,
      assignedCoach: physician ?? coach,
      createdAt: pat.createdAt,
      checkins: checkins.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })),
      notes: notes.map(n => ({ ...n, createdAt: n.createdAt.toISOString() })),
      metrics: metrics.map(m => ({ ...m, createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt })),
      appointments: appointments.map(a => ({ ...a, scheduledAt: a.scheduledAt instanceof Date ? a.scheduledAt.toISOString() : a.scheduledAt })),
      nutritionPlan: plan?.nutritionPlan ?? null,
      activityPlan: plan?.activityPlan ?? null,
      weeklyGoals: plan?.weeklyGoals ?? null,
    });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// Get all staff grouped by role
router.get("/staff", async (req, res) => {
  try {
    const staff = await db.select().from(staffTable).orderBy(staffTable.role, staffTable.id);
    const rows = await Promise.all(staff.map(async (s) => {
      const [{ count: patientCount }] = await db.select({ count: sql<number>`count(*)::int` })
        .from(patientsTable).where(
          or(
            eq(patientsTable.assignedCoachId, s.id),
            eq(patientsTable.assignedPhysicianId, s.id),
            eq(patientsTable.assignedDieticianId, s.id),
            eq(patientsTable.assignedCaretakerId, s.id)
          )!
        );
      return { id: s.id, fullName: s.fullName, email: s.email, role: s.role, specialty: s.specialty, patientCount, createdAt: s.createdAt };
    }));
    res.json(rows);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// Assign care team to patient
router.patch("/patients/:id/assign-team", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const { physicianId, dieticianId, caretakerId } = req.body;

    const updateData: any = {};
    if (physicianId !== undefined) {
      updateData.assignedPhysicianId = physicianId || null;
      // Also update assignedCoachId for backward compat with physician route
      if (physicianId) updateData.assignedCoachId = physicianId;
    }
    if (dieticianId !== undefined) updateData.assignedDieticianId = dieticianId || null;
    if (caretakerId !== undefined) updateData.assignedCaretakerId = caretakerId || null;

    const [patient] = await db.update(patientsTable)
      .set(updateData)
      .where(eq(patientsTable.id, patientId))
      .returning();

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, patient.userId)).limit(1);
    const [physician, dietician, caretaker] = await Promise.all([
      getStaffName(patient.assignedPhysicianId),
      getStaffName(patient.assignedDieticianId),
      getStaffName(patient.assignedCaretakerId),
    ]);

    res.json({
      id: patient.id,
      fullName: user?.fullName,
      assignedPhysician: physician,
      assignedDietician: dietician,
      assignedCaretaker: caretaker,
      assignedPhysicianId: patient.assignedPhysicianId,
      assignedDieticianId: patient.assignedDieticianId,
      assignedCaretakerId: patient.assignedCaretakerId,
    });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// Legacy single assign
router.patch("/patients/:id/assign", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const { coachId } = req.body;
    const [patient] = await db.update(patientsTable)
      .set({ assignedCoachId: coachId, assignedPhysicianId: coachId || null })
      .where(eq(patientsTable.id, patientId)).returning();
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, patient.userId)).limit(1);
    const coachName = await getStaffName(coachId);
    res.json({ id: patient.id, fullName: user.fullName, assignedCoach: coachName, plan: patient.plan, status: patient.status, riskLevel: patient.riskLevel });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

router.patch("/patients/:id/escalate", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const [patient] = await db.update(patientsTable)
      .set({ riskLevel: "high" }).where(eq(patientsTable.id, patientId)).returning();
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, patient.userId)).limit(1);
    res.json({ id: patient.id, fullName: user.fullName, riskLevel: patient.riskLevel, escalated: true });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

router.patch("/patients/:id/deescalate", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const [patient] = await db.update(patientsTable)
      .set({ riskLevel: "low" }).where(eq(patientsTable.id, patientId)).returning();
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, patient.userId)).limit(1);
    res.json({ id: patient.id, fullName: user.fullName, riskLevel: patient.riskLevel, escalated: false });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// Notes endpoint for ops
router.post("/patients/:id/notes", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const parsed = parseToken(req.headers.authorization);
    const { content, category } = req.body;
    if (!content) { res.status(400).json({ error: "Content required" }); return; }
    const [note] = await db.insert(patientNotesTable).values({
      patientId, coachId: parsed?.userId ?? null, content, category: category ?? "ops",
    }).returning();
    res.status(201).json({ ...note, createdAt: note.createdAt.toISOString() });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/ops/pending-approvals — list patients with pending_approval status
router.get("/pending-approvals", async (req, res) => {
  try {
    const auth = await requireOps(req, res); if (!auth) return;
    const rows = await db.select({
      patientId: patientsTable.id,
      userId: patientsTable.userId,
      fullName: usersTable.fullName,
      email: usersTable.email,
      phone: usersTable.phone,
      city: usersTable.city,
      plan: patientsTable.plan,
      primaryGoal: patientsTable.primaryGoal,
      preferredCallbackTime: patientsTable.preferredCallbackTime,
      createdAt: patientsTable.createdAt,
      status: patientsTable.status,
    }).from(patientsTable)
      .innerJoin(usersTable, eq(patientsTable.userId, usersTable.id))
      .where(eq(patientsTable.status, "pending_approval"))
      .orderBy(desc(patientsTable.createdAt));
    res.json(rows.map(r => ({
      ...r,
      id: r.patientId,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    })));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/ops/patients/:id/approve — approve a pending patient
router.post("/patients/:id/approve", async (req, res) => {
  try {
    const auth = await requireOps(req, res); if (!auth) return;
    const patientId = parseInt(req.params.id);
    if (Number.isNaN(patientId)) { res.status(400).json({ error: "Invalid patient id" }); return; }
    await db.update(patientsTable).set({ status: "active" }).where(eq(patientsTable.id, patientId));
    res.json({ ok: true, message: "Patient approved and activated" });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/ops/patients/:id/reject — reject a pending patient application
router.post("/patients/:id/reject", async (req, res) => {
  try {
    const auth = await requireOps(req, res); if (!auth) return;
    const patientId = parseInt(req.params.id);
    if (Number.isNaN(patientId)) { res.status(400).json({ error: "Invalid patient id" }); return; }
    await db.update(patientsTable).set({ status: "rejected" }).where(eq(patientsTable.id, patientId));
    res.json({ ok: true, message: "Patient application rejected" });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/ops/leads — list all inbound leads
router.get("/leads", async (req, res) => {
  try {
    const rows = await db.select().from(leadsTable).orderBy(desc(leadsTable.createdAt)).limit(500);
    res.json(rows.map(l => ({
      ...l,
      createdAt: l.createdAt instanceof Date ? l.createdAt.toISOString() : l.createdAt,
    })));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/ops/patients/:id/dashboard — full patient dashboard data
router.get("/patients/:id/dashboard", async (req, res) => {
  try {
    const auth = await requireOps(req, res);
    if (!auth) return;
    const patientId = parseInt(req.params.id);
    if (Number.isNaN(patientId)) { res.status(400).json({ error: "Invalid patient id" }); return; }

    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, patientId)).limit(1);
    if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, patient.userId)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    async function loadStaff2(id: number | null | undefined) {
      if (!id) return null;
      const [s] = await db.select().from(staffTable).where(eq(staffTable.id, id)).limit(1);
      return s ? { name: s.fullName, role: s.role } : null;
    }
    const [physician, dietician, caretaker] = await Promise.all([
      loadStaff2(patient.assignedPhysicianId),
      loadStaff2(patient.assignedDieticianId),
      loadStaff2(patient.assignedCaretakerId ?? patient.assignedCoachId),
    ]);

    const allMetrics = await db.select().from(metricsTable)
      .where(eq(metricsTable.patientId, patient.id))
      .orderBy(asc(metricsTable.createdAt)).limit(200);

    const weightSeries = allMetrics.filter(m => m.type === "weight").map(m => ({ date: m.date, value: m.value }));
    const glucoseSeries = allMetrics.filter(m => m.type === "glucose").map(m => ({ date: m.date, value: m.value }));

    const allCheckins = await db.select().from(checkinsTable)
      .where(eq(checkinsTable.patientId, patient.id))
      .orderBy(desc(checkinsTable.createdAt)).limit(30);
    const [{ count: totalCheckinsRow }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(checkinsTable).where(eq(checkinsTable.patientId, patient.id));
    const totalCheckins = Number(totalCheckinsRow ?? 0);

    const energyMap: Record<string, number> = { high: 3, good: 3, moderate: 2, medium: 2, low: 1, tired: 1 };
    const recent7 = [...allCheckins].slice(0, 7).reverse();
    const energySeries = recent7.map(c => ({
      date: c.createdAt.toISOString().slice(0, 10),
      dow: new Date(c.createdAt).toLocaleDateString("en-US", { weekday: "short" }),
      value: energyMap[c.energyLevel?.toLowerCase()] ?? 2,
      label: c.energyLevel,
    }));

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString().slice(0, 10);
    const adherence7Day: Array<{ date: string; dow: string; completed: boolean | null }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const dow = d.toLocaleDateString("en-US", { weekday: "short" });
      const ci = allCheckins.find(c => c.createdAt.toISOString().slice(0, 10) === iso);
      adherence7Day.push({ date: iso, dow, completed: ci ? ci.mealsFollowed === "yes" : null });
    }
    const completedCount = adherence7Day.filter(d => d.completed === true).length;
    const dataCount = adherence7Day.filter(d => d.completed !== null).length;
    const adherencePct = dataCount > 0 ? Math.round((completedCount / 7) * 100) : null;

    const last7 = allCheckins.slice(0, 7);
    const consistencyBreakdown = last7.length === 0 ? null : {
      mealLogging: Math.round((last7.filter(c => c.mealsFollowed === "yes" || c.mealsFollowed === "mostly").length / 7) * 100),
      checkIns: Math.round((last7.length / 7) * 100),
      activity: Math.round((last7.filter(c => c.activityCompleted).length / 7) * 100),
    };

    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      if (allCheckins.find(c => c.createdAt.toISOString().slice(0, 10) === iso)) streak++;
      else if (i > 0) break;
    }
    const checkinDoneToday = allCheckins.some(c => c.createdAt.toISOString().slice(0, 10) === todayIso);
    const weightChange = weightSeries.length >= 2
      ? +(weightSeries[weightSeries.length - 1].value - weightSeries[0].value).toFixed(1) : null;
    const last7Glucose = glucoseSeries.slice(-7).map(g => g.value);
    const avgGlucose = last7Glucose.length > 0 ? Math.round(last7Glucose.reduce((a, b) => a + b, 0) / last7Glucose.length) : null;
    const timeInRange = last7Glucose.length > 0
      ? Math.round((last7Glucose.filter(g => g >= 80 && g <= 140).length / last7Glucose.length) * 100) : null;

    const upcoming = await db.select().from(appointmentsTable)
      .where(and(eq(appointmentsTable.patientId, patient.id), eq(appointmentsTable.status, "upcoming"), gte(appointmentsTable.scheduledAt, new Date())))
      .orderBy(asc(appointmentsTable.scheduledAt)).limit(1);
    const nextAppointment = upcoming[0] ? { ...upcoming[0], scheduledAt: upcoming[0].scheduledAt.toISOString(), createdAt: upcoming[0].createdAt.toISOString() } : null;

    const [planRow] = await db.select().from(patientPlansTable).where(eq(patientPlansTable.patientId, patient.id)).limit(1);
    const carePlan = planRow ? { nutritionPlan: planRow.nutritionPlan, activityPlan: planRow.activityPlan, weeklyGoals: planRow.weeklyGoals } : null;

    const hasEnoughData = allCheckins.length >= 5;

    // Ops content — fetch most recent ops_content note for this patient
    const [opsNote] = await db.select().from(patientNotesTable)
      .where(and(eq(patientNotesTable.patientId, patient.id), eq(patientNotesTable.category, "ops_content")))
      .orderBy(desc(patientNotesTable.createdAt)).limit(1);
    let opsContent: any = null;
    if (opsNote) {
      try { opsContent = JSON.parse(opsNote.content); } catch { opsContent = null; }
    }

    res.json({
      patient: { id: patient.id, fullName: user.fullName, phone: user.phone, email: user.email ?? null, city: user.city ?? "", primaryGoal: patient.primaryGoal, plan: patient.plan, weekNumber: patient.weekNumber, startingWeight: patient.startingWeight ?? null, currentWeight: patient.currentWeight ?? null, targetWeight: patient.targetWeight ?? null },
      careTeam: { physician, dietician, caretaker },
      careAssigned: Boolean(physician || dietician || caretaker),
      weekNumber: patient.weekNumber,
      weightSeries, glucoseSeries, energySeries,
      adherence7Day, adherencePct, consistencyBreakdown,
      streak, checkinDoneToday, weightChange, avgGlucose, timeInRange,
      nextAppointment, carePlan, opsContent, hasEnoughData, totalCheckins,
    });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/ops/patients/:id/content
router.get("/patients/:id/content", async (req, res) => {
  try {
    const auth = await requireOps(req, res); if (!auth) return;
    const patientId = parseInt(req.params.id);
    const [note] = await db.select().from(patientNotesTable)
      .where(and(eq(patientNotesTable.patientId, patientId), eq(patientNotesTable.category, "ops_content")))
      .orderBy(desc(patientNotesTable.createdAt)).limit(1);
    if (!note) { res.json(null); return; }
    try { res.json(JSON.parse(note.content)); } catch { res.json(null); }
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/ops/patients/:id/content
router.post("/patients/:id/content", async (req, res) => {
  try {
    const auth = await requireOps(req, res); if (!auth) return;
    const patientId = parseInt(req.params.id);
    const content = req.body;
    const existing = await db.select({ id: patientNotesTable.id }).from(patientNotesTable)
      .where(and(eq(patientNotesTable.patientId, patientId), eq(patientNotesTable.category, "ops_content")));
    for (const row of existing) {
      await db.delete(patientNotesTable).where(eq(patientNotesTable.id, row.id));
    }
    await db.insert(patientNotesTable).values({
      patientId, coachId: auth.staffId,
      content: JSON.stringify(content),
      category: "ops_content",
    });
    res.json({ ok: true });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// PATCH /api/ops/patients/:id/plan
router.patch("/patients/:id/plan", async (req, res) => {
  try {
    const auth = await requireOps(req, res); if (!auth) return;
    const patientId = parseInt(req.params.id);
    const { nutritionPlan, activityPlan, weeklyGoals } = req.body;
    const [existing] = await db.select().from(patientPlansTable).where(eq(patientPlansTable.patientId, patientId)).limit(1);
    if (existing) {
      await db.update(patientPlansTable).set({ nutritionPlan, activityPlan, weeklyGoals }).where(eq(patientPlansTable.patientId, patientId));
    } else {
      await db.insert(patientPlansTable).values({ patientId, nutritionPlan, activityPlan, weeklyGoals });
    }
    res.json({ ok: true });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/ops/patients/:id/appointments — schedule appointment for a patient
router.post("/patients/:id/appointments", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    if (Number.isNaN(patientId)) { res.status(400).json({ error: "Invalid patient id" }); return; }
    const { careTeamMember, role, scheduledAt, notes } = req.body;
    if (!careTeamMember || !scheduledAt) {
      res.status(400).json({ error: "careTeamMember and scheduledAt are required" }); return;
    }
    const [appt] = await db.insert(appointmentsTable).values({
      patientId,
      careTeamMember,
      role: role ?? "physician",
      scheduledAt: new Date(scheduledAt),
      status: "upcoming",
      notes: notes ?? null,
    }).returning();
    res.status(201).json({
      ...appt,
      scheduledAt: appt.scheduledAt.toISOString(),
      createdAt: appt.createdAt.toISOString(),
    });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

export default router;
