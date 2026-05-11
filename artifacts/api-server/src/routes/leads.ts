import { Router } from "express";
import { db } from "@workspace/db";
import { leadsTable, physicianLeadsTable } from "@workspace/db";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { fullName, phone, city, primaryGoal, preferredCallbackTime, email } = req.body;
    if (!fullName || !phone || !city || !primaryGoal) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const [lead] = await db.insert(leadsTable).values({
      fullName,
      phone,
      email: email || null,
      city,
      primaryGoal,
      preferredCallbackTime: preferredCallbackTime || null,
    }).returning();
    res.status(201).json({ ...lead, createdAt: lead.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/physician", async (req, res) => {
  try {
    const { name, specialty, clinicOrHospital, city, phone, preferredCallbackTime } = req.body;
    if (!name || !specialty || !city || !phone) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const [lead] = await db.insert(physicianLeadsTable).values({
      name,
      specialty,
      clinicOrHospital: clinicOrHospital || null,
      city,
      phone,
      preferredCallbackTime: preferredCallbackTime || null,
    }).returning();
    res.status(201).json({ ...lead, createdAt: lead.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
