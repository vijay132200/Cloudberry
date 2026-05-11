import { pgTable, text, serial, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const checkinsTable = pgTable("checkins", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  mealsFollowed: text("meals_followed").notNull(),
  activityCompleted: boolean("activity_completed").notNull().default(false),
  energyLevel: text("energy_level").notNull(),
  mood: text("mood").notNull(),
  glucoseReading: real("glucose_reading"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCheckinSchema = createInsertSchema(checkinsTable).omit({ id: true, createdAt: true });
export type InsertCheckin = z.infer<typeof insertCheckinSchema>;
export type Checkin = typeof checkinsTable.$inferSelect;

export const metricsTable = pgTable("metrics", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  type: text("type").notNull(),
  value: real("value").notNull(),
  date: text("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMetricSchema = createInsertSchema(metricsTable).omit({ id: true, createdAt: true });
export type InsertMetric = z.infer<typeof insertMetricSchema>;
export type Metric = typeof metricsTable.$inferSelect;
