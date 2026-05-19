import { createHash } from "crypto";
import { db, pool } from "@workspace/db";
import {
  usersTable, staffTable, patientsTable, checkinsTable,
  metricsTable, appointmentsTable, tipsTable, patientPlansTable, patientNotesTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";

function hash(p: string) { return createHash("sha256").update(p).digest("hex"); }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d; }
function dateStr(n: number) { return daysAgo(n).toISOString().split("T")[0]; }

async function upsertStaff(email: string, data: any) {
  const [ex] = await db.select().from(staffTable).where(eq(staffTable.email, email)).limit(1);
  if (ex) {
    await db.update(staffTable).set({ passwordHash: hash("demo123"), role: data.role, fullName: data.fullName, specialty: data.specialty }).where(eq(staffTable.email, email));
    console.log(`✅ Staff updated: ${email} (role: ${data.role})`);
    const [updated] = await db.select().from(staffTable).where(eq(staffTable.email, email)).limit(1);
    return updated;
  }
  const [s] = await db.insert(staffTable).values({ ...data, passwordHash: hash("demo123") }).returning();
  console.log(`✅ Staff created: ${email} (role: ${data.role})`);
  return s;
}

async function upsertPatientUser(email: string, phone: string, data: any) {
  const [ex] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (ex) {
    await db.update(usersTable).set({ passwordHash: hash("demo123") }).where(eq(usersTable.email, email));
    return ex;
  }
  const [u] = await db.insert(usersTable).values({
    ...data, phone, email, passwordHash: hash("demo123"), role: "patient",
  }).returning();
  return u;
}

async function seedCheckins(patientId: number, days: number) {
  const [ex] = await db.select().from(checkinsTable).where(eq(checkinsTable.patientId, patientId)).limit(1);
  if (ex) return;
  const moods = ["happy", "neutral", "tired", "stressed", "happy", "neutral", "happy"];
  const energies = ["high", "medium", "low", "medium", "high", "high", "medium"];
  const meals = ["yes", "yes", "partial", "yes", "no", "yes", "yes"];
  for (let i = days - 1; i >= 0; i--) {
    const idx = i % 7;
    await db.insert(checkinsTable).values({
      patientId, mealsFollowed: meals[idx], activityCompleted: idx !== 4,
      energyLevel: energies[idx], mood: moods[idx],
      glucoseReading: 90 + Math.round(Math.random() * 55),
      notes: i === 0 ? "Following the plan well today." : null,
      createdAt: daysAgo(i),
    });
  }
}

async function seedMetrics(patientId: number, weeks: number, startWeight: number, startGlucose: number) {
  const [ex] = await db.select().from(metricsTable).where(eq(metricsTable.patientId, patientId)).limit(1);
  if (ex) return;
  for (let w = 0; w < weeks; w++) {
    await db.insert(metricsTable).values({
      patientId, type: "weight", value: startWeight - w * 0.4,
      date: dateStr((weeks - w - 1) * 7), notes: w === 0 ? "Starting weight" : null,
    });
    await db.insert(metricsTable).values({
      patientId, type: "glucose", value: startGlucose - w * 2,
      date: dateStr((weeks - w - 1) * 7), notes: w === 0 ? "Baseline" : null,
    });
  }
}

async function seedAppointments(patientId: number, careTeamMember: string, role: string) {
  const [ex] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.patientId, patientId)).limit(1);
  if (ex) return;
  const upcoming = new Date(); upcoming.setDate(upcoming.getDate() + 3); upcoming.setHours(11, 0, 0, 0);
  await db.insert(appointmentsTable).values({
    patientId, careTeamMember, role, scheduledAt: upcoming, status: "upcoming",
    notes: "Monthly review — check weight and glucose progress",
  });
  const past = new Date(); past.setDate(past.getDate() - 14); past.setHours(10, 0, 0, 0);
  await db.insert(appointmentsTable).values({
    patientId, careTeamMember: "Priya Sharma", role: "Dietician",
    scheduledAt: past, status: "completed",
    notes: "Nutrition plan review and meal timing adjustments",
  });
}

