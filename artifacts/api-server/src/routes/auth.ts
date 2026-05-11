import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, staffTable, patientsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function generateToken(userId: number, role: string): string {
  return Buffer.from(JSON.stringify({ userId, role, ts: Date.now() })).toString("base64");
}

router.post("/patient/signup", async (req, res) => {
  try {
    const { fullName, phone, city, primaryGoal, preferredCallbackTime, email, selectedPlan } = req.body;
    if (!fullName || !phone || !city || !primaryGoal) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const existing = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
    let user;
    if (existing.length > 0) {
      user = existing[0];
    } else {
      const [newUser] = await db.insert(usersTable).values({
        fullName,
        phone,
        email: email || null,
        passwordHash: "demo",
        role: "patient",
        city,
      }).returning();
      user = newUser;
      await db.insert(patientsTable).values({
        userId: user.id,
        primaryGoal,
        plan: selectedPlan || "basic",
        weekNumber: 1,
        preferredCallbackTime: preferredCallbackTime || null,
        status: "active",
        riskLevel: "low",
      });
    }
    const token = generateToken(user.id, "patient");
    res.status(201).json({ token, role: "patient", userId: user.id });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/patient/signin", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ error: "Phone required" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    const token = generateToken(user.id, "patient");
    res.json({ token, role: "patient", userId: user.id });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/coach/signin", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email required" });
      return;
    }
    const [staff] = await db.select().from(staffTable).where(eq(staffTable.email, email)).limit(1);
    if (!staff) {
      res.status(401).json({ error: "Staff not found" });
      return;
    }
    const token = generateToken(staff.id, "coach");
    res.json({ token, role: "coach", userId: staff.id });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/ops/signin", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email required" });
      return;
    }
    const [staff] = await db.select().from(staffTable).where(eq(staffTable.email, email)).limit(1);
    if (!staff || staff.role !== "ops") {
      res.status(401).json({ error: "Not authorized" });
      return;
    }
    const token = generateToken(staff.id, "ops");
    res.json({ token, role: "ops", userId: staff.id });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
