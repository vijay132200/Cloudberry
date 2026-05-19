import { createHash } from "crypto";
import { db, pool } from "@workspace/db";
import {
  usersTable,
  staffTable,
  patientsTable,
  checkinsTable,
  metricsTable,
  appointmentsTable,
  tipsTable,
  patientPlansTable,
  patientNotesTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";

function hash(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function dateStr(n: number): string {
  return daysAgo(n).toISOString().split("T")[0];
}

async function seed() {
  console.log("🌱 Seeding demo data...");

  // ─── 1. Ops staff ─────────────────────────────────────────────────────────
  const existingOps = await db.select().from(staffTable).where(eq(staffTable.email, "ops@cloudberry.health")).limit(1);
  let opsStaff;
  if (existingOps.length === 0) {
    [opsStaff] = await db.insert(staffTable).values({
      fullName: "Neha Iyer",
      email: "ops@cloudberry.health",
      passwordHash: hash("demo123"),
      role: "ops",
      specialty: "Operations",
    }).returning();
    console.log("✅ Ops user created:", opsStaff.email);
  } else {
    await db.update(staffTable).set({ passwordHash: hash("demo123") }).where(eq(staffTable.email, "ops@cloudberry.health"));
    opsStaff = existingOps[0];
    console.log("✅ Ops user updated:", opsStaff.email);
  }

  // ─── 2. Physician / Coach staff ───────────────────────────────────────────
  const existingDoc = await db.select().from(staffTable).where(eq(staffTable.email, "physician@cloudberry.health")).limit(1);
  let physician;
  if (existingDoc.length === 0) {
    [physician] = await db.insert(staffTable).values({
      fullName: "Dr. Arjun Mehta",
      email: "physician@cloudberry.health",
      passwordHash: hash("demo123"),
      role: "coach",
      specialty: "Endocrinology",
    }).returning();
    console.log("✅ Physician created:", physician.email);
  } else {
    await db.update(staffTable).set({ passwordHash: hash("demo123") }).where(eq(staffTable.email, "physician@cloudberry.health"));
    physician = existingDoc[0];
    console.log("✅ Physician updated:", physician.email);
  }

  // ─── 3. Demo patient user ─────────────────────────────────────────────────
  const existingPatientUser = await db.select().from(usersTable).where(eq(usersTable.email, "patient@cloudberry.health")).limit(1);
  let patientUser;
  if (existingPatientUser.length === 0) {
    [patientUser] = await db.insert(usersTable).values({
      fullName: "Rahul Sharma",
      phone: "9876543210",
      email: "patient@cloudberry.health",
      passwordHash: hash("demo123"),
      role: "patient",
      city: "Indore",
    }).returning();
    console.log("✅ Demo patient user created:", patientUser.email);
  } else {
    await db.update(usersTable).set({ passwordHash: hash("demo123") }).where(eq(usersTable.email, "patient@cloudberry.health"));
    patientUser = existingPatientUser[0];
    console.log("✅ Demo patient updated:", patientUser.email);
  }

  // ─── 4. Patient record ────────────────────────────────────────────────────
  const existingPatient = await db.select().from(patientsTable).where(eq(patientsTable.userId, patientUser.id)).limit(1);
  let patient;
  if (existingPatient.length === 0) {
    [patient] = await db.insert(patientsTable).values({
      userId: patientUser.id,
      primaryGoal: "weight_loss",
      plan: "comprehensive",
      weekNumber: 8,
      startingWeight: 92.5,
      currentWeight: 88.3,
      targetWeight: 78.0,
      assignedCoachId: physician.id,
      status: "active",
      riskLevel: "low",
    }).returning();
    console.log("✅ Patient record created");
  } else {
    patient = existingPatient[0];
    console.log("✅ Patient record already exists");
  }

  // ─── 5. Patient plan ──────────────────────────────────────────────────────
  const existingPlan = await db.select().from(patientPlansTable).where(eq(patientPlansTable.patientId, patient.id)).limit(1);
  if (existingPlan.length === 0) {
    await db.insert(patientPlansTable).values({
      patientId: patient.id,
      nutritionPlan: "1800 kcal/day — low GI diet with 3 meals and 2 snacks. Avoid refined carbs and sugary drinks. Focus on legumes, whole grains, and vegetables.",
      activityPlan: "30-min brisk walk daily. Add 2x resistance training per week. Target 8000 steps/day.",
      weeklyGoals: "Log all meals, complete 5 check-ins this week, maintain glucose below 140 post-meal.",
    });
    console.log("✅ Patient plan created");
  }

  // ─── 6. Check-ins (last 14 days) ─────────────────────────────────────────
  const existingCheckins = await db.select().from(checkinsTable).where(eq(checkinsTable.patientId, patient.id)).limit(1);
  if (existingCheckins.length === 0) {
    const moods = ["happy", "neutral", "tired", "stressed", "happy", "neutral", "happy"];
    const energies = ["high", "medium", "low", "medium", "high", "high", "medium"];
    const meals = ["yes", "yes", "partial", "yes", "no", "yes", "yes"];
    for (let i = 13; i >= 0; i--) {
      const idx = i % 7;
      await db.insert(checkinsTable).values({
        patientId: patient.id,
        mealsFollowed: meals[idx],
        activityCompleted: idx !== 4,
        energyLevel: energies[idx],
        mood: moods[idx],
        glucoseReading: 95 + Math.round(Math.random() * 30),
        notes: i === 0 ? "Feeling great today. Sticking to the plan!" : null,
        createdAt: daysAgo(i),
      });
    }
    console.log("✅ 14 check-ins seeded");
  }

  // ─── 7. Metrics — weight (last 8 weeks) ──────────────────────────────────
  const existingMetrics = await db.select().from(metricsTable).where(eq(metricsTable.patientId, patient.id)).limit(1);
  if (existingMetrics.length === 0) {
    const weights = [92.5, 91.8, 91.0, 90.4, 89.9, 89.3, 88.8, 88.3];
    const glucoses = [148, 142, 138, 135, 132, 128, 124, 120];
    for (let w = 0; w < 8; w++) {
      await db.insert(metricsTable).values({
        patientId: patient.id,
        type: "weight",
        value: weights[w],
        date: dateStr((7 - w) * 7),
        notes: null,
      });
      await db.insert(metricsTable).values({
        patientId: patient.id,
        type: "glucose",
        value: glucoses[w],
        date: dateStr((7 - w) * 7),
        notes: w === 0 ? "Baseline reading" : null,
      });
    }
    console.log("✅ Weight & glucose metrics seeded");
  }

  // ─── 8. Appointments ──────────────────────────────────────────────────────
  const existingAppts = await db.select().from(appointmentsTable).where(eq(appointmentsTable.patientId, patient.id)).limit(1);
  if (existingAppts.length === 0) {
    const upcoming = new Date();
    upcoming.setDate(upcoming.getDate() + 3);
    upcoming.setHours(11, 0, 0, 0);
    await db.insert(appointmentsTable).values({
      patientId: patient.id,
      careTeamMember: "Dr. Arjun Mehta",
      role: "Physician",
      scheduledAt: upcoming,
      status: "upcoming",
      notes: "Monthly review — check HbA1c and weight progress",
    });
    const past = new Date();
    past.setDate(past.getDate() - 14);
    past.setHours(10, 0, 0, 0);
    await db.insert(appointmentsTable).values({
      patientId: patient.id,
      careTeamMember: "Priya Nair",
      role: "Dietician",
      scheduledAt: past,
      status: "completed",
      notes: "Nutrition plan review — updated meal timings",
    });
    console.log("✅ Appointments seeded");
  }

  // ─── 9. Tips ──────────────────────────────────────────────────────────────
  const existingTips = await db.select().from(tipsTable).limit(1);
  if (existingTips.length === 0) {
    await db.insert(tipsTable).values([
      { title: "Eat protein first", body: "Starting meals with protein reduces glucose spikes by slowing carbohydrate absorption.", category: "nutrition", icon: "🥚" },
      { title: "2-minute morning walk", body: "A short walk after waking up helps regulate cortisol and sets a positive tone for the day.", category: "activity", icon: "🚶" },
      { title: "Sleep before midnight", body: "Poor sleep disrupts hunger hormones and increases cravings. Aim for 7–8 hours consistently.", category: "lifestyle", icon: "😴" },
      { title: "Hydrate before meals", body: "Drinking 250ml of water before eating helps with portion control and digestion.", category: "nutrition", icon: "💧" },
      { title: "Track your wins", body: "Celebrate small consistent behaviours — they compound into lasting results.", category: "mindset", icon: "🏆" },
    ]);
    console.log("✅ Tips seeded");
  }

  // ─── 10. Additional sample patients for ops/coach dashboards ──────────────
  const samplePatients = [
    { name: "Neha Iyer", phone: "9123456789", email: "neha@demo.com", goal: "diabetes_management", plan: "premium", weight: 74.2, risk: "low" },
    { name: "Siddharth Verma", phone: "9234567890", email: "sid@demo.com", goal: "weight_loss", plan: "basic", weight: 98.1, risk: "high" },
    { name: "Aarti Desai", phone: "9345678901", email: "aarti@demo.com", goal: "weight_loss", plan: "premium", weight: 82.0, risk: "low" },
    { name: "Vikram Singh", phone: "9456789012", email: "vikram@demo.com", goal: "diabetes_management", plan: "comprehensive", weight: 89.5, risk: "low" },
    { name: "Priya Nair", phone: "9567890123", email: "priya@demo.com", goal: "weight_loss", plan: "basic", weight: 68.0, risk: "low" },
    { name: "Rohit Kumar", phone: "9678901234", email: "rohit@demo.com", goal: "weight_loss", plan: "comprehensive", weight: 105.3, risk: "high" },
  ];

  for (const p of samplePatients) {
    const existing = await db.select().from(usersTable).where(eq(usersTable.phone, p.phone)).limit(1);
    if (existing.length === 0) {
      const [u] = await db.insert(usersTable).values({
        fullName: p.name,
        phone: p.phone,
        email: p.email,
        passwordHash: hash("demo123"),
        role: "patient",
        city: "Indore",
      }).returning();
      const [pt] = await db.insert(patientsTable).values({
        userId: u.id,
        primaryGoal: p.goal,
        plan: p.plan,
        weekNumber: Math.ceil(Math.random() * 12) + 1,
        startingWeight: p.weight + 5,
        currentWeight: p.weight,
        targetWeight: p.weight - 12,
        assignedCoachId: physician.id,
        status: "active",
        riskLevel: p.risk as "low" | "high",
      }).returning();
      // Seed a few check-ins for each
      for (let i = 6; i >= 0; i--) {
        await db.insert(checkinsTable).values({
          patientId: pt.id,
          mealsFollowed: i % 3 === 0 ? "no" : "yes",
          activityCompleted: i % 4 !== 0,
          energyLevel: ["high", "medium", "low"][i % 3],
          mood: ["happy", "neutral", "stressed"][i % 3],
          glucoseReading: 90 + Math.round(Math.random() * 50),
          createdAt: daysAgo(i),
        });
      }
    }
  }
  console.log("✅ Sample patients seeded");

  console.log("\n✅ Seed complete!\n");
  console.log("Demo credentials:");
  console.log("  Patient:   patient@cloudberry.health / demo123");
  console.log("  Physician: physician@cloudberry.health / demo123");
  console.log("  Ops:       ops@cloudberry.health / demo123\n");
}

seed()
  .then(() => pool.end())
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    pool.end();
    process.exit(1);
  });
