import { Router } from "express";
import { db } from "@workspace/db";
import { tipsTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const tips = await db.select().from(tipsTable).orderBy(desc(tipsTable.createdAt)).limit(10);
    res.json(tips.map(t => ({ ...t, createdAt: undefined })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
