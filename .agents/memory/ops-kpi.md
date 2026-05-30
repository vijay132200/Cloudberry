---
name: Ops KPI dashboard
description: Fields returned by /api/ops/dashboard and frontend grid layout
---

## KPI endpoint response shape (8 fields)

```json
{
  "activePatients": number,
  "dailyAdherencePct": number,
  "missedCheckins": number,
  "totalLeads": number,
  "totalStaff": number,
  "conversionRate": number,
  "highRiskCount": number,
  "upcomingAppointments": number
}
```

Frontend renders these in a `grid-cols-2 sm:grid-cols-4 lg:grid-cols-8` grid — must stay 8 items to fill correctly.

**Why**: Original code only had 4 KPI fields, leaving half the grid empty on large screens.
