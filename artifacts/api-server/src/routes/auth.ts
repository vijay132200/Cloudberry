import { Router } from "express";
import { createHash } from "crypto";
import { db } from "@workspace/db";
import { usersTable, staffTable, patientsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const DEMO_PW_HASH = createHash("sha256").update("demo123").digest("hex");

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function generateToken(userId: number, role: string): string {
  return Buffer.from(JSON.stringify({ userId, role, ts: Date.now() })).toString("base64");
}

function validatePassword(password: string): string | null {
  if (!password || password.length < 8) return "Password must be at least 8 characters";
  if (!/\d/.test(password)) return "Password must include at least one number";
  if (!/[^a-zA-Z0-9]/.test(password)) return "Password must include at least one special character";
  return null;
}

function checkPasswordHash(provided: string, stored: string): boolean {
  const hashed = hashPassword(provided);
  return hashed === stored || stored === DEMO_PW_HASH && provided === "demo123";
}

// Patient signup
router.post("/patient/signup", async (req, res) => {
  try {
    const { fullName, phone, city, primaryGoal, preferredCallbackTime, email, selectedPlan, password } = req.body;
    if (!fullName || !phone || !city || !primaryGoal) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    if (!email || !email.includes("@")) {
      res.status(400).json({ error: "Valid email address required" });
      return;
    }
    if (!/^\d{10}$/.test(phone.replace(/\s+/g, ""))) {
      res.status(400).json({ error: "Phone must be a 10-digit number" });
      return;
    }
    if (password) {
      const err = validatePassword(password);
      if (err) { res.status(400).json({ error: err }); return; }
    }

    const existingEmail = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existingEmail.length > 0) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }
    const existingPhone = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
    if (existingPhone.length > 0) {
      res.status(409).json({ error: "An account with this phone number already exists" });
      return;
    }

    const [user] = await db.insert(usersTable).values({
      fullName, phone, email,
      passwordHash: password ? hashPassword(password) : DEMO_PW_HASH,
      role: "patient", city,
    }).returning();

    const plan = selectedPlan && selectedPlan !== "undecided" ? selectedPlan : "comprehensive";
    await db.insert(patientsTable).values({
      userId: user.id, primaryGoal, plan,
      weekNumber: 1, preferredCallbackTime: preferredCallbackTime || null,
      status: "pending_approval", riskLevel: "low",
    });

    const token = generateToken(user.id, "patient");
    res.status(201).json({ token, role: "patient", userId: user.id, fullName: user.fullName, plan });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Patient signin — accepts email or phone in the `phone` field
router.post("/patient/signin", async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone) { res.status(400).json({ error: "Email or phone required" }); return; }
    if (!password) { res.status(400).json({ error: "Password required" }); return; }

    let users;
    if (phone.includes("@")) {
      users = await db.select().from(usersTable).where(eq(usersTable.email, phone)).limit(1);
    } else {
      users = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
    }

    const user = users[0];
    if (!user || user.role !== "patient") {
      res.status(401).json({ error: "Invalid credentials" }); return;
    }

    if (!checkPasswordHash(password, user.passwordHash ?? "")) {
      res.status(401).json({ error: "Invalid credentials" }); return;
    }

    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.userId, user.id)).limit(1);
    if (patient?.status === "pending_approval") {
      res.status(403).json({ status: "pending_approval", error: "Your account is pending approval by our team." });
      return;
    }
    const token = generateToken(user.id, "patient");
    res.json({ token, role: "patient", userId: user.id, fullName: user.fullName, plan: patient?.plan ?? "basic", status: patient?.status ?? "active" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Physician signup (creates a staff account)
router.post("/physician/signup", async (req, res) => {
  try {
    const { fullName, email, password, specialty, phone } = req.body;
    if (!fullName || !email || !password) {
      res.status(400).json({ error: "Full name, email, and password are required" }); return;
    }
    if (!email.includes("@")) {
      res.status(400).json({ error: "Valid email address required" }); return;
    }
    const pwErr = validatePassword(password);
    if (pwErr) { res.status(400).json({ error: pwErr }); return; }

    const existing = await db.select().from(staffTable).where(eq(staffTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "An account with this email already exists" }); return;
    }

    const [staff] = await db.insert(staffTable).values({
      fullName, email, passwordHash: hashPassword(password),
      role: "physician", specialty: specialty || "General Medicine",
    }).returning();

    const token = generateToken(staff.id, "physician");
    res.status(201).json({ token, role: "physician", userId: staff.id, fullName: staff.fullName });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Staff signin — physician, dietician, caretaker, coach
router.post("/coach/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) { res.status(400).json({ error: "Email required" }); return; }
    if (!password) { res.status(400).json({ error: "Password required" }); return; }

    let staff: typeof staffTable.$inferSelect | undefined;
    if (email.includes("@")) {
      [staff] = await db.select().from(staffTable).where(eq(staffTable.email, email)).limit(1);
    } else {
      [staff] = await db.select().from(staffTable).where(eq(staffTable.phone, email)).limit(1);
    }
    if (!staff || !["coach", "physician", "dietician", "caretaker"].includes(staff.role)) {
      res.status(401).json({ error: "Invalid credentials" }); return;
    }
    if (!checkPasswordHash(password, staff.passwordHash ?? "")) {
      res.status(401).json({ error: "Invalid credentials" }); return;
    }

    const token = generateToken(staff.id, staff.role);
    res.json({ token, role: staff.role, userId: staff.id, fullName: staff.fullName, specialty: staff.specialty });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Ops signin
router.post("/ops/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) { res.status(400).json({ error: "Email required" }); return; }
    if (!password) { res.status(400).json({ error: "Password required" }); return; }

    const [staff] = await db.select().from(staffTable).where(eq(staffTable.email, email)).limit(1);
    if (!staff || staff.role !== "ops") {
      res.status(401).json({ error: "Invalid credentials" }); return;
    }
    if (!checkPasswordHash(password, staff.passwordHash ?? "")) {
      res.status(401).json({ error: "Invalid credentials" }); return;
    }

    const token = generateToken(staff.id, "ops");
    res.json({ token, role: "ops", userId: staff.id, fullName: staff.fullName });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
