import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
// In production, restrict CORS to known frontend origins.
// ALLOWED_ORIGINS env var accepts a comma-separated list of allowed origins
// (e.g. "https://www.cloudberryhealth.in,https://cloudberryhealth.in").
// Falls back to open CORS when not set (safe for Replit / local dev).
const rawAllowedOrigins = process.env.ALLOWED_ORIGINS;
const allowedOrigins = rawAllowedOrigins
  ? rawAllowedOrigins.split(",").map((o) => o.trim()).filter(Boolean)
  : null;

app.use(
  cors({
    origin: allowedOrigins
      ? (origin, cb) => {
          // Allow requests with no Origin header (server-to-server, curl, etc.)
          if (!origin) return cb(null, true);
          if (allowedOrigins.includes(origin)) return cb(null, true);
          cb(new Error(`CORS: origin ${origin} not allowed`));
        }
      : true,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

app.use("/api", router);

// Serve the Vite-built frontend as static files and fall through to
// index.html for all unmatched routes (SPA client-side routing).
//
// In production: always enabled.
// In development on Replit: enabled when SERVE_FRONTEND=true is set,
// so a single Express server on port 8080 handles both API and UI.
const shouldServeFrontend =
  process.env.NODE_ENV === "production" ||
  process.env.SERVE_FRONTEND === "true";

if (shouldServeFrontend) {
  const frontendDist = process.env.FRONTEND_DIST
    ? path.resolve(process.cwd(), process.env.FRONTEND_DIST)
    : path.resolve(__dirname, "../../cloudberry/dist/public");

  app.use(express.static(frontendDist));

  app.use((_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

export default app;
