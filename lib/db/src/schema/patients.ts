import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const patientsTable = pgTable("patients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  primaryGoal: text("primary_goal").notNull().default("weight_loss"),
  plan: text("plan").notNull().default("basic"),
  weekNumber: integer("week_number").notNull().default(1),
  startingWeight: real("starting_weight"),
  currentWeight: real("current_weight"),
  targetWeight: real("target_weight"),
  assignedCoachId: integer("assigned_coach_id"),
  status: text("status").notNull().default("active"),
  riskLevel: text("risk_level").notNull().default("low"),
  selectedPlan: text("selected_plan"),
  preferredCallbackTime: text("preferred_callback_time"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPatientSchema = createInsertSchema(patientsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patientsTable.$inferSelect;

export const patientPlansTable = pgTable("patient_plans", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  nutritionPlan: text("nutrition_plan"),
  activityPlan: text("activity_plan"),
  weeklyGoals: text("weekly_goals"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPatientPlanSchema = createInsertSchema(patientPlansTable).omit({ id: true, updatedAt: true });
export type InsertPatientPlan = z.infer<typeof insertPatientPlanSchema>;
export type PatientPlan = typeof patientPlansTable.$inferSelect;

export const patientNotesTable = pgTable("patient_notes", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  coachId: integer("coach_id"),
  content: text("content").notNull(),
  category: text("category"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPatientNoteSchema = createInsertSchema(patientNotesTable).omit({ id: true, createdAt: true });
export type InsertPatientNote = z.infer<typeof insertPatientNoteSchema>;
export type PatientNote = typeof patientNotesTable.$inferSelect;
