---
name: Coach route patient isolation
description: How physician/dietician/caretaker portals filter patients to their assigned ones
---

## Patient isolation in /api/coach/patients

The coach route was fixed to filter patients by the logged-in staff member's ID.

**How to apply**: When a non-ops staff member calls GET /api/coach/patients, use an OR filter:
```ts
or(
  eq(patientsTable.assignedPhysicianId, staffId),
  eq(patientsTable.assignedDieticianId, staffId),
  eq(patientsTable.assignedCaretakerId, staffId),
  eq(patientsTable.assignedCoachId, staffId),
)
```
Ops role bypasses this filter and sees all patients.

**Why**: Data isolation — each care team member should only see patients assigned to them.
