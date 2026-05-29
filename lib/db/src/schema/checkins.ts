import { pgTable, text, serial, timestamp, integer, real, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { patientsTable } from "./patients";

export const checkinsTable = pgTable("checkins", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id, { onDelete: "cascade" }),
  mealsFollowed: text("meals_followed").notNull(),
  activityCompleted: boolean("activity_completed").notNull().default(false),
  energyLevel: text("energy_level").notNull(),
  mood: text("mood").notNull(),
  glucoseReading: real("glucose_reading"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  patientIdIdx: index("checkins_patient_id_idx").on(t.patientId),
  patientDateIdx: index("checkins_patient_date_idx").on(t.patientId, t.createdAt),
}));

export const insertCheckinSchema = createInsertSchema(checkinsTable).omit({ id: true, createdAt: true });
export type InsertCheckin = z.infer<typeof insertCheckinSchema>;
export type Checkin = typeof checkinsTable.$inferSelect;

export const metricsTable = pgTable("metrics", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  value: real("value").notNull(),
  date: text("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  patientIdIdx: index("metrics_patient_id_idx").on(t.patientId),
  patientTypeIdx: index("metrics_patient_type_idx").on(t.patientId, t.type),
  patientTypeDateUniqueIdx: uniqueIndex("metrics_patient_type_date_unique").on(t.patientId, t.type, t.date),
}));

export const insertMetricSchema = createInsertSchema(metricsTable).omit({ id: true, createdAt: true });
export type InsertMetric = z.infer<typeof insertMetricSchema>;
export type Metric = typeof metricsTable.$inferSelect;
