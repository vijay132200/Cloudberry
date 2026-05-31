import { createHash } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "./index";
import {
  usersTable, staffTable, patientsTable,
  checkinsTable, appointmentsTable, metricsTable, patientPlansTable,
  patientNotesTable, tipsTable,
} from "./schema";

function hash(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

const DEMO_PW = hash("demo123");

async function seed() {
  // ── Destructive-action guardrail ───────────────────────────────────────
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DESTRUCTIVE_SEED !== "true") {
    console.error("❌ Refusing to seed: NODE_ENV=production. Set ALLOW_DESTRUCTIVE_SEED=true to override.");
    process.exit(1);
  }

  console.log("🌱 Seeding database...\n");

  // ── WIPE existing data (dev only) ──────────────────────────────────────
  console.log("Clearing existing data...");
  await db.delete(tipsTable);
  await db.delete(metricsTable);
  await db.delete(appointmentsTable);
  await db.delete(checkinsTable);
  await db.delete(patientNotesTable);
  await db.delete(patientPlansTable);
  await db.delete(patientsTable);
  await db.delete(usersTable);
  await db.delete(staffTable);
  console.log("  ✔ Cleared\n");

  // ── STAFF ──────────────────────────────────────────────────────────────
  console.log("Seeding staff...");

  const staffRows = [
    // Ops
    { fullName: "Priya Nair", email: "ops@cloudberry.health", role: "ops", specialty: null },
    { fullName: "Arjun Kapoor", email: "ops2@cloudberry.health", role: "ops", specialty: null },
    // Physicians
    { fullName: "Dr. Sneha Mehta", email: "dr.mehta@cloudberry.health", role: "physician", specialty: "Endocrinologist & Diabetologist" },
    { fullName: "Dr. Raj Patel", email: "dr.raj@cloudberry.health", role: "physician", specialty: "Internal Medicine" },
    { fullName: "Dr. Priya Singh", email: "dr.priya@cloudberry.health", role: "physician", specialty: "Metabolic & Lifestyle Medicine" },
    // Dieticians
    { fullName: "Priya Sharma", email: "priya.diet@cloudberry.health", role: "dietician", specialty: "Clinical Nutritionist" },
    { fullName: "Kavya Nair", email: "kavya.diet@cloudberry.health", role: "dietician", specialty: "Sports & Therapeutic Nutrition" },
    { fullName: "Rohan Verma", email: "rohan.diet@cloudberry.health", role: "dietician", specialty: "Diabetes & PCOS Nutrition" },
    // Caretakers
    { fullName: "Ranjit Kumar", email: "ranjit.care@cloudberry.health", role: "caretaker", specialty: "Senior Care Coordinator" },
    { fullName: "Sunita Rao", email: "sunita.care@cloudberry.health", role: "caretaker", specialty: "Patient Support Specialist" },
    { fullName: "Mahesh Iyer", email: "mahesh.care@cloudberry.health", role: "caretaker", specialty: "Health & Wellness Coach" },
  ];

  const staffIds: Record<string, number> = {};
  for (const s of staffRows) {
    const [inserted] = await db.insert(staffTable).values({
      fullName: s.fullName, email: s.email,
      passwordHash: DEMO_PW, role: s.role, specialty: s.specialty,
    }).returning();
    staffIds[s.email] = inserted.id;
    console.log(`  ✔ ${s.role}: ${s.email}`);
  }

  const physicians = [staffIds["dr.mehta@cloudberry.health"], staffIds["dr.raj@cloudberry.health"], staffIds["dr.priya@cloudberry.health"]];
  const dieticians = [staffIds["priya.diet@cloudberry.health"], staffIds["kavya.diet@cloudberry.health"], staffIds["rohan.diet@cloudberry.health"]];
  const caretakers = [staffIds["ranjit.care@cloudberry.health"], staffIds["sunita.care@cloudberry.health"], staffIds["mahesh.care@cloudberry.health"]];

  // ── PATIENTS ────────────────────────────────────────────────────────────
  console.log("\nSeeding patients...");

  const patientRows = [
    { fullName: "Rahul Sharma", phone: "9876543210", email: "rahul.sharma@email.com", city: "Mumbai", plan: "comprehensive", primaryGoal: "weight_loss", startingWeight: 98, currentWeight: 91, targetWeight: 78, weekNumber: 8, riskLevel: "low", physicianIdx: 0, dieticianIdx: 0, caretakerIdx: 0 },
    { fullName: "Ananya Patel", phone: "9765432109", email: "ananya.patel@email.com", city: "Ahmedabad", plan: "premium", primaryGoal: "diabetes_reversal", startingWeight: 82, currentWeight: 79, targetWeight: 68, weekNumber: 12, riskLevel: "high", physicianIdx: 1, dieticianIdx: 2, caretakerIdx: 1 },
    { fullName: "Vikram Singh", phone: "9654321098", email: "vikram.singh@email.com", city: "Delhi", plan: "basic", primaryGoal: "weight_loss", startingWeight: 105, currentWeight: 102, targetWeight: 85, weekNumber: 3, riskLevel: "medium", physicianIdx: 2, dieticianIdx: 1, caretakerIdx: 2 },
    { fullName: "Meera Iyer", phone: "9543210987", email: "meera.iyer@email.com", city: "Chennai", plan: "premium", primaryGoal: "pcos_management", startingWeight: 76, currentWeight: 73, targetWeight: 62, weekNumber: 6, riskLevel: "medium", physicianIdx: 0, dieticianIdx: 2, caretakerIdx: 0 },
    { fullName: "Karan Malhotra", phone: "9432109876", email: "karan.malhotra@email.com", city: "Bengaluru", plan: "comprehensive", primaryGoal: "cholesterol_control", startingWeight: 89, currentWeight: 86, targetWeight: 75, weekNumber: 5, riskLevel: "low", physicianIdx: 1, dieticianIdx: 0, caretakerIdx: 1 },
    { fullName: "Divya Reddy", phone: "9321098765", email: "divya.reddy@email.com", city: "Hyderabad", plan: "basic", primaryGoal: "weight_loss", startingWeight: 78, currentWeight: 77, targetWeight: 65, weekNumber: 2, riskLevel: "low", physicianIdx: 2, dieticianIdx: 1, caretakerIdx: 2 },
    { fullName: "Arjun Nair", phone: "9210987654", email: "arjun.nair@email.com", city: "Kochi", plan: "comprehensive", primaryGoal: "diabetes_reversal", startingWeight: 91, currentWeight: 88, targetWeight: 76, weekNumber: 10, riskLevel: "high", physicianIdx: 0, dieticianIdx: 0, caretakerIdx: 0 },
    { fullName: "Preethi Menon", phone: "9109876543", email: "preethi.menon@email.com", city: "Pune", plan: "premium", primaryGoal: "pcos_management", startingWeight: 72, currentWeight: 69, targetWeight: 58, weekNumber: 7, riskLevel: "medium", physicianIdx: 1, dieticianIdx: 2, caretakerIdx: 1 },
  ];

  for (const p of patientRows) {
    const [user] = await db.insert(usersTable).values({
      fullName: p.fullName, phone: p.phone, email: p.email,
      passwordHash: DEMO_PW, role: "patient", city: p.city,
    }).returning();

    const physicianId = physicians[p.physicianIdx];
    const dieticianId = dieticians[p.dieticianIdx];
    const caretakerId = caretakers[p.caretakerIdx];
    const [patient] = await db.insert(patientsTable).values({
      userId: user.id, primaryGoal: p.primaryGoal, plan: p.plan,
      weekNumber: p.weekNumber, startingWeight: p.startingWeight,
      currentWeight: p.currentWeight, targetWeight: p.targetWeight,
      assignedCoachId: physicianId,
      assignedPhysicianId: physicianId,
      assignedDieticianId: dieticianId,
      assignedCaretakerId: caretakerId,
      status: "active", riskLevel: p.riskLevel,
    }).returning();

    await db.insert(patientPlansTable).values({
      patientId: patient.id,
      nutritionPlan: `Personalised ${p.plan} nutrition plan for ${p.primaryGoal.replace(/_/g, " ")}. 5 small balanced meals. High protein, low refined carbs.`,
      activityPlan: "30 min brisk walk daily. 2×/week strength training. Evening yoga 3×/week.",
      weeklyGoals: "Lose 0.5 kg. Log all meals. Complete all 7 daily check-ins.",
    });

    // Check-ins (8–14 per patient) — batch insert
    const checkinCount = 8 + Math.floor(Math.random() * 7);
    const meals = ["yes", "mostly", "partially", "no"];
    const energy = ["good", "moderate", "low"];
    const moods = ["great", "good", "neutral", "tired"];
    const isMetabolic = p.primaryGoal === "diabetes_reversal" || p.primaryGoal === "pcos_management";
    const glucoseBase = isMetabolic ? 145 : 95;

    const checkinValues = [];
    for (let i = checkinCount; i >= 1; i--) {
      const date = new Date(); date.setDate(date.getDate() - i);
      checkinValues.push({
        patientId: patient.id,
        mealsFollowed: meals[Math.floor(Math.random() * (i < 3 ? 2 : 4))],
        activityCompleted: Math.random() > 0.35,
        energyLevel: energy[Math.floor(Math.random() * 3)],
        mood: moods[Math.floor(Math.random() * 4)],
        glucoseReading: isMetabolic
          ? Number((glucoseBase - i * 0.6 + (Math.random() * 12 - 6)).toFixed(1))
          : null,
        notes: i % 4 === 0 ? "Feeling consistent, managing cravings better." : null,
        createdAt: date,
      });
    }
    await db.insert(checkinsTable).values(checkinValues);

    // Metrics (weight, optionally glucose, sleep + hunger) — batch insert
    const metricValues: any[] = [];
    for (let i = checkinCount; i >= 1; i--) {
      const wd = new Date(); wd.setDate(wd.getDate() - i * 3);
      const weight = p.startingWeight - ((p.startingWeight - p.currentWeight) * (1 - i / checkinCount));
      metricValues.push({ patientId: patient.id, type: "weight", value: Number(weight.toFixed(1)), date: wd.toISOString().split("T")[0] });
    }
    for (let i = checkinCount; i >= 1; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      if (isMetabolic) {
        metricValues.push({ patientId: patient.id, type: "glucose", value: Number((glucoseBase - i * 0.6 + (Math.random() * 8 - 4)).toFixed(1)), date: ds });
      }
      metricValues.push({ patientId: patient.id, type: "sleep_hours", value: Number((5.5 + Math.random() * 3).toFixed(1)), date: ds });
      metricValues.push({ patientId: patient.id, type: "hunger_score", value: Math.floor(1 + Math.random() * 5), date: ds });
    }
    await db.insert(metricsTable).values(metricValues);

    // Appointments (3 upcoming per patient) — batch insert
    const careTeam = [
      { name: "Dr. Sneha Mehta", role: "Physician" },
      { name: "Priya Sharma", role: "Dietician" },
      { name: "Ranjit Kumar", role: "Caretaker" },
    ];
    const apptValues = [0, 1, 2].map(i => {
      const apptDate = new Date(); apptDate.setDate(apptDate.getDate() + (i + 1) * 7);
      return { patientId: patient.id, careTeamMember: careTeam[i].name, role: careTeam[i].role, scheduledAt: apptDate, status: "upcoming" };
    });
    await db.insert(appointmentsTable).values(apptValues);
    console.log(`  ✔ ${p.fullName} (${p.plan}, ${checkinCount} check-ins)`);
  }

  // ── TIPS ────────────────────────────────────────────────────────────────
  console.log("\nSeeding tips...");
  const tipsData = [
    { title: "Stay Hydrated", body: "Drink at least 8–10 glasses of water daily. Dehydration can mimic hunger and slow metabolism.", category: "nutrition" },
    { title: "Eat Protein at Every Meal", body: "Include a palm-sized portion of protein (eggs, dal, paneer, chicken) at every meal to stay full longer and protect muscle mass.", category: "nutrition" },
    { title: "Chew Slowly", body: "Eating slowly gives your brain time to register fullness. Aim for 20–25 chews per bite to reduce overeating.", category: "nutrition" },
    { title: "Don't Skip Breakfast", body: "A balanced breakfast with protein and fibre sets the metabolic tone for the day. Skipping it often leads to cravings by noon.", category: "nutrition" },
    { title: "Walk After Meals", body: "A 10-minute walk after each meal significantly improves post-meal glucose levels and aids digestion.", category: "fitness" },
    { title: "Strength Train Twice a Week", body: "Resistance training builds muscle which burns more calories at rest. Even bodyweight exercises at home make a big difference.", category: "fitness" },
    { title: "Track Your Steps", body: "Aim for 8,000–10,000 steps per day. Use your phone's pedometer or a basic fitness band to stay accountable.", category: "fitness" },
    { title: "Prioritise Sleep", body: "Poor sleep raises cortisol and hunger hormones (ghrelin). Aim for 7–8 hours. Consistent sleep times matter more than duration alone.", category: "lifestyle" },
    { title: "Manage Stress Daily", body: "Chronic stress spikes cortisol, which promotes fat storage. Even 5 minutes of deep breathing or a short walk helps reset your system.", category: "lifestyle" },
    { title: "Limit Late-Night Eating", body: "Your metabolism slows at night. Try to finish dinner 2–3 hours before bedtime to improve fat burning and sleep quality.", category: "lifestyle" },
    { title: "Read Food Labels", body: "Hidden sugars appear under 60+ names (dextrose, maltose, fructose syrup). Check the ingredients list, not just the 'sugar' figure.", category: "nutrition" },
    { title: "Control Portions with Your Hand", body: "Fist = carbs, palm = protein, thumb = fats. This simple visual guide works anywhere without weighing food.", category: "nutrition" },
    { title: "Replace Refined Carbs", body: "Swap white rice/bread for millets, oats, or whole wheat. They digest slower, keeping glucose levels stable for longer.", category: "nutrition" },
    { title: "Stay Consistent on Weekends", body: "Weekend dietary slip-ups erase most weekday progress. Plan one enjoyable meal, not an entire day off the plan.", category: "lifestyle" },
    { title: "Celebrate Non-Scale Wins", body: "Better sleep, more energy, and improved mood are signs your metabolism is healing — even if the scale hasn't moved yet.", category: "lifestyle" },
  ];
  await db.insert(tipsTable).values(tipsData);
  console.log(`  ✔ ${tipsData.length} tips seeded`);

  console.log("\n✅ Seed complete!");
  console.log("\n─── Demo Credentials (password: demo123 for ALL accounts) ───");
  console.log("Patients:");
  for (const p of patientRows) console.log(`  ${p.fullName.padEnd(20)} ${p.phone}  (${p.plan})`);
  console.log("\nPhysicians:");
  console.log("  Dr. Sneha Mehta      dr.mehta@cloudberry.health");
  console.log("  Dr. Raj Patel        dr.raj@cloudberry.health");
  console.log("  Dr. Priya Singh      dr.priya@cloudberry.health");
  console.log("\nDieticians:");
  console.log("  Priya Sharma         priya.diet@cloudberry.health");
  console.log("  Kavya Nair           kavya.diet@cloudberry.health");
  console.log("  Rohan Verma          rohan.diet@cloudberry.health");
  console.log("\nCaretakers:");
  console.log("  Ranjit Kumar         ranjit.care@cloudberry.health");
  console.log("  Sunita Rao           sunita.care@cloudberry.health");
  console.log("  Mahesh Iyer          mahesh.care@cloudberry.health");
  console.log("\nOperations:");
  console.log("  Priya Nair           ops@cloudberry.health");
  console.log("  Arjun Kapoor         ops2@cloudberry.health");
  process.exit(0);
}

seed().catch(err => { console.error("Seed failed:", err); process.exit(1); });
