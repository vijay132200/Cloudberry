# Cloudberry Health

A full-stack metabolic health platform serving patients, physicians, nutritionists/coaches, and operations staff. Doctor-led care for long-term metabolic health — weight loss and diabetes management.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/cloudberry run dev` — run the frontend (port 19024, proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, Framer Motion, Recharts, Wouter
- API: Express 5 with Pino logging
- DB: PostgreSQL + Drizzle ORM (lib/db)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in lib/api-spec)
- Generated client: `@workspace/api-client-react` (React Query hooks)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — DB schema (users, patients, checkins, appointments, leads, metrics, tips, notes, plans, staff)
- `lib/api-client-react/src/generated/` — auto-generated React Query hooks and Zod schemas (DO NOT edit manually)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, leads, patients, checkins, metrics, tips, appointments, coach, ops)
- `artifacts/cloudberry/src/pages/` — all frontend pages by role
- `artifacts/cloudberry/public/images/` — AI-generated stock images for marketing

## Architecture decisions

- Auth is demo-mode JWT-free: tokens are base64-encoded JSON `{userId, role, ts}` stored in `localStorage` under key `cloudberry_token`
- Patient signin uses phone number; staff (coach/ops/doctor) signin uses email
- Frontend has demo fallbacks on all API calls — app renders meaningfully even if API fails
- OpenAPI spec → Orval codegen → React Query hooks; always regenerate after spec changes
- Routes are prefixed: `/api/auth/*`, `/api/patients/*`, `/api/coach/*`, `/api/ops/*`, etc.

## Product

Four distinct role-based experiences:
1. **Marketing site** — Home, About, Blogs, FAQs, Physician partnership pages
2. **Patient portal** — Sign up/in (phone), dashboard with daily check-in, health records with charts, support, settings
3. **Coach portal** — Sign in (email), patient list with risk/adherence, patient detail with notes + plan editor
4. **Ops command center** — Sign in (email), KPI dashboard, full patient roster, coach assignment, escalation

## Demo credentials

All passwords: `demo123`

| Role | Login | Name |
|------|-------|------|
| Patient | 9876543210 (phone) | Rahul Sharma |
| Patient (diabetic) | 9765432109 (phone) | Ananya Patel |
| Ops | ops@cloudberry.health | Priya Nair |
| Ops 2 | ops2@cloudberry.health | Arjun Kapoor |
| Physician | dr.mehta@cloudberry.health | Dr. Sneha Mehta |
| Physician 2 | dr.raj@cloudberry.health | Dr. Raj Patel |
| Dietician | priya.diet@cloudberry.health | Priya Sharma |
| Caretaker | ranjit.care@cloudberry.health | Ranjit Kumar |

Patient sign-in uses phone number; all staff portals use email at `/physician/signin`. The main demo patient (Rahul Sharma, phone 9876543210) has check-in history, weight metrics, a care plan, and upcoming appointments. Ananya Patel (diabetes_reversal goal) has glucose metric series visible in charts.

## User preferences

- Tagline: "Doctor-Led Care for Long-Term Metabolic Health"
- Colors: white base, soft greens/teals (primary)
- Theme: warm, modern, premium, clinically trustworthy
- Typography: Instrument Serif (display) + Outfit (body)
- 3-tier pricing: ₹990 (Basic) / ₹1,990 (Comprehensive) / ₹3,990 (Premium)
- Currently available in Indore, expanding soon
- Responsive web app (not native mobile)

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after editing openapi.yaml before using generated hooks
- Always run `pnpm --filter @workspace/db run push` after adding/modifying DB schema
- Never import from `@workspace/api-client-react/src/generated/...` deep paths — use the main package entry `@workspace/api-client-react` only (it re-exports everything)
- Do NOT run `pnpm dev` at workspace root — use workflows or `pnpm --filter` commands
- API server logs use `req.log` and the `logger` singleton — never `console.log`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
