import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, staffTable, patientsTable, checkinsTable, patientNotesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

function parseToken(h: string | undefined) {
  if (!h) return null;
  try { return JSON.parse(Buffer.from(h.replace("Bearer ", ""), "base64").toString("utf-8")); } catch { return null; }
}

async function requireCaretaker(req: any, res: any) {
  const parsed = parseToken(req.headers.authorization);
  if (!parsed) { res.status(401).json({ error: "Unauthorized" }); return null; }
  const [staff] = await db.select().from(staffTable).where(eq(staffTable.id, parsed.userId)).limit(1);
  if (!staff || staff.role !== "caretaker") { res.status(403).json({ error: "Forbidden" }); return null; }
  return { staffId: staff.id, fullName: staff.fullName };
}

router.get("/me", async (req, res) => {
  try {
    const parsed = parseToken(req.headers.authorization);
    if (!parsed) { res.status(401).json({ error: "Unauthorized" }); return; }
    const [staff] = await db.select().from(staffTable).where(eq(staffTable.id, parsed.userId)).limit(1);
    if (!staff || staff.role !== "caretaker") { res.status(403).json({ error: "Forbidden" }); return; }
    res.json({ id: staff.id, fullName: staff.fullName, email: staff.email, specialty: staff.specialty, role: staff.role });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

router.get("/patients", async (req, res) => {
  try {
    const auth = await requireCaretaker(req, res);
    if (!auth) return;
    const allPatients = await db.select().from(patientsTable).where(eq(patientsTable.status, "active"));
    const result = await Promise.all(allPatients.map(async (p) => {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, p.userId)).limit(1);
      const recentCheckins = await db.select().from(checkinsTable).where(eq(checkinsTable.patientId, p.id)).orderBy(desc(checkinsTable.createdAt)).limit(7);
      // Map to Mon-Sun adherence array (last 7 days)
      const adherenceMap: boolean[] = Array(7).fill(false);
      recentCheckins.slice(0, 7).forEach((c, i) => { adherenceMap[6 - i] = true; });
      const consistencyPct = recentCheckins.length > 0 ? Math.round((recentCheckins.length / 7) * 100) : 0;
      const lastCheckin = recentCheckins[0];
      return {
        id: p.id, fullName: user?.fullName, phone: user?.phone, email: user?.email, city: user?.city,
        plan: p.plan, primaryGoal: p.primaryGoal, weekNumber: p.weekNumber,
        status: p.status, riskLevel: p.riskLevel, consistencyPct, streak: recentCheckins.length,
        adherenceMap, lastCheckinAt: lastCheckin?.createdAt?.toISOString() ?? null,
        lastMood: lastCheckin?.mood ?? null, lastEnergy: lastCheckin?.energyLevel ?? null,
        checkedInToday: lastCheckin ? new Date(lastCheckin.createdAt).toDateString() === new Date().toDateString() : false,
      };
    }));
    res.json(result);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

router.post("/patients/:id/conversation", async (req, res) => {
  try {
    const auth = await requireCaretaker(req, res);
    if (!auth) return;
    const { content } = req.body;
    const [note] = await db.insert(patientNotesTable).values({
      patientId: parseInt(req.params.id), coachId: auth.staffId,
      content, category: "whatsapp_conversation",
    }).returning();
    res.status(201).json({ ...note, createdAt: note.createdAt.toISOString() });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

router.get("/patients/:id/conversations", async (req, res) => {
  try {
    const auth = await requireCaretaker(req, res);
    if (!auth) return;
    const notes = await db.select().from(patientNotesTable)
      .where(eq(patientNotesTable.patientId, parseInt(req.params.id)))
      .orderBy(desc(patientNotesTable.createdAt)).limit(20);
    res.json(notes.filter(n => n.category === "whatsapp_conversation").map(n => ({ ...n, createdAt: n.createdAt.toISOString() })));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

export default router;
