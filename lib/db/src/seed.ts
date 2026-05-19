import { eq } from "drizzle-orm";
import { db } from "./index";
import {
  usersTable,
  staffTable,
  patientsTable,
  checkinsTable,
  appointmentsTable,
  metricsTable,
  patientPlansTable,
} from "./schema";

const COACH_IDS: number[] = [];

async function seed() {
  console.log("Seeding database...");

  // ── Staff ──────────────────────────────────────────────────────────────
  const staffSeed = [
    { fullName: "Priya Nair", email: "ops@cloudberry.health", role: "ops", specialty: null },
    { fullName: "Arjun Kapoor", email: "admin@cloudberry.health", role: "ops", specialty: null },
    { fullName: "Dr. Sneha Mehta", email: "dr.mehta@cloudberry.health", role: "coach", specialty: "Endocrinologist" },
    { fullName: "Kavya Sharma", email: "coach@cloudberry.health", role: "coach", specialty: "Certified Dietician" },
    { fullName: "Rohan Verma", email: "dietician@cloudberry.health", role: "coach", specialty: "Sports Nutritionist" },
  ];

  for (const s of staffSeed) {
    const existing = await db.select().from(staffTable).where(eq(staffTable.email, s.email)).limit(1);
    if (existing.length === 0) {
      const [inserted] = await db.insert(staffTable).values({
        fullName: s.fullName,
        email: s.email,
        passwordHash: "demo",
        role: s.role,
        specialty: s.specialty,
      }).returning();
      if (s.role === "coach") COACH_IDS.push(inserted.id);
      console.log(`  ✔ staff: ${s.email}`);
    } else {
      if (s.role === "coach") COACH_IDS.push(existing[0].id);
      console.log(`  – staff already exists: ${s.email}`);
    }
  }

  // ── Patients ────────────────────────────────────────────────────────────
  const patientsSeed = [
    {
      fullName: "Rahul Sharma",
      phone: "9876543210",
      email: "rahul.sharma@email.com",
      city: "Mumbai",
      plan: "comprehensive",
      primaryGoal: "weight_loss",
      startingWeight: 98,
      currentWeight: 91,
      targetWeight: 78,
      weekNumber: 8,
      riskLevel: "low",
      coachIdx: 0,
    },
    {
      fullName: "Ananya Patel",
      phone: "9765432109",
      email: "ananya.patel@email.com",
      city: "Ahmedabad",
      plan: "premium",
      primaryGoal: "diabetes_reversal",
      startingWeight: 82,
      currentWeight: 79,
      targetWeight: 68,
      weekNumber: 12,
      riskLevel: "high",
      coachIdx: 1,
    },
    {
      fullName: "Vikram Singh",
      phone: "9654321098",
      email: "vikram.singh@email.com",
      city: "Delhi",
      plan: "basic",
      primaryGoal: "weight_loss",
      startingWeight: 105,
      currentWeight: 102,
      targetWeight: 85,
      weekNumber: 3,
      riskLevel: "medium",
      coachIdx: 2,
    },
    {
      fullName: "Meera Iyer",
      phone: "9543210987",
      email: "meera.iyer@email.com",
      city: "Chennai",
      plan: "premium",
      primaryGoal: "pcos_management",
      startingWeight: 76,
      currentWeight: 73,
      targetWeight: 62,
      weekNumber: 6,
      riskLevel: "medium",
      coachIdx: 0,
    },
    {
      fullName: "Karan Malhotra",
      phone: "9432109876",
      email: "karan.malhotra@email.com",
      city: "Bengaluru",
      plan: "comprehensive",
      primaryGoal: "cholesterol_control",
      startingWeight: 89,
      currentWeight: 86,
      targetWeight: 75,
      weekNumber: 5,
      riskLevel: "low",
      coachIdx: 1,
    },
  ];

  for (const p of patientsSeed) {
    const existingUser = await db.select().from(usersTable).where(eq(usersTable.phone, p.phone)).limit(1);
    let userId: number;
    if (existingUser.length === 0) {
      const [user] = await db.insert(usersTable).values({
        fullName: p.fullName,
        phone: p.phone,
        email: p.email,
        passwordHash: "demo",
        role: "patient",
        city: p.city,
      }).returning();
      userId = user.id;
      console.log(`  ✔ user: ${p.phone} (${p.fullName})`);
    } else {
      userId = existingUser[0].id;
      console.log(`  – user already exists: ${p.phone}`);
    }

    const existingPatient = await db.select().from(patientsTable).where(eq(patientsTable.userId, userId)).limit(1);
    let patientId: number;
    if (existingPatient.length === 0) {
      const coachId = COACH_IDS[p.coachIdx] ?? null;
      const [patient] = await db.insert(patientsTable).values({
        userId,
        primaryGoal: p.primaryGoal,
        plan: p.plan,
        weekNumber: p.weekNumber,
        startingWeight: p.startingWeight,
        currentWeight: p.currentWeight,
        targetWeight: p.targetWeight,
        assignedCoachId: coachId,
        status: "active",
        riskLevel: p.riskLevel,
      }).returning();
      patientId = patient.id;
      console.log(`    ✔ patient record created (id=${patientId})`);

      await db.insert(patientPlansTable).values({
        patientId,
        nutritionPlan: `Low-carb, high-protein diet tailored for ${p.primaryGoal.replace(/_/g, " ")}. Eat 5 small meals a day. Avoid processed foods and sugary drinks.`,
        activityPlan: "30 min brisk walk daily. 2x strength training per week. Yoga 3x per week.",
        weeklyGoals: `Lose 0.5 kg this week. Log all meals. Complete all check-ins.`,
      });
    } else {
      patientId = existingPatient[0].id;
      console.log(`    – patient already exists (id=${patientId})`);
    }

    // Check-ins (7–14 per patient, skip if already has check-ins)
    const existingCheckins = await db.select().from(checkinsTable).where(eq(checkinsTable.patientId, patientId)).limit(1);
    if (existingCheckins.length === 0) {
      const checkinCount = 7 + Math.floor(Math.random() * 8);
      const mealOptions = ["all_meals", "most_meals", "some_meals", "missed_meals"];
      const energyOptions = ["high", "medium", "low"];
      const moodOptions = ["great", "good", "neutral", "tired", "stressed"];
      const glucoseBase = p.primaryGoal === "diabetes_reversal" ? 140 : 95;

      for (let i = checkinCount; i >= 1; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        await db.insert(checkinsTable).values({
          patientId,
          mealsFollowed: mealOptions[Math.floor(Math.random() * 4)],
          activityCompleted: Math.random() > 0.3,
          energyLevel: energyOptions[Math.floor(Math.random() * energyOptions.length)],
          mood: moodOptions[Math.floor(Math.random() * moodOptions.length)],
          glucoseReading: p.primaryGoal === "diabetes_reversal"
            ? glucoseBase - i * 0.8 + (Math.random() * 10 - 5)
            : null,
          notes: i % 3 === 0 ? "Feeling good, sticking to plan." : null,
          createdAt: date,
        });
      }
      console.log(`    ✔ ${checkinCount} check-ins seeded`);

      // Fasting glucose metrics for diabetes patients
      if (p.primaryGoal === "diabetes_reversal") {
        for (let i = checkinCount; i >= 1; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          await db.insert(metricsTable).values({
            patientId,
            type: "fasting_glucose",
            value: Number((glucoseBase - i * 0.8 + (Math.random() * 8 - 4)).toFixed(1)),
            date: date.toISOString().split("T")[0],
          });
        }
      }

      // Weight metrics
      for (let i = checkinCount; i >= 1; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i * 3);
        const weight = p.startingWeight - ((p.startingWeight - p.currentWeight) * (1 - i / checkinCount));
        await db.insert(metricsTable).values({
          patientId,
          type: "weight",
          value: Number(weight.toFixed(1)),
          date: date.toISOString().split("T")[0],
        });
      }

      // Sleep hours and hunger score metrics
      for (let i = checkinCount; i >= 1; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        await db.insert(metricsTable).values({
          patientId,
          type: "sleep_hours",
          value: Number((5.5 + Math.random() * 3).toFixed(1)),
          date: dateStr,
        });
        await db.insert(metricsTable).values({
          patientId,
          type: "hunger_score",
          value: Math.floor(1 + Math.random() * 5),
          date: dateStr,
        });
      }
    }

    // Appointments (3 upcoming per patient, skip if already exist)
    const existingAppts = await db.select().from(appointmentsTable).where(eq(appointmentsTable.patientId, patientId)).limit(1);
    if (existingAppts.length === 0) {
      const careTeam = [
        { name: "Dr. Sneha Mehta", role: "Endocrinologist" },
        { name: "Kavya Sharma", role: "Dietician" },
        { name: "Rohan Verma", role: "Fitness Coach" },
      ];
      for (let i = 0; i < 3; i++) {
        const apptDate = new Date();
        apptDate.setDate(apptDate.getDate() + (i + 1) * 7);
        await db.insert(appointmentsTable).values({
          patientId,
          careTeamMember: careTeam[i].name,
          role: careTeam[i].role,
          scheduledAt: apptDate,
          status: "upcoming",
        });
      }
      console.log(`    ✔ 3 appointments seeded`);
    }
  }

  console.log("\nSeed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
