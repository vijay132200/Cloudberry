import { Router } from "express";
import { db } from "@workspace/db";
import {
  clinicalNotesTable, clinicalNoteVersionsTable,
  criticalNotesTable, criticalNoteVersionsTable,
  escalationsTable, escalationAuditLogTable, opsEscalationLogTable,
  dietPlansTable, checkinsTable, metricsTable, appointmentsTable,
  patientNotesTable, staffTable, patientPlansTable, patientPlanHistoryTable,
  patientsTable,
} from "@workspace/db";
import { eq, desc, and, asc, gte, lte, sql } from "drizzle-orm";

export function parseToken(h: string | undefined): { userId: number; role: string } | null {
  if (!h) return null;
  try { return JSON.parse(Buffer.from(h.replace("Bearer ", ""), "base64").toString("utf-8")); } catch { return null; }
}

async function getStaffInfo(id: number) {
  const [s] = await db.select().from(staffTable).where(eq(staffTable.id, id)).limit(1);
  return s ? { id: s.id, fullName: s.fullName, role: s.role } : null;
}

// DB-verified auth — matches existing ops.ts / physician.ts patterns
async function requirePhysicianAuth(req: any, res: any): Promise<{ staffId: number; role: string } | null> {
  const parsed = parseToken(req.headers.authorization);
  if (!parsed || parsed.role !== "physician") { res.status(403).json({ error: "Forbidden: physician only" }); return null; }
  const [staff] = await db.select().from(staffTable).where(eq(staffTable.id, parsed.userId)).limit(1);
  if (!staff || staff.role !== "physician") { res.status(403).json({ error: "Forbidden: physician only" }); return null; }
  return { staffId: staff.id, role: staff.role };
}

async function requireOpsAuth(req: any, res: any): Promise<{ staffId: number; role: string } | null> {
  const parsed = parseToken(req.headers.authorization);
  if (!parsed || parsed.role !== "ops") { res.status(403).json({ error: "Forbidden: ops only" }); return null; }
  const [staff] = await db.select().from(staffTable).where(eq(staffTable.id, parsed.userId)).limit(1);
  if (!staff || staff.role !== "ops") { res.status(403).json({ error: "Forbidden: ops only" }); return null; }
  return { staffId: staff.id, role: staff.role };
}

// ── SHARED QUERY HELPERS ─────────────────────────────────────────────────────

async function getClinicalNotes(patientId: number) {
  const notes = await db.select().from(clinicalNotesTable)
    .where(eq(clinicalNotesTable.patientId, patientId))
    .orderBy(desc(clinicalNotesTable.createdAt)).limit(50);
  return Promise.all(notes.map(async n => {
    const author = await getStaffInfo(n.authorId);
    const versions = await db.select().from(clinicalNoteVersionsTable)
      .where(eq(clinicalNoteVersionsTable.noteId, n.id))
      .orderBy(desc(clinicalNoteVersionsTable.editedAt));
    return {
      ...n, authorName: author?.fullName ?? "Unknown",
      createdAt: n.createdAt.toISOString(), updatedAt: n.updatedAt.toISOString(),
      versions: versions.map(v => ({ ...v, editedAt: v.editedAt.toISOString() })),
    };
  }));
}

async function getCriticalNotes(patientId: number) {
  const notes = await db.select().from(criticalNotesTable)
    .where(eq(criticalNotesTable.patientId, patientId))
    .orderBy(desc(criticalNotesTable.createdAt)).limit(50);
  return Promise.all(notes.map(async n => {
    const author = await getStaffInfo(n.authorId);
    const versions = await db.select().from(criticalNoteVersionsTable)
      .where(eq(criticalNoteVersionsTable.noteId, n.id))
      .orderBy(desc(criticalNoteVersionsTable.editedAt));
    return {
      ...n, authorName: author?.fullName ?? "Unknown", authorRole: n.authorRole,
      createdAt: n.createdAt.toISOString(), updatedAt: n.updatedAt.toISOString(),
      versions: versions.map(v => ({ ...v, editedAt: v.editedAt.toISOString() })),
    };
  }));
}

