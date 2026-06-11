import { pgTable, text, serial, timestamp, integer, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { patientsTable } from "./patients";
import { staffTable } from "./users";

export const clinicalNotesTable = pgTable("clinical_notes", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id, { onDelete: "cascade" }),
  authorId: integer("author_id").notNull().references(() => staffTable.id, { onDelete: "cascade" }),
  authorRole: text("author_role").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull().default("general"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  patientIdIdx: index("clinical_notes_patient_id_idx").on(t.patientId),
  authorIdIdx: index("clinical_notes_author_id_idx").on(t.authorId),
}));

export const clinicalNoteVersionsTable = pgTable("clinical_note_versions", {
  id: serial("id").primaryKey(),
  noteId: integer("note_id").notNull().references(() => clinicalNotesTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  editedById: integer("edited_by_id").notNull().references(() => staffTable.id, { onDelete: "cascade" }),
  editedAt: timestamp("edited_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  noteIdIdx: index("clinical_note_versions_note_id_idx").on(t.noteId),
}));

export const criticalNotesTable = pgTable("critical_notes", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id, { onDelete: "cascade" }),
  authorId: integer("author_id").notNull().references(() => staffTable.id, { onDelete: "cascade" }),
  authorRole: text("author_role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  patientIdIdx: index("critical_notes_patient_id_idx").on(t.patientId),
}));

export const criticalNoteVersionsTable = pgTable("critical_note_versions", {
  id: serial("id").primaryKey(),
  noteId: integer("note_id").notNull().references(() => criticalNotesTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  editedById: integer("edited_by_id").notNull().references(() => staffTable.id, { onDelete: "cascade" }),
  editedAt: timestamp("edited_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  noteIdIdx: index("critical_note_versions_note_id_idx").on(t.noteId),
}));

export const escalationsTable = pgTable("escalations", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id, { onDelete: "cascade" }),
  authorId: integer("author_id").notNull().references(() => staffTable.id, { onDelete: "cascade" }),
  category: text("category").notNull().default("medical"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"),
  resolutionNotes: text("resolution_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  patientIdIdx: index("escalations_patient_id_idx").on(t.patientId),
  statusIdx: index("escalations_status_idx").on(t.status),
}));

export const escalationAuditLogTable = pgTable("escalation_audit_log", {
  id: serial("id").primaryKey(),
  escalationId: integer("escalation_id").notNull().references(() => escalationsTable.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  actorId: integer("actor_id").notNull().references(() => staffTable.id, { onDelete: "cascade" }),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  escalationIdIdx: index("escalation_audit_log_escalation_id_idx").on(t.escalationId),
}));

export const opsEscalationLogTable = pgTable("ops_escalation_log", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id, { onDelete: "cascade" }),
  authorId: integer("author_id").notNull().references(() => staffTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  category: text("category").notNull().default("observation"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  patientIdIdx: index("ops_escalation_log_patient_id_idx").on(t.patientId),
}));

export const dietPlansTable = pgTable("diet_plans", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id, { onDelete: "cascade" }),
  authorId: integer("author_id").notNull().references(() => staffTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  pdfFilename: text("pdf_filename"),
  pdfData: text("pdf_data"),
  version: integer("version").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  patientIdIdx: index("diet_plans_patient_id_idx").on(t.patientId),
  patientActiveIdx: index("diet_plans_patient_active_idx").on(t.patientId, t.isActive),
}));

export const dietPlanCommentsTable = pgTable("diet_plan_comments", {
  id: serial("id").primaryKey(),
  dietPlanId: integer("diet_plan_id").notNull().references(() => dietPlansTable.id, { onDelete: "cascade" }),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id, { onDelete: "cascade" }),
  authorId: integer("author_id").notNull().references(() => staffTable.id, { onDelete: "cascade" }),
  authorRole: text("author_role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  dietPlanIdIdx: index("diet_plan_comments_diet_plan_id_idx").on(t.dietPlanId),
  patientIdIdx: index("diet_plan_comments_patient_id_idx").on(t.patientId),
}));

export const patientDocumentsTable = pgTable("patient_documents", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id, { onDelete: "cascade" }),
  uploadedByPatient: boolean("uploaded_by_patient").notNull().default(false),
  uploadedByStaffId: integer("uploaded_by_staff_id").references(() => staffTable.id, { onDelete: "set null" }),
  filename: text("filename").notNull(),
  fileData: text("file_data").notNull(),
  fileType: text("file_type").notNull().default("application/pdf"),
  category: text("category").notNull().default("general"),
  label: text("label"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  patientIdIdx: index("patient_documents_patient_id_idx").on(t.patientId),
}));

// Care plan version history — snapshots of patientPlansTable before each edit
export const patientPlanHistoryTable = pgTable("patient_plan_history", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id, { onDelete: "cascade" }),
  editedById: integer("edited_by_id").notNull().references(() => staffTable.id, { onDelete: "cascade" }),
  nutritionPlan: text("nutrition_plan"),
  activityPlan: text("activity_plan"),
  weeklyGoals: text("weekly_goals"),
  editedAt: timestamp("edited_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  patientIdIdx: index("patient_plan_history_patient_id_idx").on(t.patientId),
}));

export type ClinicalNote = typeof clinicalNotesTable.$inferSelect;
export type ClinicalNoteVersion = typeof clinicalNoteVersionsTable.$inferSelect;
export type CriticalNote = typeof criticalNotesTable.$inferSelect;
export type CriticalNoteVersion = typeof criticalNoteVersionsTable.$inferSelect;
export type Escalation = typeof escalationsTable.$inferSelect;
export type EscalationAuditLog = typeof escalationAuditLogTable.$inferSelect;
export type OpsEscalationLog = typeof opsEscalationLogTable.$inferSelect;
export type DietPlan = typeof dietPlansTable.$inferSelect;
