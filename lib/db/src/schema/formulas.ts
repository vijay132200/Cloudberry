import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { customType } from "drizzle-orm/pg-core";
import { staffTable } from "./users";
import { patientsTable } from "./patients";

const jsonb = customType<{ data: any }>({
  dataType() { return "jsonb"; },
  toDriver(val) { return JSON.stringify(val); },
  fromDriver(val) { return typeof val === "string" ? JSON.parse(val) : val; },
});

export const formulaDefinitionsTable = pgTable("formula_definitions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  purpose: text("purpose").notNull(),
  category: text("category").notNull(),
  templateType: text("template_type").notNull(),
  inputs: jsonb("inputs").notNull(),
  outputMin: integer("output_min").notNull().default(0),
  outputMax: integer("output_max").notNull().default(100),
  currentVersionId: integer("current_version_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: integer("created_by").references(() => staffTable.id),
});

export const formulaVersionsTable = pgTable("formula_versions", {
  id: serial("id").primaryKey(),
  formulaId: integer("formula_id").notNull().references(() => formulaDefinitionsTable.id),
  version: integer("version").notNull(),
  parameters: jsonb("parameters").notNull(),
  humanReadable: text("human_readable").notNull(),
  mathRepresentation: text("math_representation"),
  exampleCalculation: text("example_calculation"),
  status: text("status").notNull().default("draft"),
  reason: text("reason").notNull(),
  proposedBy: integer("proposed_by").notNull().references(() => staffTable.id),
  approvedBy: integer("approved_by").references(() => staffTable.id),
  proposedAt: timestamp("proposed_at", { withTimezone: true }).notNull().defaultNow(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  deployedAt: timestamp("deployed_at", { withTimezone: true }),
});

export const formulaPatientOverridesTable = pgTable("formula_patient_overrides", {
  id: serial("id").primaryKey(),
  formulaId: integer("formula_id").notNull().references(() => formulaDefinitionsTable.id),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id),
  parameters: jsonb("parameters").notNull(),
  baseVersionId: integer("base_version_id").references(() => formulaVersionsTable.id),
  active: boolean("active").notNull().default(true),
  reason: text("reason"),
  createdBy: integer("created_by").references(() => staffTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const formulaAuditLogTable = pgTable("formula_audit_log", {
  id: serial("id").primaryKey(),
  formulaId: integer("formula_id").references(() => formulaDefinitionsTable.id),
  versionId: integer("version_id").references(() => formulaVersionsTable.id),
  patientId: integer("patient_id").references(() => patientsTable.id),
  action: text("action").notNull(),
  actorId: integer("actor_id").references(() => staffTable.id),
  previousValue: jsonb("previous_value"),
  newValue: jsonb("new_value"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
