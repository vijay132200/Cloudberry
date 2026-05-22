import { Router } from "express";
import { db } from "@workspace/db";
import { appointmentsTable, patientsTable, patientNotesTable, usersTable } from "@workspace/db";
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
      .limit(20);
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
    const { careTeamMember, role, preferredDate, notes } = req.body;
    const [appt] = await db.insert(appointmentsTable).values({
      patientId: patient.id,
      careTeamMember: careTeamMember ?? "Care Team",
      role: role ?? "coach",
      scheduledAt: new Date(preferredDate),
      status: "requested",
      notes: notes ?? null,
    }).returning();
    res.status(201).json({ ...appt, scheduledAt: appt.scheduledAt.toISOString(), createdAt: appt.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

async function ownedAppointmentId(req: any, idStr: string) {
  const parsed = parseToken(req.headers.authorization);
  if (!parsed) return { error: 401 as const };
  const id = parseInt(idStr);
  if (Number.isNaN(id)) return { error: 400 as const };
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.userId, parsed.userId)).limit(1);
  if (!patient) return { error: 404 as const };
  const [existing] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, id)).limit(1);
  if (!existing) return { error: 404 as const };
  if (existing.patientId !== patient.id) return { error: 403 as const };
  return { id, patientId: patient.id };
}

router.patch("/:id/reschedule", async (req, res) => {
  try {
    const owned = await ownedAppointmentId(req, req.params.id);
    if ("error" in owned) { res.status(owned.error as number).json({ error: "Not allowed" }); return; }
    const { newDate, reason } = req.body ?? {};
    if (!newDate) { res.status(400).json({ error: "newDate required" }); return; }
    const [appt] = await db.update(appointmentsTable)
      .set({
        scheduledAt: new Date(newDate),
        status: "reschedule_requested",
        ...(reason ? { notes: `Reschedule requested: ${reason}` } : {}),
      })
      .where(eq(appointmentsTable.id, owned.id))
      .returning();
    if (!appt) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...appt, scheduledAt: appt.scheduledAt.toISOString(), createdAt: appt.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id/cancel", async (req, res) => {
  try {
    const owned = await ownedAppointmentId(req, req.params.id);
    if ("error" in owned) { res.status(owned.error as number).json({ error: "Not allowed" }); return; }
    const [appt] = await db.update(appointmentsTable)
      .set({ status: "cancelled" })
      .where(eq(appointmentsTable.id, owned.id))
      .returning();
    if (!appt) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...appt, scheduledAt: appt.scheduledAt.toISOString(), createdAt: appt.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Support tickets — stored as patient_notes with category='ticket'
router.post("/tickets", async (req, res) => {
  try {
    const parsed = parseToken(req.headers.authorization);
    if (!parsed) { res.status(401).json({ error: "Unauthorized" }); return; }
    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.userId, parsed.userId)).limit(1);
    if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }
    const { subject, message } = req.body ?? {};
    if (!message?.trim()) { res.status(400).json({ error: "Message required" }); return; }
    const [note] = await db.insert(patientNotesTable).values({
      patientId: patient.id,
      coachId: parsed.userId,
      content: `[${subject ?? "General"}] ${message}`,
      category: "ticket",
    }).returning();
    res.status(201).json({ ...note, createdAt: note.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