async function seedPlan(patientId: number) {
  const [ex] = await db.select().from(patientPlansTable).where(eq(patientPlansTable.patientId, patientId)).limit(1);
  if (ex) return;
  await db.insert(patientPlansTable).values({
    patientId,
    nutritionPlan: "1800 kcal/day — low GI diet with 3 meals and 2 snacks. Avoid refined carbs and sugary drinks.",
    activityPlan: "30-min brisk walk daily. 2× resistance training per week. Target 8000 steps/day.",
    weeklyGoals: "Log all meals, complete 5 check-ins this week, maintain glucose below 140 post-meal.",
  });
}

async function seed() {
  console.log("🌱 Seeding comprehensive demo data...\n");

  // ─── STAFF ────────────────────────────────────────────────────────────────
  const ops = await upsertStaff("ops@cloudberry.health", {
    fullName: "Neha Iyer", email: "ops@cloudberry.health", role: "ops", specialty: "Operations Management",
  });

  const physician = await upsertStaff("physician@cloudberry.health", {
    fullName: "Dr. Arjun Mehta", email: "physician@cloudberry.health", role: "physician", specialty: "Endocrinology & Metabolic Disorders",
  });

  const dietician = await upsertStaff("dietician@cloudberry.health", {
    fullName: "Priya Sharma", email: "dietician@cloudberry.health", role: "dietician", specialty: "Clinical Nutrition & Dietetics",
  });

  const caretaker = await upsertStaff("caretaker@cloudberry.health", {
    fullName: "Rajesh Kumar", email: "caretaker@cloudberry.health", role: "caretaker", specialty: "Patient Care Coordination",
  });

  console.log(`\n📋 Staff IDs — Ops: ${ops.id} | Physician: ${physician.id} | Dietician: ${dietician.id} | Caretaker: ${caretaker.id}\n`);

  // ─── PATIENTS — 3 per plan × 3 data levels ───────────────────────────────
  // COMPREHENSIVE PLAN (1-month data) — main demo patient
  const u1 = await upsertPatientUser("patient@cloudberry.health", "9876543210", {
    fullName: "Rahul Sharma", city: "Indore",
  });
  const [ep1] = await db.select().from(patientsTable).where(eq(patientsTable.userId, u1.id)).limit(1);
  const p1 = ep1 || (await db.insert(patientsTable).values({
    userId: u1.id, primaryGoal: "weight_loss", plan: "comprehensive",
    weekNumber: 8, startingWeight: 92.5, currentWeight: 88.3, targetWeight: 78.0,
    assignedCoachId: physician.id, status: "active", riskLevel: "low",
  }).returning())[0];
  await seedPlan(p1.id);
  await seedCheckins(p1.id, 30);
  await seedMetrics(p1.id, 8, 92.5, 148);
  await seedAppointments(p1.id, "Dr. Arjun Mehta", "Physician");
  console.log(`✅ patient@cloudberry.health — ID #${u1.id} (patient #${p1.id}) — Comprehensive — 1 month data`);

  // BASIC PLAN (1-month data)
  const u2 = await upsertPatientUser("patient.basic@cloudberry.health", "9812345670", {
    fullName: "Amit Joshi", city: "Indore",
  });
  const [ep2] = await db.select().from(patientsTable).where(eq(patientsTable.userId, u2.id)).limit(1);
  const p2 = ep2 || (await db.insert(patientsTable).values({
    userId: u2.id, primaryGoal: "weight_loss", plan: "basic",
    weekNumber: 6, startingWeight: 98.0, currentWeight: 95.1, targetWeight: 82.0,
    assignedCoachId: caretaker.id, status: "active", riskLevel: "low",
  }).returning())[0];
  await seedPlan(p2.id);
  await seedCheckins(p2.id, 28);
  await seedMetrics(p2.id, 6, 98.0, 135);
  await seedAppointments(p2.id, "Rajesh Kumar", "Caretaker");
  console.log(`✅ patient.basic@cloudberry.health — ID #${u2.id} (patient #${p2.id}) — Basic — 1 month data`);

  // PREMIUM PLAN (1-month data)
  const u3 = await upsertPatientUser("patient.premium@cloudberry.health", "9823456780", {
    fullName: "Kavitha Reddy", city: "Hyderabad",
  });
  const [ep3] = await db.select().from(patientsTable).where(eq(patientsTable.userId, u3.id)).limit(1);
  const p3 = ep3 || (await db.insert(patientsTable).values({
    userId: u3.id, primaryGoal: "diabetes_management", plan: "premium",
    weekNumber: 10, startingWeight: 74.5, currentWeight: 71.2, targetWeight: 62.0,
    assignedCoachId: physician.id, status: "active", riskLevel: "medium",
  }).returning())[0];
  await seedPlan(p3.id);
  await seedCheckins(p3.id, 30);
  await seedMetrics(p3.id, 10, 74.5, 162);
  await seedAppointments(p3.id, "Dr. Arjun Mehta", "Physician");
  console.log(`✅ patient.premium@cloudberry.health — ID #${u3.id} (patient #${p3.id}) — Premium — 1 month data`);

  // ─── COMPREHENSIVE PLAN (1-week data) ────────────────────────────────────
  const u4 = await upsertPatientUser("patient.comp.week@cloudberry.health", "9834567890", {
    fullName: "Sunita Patel", city: "Pune",
  });
  const [ep4] = await db.select().from(patientsTable).where(eq(patientsTable.userId, u4.id)).limit(1);
  const p4 = ep4 || (await db.insert(patientsTable).values({
    userId: u4.id, primaryGoal: "both", plan: "comprehensive",
    weekNumber: 2, startingWeight: 82.0, currentWeight: 81.2, targetWeight: 70.0,
    assignedCoachId: dietician.id, status: "active", riskLevel: "low",
  }).returning())[0];
  await seedPlan(p4.id);
  await seedCheckins(p4.id, 7);
  await seedMetrics(p4.id, 2, 82.0, 138);
  await seedAppointments(p4.id, "Priya Sharma", "Dietician");
  console.log(`✅ patient.comp.week@cloudberry.health — ID #${u4.id} (patient #${p4.id}) — Comprehensive — 1 week data`);

  // BASIC PLAN (1-week data)
  const u5 = await upsertPatientUser("patient.basic.week@cloudberry.health", "9845678901", {
    fullName: "Mohan Das", city: "Mumbai",
  });
  const [ep5] = await db.select().from(patientsTable).where(eq(patientsTable.userId, u5.id)).limit(1);
  const p5 = ep5 || (await db.insert(patientsTable).values({
    userId: u5.id, primaryGoal: "weight_loss", plan: "basic",
    weekNumber: 1, startingWeight: 105.0, currentWeight: 104.5, targetWeight: 88.0,
    assignedCoachId: caretaker.id, status: "active", riskLevel: "high",
  }).returning())[0];
  await seedPlan(p5.id);
  await seedCheckins(p5.id, 5);
  await seedMetrics(p5.id, 1, 105.0, 145);
  await seedAppointments(p5.id, "Rajesh Kumar", "Caretaker");
  console.log(`✅ patient.basic.week@cloudberry.health — ID #${u5.id} (patient #${p5.id}) — Basic — 1 week data`);

  // PREMIUM PLAN (1-week data)
  const u6 = await upsertPatientUser("patient.premium.week@cloudberry.health", "9856789012", {
    fullName: "Ananya Krishnan", city: "Chennai",
  });
  const [ep6] = await db.select().from(patientsTable).where(eq(patientsTable.userId, u6.id)).limit(1);
  const p6 = ep6 || (await db.insert(patientsTable).values({
    userId: u6.id, primaryGoal: "diabetes_management", plan: "premium",
    weekNumber: 2, startingWeight: 68.0, currentWeight: 67.5, targetWeight: 58.0,
    assignedCoachId: physician.id, status: "active", riskLevel: "low",
  }).returning())[0];
  await seedPlan(p6.id);
  await seedCheckins(p6.id, 6);
  await seedMetrics(p6.id, 2, 68.0, 155);
  await seedAppointments(p6.id, "Dr. Arjun Mehta", "Physician");
  console.log(`✅ patient.premium.week@cloudberry.health — ID #${u6.id} (patient #${p6.id}) — Premium — 1 week data`);

  // ─── NO ENTRY PATIENTS (just registered, no check-ins) ──────────────────
  const u7 = await upsertPatientUser("patient.basic.new@cloudberry.health", "9867890123", {
    fullName: "Vikram Singh", city: "Delhi",
  });
  const [ep7] = await db.select().from(patientsTable).where(eq(patientsTable.userId, u7.id)).limit(1);
  const p7 = ep7 || (await db.insert(patientsTable).values({
    userId: u7.id, primaryGoal: "weight_loss", plan: "basic",
    weekNumber: 1, startingWeight: 88.0, currentWeight: 88.0, targetWeight: 76.0,
    assignedCoachId: null, status: "active", riskLevel: "low",
  }).returning())[0];
  await seedPlan(p7.id);
  console.log(`✅ patient.basic.new@cloudberry.health — ID #${u7.id} (patient #${p7.id}) — Basic — no entries`);

  const u8 = await upsertPatientUser("patient.comp.new@cloudberry.health", "9878901234", {
    fullName: "Deepa Nair", city: "Kochi",
  });
  const [ep8] = await db.select().from(patientsTable).where(eq(patientsTable.userId, u8.id)).limit(1);
  const p8 = ep8 || (await db.insert(patientsTable).values({
    userId: u8.id, primaryGoal: "both", plan: "comprehensive",
    weekNumber: 1, startingWeight: 79.0, currentWeight: 79.0, targetWeight: 65.0,
    assignedCoachId: null, status: "active", riskLevel: "low",
  }).returning())[0];
  await seedPlan(p8.id);
  console.log(`✅ patient.comp.new@cloudberry.health — ID #${u8.id} (patient #${p8.id}) — Comprehensive — no entries`);

  const u9 = await upsertPatientUser("patient.premium.new@cloudberry.health", "9889012345", {
    fullName: "Ravi Varma", city: "Bengaluru",
  });
  const [ep9] = await db.select().from(patientsTable).where(eq(patientsTable.userId, u9.id)).limit(1);
  const p9 = ep9 || (await db.insert(patientsTable).values({
    userId: u9.id, primaryGoal: "diabetes_management", plan: "premium",
    weekNumber: 1, startingWeight: 91.0, currentWeight: 91.0, targetWeight: 78.0,
    assignedCoachId: null, status: "active", riskLevel: "low",
  }).returning())[0];
  await seedPlan(p9.id);
  console.log(`✅ patient.premium.new@cloudberry.health — ID #${u9.id} (patient #${p9.id}) — Premium — no entries`);

  // ─── ADDITIONAL SAMPLE PATIENTS for roster ────────────────────────────────
  const extras = [
    { name: "Neha Iyer", phone: "9123456789", email: "neha@demo.com", goal: "diabetes_management", plan: "premium", weight: 74.2, risk: "low", coachId: physician.id, city: "Surat" },
    { name: "Siddharth Verma", phone: "9234567890", email: "sid@demo.com", goal: "weight_loss", plan: "basic", weight: 98.1, risk: "high", coachId: caretaker.id, city: "Jaipur" },
    { name: "Aarti Desai", phone: "9345678901", email: "aarti@demo.com", goal: "weight_loss", plan: "premium", weight: 82.0, risk: "low", coachId: dietician.id, city: "Ahmedabad" },
    { name: "Rohit Kumar", phone: "9678901234", email: "rohit@demo.com", goal: "weight_loss", plan: "comprehensive", weight: 105.3, risk: "high", coachId: physician.id, city: "Nagpur" },
  ];

  for (const p of extras) {
    const [exu] = await db.select().from(usersTable).where(eq(usersTable.phone, p.phone)).limit(1);
    if (!exu) {
      const [u] = await db.insert(usersTable).values({
        fullName: p.name, phone: p.phone, email: p.email, city: p.city,
        passwordHash: hash("demo123"), role: "patient",
      }).returning();
      const [pt] = await db.insert(patientsTable).values({
        userId: u.id, primaryGoal: p.goal, plan: p.plan,
        weekNumber: Math.ceil(Math.random() * 10) + 1,
        startingWeight: p.weight + 5, currentWeight: p.weight,
        targetWeight: p.weight - 12, assignedCoachId: p.coachId,
        status: "active", riskLevel: p.risk as "low" | "high",
      }).returning();
      await seedCheckins(pt.id, 14);
    }
  }
  console.log("✅ Extra sample patients seeded");

  // ─── TIPS ─────────────────────────────────────────────────────────────────
  const [exTip] = await db.select().from(tipsTable).limit(1);
  if (!exTip) {
    await db.insert(tipsTable).values([
      { title: "Eat protein first", body: "Starting meals with protein reduces glucose spikes by slowing carbohydrate absorption.", category: "nutrition", icon: "🥚" },
      { title: "2-minute morning walk", body: "A short walk after waking helps regulate cortisol and sets a positive tone for the day.", category: "activity", icon: "🚶" },
      { title: "Sleep before midnight", body: "Poor sleep disrupts hunger hormones and increases cravings. Aim for 7–8 hours consistently.", category: "lifestyle", icon: "😴" },
      { title: "Hydrate before meals", body: "Drinking 250ml of water before eating helps with portion control and digestion.", category: "nutrition", icon: "💧" },
      { title: "Track your wins", body: "Celebrate small consistent behaviours — they compound into lasting results.", category: "mindset", icon: "🏆" },
      { title: "Limit screen time at night", body: "Blue light from screens disrupts melatonin. Use night mode after 9PM.", category: "lifestyle", icon: "📵" },
      { title: "Post-meal walk", body: "A 10-minute walk after eating significantly lowers post-meal glucose spikes.", category: "activity", icon: "🏃" },
    ]);
    console.log("✅ Tips seeded");
  }

  // ─── SUMMARY ─────────────────────────────────────────────────────────────
  console.log("\n✅ Seed complete!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("STAFF DEMO CREDENTIALS (all password: demo123)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Ops Admin  : ops@cloudberry.health`);
  console.log(`  Physician  : physician@cloudberry.health`);
  console.log(`  Dietician  : dietician@cloudberry.health`);
  console.log(`  Caretaker  : caretaker@cloudberry.health`);
  console.log("\nPATIENT DEMO CREDENTIALS (all password: demo123)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Comprehensive (1 month) : patient@cloudberry.health");
  console.log("  Basic (1 month)         : patient.basic@cloudberry.health");
  console.log("  Premium (1 month)       : patient.premium@cloudberry.health");
  console.log("  Comprehensive (1 week)  : patient.comp.week@cloudberry.health");
  console.log("  Basic (1 week)          : patient.basic.week@cloudberry.health");
  console.log("  Premium (1 week)        : patient.premium.week@cloudberry.health");
  console.log("  Comprehensive (new)     : patient.comp.new@cloudberry.health");
  console.log("  Basic (new)             : patient.basic.new@cloudberry.health");
  console.log("  Premium (new)           : patient.premium.new@cloudberry.health");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

seed()
  .then(() => pool.end())
  .catch((err) => { console.error("❌ Seed failed:", err); pool.end(); process.exit(1); });
