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