async function getEscalations(patientId: number) {
  const escs = await db.select().from(escalationsTable)
    .where(eq(escalationsTable.patientId, patientId))
    .orderBy(desc(escalationsTable.createdAt)).limit(50);
  return Promise.all(escs.map(async e => {
    const author = await getStaffInfo(e.authorId);
    const auditLog = await db.select().from(escalationAuditLogTable)
      .where(eq(escalationAuditLogTable.escalationId, e.id))
      .orderBy(asc(escalationAuditLogTable.createdAt));
    const auditWithActors = await Promise.all(auditLog.map(async a => {
      const actor = await getStaffInfo(a.actorId);
      return { ...a, actorName: actor?.fullName ?? "Unknown", createdAt: a.createdAt.toISOString() };
    }));
    return {
      ...e, authorName: author?.fullName ?? "Unknown",
      createdAt: e.createdAt.toISOString(), updatedAt: e.updatedAt.toISOString(),
      auditLog: auditWithActors,
    };
  }));
}

async function getDietPlans(patientId: number) {
  const plans = await db.select().from(dietPlansTable)
    .where(eq(dietPlansTable.patientId, patientId))
    .orderBy(desc(dietPlansTable.version)).limit(20);
  return Promise.all(plans.map(async p => {
    const author = await getStaffInfo(p.authorId);
    return { ...p, pdfData: undefined, authorName: author?.fullName ?? "Unknown", createdAt: p.createdAt.toISOString() };
  }));
}

async function getRecords(patientId: number, from?: string, to?: string) {
  const ciConditions: any[] = [eq(checkinsTable.patientId, patientId)];
  if (from) ciConditions.push(gte(checkinsTable.createdAt, new Date(from)));
  if (to) ciConditions.push(lte(checkinsTable.createdAt, new Date(to)));
  const checkins = await db.select().from(checkinsTable)
    .where(and(...ciConditions)).orderBy(desc(checkinsTable.createdAt)).limit(200);

  const mConditions: any[] = [eq(metricsTable.patientId, patientId)];
  if (from) mConditions.push(gte(metricsTable.createdAt, new Date(from)));
  if (to) mConditions.push(lte(metricsTable.createdAt, new Date(to)));
  const metrics = await db.select().from(metricsTable)
    .where(and(...mConditions)).orderBy(asc(metricsTable.createdAt)).limit(500);

  const weightSeries = metrics.filter(m => m.type === "weight").map(m => ({ date: m.date, value: m.value }));
  const glucoseSeries = metrics.filter(m => m.type === "glucose" || m.type === "glucose_fasting").map(m => ({ date: m.date, value: m.value }));
  const sleepSeries = metrics.filter(m => m.type === "sleep_hours").map(m => ({ date: m.date, value: m.value }));

  const totalCheckins = checkins.length;
  const adherentCount = checkins.filter(c => c.mealsFollowed === "yes" || c.mealsFollowed === "mostly").length;
  const adherencePct = totalCheckins > 0 ? Math.round((adherentCount / totalCheckins) * 100) : null;
  const activityCount = checkins.filter(c => c.activityCompleted).length;
  const activityPct = totalCheckins > 0 ? Math.round((activityCount / totalCheckins) * 100) : null;
  const avgWeight = weightSeries.length > 0 ? +(weightSeries.reduce((a, b) => a + b.value, 0) / weightSeries.length).toFixed(1) : null;
  const avgGlucose = glucoseSeries.length > 0 ? Math.round(glucoseSeries.reduce((a, b) => a + b.value, 0) / glucoseSeries.length) : null;
  const avgSleep = sleepSeries.length > 0 ? +(sleepSeries.reduce((a, b) => a + b.value, 0) / sleepSeries.length).toFixed(1) : null;

  const sleepAvg = sleepSeries.length > 0 ? Math.round(sleepSeries.reduce((a, b) => a + b.value, 0) / sleepSeries.length * 100 / 8) : null;
  const consistencyBreakdown = totalCheckins > 0 ? {
    mealLogging: adherencePct ?? 0,
    activity: activityPct ?? 0,
    sleep: sleepAvg !== null ? Math.min(100, sleepAvg) : 0,
  } : null;

  return {
    from: from ?? null, to: to ?? null, totalCheckins,
    adherencePct, activityPct, avgWeight, avgGlucose, avgSleep,
    consistencyBreakdown,
    weightSeries, glucoseSeries, sleepSeries,
    checkins: checkins.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })),
  };
}

