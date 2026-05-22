import { Router, type IRouter } from "express";
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

export default router;
