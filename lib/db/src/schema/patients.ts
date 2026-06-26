import { pgTable, text, serial, timestamp, integer, real, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable, staffTable } from "./users";

export const patientsTable = pgTable("patients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  primaryGoal: text("primary_goal").notNull().default("weight_loss"),
  plan: text("plan").notNull().default("basic"),
  weekNumber: integer("week_number").notNull().default(1),
  startingWeight: real("starting_weight"),
  currentWeight: real("current_weight"),
  targetWeight: real("target_weight"),
  assignedCoachId: integer("assigned_coach_id").references(() => staffTable.id, { onDelete: "set null" }),
  assignedPhysicianId: integer("assigned_physician_id").references(() => staffTable.id, { onDelete: "set null" }),
  assignedDieticianId: integer("assigned_dietician_id").references(() => staffTable.id, { onDelete: "set null" }),
  assignedCaretakerId: integer("assigned_caretaker_id").references(() => staffTable.id, { onDelete: "set null" }),
  status: text("status").notNull().default("active"),
  riskLevel: text("risk_level").notNull().default("low"),
  selectedPlan: text("selected_plan"),
  preferredCallbackTime: text("preferred_callback_time"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  userIdUniqueIdx: uniqueIndex("patients_user_id_unique").on(t.userId),
  assignedCoachIdx: index("patients_assigned_coach_idx").on(t.assignedCoachId),
  assignedPhysicianIdx: index("patients_assigned_physician_idx").on(t.assignedPhysicianId),
  statusIdx: index("patients_status_idx").on(t.status),
  riskLevelIdx: index("patients_risk_level_idx").on(t.riskLevel),
}));

export const insertPatientSchema = createInsertSchema(patientsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patientsTable.$inferSelect;

export const patientPlansTable = pgTable("patient_plans", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id, { onDelete: "cascade" }),
  nutritionPlan: text("nutrition_plan"),
  activityPlan: text("activity_plan"),
  weeklyGoals: text("weekly_goals"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  patientIdUniqueIdx: uniqueIndex("patient_plans_patient_id_unique").on(t.patientId),
}));

export const insertPatientPlanSchema = createInsertSchema(patientPlansTable).omit({ id: true, updatedAt: true });
export type InsertPatientPlan = z.infer<typeof insertPatientPlanSchema>;
export type PatientPlan = typeof patientPlansTable.$inferSelect;

export const patientNotesTable = pgTable("patient_notes", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id, { onDelete: "cascade" }),
  coachId: integer("coach_id").references(() => staffTable.id, { onDelete: "set null" }),
  content: text("content").notNull(),
  category: text("category"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  patientIdIdx: index("patient_notes_patient_id_idx").on(t.patientId),
  coachIdIdx: index("patient_notes_coach_id_idx").on(t.coachId),
}));

export const insertPatientNoteSchema = createInsertSchema(patientNotesTable).omit({ id: true, createdAt: true });
export type InsertPatientNote = z.infer<typeof insertPatientNoteSchema>;
export type PatientNote = typeof patientNotesTable.$inferSelect;

export const planChangeRequestsTable = pgTable("plan_change_requests", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id, { onDelete: "cascade" }),
  currentPlan: text("current_plan").notNull(),
  requestedPlan: text("requested_plan").notNull(),
  status: text("status").notNull().default("pending"),
  reviewedByStaffId: integer("reviewed_by_staff_id").references(() => staffTable.id, { onDelete: "set null" }),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  patientIdIdx: index("plan_change_requests_patient_id_idx").on(t.patientId),
  statusIdx: index("plan_change_requests_status_idx").on(t.status),
}));

export type PlanChangeRequest = typeof planChangeRequestsTable.$inferSelect;