async function getActivity(patientId: number, from?: string, to?: string, type?: string, author?: string) {
  const events: any[] = [];

  if (!type || type === "checkin" || type === "all") {
    const ciConds: any[] = [eq(checkinsTable.patientId, patientId)];
    if (from) ciConds.push(gte(checkinsTable.createdAt, new Date(from)));
    if (to) ciConds.push(lte(checkinsTable.createdAt, new Date(to)));
    const checkins = await db.select().from(checkinsTable).where(and(...ciConds)).orderBy(desc(checkinsTable.createdAt)).limit(30);
    for (const c of checkins) {
      events.push({ id: `ci-${c.id}`, type: "checkin", title: "Daily Check-in", summary: `Meals: ${c.mealsFollowed} · Energy: ${c.energyLevel}`, content: { ...c, createdAt: c.createdAt.toISOString() }, createdAt: c.createdAt.toISOString(), author: "Patient" });
    }
  }

  if (!type || type === "clinical_note" || type === "all") {
    const cnConds: any[] = [eq(clinicalNotesTable.patientId, patientId)];
    if (from) cnConds.push(gte(clinicalNotesTable.createdAt, new Date(from)));
    if (to) cnConds.push(lte(clinicalNotesTable.createdAt, new Date(to)));
    const cnotes = await db.select().from(clinicalNotesTable).where(and(...cnConds)).orderBy(desc(clinicalNotesTable.createdAt)).limit(20);
    for (const n of cnotes) {
      const a = await getStaffInfo(n.authorId);
      const authorName = a?.fullName ?? "Staff";
      if (author && !authorName.toLowerCase().includes(author.toLowerCase())) continue;
      events.push({ id: `cn-${n.id}`, type: "clinical_note", title: "Clinical Note", summary: n.content.slice(0, 100), content: { ...n, createdAt: n.createdAt.toISOString(), updatedAt: n.updatedAt.toISOString() }, createdAt: n.createdAt.toISOString(), author: authorName });
    }
  }

  if (!type || type === "critical_note" || type === "all") {
    const crConds: any[] = [eq(criticalNotesTable.patientId, patientId)];
    if (from) crConds.push(gte(criticalNotesTable.createdAt, new Date(from)));
    if (to) crConds.push(lte(criticalNotesTable.createdAt, new Date(to)));
    const crnotes = await db.select().from(criticalNotesTable).where(and(...crConds)).orderBy(desc(criticalNotesTable.createdAt)).limit(20);
    for (const n of crnotes) {
      const a = await getStaffInfo(n.authorId);
      const authorName = a?.fullName ?? "Staff";
      if (author && !authorName.toLowerCase().includes(author.toLowerCase())) continue;
      events.push({ id: `crn-${n.id}`, type: "critical_note", title: "Critical Note", summary: n.content.slice(0, 100), content: { ...n, createdAt: n.createdAt.toISOString(), updatedAt: n.updatedAt.toISOString() }, createdAt: n.createdAt.toISOString(), author: authorName });
    }
  }

  if (!type || type === "escalation" || type === "all") {
    const escConds: any[] = [eq(escalationsTable.patientId, patientId)];
    if (from) escConds.push(gte(escalationsTable.createdAt, new Date(from)));
    if (to) escConds.push(lte(escalationsTable.createdAt, new Date(to)));
    const escs = await db.select().from(escalationsTable).where(and(...escConds)).orderBy(desc(escalationsTable.createdAt)).limit(20);
    for (const e of escs) {
      const a = await getStaffInfo(e.authorId);
      const authorName = a?.fullName ?? "Staff";
      if (author && !authorName.toLowerCase().includes(author.toLowerCase())) continue;
      events.push({ id: `esc-${e.id}`, type: "escalation", title: `Escalation: ${e.title}`, summary: `${e.category} · ${e.status}`, content: { ...e, createdAt: e.createdAt.toISOString(), updatedAt: e.updatedAt.toISOString() }, createdAt: e.createdAt.toISOString(), author: authorName });
    }
  }

  if (!type || type === "appointment" || type === "all") {
    const appts = await db.select().from(appointmentsTable).where(eq(appointmentsTable.patientId, patientId)).orderBy(desc(appointmentsTable.scheduledAt)).limit(10);
    for (const a of appts) {
      if (from && a.scheduledAt < new Date(from)) continue;
      if (to && a.scheduledAt > new Date(to)) continue;
      events.push({ id: `appt-${a.id}`, type: "appointment", title: "Appointment", summary: `with ${a.careTeamMember} · ${a.status}`, content: { ...a, scheduledAt: a.scheduledAt.toISOString(), createdAt: a.createdAt.toISOString() }, createdAt: a.scheduledAt.toISOString(), author: a.careTeamMember });
    }
  }

  if (!type || type === "diet_plan" || type === "all") {
    const dplans = await db.select().from(dietPlansTable).where(eq(dietPlansTable.patientId, patientId)).orderBy(desc(dietPlansTable.createdAt)).limit(10);
    for (const p of dplans) {
      if (from && p.createdAt < new Date(from)) continue;
      if (to && p.createdAt > new Date(to)) continue;
      const a = await getStaffInfo(p.authorId);
      const authorName = a?.fullName ?? "Staff";
      if (author && !authorName.toLowerCase().includes(author.toLowerCase())) continue;
      events.push({ id: `dp-${p.id}`, type: "diet_plan", title: `Diet Plan v${p.version}: ${p.title}`, summary: p.content.slice(0, 100), content: { ...p, pdfData: undefined, createdAt: p.createdAt.toISOString() }, createdAt: p.createdAt.toISOString(), author: authorName });
    }
  }

  if (!type || type === "note" || type === "all") {
    const notes = await db.select().from(patientNotesTable).where(eq(patientNotesTable.patientId, patientId)).orderBy(desc(patientNotesTable.createdAt)).limit(10);
    for (const n of notes) {
      if (from && n.createdAt < new Date(from)) continue;
      if (to && n.createdAt > new Date(to)) continue;
      events.push({ id: `note-${n.id}`, type: "note", title: "Care Note", summary: n.content.slice(0, 100), content: { ...n, createdAt: n.createdAt.toISOString() }, createdAt: n.createdAt.toISOString(), author: "Care Team" });
    }
  }

  // Metric entries — weight, glucose, sleep recordings
  if (!type || type === "metric" || type === "all") {
    const mConds: any[] = [eq(metricsTable.patientId, patientId)];
    if (from) mConds.push(gte(metricsTable.createdAt, new Date(from)));
    if (to) mConds.push(lte(metricsTable.createdAt, new Date(to)));
    const metrics = await db.select().from(metricsTable).where(and(...mConds)).orderBy(desc(metricsTable.createdAt)).limit(50);
    for (const m of metrics) {
      const label = m.type === "weight" ? `${m.value} kg` : m.type === "glucose" || m.type === "glucose_fasting" ? `${m.value} mg/dL` : m.type === "sleep_hours" ? `${m.value} hrs` : `${m.value}`;
      events.push({ id: `metric-${m.id}`, type: "metric", title: `Metric: ${m.type.replace(/_/g, " ")}`, summary: label, content: { ...m, createdAt: m.createdAt.toISOString() }, createdAt: m.createdAt.toISOString(), author: "Patient" });
    }
  }

  // Care plan edits — from patientPlanHistoryTable (snapshots before each physician edit)
  if (!type || type === "care_plan" || type === "all") {
    const planHistory = await db.select().from(patientPlanHistoryTable).where(eq(patientPlanHistoryTable.patientId, patientId)).orderBy(desc(patientPlanHistoryTable.editedAt)).limit(20);
    for (const h of planHistory) {
      if (from && h.editedAt < new Date(from)) continue;
      if (to && h.editedAt > new Date(to)) continue;
      const a = await getStaffInfo(h.editedById);
      const authorName = a?.fullName ?? "Physician";
      if (author && !authorName.toLowerCase().includes(author.toLowerCase())) continue;
      const parts: string[] = [];
      if (h.nutritionPlan) parts.push("Nutrition");
      if (h.activityPlan) parts.push("Activity");
      if (h.weeklyGoals) parts.push("Goals");
      events.push({ id: `cp-${h.id}`, type: "care_plan", title: "Care Plan Updated", summary: `Sections: ${parts.join(", ") || "General"}`, content: { ...h, editedAt: h.editedAt.toISOString() }, createdAt: h.editedAt.toISOString(), author: authorName });
    }
  }

  events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return events.slice(0, 100);
}

