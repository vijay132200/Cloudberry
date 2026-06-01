import { Router } from "express";
import { db } from "@workspace/db";
import {
  staffTable,
  patientsTable,
  usersTable,
  checkinsTable,
  metricsTable,
  formulaDefinitionsTable,
  formulaVersionsTable,
  formulaPatientOverridesTable,
  formulaAuditLogTable,
} from "@workspace/db";
import { eq, and, desc, asc } from "drizzle-orm";
import {
  getActiveParams,
  invalidateCache,
  validateFormulaParams,
  seedFormulasIfEmpty,
  FORMULA_CATALOG,
} from "../lib/formula-engine";
import {
  computeConsistency,
  computeScore,
  toConsistencyParams,
} from "../lib/consistency";

const router = Router();

function parseToken(h: string | undefined) {
  if (!h) return null;
  try {
    return JSON.parse(Buffer.from(h.replace("Bearer ", ""), "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

async function requireOps(req: any, res: any): Promise<{ staffId: number } | null> {
  const parsed = parseToken(req.headers.authorization);
  if (!parsed) { res.status(401).json({ error: "Unauthorized" }); return null; }
  if (parsed.role !== "ops") { res.status(403).json({ error: "Forbidden" }); return null; }
  const [staff] = await db.select().from(staffTable).where(eq(staffTable.id, parsed.userId)).limit(1);
  if (!staff || staff.role !== "ops") { res.status(403).json({ error: "Forbidden" }); return null; }
  return { staffId: staff.id };
}

let seeded = false;
async function ensureSeeded() {
  if (seeded) return;
  const [anyStaff] = await db.select().from(staffTable).where(eq(staffTable.role, "ops")).limit(1);
  if (anyStaff) {
    await seedFormulasIfEmpty(anyStaff.id);
    seeded = true;
  }
}

function formatVersion(v: any, staffMap: Map<number, string>) {
  return {
    id: v.id,
    formulaId: v.formulaId,
    version: v.version,
    parameters: v.parameters,
    humanReadable: v.humanReadable,
    mathRepresentation: v.mathRepresentation,
    exampleCalculation: v.exampleCalculation,
    status: v.status,
    reason: v.reason,
    proposedBy: v.proposedBy,
    proposedByName: staffMap.get(v.proposedBy) ?? "Unknown",
    approvedBy: v.approvedBy,
    approvedByName: v.approvedBy ? (staffMap.get(v.approvedBy) ?? "Unknown") : null,
    proposedAt: v.proposedAt,
    approvedAt: v.approvedAt,
    deployedAt: v.deployedAt,
  };
}

async function buildStaffMap(ids: number[]): Promise<Map<number, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const rows = await db.select().from(staffTable);
  const map = new Map<number, string>();
  for (const r of rows) map.set(r.id, r.fullName);
  return map;
}

// GET /api/ops/formulas — registry list
router.get("/", async (req, res) => {
  try {
    const auth = await requireOps(req, res);
    if (!auth) return;
    await ensureSeeded();

    const defs = await db.select().from(formulaDefinitionsTable).orderBy(asc(formulaDefinitionsTable.id));
    const versionIds = defs.map(d => d.currentVersionId).filter(Boolean) as number[];
    const versions = versionIds.length > 0
      ? await db.select().from(formulaVersionsTable)
      : [];

    const versionMap = new Map(versions.map(v => [v.id, v]));
    const staffIds = versions.map(v => v.proposedBy).concat(versions.map(v => v.approvedBy!)).filter(Boolean);
    const staffMap = await buildStaffMap(staffIds);

    const result = defs.map(def => {
      const ver = def.currentVersionId ? versionMap.get(def.currentVersionId) : null;
      const catalog = FORMULA_CATALOG.find(f => f.slug === def.slug);
      return {
        id: def.id,
        name: def.name,
        slug: def.slug,
        description: def.description,
        purpose: def.purpose,
        category: def.category,
        templateType: def.templateType,
        inputs: def.inputs,
        outputMin: def.outputMin,
        outputMax: def.outputMax,
        currentVersion: ver ? {
          id: ver.id,
          version: ver.version,
          parameters: ver.parameters,
          status: ver.status,
          deployedAt: ver.deployedAt,
          proposedByName: staffMap.get(ver.proposedBy) ?? "System",
        } : null,
        humanReadable: ver?.humanReadable ?? catalog?.humanReadable ?? "",
        mathRepresentation: ver?.mathRepresentation ?? catalog?.mathRepresentation ?? "",
        exampleCalculation: ver?.exampleCalculation ?? catalog?.exampleCalculation ?? "",
      };
    });

    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/ops/formulas/:id — full formula detail
router.get("/:id", async (req, res) => {
  try {
    const auth = await requireOps(req, res);
    if (!auth) return;
    await ensureSeeded();

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

    const [def] = await db.select().from(formulaDefinitionsTable)
      .where(eq(formulaDefinitionsTable.id, id)).limit(1);
    if (!def) { res.status(404).json({ error: "Formula not found" }); return; }

    const versions = await db.select().from(formulaVersionsTable)
      .where(eq(formulaVersionsTable.formulaId, id))
      .orderBy(desc(formulaVersionsTable.version));

    const catalog = FORMULA_CATALOG.find(f => f.slug === def.slug);
    const staffIds = versions.flatMap(v => [v.proposedBy, v.approvedBy!]).filter(Boolean);
    const staffMap = await buildStaffMap(staffIds);
    const currentVer = versions.find(v => v.id === def.currentVersionId);

    // audit log
    const auditRows = await db.select().from(formulaAuditLogTable)
      .where(eq(formulaAuditLogTable.formulaId, id))
      .orderBy(desc(formulaAuditLogTable.createdAt))
      .limit(50);

    const actorIds = auditRows.map(a => a.actorId!).filter(Boolean);
    const auditStaffMap = await buildStaffMap(actorIds);

    const audit = auditRows.map(a => ({
      id: a.id,
      action: a.action,
      actorId: a.actorId,
      actorName: a.actorId ? (auditStaffMap.get(a.actorId) ?? "Unknown") : "System",
      previousValue: a.previousValue,
      newValue: a.newValue,
      notes: a.notes,
      createdAt: a.createdAt,
    }));

    res.json({
      id: def.id,
      name: def.name,
      slug: def.slug,
      description: def.description,
      purpose: def.purpose,
      category: def.category,
      templateType: def.templateType,
      inputs: def.inputs as string[],
      outputMin: def.outputMin,
      outputMax: def.outputMax,
      humanReadable: currentVer?.humanReadable ?? catalog?.humanReadable ?? "",
      mathRepresentation: currentVer?.mathRepresentation ?? catalog?.mathRepresentation ?? "",
      exampleCalculation: currentVer?.exampleCalculation ?? catalog?.exampleCalculation ?? "",
      currentVersion: currentVer ? formatVersion(currentVer, staffMap) : null,
      versions: versions.map(v => formatVersion(v, staffMap)),
      audit,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/ops/formulas/:id/propose — create a draft version
router.post("/:id/propose", async (req, res) => {
  try {
    const auth = await requireOps(req, res);
    if (!auth) return;

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

    const { parameters, reason } = req.body;
    if (!parameters || typeof parameters !== "object") {
      res.status(400).json({ error: "parameters required" }); return;
    }
    if (!reason || typeof reason !== "string" || reason.trim().length < 5) {
      res.status(400).json({ error: "reason must be at least 5 characters" }); return;
    }

    const [def] = await db.select().from(formulaDefinitionsTable)
      .where(eq(formulaDefinitionsTable.id, id)).limit(1);
    if (!def) { res.status(404).json({ error: "Formula not found" }); return; }

    const { valid, errors } = validateFormulaParams(def.templateType, def.inputs as string[], parameters);
    if (!valid) { res.status(422).json({ error: "Validation failed", errors }); return; }

    const catalog = FORMULA_CATALOG.find(f => f.slug === def.slug);
    const [currentVer] = def.currentVersionId
      ? await db.select().from(formulaVersionsTable).where(eq(formulaVersionsTable.id, def.currentVersionId)).limit(1)
      : [null];

    const nextVersion = (currentVer?.version ?? 0) + 1;

    const [newVer] = await db.insert(formulaVersionsTable).values({
      formulaId: def.id,
      version: nextVersion,
      parameters,
      humanReadable: catalog?.humanReadable ?? currentVer?.humanReadable ?? "",
      mathRepresentation: catalog?.mathRepresentation ?? currentVer?.mathRepresentation ?? null,
      exampleCalculation: catalog?.exampleCalculation ?? currentVer?.exampleCalculation ?? null,
      status: "draft",
      reason: reason.trim(),
      proposedBy: auth.staffId,
    }).returning();

    await db.insert(formulaAuditLogTable).values({
      formulaId: def.id,
      versionId: newVer.id,
      action: "propose",
      actorId: auth.staffId,
      previousValue: currentVer?.parameters as any ?? null,
      newValue: parameters,
      notes: reason.trim(),
    });

    res.status(201).json({ version: newVer, message: "Draft version created" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/ops/formulas/:id/versions/:vid/approve — approve and deploy
router.post("/:id/versions/:vid/approve", async (req, res) => {
  try {
    const auth = await requireOps(req, res);
    if (!auth) return;

    const id = parseInt(req.params.id, 10);
    const vid = parseInt(req.params.vid, 10);
    if (isNaN(id) || isNaN(vid)) { res.status(400).json({ error: "Invalid ids" }); return; }

    const [def] = await db.select().from(formulaDefinitionsTable)
      .where(eq(formulaDefinitionsTable.id, id)).limit(1);
    if (!def) { res.status(404).json({ error: "Formula not found" }); return; }

    const [ver] = await db.select().from(formulaVersionsTable)
      .where(and(eq(formulaVersionsTable.id, vid), eq(formulaVersionsTable.formulaId, id))).limit(1);
    if (!ver) { res.status(404).json({ error: "Version not found" }); return; }
    if (ver.status !== "draft") { res.status(409).json({ error: `Version is already ${ver.status}` }); return; }

    const now = new Date();

    // Mark old deployed version as superseded
    if (def.currentVersionId && def.currentVersionId !== vid) {
      await db.update(formulaVersionsTable)
        .set({ status: "superseded" })
        .where(eq(formulaVersionsTable.id, def.currentVersionId));
    }

    // Approve + deploy new version
    const [updated] = await db.update(formulaVersionsTable)
      .set({ status: "deployed", approvedBy: auth.staffId, approvedAt: now, deployedAt: now })
      .where(eq(formulaVersionsTable.id, vid))
      .returning();

    // Update formula definition
    await db.update(formulaDefinitionsTable)
      .set({ currentVersionId: vid })
      .where(eq(formulaDefinitionsTable.id, id));

    // Audit
    await db.insert(formulaAuditLogTable).values({
      formulaId: id,
      versionId: vid,
      action: "deploy",
      actorId: auth.staffId,
      previousValue: def.currentVersionId ? { versionId: def.currentVersionId } : null,
      newValue: { versionId: vid, parameters: ver.parameters },
      notes: `Approved and deployed version ${ver.version}`,
    });

    // Bust cache
    invalidateCache(def.slug);

    res.json({ version: updated, message: "Formula approved and deployed" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/ops/formulas/:id/simulate — impact simulation
router.post("/:id/simulate", async (req, res) => {
  try {
    const auth = await requireOps(req, res);
    if (!auth) return;

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

    const { parameters } = req.body;
    if (!parameters || typeof parameters !== "object") {
      res.status(400).json({ error: "parameters required" }); return;
    }

    const [def] = await db.select().from(formulaDefinitionsTable)
      .where(eq(formulaDefinitionsTable.id, id)).limit(1);
    if (!def) { res.status(404).json({ error: "Formula not found" }); return; }

    if (def.templateType !== "weighted_average") {
      const currentVer = def.currentVersionId
        ? (await db.select().from(formulaVersionsTable).where(eq(formulaVersionsTable.id, def.currentVersionId)).limit(1))[0]
        : null;
      const currentParams = (currentVer?.parameters ?? {}) as Record<string, number>;
      const changes = (def.inputs as string[]).map(k => ({
        param: k,
        before: currentParams[k] ?? null,
        after: (parameters as Record<string, number>)[k] ?? null,
      }));
      res.json({ type: "threshold_comparison", changes, message: "Threshold formula — parameter comparison shown above." });
      return;
    }

    // For weighted_average (behavioral consistency): compute real patient scores
    const topPatients = await db
      .select({ patient: patientsTable, user: usersTable })
      .from(patientsTable)
      .innerJoin(usersTable, eq(usersTable.id, patientsTable.userId))
      .limit(9);

    const currentRaw = def.currentVersionId
      ? ((await db.select().from(formulaVersionsTable).where(eq(formulaVersionsTable.id, def.currentVersionId)).limit(1))[0]?.parameters ?? {})
      : {};

    const currentParams = toConsistencyParams(currentRaw as Record<string, number>);
    const proposedParams = toConsistencyParams(parameters as Record<string, number>);

    const patientResults = [];
    for (const row of topPatients) {
      const checkins = await db.select().from(checkinsTable)
        .where(eq(checkinsTable.patientId, row.patient.id))
        .orderBy(desc(checkinsTable.createdAt))
        .limit(7);

      if (checkins.length === 0) continue;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const sleepRows = await db.select().from(metricsTable)
        .where(and(
          eq(metricsTable.patientId, row.patient.id),
          eq(metricsTable.type, "sleep_hours"),
        ));
      const sleepMetrics = sleepRows.map(m => ({
        date: m.date,
        value: Number(m.value),
      }));

      const breakdown = computeConsistency(checkins, sleepMetrics, currentParams);
      if (!breakdown) continue;

      const currentScore = computeScore(breakdown, currentParams);
      const proposedScore = computeScore(breakdown, proposedParams);

      patientResults.push({
        patientId: row.patient.id,
        patientName: row.user.fullName,
        currentScore,
        proposedScore,
        delta: proposedScore - currentScore,
        breakdown: {
          mealLogging: breakdown.mealLogging,
          activity: breakdown.activity,
          sleep: breakdown.sleep,
          dataPoints: breakdown.dataPoints,
        },
      });
    }

    patientResults.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    const top5 = patientResults.slice(0, 5);

    const avgCurrent = top5.length > 0
      ? Math.round(top5.reduce((s, p) => s + p.currentScore, 0) / top5.length)
      : 0;
    const avgProposed = top5.length > 0
      ? Math.round(top5.reduce((s, p) => s + p.proposedScore, 0) / top5.length)
      : 0;

    res.json({
      type: "score_comparison",
      summary: { avgCurrent, avgProposed, delta: avgProposed - avgCurrent, patientsAnalyzed: top5.length },
      patients: top5,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/ops/formulas/:id/audit — audit log
router.get("/:id/audit", async (req, res) => {
  try {
    const auth = await requireOps(req, res);
    if (!auth) return;

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

    const rows = await db.select().from(formulaAuditLogTable)
      .where(eq(formulaAuditLogTable.formulaId, id))
      .orderBy(desc(formulaAuditLogTable.createdAt))
      .limit(100);

    const staffMap = await buildStaffMap(rows.map(r => r.actorId!).filter(Boolean));
    res.json(rows.map(r => ({
      ...r,
      actorName: r.actorId ? (staffMap.get(r.actorId) ?? "Unknown") : "System",
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/ops/formulas/patient/:patientId — patient overrides
router.get("/patient/:patientId", async (req, res) => {
  try {
    const auth = await requireOps(req, res);
    if (!auth) return;
    await ensureSeeded();

    const patientId = parseInt(req.params.patientId, 10);
    if (isNaN(patientId)) { res.status(400).json({ error: "Invalid patientId" }); return; }

    const overrides = await db.select().from(formulaPatientOverridesTable)
      .where(and(
        eq(formulaPatientOverridesTable.patientId, patientId),
        eq(formulaPatientOverridesTable.active, true),
      ));

    const formulaIds = overrides.map(o => o.formulaId);
    const formulas = formulaIds.length > 0
      ? await db.select().from(formulaDefinitionsTable)
      : [];

    const formulaMap = new Map(formulas.map(f => [f.id, f]));
    const creatorIds = overrides.map(o => o.createdBy!).filter(Boolean);
    const staffMap = await buildStaffMap(creatorIds);

    const globalParams: Record<number, Record<string, number>> = {};
    for (const fid of formulaIds) {
      const formula = formulaMap.get(fid);
      if (formula?.currentVersionId) {
        const [ver] = await db.select().from(formulaVersionsTable)
          .where(eq(formulaVersionsTable.id, formula.currentVersionId)).limit(1);
        if (ver) globalParams[fid] = ver.parameters as Record<string, number>;
      }
    }

    res.json(overrides.map(o => ({
      id: o.id,
      formulaId: o.formulaId,
      formulaName: formulaMap.get(o.formulaId)?.name ?? "Unknown",
      formulaSlug: formulaMap.get(o.formulaId)?.slug ?? "",
      patientId: o.patientId,
      parameters: o.parameters,
      globalParameters: globalParams[o.formulaId] ?? {},
      reason: o.reason,
      createdBy: o.createdBy,
      createdByName: o.createdBy ? (staffMap.get(o.createdBy) ?? "Unknown") : "Unknown",
      createdAt: o.createdAt,
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/ops/formulas/patient/:patientId/override — set patient override
router.post("/patient/:patientId/override", async (req, res) => {
  try {
    const auth = await requireOps(req, res);
    if (!auth) return;

    const patientId = parseInt(req.params.patientId, 10);
    if (isNaN(patientId)) { res.status(400).json({ error: "Invalid patientId" }); return; }

    const { formulaId, parameters, reason } = req.body;
    if (!formulaId || !parameters || typeof parameters !== "object") {
      res.status(400).json({ error: "formulaId and parameters required" }); return;
    }

    const [def] = await db.select().from(formulaDefinitionsTable)
      .where(eq(formulaDefinitionsTable.id, formulaId)).limit(1);
    if (!def) { res.status(404).json({ error: "Formula not found" }); return; }

    const { valid, errors } = validateFormulaParams(def.templateType, def.inputs as string[], parameters);
    if (!valid) { res.status(422).json({ error: "Validation failed", errors }); return; }

    // Deactivate existing override for this formula+patient
    await db.update(formulaPatientOverridesTable)
      .set({ active: false })
      .where(and(
        eq(formulaPatientOverridesTable.formulaId, formulaId),
        eq(formulaPatientOverridesTable.patientId, patientId),
      ));

    const [override] = await db.insert(formulaPatientOverridesTable).values({
      formulaId,
      patientId,
      parameters,
      baseVersionId: def.currentVersionId ?? null,
      active: true,
      reason: reason ?? null,
      createdBy: auth.staffId,
    }).returning();

    await db.insert(formulaAuditLogTable).values({
      formulaId,
      patientId,
      action: "override",
      actorId: auth.staffId,
      newValue: parameters,
      notes: reason ?? `Patient-specific override for patient ${patientId}`,
    });

    // Bust cache for this patient
    invalidateCache(def.slug);

    res.status(201).json({ override, message: "Patient override saved" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/ops/formulas/patient/:patientId/override/:formulaId — remove override
router.delete("/patient/:patientId/override/:formulaId", async (req, res) => {
  try {
    const auth = await requireOps(req, res);
    if (!auth) return;

    const patientId = parseInt(req.params.patientId, 10);
    const formulaId = parseInt(req.params.formulaId, 10);
    if (isNaN(patientId) || isNaN(formulaId)) { res.status(400).json({ error: "Invalid ids" }); return; }

    const [def] = await db.select().from(formulaDefinitionsTable)
      .where(eq(formulaDefinitionsTable.id, formulaId)).limit(1);

    await db.update(formulaPatientOverridesTable)
      .set({ active: false })
      .where(and(
        eq(formulaPatientOverridesTable.formulaId, formulaId),
        eq(formulaPatientOverridesTable.patientId, patientId),
      ));

    await db.insert(formulaAuditLogTable).values({
      formulaId,
      patientId,
      action: "override_remove",
      actorId: auth.staffId,
      notes: `Patient-specific override removed for patient ${patientId}`,
    });

    if (def) invalidateCache(def.slug);
    res.json({ message: "Override removed" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
