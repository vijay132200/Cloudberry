import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const handler = (_req: any, res: any) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
};

// /api/healthz  — primary endpoint (original)
router.get("/healthz", handler);

// /api/health   — alias used by Railway's healthcheckPath
router.get("/health", handler);

// /api/healthz/db — DB connection + schema verification: dynamically validates connectivity
// and that all expected clinical tables exist in the public schema.
router.get("/healthz/db", async (req: any, res) => {
  try {
    // 1. Verify DB connectivity + get server info
    const connResult = await db.execute(sql`SELECT current_database() as db, version() as pg_version`);
    const row: any = connResult.rows[0] ?? {};

    // 2. Query information_schema to verify all expected tables actually exist
    const EXPECTED_TABLES = [
      "users", "staff", "patients", "checkins", "metrics", "appointments",
      "patient_notes", "patient_plans", "patient_plan_history",
      "clinical_notes", "clinical_note_versions",
      "critical_notes", "critical_note_versions",
      "escalations", "escalation_audit_log", "ops_escalation_log",
      "diet_plans",
    ];
    const tableResult = await db.execute(sql.raw(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (${EXPECTED_TABLES.map(t => `'${t}'`).join(",")})
    `));
    const foundTables = new Set((tableResult.rows as any[]).map(r => r.table_name));
    const tableAudit = EXPECTED_TABLES.map(t => ({ table: t, exists: foundTables.has(t) }));
    const missingTables = tableAudit.filter(t => !t.exists).map(t => t.table);

    // 3. Verify row counts on core tables to confirm data is accessible
    const countResult = await db.execute(sql`
      SELECT
        (SELECT COUNT(*) FROM users)    AS users,
        (SELECT COUNT(*) FROM patients) AS patients,
        (SELECT COUNT(*) FROM staff)    AS staff
    `);
    const counts: any = countResult.rows[0] ?? {};

    const allTablesPresent = missingTables.length === 0;
    res.status(allTablesPresent ? 200 : 500).json({
      status: allTablesPresent ? "ok" : "degraded",
      db: {
        connected: true,
        database: row.db ?? "cloudberry",
        pgVersion: (row.pg_version ?? "").split(" ").slice(0, 2).join(" "),
        connectionSource: "DATABASE_URL via @workspace/db (single shared pool)",
      },
      schema: {
        allTablesPresent,
        missing: missingTables,
        tableAudit,
      },
      rowCounts: {
        users: Number(counts.users ?? 0),
        patients: Number(counts.patients ?? 0),
        staff: Number(counts.staff ?? 0),
      },
    });
  } catch (err: any) {
    res.status(500).json({
      status: "error",
      db: { connected: false, error: err?.message ?? "Unknown error" },
      schema: null,
      rowCounts: null,
    });
  }
});

export default router;