// ── PATIENT SCOPE GUARD ──────────────────────────────────────────────────────
// Verifies the requesting physician is assigned to the patient (prevents IDOR).
// Returns true if access is allowed; sends 403/404 and returns false if not.
async function verifyPhysicianPatientAccess(patientId: number, staffId: number, res: any): Promise<boolean> {
  const [patient] = await db.select({ id: patientsTable.id, assignedPhysicianId: patientsTable.assignedPhysicianId })
    .from(patientsTable).where(eq(patientsTable.id, patientId)).limit(1);
  if (!patient) { res.status(404).json({ error: "Patient not found" }); return false; }
  if (patient.assignedPhysicianId !== staffId) {
    res.status(403).json({ error: "Forbidden: this patient is not assigned to you" });
    return false;
  }
  return true;
}

// ── PHYSICIAN CLINICAL ROUTER ────────────────────────────────────────────────
// Physician can: write clinical notes, write critical notes, READ escalations (no write), READ diet plans (no upload)
export function buildPhysicianClinicalRouter() {
  const router = Router({ mergeParams: true });

  // Clinical notes — physician can read + write
  router.get("/patients/:id/clinical-notes", async (req, res) => {
    try {
      const auth = await requirePhysicianAuth(req, res); if (!auth) return;
      const patientId = parseInt(req.params.id);
      if (!await verifyPhysicianPatientAccess(patientId, auth.staffId, res)) return;
      res.json(await getClinicalNotes(patientId));
    } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
  });

  router.post("/patients/:id/clinical-notes", async (req, res) => {
    try {
      const auth = await requirePhysicianAuth(req, res); if (!auth) return;
      const patientId = parseInt(req.params.id);
      if (!await verifyPhysicianPatientAccess(patientId, auth.staffId, res)) return;
      const { content, category } = req.body;
      if (!content?.trim()) { res.status(400).json({ error: "Content required" }); return; }
      const [note] = await db.insert(clinicalNotesTable).values({
        patientId, authorId: auth.staffId, authorRole: auth.role,
        content: content.trim(), category: category ?? "general",
      }).returning();
      const author = await getStaffInfo(auth.staffId);
      res.status(201).json({ ...note, authorName: author?.fullName, createdAt: note.createdAt.toISOString(), updatedAt: note.updatedAt.toISOString(), versions: [] });
    } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
  });

  router.patch("/clinical-notes/:noteId", async (req, res) => {
    try {
      const auth = await requirePhysicianAuth(req, res); if (!auth) return;
      const noteId = parseInt(req.params.noteId);
      const { content } = req.body;
      if (!content?.trim()) { res.status(400).json({ error: "Content required" }); return; }
      const [existing] = await db.select().from(clinicalNotesTable).where(eq(clinicalNotesTable.id, noteId)).limit(1);
      if (!existing) { res.status(404).json({ error: "Note not found" }); return; }
      if (!await verifyPhysicianPatientAccess(existing.patientId, auth.staffId, res)) return;
      await db.insert(clinicalNoteVersionsTable).values({ noteId, content: existing.content, editedById: auth.staffId });
      const [updated] = await db.update(clinicalNotesTable).set({ content: content.trim() })
        .where(eq(clinicalNotesTable.id, noteId)).returning();
      res.json({ ...updated, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString() });
    } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
  });

  // Critical notes — physician can read + write
  router.get("/patients/:id/critical-notes", async (req, res) => {
    try {
      const auth = await requirePhysicianAuth(req, res); if (!auth) return;
      const patientId = parseInt(req.params.id);
      if (!await verifyPhysicianPatientAccess(patientId, auth.staffId, res)) return;
      res.json(await getCriticalNotes(patientId));
    } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
  });

  router.post("/patients/:id/critical-notes", async (req, res) => {
    try {
      const auth = await requirePhysicianAuth(req, res); if (!auth) return;
      const patientId = parseInt(req.params.id);
      if (!await verifyPhysicianPatientAccess(patientId, auth.staffId, res)) return;
      const { content } = req.body;
      if (!content?.trim()) { res.status(400).json({ error: "Content required" }); return; }
      const [note] = await db.insert(criticalNotesTable).values({
        patientId, authorId: auth.staffId, authorRole: auth.role, content: content.trim(),
      }).returning();
      const author = await getStaffInfo(auth.staffId);
      res.status(201).json({ ...note, authorName: author?.fullName, createdAt: note.createdAt.toISOString(), updatedAt: note.updatedAt.toISOString(), versions: [] });
    } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
  });

  router.patch("/critical-notes/:noteId", async (req, res) => {
    try {
      const auth = await requirePhysicianAuth(req, res); if (!auth) return;
      const noteId = parseInt(req.params.noteId);
      const { content } = req.body;
      if (!content?.trim()) { res.status(400).json({ error: "Content required" }); return; }
      const [existing] = await db.select().from(criticalNotesTable).where(eq(criticalNotesTable.id, noteId)).limit(1);
      if (!existing) { res.status(404).json({ error: "Note not found" }); return; }
      if (!await verifyPhysicianPatientAccess(existing.patientId, auth.staffId, res)) return;
      await db.insert(criticalNoteVersionsTable).values({ noteId, content: existing.content, editedById: auth.staffId });
      const [updated] = await db.update(criticalNotesTable).set({ content: content.trim() })
        .where(eq(criticalNotesTable.id, noteId)).returning();
      res.json({ ...updated, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString() });
    } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
  });

  // Escalations — physician READ ONLY (no POST/PATCH per spec)
  router.get("/patients/:id/escalations", async (req, res) => {
    try {
      const auth = await requirePhysicianAuth(req, res); if (!auth) return;
      const patientId = parseInt(req.params.id);
      if (!await verifyPhysicianPatientAccess(patientId, auth.staffId, res)) return;
      res.json(await getEscalations(patientId));
    } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
  });

  // Diet plans — physician READ ONLY per spec
  router.get("/patients/:id/diet-plans", async (req, res) => {
    try {
      const auth = await requirePhysicianAuth(req, res); if (!auth) return;
      const patientId = parseInt(req.params.id);
      if (!await verifyPhysicianPatientAccess(patientId, auth.staffId, res)) return;
      res.json(await getDietPlans(patientId));
    } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
  });

  // Historical records
  router.get("/patients/:id/records", async (req, res) => {
    try {
      const auth = await requirePhysicianAuth(req, res); if (!auth) return;
      const patientId = parseInt(req.params.id);
      if (!await verifyPhysicianPatientAccess(patientId, auth.staffId, res)) return;
      const { from, to } = req.query as { from?: string; to?: string };
      res.json(await getRecords(patientId, from, to));
    } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
  });

  // Activity feed with author filter
  router.get("/patients/:id/activity", async (req, res) => {
    try {
      const auth = await requirePhysicianAuth(req, res); if (!auth) return;
      const patientId = parseInt(req.params.id);
      if (!await verifyPhysicianPatientAccess(patientId, auth.staffId, res)) return;
      const { from, to, type, author } = req.query as { from?: string; to?: string; type?: string; author?: string };
      res.json(await getActivity(patientId, from, to, type, author));
    } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
  });

  return router;
}

