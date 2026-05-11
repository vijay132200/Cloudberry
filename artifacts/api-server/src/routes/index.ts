import { Router } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import leadsRouter from "./leads";
import patientsRouter from "./patients";
import checkinsRouter from "./checkins";
import metricsRouter from "./metrics";
import tipsRouter from "./tips";
import appointmentsRouter from "./appointments";
import coachRouter from "./coach";
import opsRouter from "./ops";

const router = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/leads", leadsRouter);
router.use("/patients", patientsRouter);
router.use("/checkins", checkinsRouter);
router.use("/metrics", metricsRouter);
router.use("/tips", tipsRouter);
router.use("/appointments", appointmentsRouter);
router.use("/coach", coachRouter);
router.use("/ops", opsRouter);

export default router;
