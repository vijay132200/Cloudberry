# Cloudberry Health

Multi-portal healthcare SaaS — React/Vite frontend + Express/Drizzle/PostgreSQL backend deployed as a single Railway service.

---

## Architecture

| Layer | Package | Tech |
|---|---|---|
| Frontend | `@workspace/cloudberry` | React 19, Vite 7, Tailwind v4, shadcn/ui |
| API | `@workspace/api-server` | Express 5, Drizzle ORM, Pino |
| Database | `@workspace/db` | Neon PostgreSQL (serverless) |
| Shared types | `@workspace/api-zod` | Zod schemas |

In production the Express API server serves both `/api/*` routes and the Vite-built static frontend from a single Railway service.

---

## Railway Deployment

### One-service deployment (recommended)

1. Create a new Railway project and connect this repository.
2. Railway auto-detects `railway.toml` and `nixpacks.toml` at the repo root.
3. Add the required environment variables (see below).
4. Deploy — Railway runs the build and starts the server automatically.

**Build pipeline (automatic):**
```
Node 20 installed → pnpm@10.26.1 installed → pnpm install --no-frozen-lockfile
  → vite build (frontend) → esbuild bundle (API) → node dist/index.mjs
```

**Health check:** `GET /api/healthz` → `{ "status": "ok" }`

### Two-service deployment (optional)

If you prefer to run the frontend and backend as separate Railway services:

**Backend service**
- Root Directory: `/` (repo root)
- Build Command: `pnpm install --no-frozen-lockfile && pnpm --filter @workspace/api-server run build`
- Start Command: `NODE_ENV=production pnpm --filter @workspace/api-server run start`
- Required env vars: `PORT`, `DATABASE_URL`

**Frontend service**
- Root Directory: `/` (repo root)
- Build Command: `pnpm install --no-frozen-lockfile && BASE_PATH=/ pnpm --filter @workspace/cloudberry run build`
- Start Command: `PORT=$PORT pnpm --filter @workspace/cloudberry run start`
- Required env vars: `PORT`, `API_SERVER_URL` (URL of the backend service)

---

## Environment Variables

### Required

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `PORT` | TCP port to listen on (Railway injects this automatically) | `3000` |

### Optional

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | Set to `production` for the frontend static-file serving to activate |
| `BASE_PATH` | `/` | URL base path prefix. Leave as `/` on Railway. Replit sets this automatically |
| `FRONTEND_DIST` | `../../cloudberry/dist/public` (relative to API dist) | Absolute path to the Vite build output if it differs from the default |
| `API_SERVER_URL` | `http://localhost:8080` | Used by the frontend dev/preview server to proxy `/api` requests |

---

## PostgreSQL Setup

This project uses [Neon](https://neon.tech) serverless PostgreSQL.

1. Create a Neon project and copy the connection string.
2. Add it as `DATABASE_URL` in Railway's environment variables.
3. Run the schema migration from your local machine:

```bash
DATABASE_URL="your-neon-url" pnpm --filter @workspace/db run push
```

4. (Optional) Seed demo data:

```bash
DATABASE_URL="your-neon-url" pnpm --filter @workspace/db run seed
```

---

## Local Development

```bash
# Install dependencies
pnpm install

# Start both services (runs in separate terminals or use a process manager)
pnpm --filter @workspace/api-server run dev   # API on :8080
pnpm --filter @workspace/cloudberry run dev   # Frontend on :$PORT (proxies /api to :8080)
```

Required local env vars (create `artifacts/api-server/.env`):
```
PORT=8080
DATABASE_URL=postgresql://...
```

The Vite dev server proxies all `/api/*` requests to `http://localhost:8080` automatically.

---

## Scripts

| Command | Description |
|---|---|
| `pnpm --filter @workspace/cloudberry run build` | Production Vite build → `artifacts/cloudberry/dist/public` |
| `pnpm --filter @workspace/cloudberry run start` | Serve built frontend via `vite preview` |
| `pnpm --filter @workspace/api-server run build` | esbuild bundle → `artifacts/api-server/dist/index.mjs` |
| `pnpm --filter @workspace/api-server run start` | Start the production Node server |
| `pnpm --filter @workspace/db run push` | Push Drizzle schema to the database |
| `pnpm --filter @workspace/db run seed` | Seed the database with demo data |
