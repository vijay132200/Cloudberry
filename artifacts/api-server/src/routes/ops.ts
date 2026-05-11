import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, patientsTable, checkinsTable, leadsTable, staffTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

router.get("/dashboard", async (req, res) => {
  try {
    const [{ count: activePatients }] = await db.select({ count: sql<number>`count(*)::int` })
      .from(patientsTable).where(eq(patientsTable.status, "active"));

    const [{ count: highRiskCount }] = await db.select({ count: sql<number>`count(*)::int` })
      .from(patientsTable).where(eq(patientsTable.riskLevel, "high"));

    const [{ count: totalLeads }] = await db.select({ count: sql<number>`count(*)::int` }).from(leadsTable);

    const allPatients = await db.select({ id: patientsTable.id }).from(patientsTable);
    let totalAdherence = 0;
    let missedCheckins = 0;

    for (const p of allPatients.slice(0, 20)) {
      const checkins = await db.select().from(checkinsTable)
        .where(eq(checkinsTable.patientId, p.id)).limit(7);
      if (checkins.length === 0) {
        missedCheckins++;
      } else {
        const pct = checkins.filter(c => c.mealsFollowed === "yes").length / checkins.length;
        totalAdherence += pct * 100;
      }
    }

    const dailyAdherencePct = allPatients.length > 0
      ? Math.round(totalAdherence / Math.min(allPatients.length, 20))
      : 0;

    res.json({
      activePatients,
      dailyAdherencePct,
      missedCheckins,
      highRiskCount,
      upcomingAppointments: 8,
      escalationsPending: highRiskCount,
      totalLeads,
      conversionRate: totalLeads > 0 ? Math.round((activePatients / totalLeads) * 100) : 0,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
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
      fullName: usersTable.fullName,
    })
      .from(patientsTable)
      .innerJoin(usersTable, eq(patientsTable.userId, usersTable.id))
      .limit(100);

    const rows = await Promise.all(patients.map(async (p) => {
      const [lastCheckin] = await db.select().from(checkinsTable)
        .where(eq(checkinsTable.patientId, p.patientId))
        .orderBy(desc(checkinsTable.createdAt))
        .limit(1);
      const checkins = await db.select().from(checkinsTable)
        .where(eq(checkinsTable.patientId, p.patientId))
        .limit(14);
      const adherencePct = checkins.length > 0
        ? Math.round((checkins.filter(c => c.mealsFollowed === "yes").length / checkins.length) * 100)
        : 0;

      let assignedCoach: string | null = null;
      if (p.assignedCoachId) {
        const [coach] = await db.select().from(staffTable).where(eq(staffTable.id, p.assignedCoachId)).limit(1);
        assignedCoach = coach?.fullName ?? null;
      }

      return {
        id: p.patientId,
        fullName: p.fullName,
        plan: p.plan,
        status: p.status,
        riskLevel: p.riskLevel,
        adherencePct,
        weekNumber: p.weekNumber,
        lastCheckinAt: lastCheckin?.createdAt.toISOString() ?? null,
        assignedCoach,
        escalated: p.riskLevel === "high",
      };
    }));
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/patients/:id/assign", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const { coachId } = req.body;
    const [patient] = await db.update(patientsTable)
      .set({ assignedCoachId: coachId })
      .where(eq(patientsTable.id, patientId))
      .returning();
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, patient.userId)).limit(1);
    res.json({
      id: patient.id,
      fullName: user.fullName,
      plan: patient.plan,
      status: patient.status,
      riskLevel: patient.riskLevel,
      adherencePct: 0,
      weekNumber: patient.weekNumber,
      lastCheckinAt: null,
      assignedCoach: null,
      escalated: patient.riskLevel === "high",
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/patients/:id/escalate", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const [patient] = await db.update(patientsTable)
      .set({ riskLevel: "high" })
      .where(eq(patientsTable.id, patientId))
      .returning();
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, patient.userId)).limit(1);
    res.json({
      id: patient.id,
      fullName: user.fullName,
      plan: patient.plan,
      status: patient.status,
      riskLevel: patient.riskLevel,
      adherencePct: 0,
      weekNumber: patient.weekNumber,
      lastCheckinAt: null,
      assignedCoach: null,
      escalated: true,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
