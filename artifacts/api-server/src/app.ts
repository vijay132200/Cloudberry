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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// In production, serve the Vite-built frontend as static files and fall
// through to index.html for all unmatched routes (SPA client-side routing).
//
// The frontend is built to artifacts/cloudberry/dist/public.
// From the bundled dist/index.mjs (__dirname = artifacts/api-server/dist/),
// the relative path resolves to the correct directory on Railway.
if (process.env.NODE_ENV === "production") {
  const frontendDist =
    process.env.FRONTEND_DIST ??
    path.resolve(__dirname, "../../cloudberry/dist/public");

  // Serve static assets (JS, CSS, images, etc.)
  app.use(express.static(frontendDist));

  // SPA fallback: any route not matched above returns index.html so the
  // React router can handle it client-side.  Using app.use (no path pattern)
  // is Express 5-compatible and catches every HTTP method.
  app.use((_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

export default app;
