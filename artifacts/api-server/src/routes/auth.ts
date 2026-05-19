import { Router } from "express";
import { createHash } from "crypto";
import { db } from "@workspace/db";
import { usersTable, staffTable, patientsTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";

const router = Router();

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function generateToken(userId: number, role: string): string {
  return Buffer.from(JSON.stringify({ userId, role, ts: Date.now() })).toString("base64");
}

// Patient signup
router.post("/patient/signup", async (req, res) => {
  try {
    const { fullName, phone, city, primaryGoal, preferredCallbackTime, email, selectedPlan, password } = req.body;
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
        passwordHash: password ? hashPassword(password) : hashPassword("demo123"),
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

// Patient signin — accepts email or phone in the `phone` field
router.post("/patient/signin", async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone) {
      res.status(400).json({ error: "Email or phone required" });
      return;
    }

    let users;
    if (phone.includes("@")) {
      users = await db.select().from(usersTable).where(eq(usersTable.email, phone)).limit(1);
    } else {
      users = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
    }

    const user = users[0];
    if (!user || user.role !== "patient") {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    if (password) {
      const hashed = hashPassword(password);
      if (user.passwordHash !== hashed && user.passwordHash !== "demo") {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }
    }

    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.userId, user.id)).limit(1);
    const token = generateToken(user.id, "patient");
    res.json({
      token,
      role: "patient",
      userId: user.id,
      fullName: user.fullName,
      plan: patient?.plan ?? "basic",
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Coach / Physician signin
router.post("/coach/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email required" });
      return;
    }
    const [staff] = await db.select().from(staffTable).where(eq(staffTable.email, email)).limit(1);
    if (!staff || !["coach", "physician"].includes(staff.role)) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    if (password) {
      const hashed = hashPassword(password);
      if (staff.passwordHash !== hashed && staff.passwordHash !== "demo") {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }
    }
    const token = generateToken(staff.id, "coach");
    res.json({ token, role: "coach", userId: staff.id, fullName: staff.fullName });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Ops signin
router.post("/ops/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email required" });
      return;
    }
    const [staff] = await db.select().from(staffTable).where(eq(staffTable.email, email)).limit(1);
    if (!staff || staff.role !== "ops") {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    if (password) {
      const hashed = hashPassword(password);
      if (staff.passwordHash !== hashed && staff.passwordHash !== "demo") {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }
    }
    const token = generateToken(staff.id, "ops");
    res.json({ token, role: "ops", userId: staff.id, fullName: staff.fullName });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