// ── OPS CLINICAL ROUTER ──────────────────────────────────────────────────────
// Ops can: READ clinical notes, write critical notes, full escalation CRUD, upload diet plans
export function buildOpsClinicalRouter() {
  const router = Router({ mergeParams: true });

  // Clinical notes — ops READ only (physicians write them, ops can view)
  router.get("/patients/:id/clinical-notes", async (req, res) => {
    try {
      const auth = await requireOpsAuth(req, res); if (!auth) return;
      res.json(await getClinicalNotes(parseInt(req.params.id)));
    } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
  });

  // Critical notes — ops can read + write
  router.get("/patients/:id/critical-notes", async (req, res) => {
    try {
      const auth = await requireOpsAuth(req, res); if (!auth) return;
      res.json(await getCriticalNotes(parseInt(req.params.id)));
    } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
  });

  router.post("/patients/:id/critical-notes", async (req, res) => {
    try {
      const auth = await requireOpsAuth(req, res); if (!auth) return;
      const patientId = parseInt(req.params.id);
      const { content } = req.body;
      if (!content?.trim()) { res.status(400).json({ error: "Content required" }); return; }
      const [note] = await db.insert(criticalNotesTable).values({
        patientId, authorId: auth.staffId, authorRole: auth.role, content: content.trim(),
      }).returning();
      const author = await getStaffInfo(auth.staffId);
      res.status(201).json({ ...note, authorName: author?.fullName, createdAt: note.createdAt.toISOString(), updatedAt: note.updatedAt.toISOString(), versions: [] });
    } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
  });

  router.patch("/critical-notes/:noteId", async (req, res) => {
    try {
      const auth = await requireOpsAuth(req, res); if (!auth) return;
      const noteId = parseInt(req.params.noteId);
      const { content } = req.body;
      if (!content?.trim()) { res.status(400).json({ error: "Content required" }); return; }
      const [existing] = await db.select().from(criticalNotesTable).where(eq(criticalNotesTable.id, noteId)).limit(1);
      if (!existing) { res.status(404).json({ error: "Note not found" }); return; }
      await db.insert(criticalNoteVersionsTable).values({ noteId, content: existing.content, editedById: auth.staffId });
      const [updated] = await db.update(criticalNotesTable).set({ content: content.trim() })
        .where(eq(criticalNotesTable.id, noteId)).returning();
      res.json({ ...updated, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString() });
    } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
  });

  // Escalations — ops full CRUD
  router.get("/patients/:id/escalations", async (req, res) => {
    try {
      const auth = await requireOpsAuth(req, res); if (!auth) return;
      res.json(await getEscalations(parseInt(req.params.id)));
    } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
  });

  router.post("/patients/:id/escalations", async (req, res) => {
    try {
      const auth = await requireOpsAuth(req, res); if (!auth) return;
      const patientId = parseInt(req.params.id);
      const { category, title, description } = req.body;
      if (!title?.trim() || !description?.trim()) { res.status(400).json({ error: "Title and description required" }); return; }
      const [esc] = await db.insert(escalationsTable).values({
        patientId, authorId: auth.staffId,
        category: category ?? "medical", title: title.trim(), description: description.trim(), status: "open",
      }).returning();
      await db.insert(escalationAuditLogTable).values({
        escalationId: esc.id, action: "created", actorId: auth.staffId,
        note: `Escalation created by ops`,
      });
      const author = await getStaffInfo(auth.staffId);
      res.status(201).json({ ...esc, authorName: author?.fullName, createdAt: esc.createdAt.toISOString(), updatedAt: esc.updatedAt.toISOString(), auditLog: [] });
    } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
  });

  router.patch("/escalations/:escalationId", async (req, res) => {
    try {
      const auth = await requireOpsAuth(req, res); if (!auth) return;
      const escalationId = parseInt(req.params.escalationId);
      const { action, note, title, description, category, resolutionNotes } = req.body;
      const [existing] = await db.select().from(escalationsTable).where(eq(escalationsTable.id, escalationId)).limit(1);
      if (!existing) { res.status(404).json({ error: "Escalation not found" }); return; }

      const updateData: any = {};
      if (action === "resolve") {
        updateData.status = "resolved";
        if (resolutionNotes) updateData.resolutionNotes = resolutionNotes;
      } else if (action === "reopen") {
        updateData.status = "open";
        updateData.resolutionNotes = null;
      } else if (action === "edit") {
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (category) updateData.category = category;
      }

      if (Object.keys(updateData).length > 0) {
        await db.update(escalationsTable).set(updateData).where(eq(escalationsTable.id, escalationId));
      }
      await db.insert(escalationAuditLogTable).values({
        escalationId, action: action ?? "updated", actorId: auth.staffId,
        note: note ?? `Status changed to ${updateData.status ?? "edited"}`,
      });
      const [updated] = await db.select().from(escalationsTable).where(eq(escalationsTable.id, escalationId)).limit(1);
      res.json({ ...updated, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString() });
    } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
  });

  // Ops escalation log (ops only)
  router.get("/patients/:id/escalation-log", async (req, res) => {
    try {
      const auth = await requireOpsAuth(req, res); if (!auth) return;
      const patientId = parseInt(req.params.id);
      const logs = await db.select().from(opsEscalationLogTable)
        .where(eq(opsEscalationLogTable.patientId, patientId))
        .orderBy(desc(opsEscalationLogTable.createdAt)).limit(50);
      const result = await Promise.all(logs.map(async l => {
        const author = await getStaffInfo(l.authorId);
        return { ...l, authorName: author?.fullName ?? "Unknown", createdAt: l.createdAt.toISOString(), updatedAt: l.updatedAt.toISOString() };
      }));
      res.json(result);
    } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
  });

  router.post("/patients/:id/escalation-log", async (req, res) => {
    try {
      const auth = await requireOpsAuth(req, res); if (!auth) return;
      const patientId = parseInt(req.params.id);
      const { content, category } = req.body;
      if (!content?.trim()) { res.status(400).json({ error: "Content required" }); return; }
      const [log] = await db.insert(opsEscalationLogTable).values({
        patientId, authorId: auth.staffId, content: content.trim(), category: category ?? "observation",
      }).returning();
      const author = await getStaffInfo(auth.staffId);
      res.status(201).json({ ...log, authorName: author?.fullName, createdAt: log.createdAt.toISOString(), updatedAt: log.updatedAt.toISOString() });
    } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
  });

  // Diet plans — ops can read + upload (POST creates new version, marks old inactive)
  router.get("/patients/:id/diet-plans", async (req, res) => {
    try {
      const auth = await requireOpsAuth(req, res); if (!auth) return;
      res.json(await getDietPlans(parseInt(req.params.id)));
    } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
  });

  router.post("/patients/:id/diet-plans", async (req, res) => {
    try {
      const auth = await requireOpsAuth(req, res); if (!auth) return;
      const patientId = parseInt(req.params.id);
      const { title, content, pdfFilename, pdfData } = req.body;
      if (!title?.trim() || !content?.trim()) { res.status(400).json({ error: "Title and content required" }); return; }
      const existing = await db.select({ version: dietPlansTable.version })
        .from(dietPlansTable).where(eq(dietPlansTable.patientId, patientId))
        .orderBy(desc(dietPlansTable.version)).limit(1);
      const nextVersion = (existing[0]?.version ?? 0) + 1;
      await db.update(dietPlansTable).set({ isActive: false }).where(eq(dietPlansTable.patientId, patientId));
      const [plan] = await db.insert(dietPlansTable).values({
        patientId, authorId: auth.staffId, title: title.trim(), content: content.trim(),
        pdfFilename: pdfFilename ?? null, pdfData: pdfData ?? null,
        version: nextVersion, isActive: true,
      }).returning();
      const author = await getStaffInfo(auth.staffId);
      res.status(201).json({ ...plan, authorName: author?.fullName, createdAt: plan.createdAt.toISOString(), pdfData: undefined });
    } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
  });

  // Historical records
  router.get("/patients/:id/records", async (req, res) => {
    try {
      const auth = await requireOpsAuth(req, res); if (!auth) return;
      const { from, to } = req.query as { from?: string; to?: string };
      res.json(await getRecords(parseInt(req.params.id), from, to));
    } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
  });

  // Activity feed with author filter
  router.get("/patients/:id/activity", async (req, res) => {
    try {
      const auth = await requireOpsAuth(req, res); if (!auth) return;
      const { from, to, type, author } = req.query as { from?: string; to?: string; type?: string; author?: string };
      res.json(await getActivity(parseInt(req.params.id), from, to, type, author));
    } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
  });

  return router;
}

// Keep old export for backward compat (not used after index.ts update)
export function buildClinicalRouter(allowedRoles: string[]) {
  if (allowedRoles.includes("physician") && !allowedRoles.includes("ops")) return buildPhysicianClinicalRouter();
  return buildOpsClinicalRouter();
}
