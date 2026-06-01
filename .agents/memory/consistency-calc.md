---
name: Consistency calculation
description: How behavioral consistency scores are computed and where the source of truth lives
---

Single source of truth: `artifacts/api-server/src/lib/consistency.ts`

**The rule:** Denominator = number of actual check-in days, never 7.

- `computeConsistency(last7, sleepMetrics)` — takes up to 7 most recent check-ins + sleep metric map; returns breakdown where each sub-score is out of actual data points
- `computeWeeklyHistory(allCheckins, allSleepMetrics)` — groups check-ins by ISO week (Mon–Sun), returns `WeeklyScore[]` newest-first

**Why:** Old code divided by 7 unconditionally, so patients with fewer check-ins were penalized for missing days rather than scored on their actual behavior.

**How to apply:** Any new route that shows consistency scores must import from `consistency.ts`, never recompute inline. All 3 portals (patients.ts, physician.ts, ops.ts) use the same functions — scores are guaranteed identical across portals.

**History endpoints:**
- `GET /api/patients/me/consistency-history`
- `GET /api/physician/patients/:id/consistency-history`
- `GET /api/ops/patients/:id/consistency-history`

**Frontend components:** `artifacts/cloudberry/src/components/ConsistencyHistory.tsx` exports `PatientConsistencyHistory`, `StaffConsistencyHistory`, `ConsistencyHistoryPanel`.
