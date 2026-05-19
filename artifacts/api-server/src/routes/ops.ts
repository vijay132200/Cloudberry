import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, patientsTable, checkinsTable, leadsTable, staffTable, appointmentsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

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
    let newThisMonth = 0;

    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

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

    const dailyAdherencePct = allPatients.length > 0
      ? Math.round(totalAdherence / allPatients.length)
      : 0;

    res.json({
      activePatients,
      dailyAdherencePct,
      missedCheckins,
      highRiskCount,
      upcomingAppointments: upcomingAppts,
      escalationsPending: highRiskCount,
      totalLeads,
      totalStaff,
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
      email: usersTable.email,
      phone: usersTable.phone,
      city: usersTable.city,
      primaryGoal: patientsTable.primaryGoal,
      startingWeight: patientsTable.startingWeight,
      currentWeight: patientsTable.currentWeight,
      targetWeight: patientsTable.targetWeight,
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
        .orderBy(desc(checkinsTable.createdAt))
        .limit(14);

      const adherencePct = checkins.length > 0
        ? Math.round((checkins.filter(c => c.mealsFollowed === "yes").length / checkins.length) * 100)
        : 0;

      const streak = (() => {
        if (!checkins.length) return 0;
        let s = 0;
        for (const c of checkins) {
          if (c.activityCompleted) s++;
          else break;
        }
        return s;
      })();

      let assignedCoach: string | null = null;
      if (p.assignedCoachId) {
        const [coach] = await db.select().from(staffTable).where(eq(staffTable.id, p.assignedCoachId)).limit(1);
        assignedCoach = coach?.fullName ?? null;
      }

      const lastCheckinAt = lastCheckin?.createdAt
        ? (() => {
            const diff = Date.now() - new Date(lastCheckin.createdAt).getTime();
            const hours = Math.floor(diff / 3600000);
            if (hours < 1) return "Just now";
            if (hours < 24) return `${hours}h ago`;
            const days = Math.floor(hours / 24);
            if (days === 1) return "Yesterday";
            return `${days} days ago`;
          })()
        : "Never";

      return {
        id: p.patientId,
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
        assignedCoach,
        assignedCoachId: p.assignedCoachId,
        escalated: p.riskLevel === "high",
        streak,
        primaryGoal: p.primaryGoal,
        startingWeight: p.startingWeight,
        currentWeight: p.currentWeight,
        targetWeight: p.targetWeight,
        totalCheckins: checkins.length,
      };
    }));

    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/staff", async (req, res) => {
  try {
    const staff = await db.select().from(staffTable).orderBy(staffTable.role, staffTable.id);
    const rows = await Promise.all(staff.map(async (s) => {
      const [{ count: patientCount }] = await db.select({ count: sql<number>`count(*)::int` })
        .from(patientsTable).where(eq(patientsTable.assignedCoachId, s.id));
      return {
        id: s.id,
        fullName: s.fullName,
        email: s.email,
        role: s.role,
        specialty: s.specialty,
        patientCount,
        createdAt: s.createdAt,
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
    let coachName: string | null = null;
    if (coachId) {
      const [coach] = await db.select().from(staffTable).where(eq(staffTable.id, coachId)).limit(1);
      coachName = coach?.fullName ?? null;
    }
    res.json({ id: patient.id, fullName: user.fullName, assignedCoach: coachName, plan: patient.plan, status: patient.status, riskLevel: patient.riskLevel, weekNumber: patient.weekNumber, escalated: patient.riskLevel === "high" });
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
    res.json({ id: patient.id, fullName: user.fullName, plan: patient.plan, status: patient.status, riskLevel: patient.riskLevel, weekNumber: patient.weekNumber, escalated: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
