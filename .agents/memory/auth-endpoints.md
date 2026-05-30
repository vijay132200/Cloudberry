---
name: Auth endpoints
description: Correct API routes for all portal sign-ins in Cloudberry Health
---

## Auth route paths (mounted at /api/auth)

- Patient signin: POST `/api/auth/patient/signin` — body: `{ phone, password }`
- Physician/Dietician/Caretaker signin: POST `/api/auth/coach/signin` — body: `{ email, password }`
- Ops signin: POST `/api/auth/ops/signin` — body: `{ email, password }`

**Token format**: base64-encoded JSON `{ userId, role, ts }` — NOT a JWT. Stored in `localStorage` as `cloudberry_token`.

**Why**: The auth routes are role-split. `coach/signin` serves physicians, dieticians, and caretakers. Confusing name but intentional.
