import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  city: text("city").notNull(),
  primaryGoal: text("primary_goal").notNull(),
  preferredCallbackTime: text("preferred_callback_time"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leadsTable).omit({ id: true, createdAt: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leadsTable.$inferSelect;

export const physicianLeadsTable = pgTable("physician_leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(),
  clinicOrHospital: text("clinic_or_hospital"),
  city: text("city").notNull(),
  phone: text("phone").notNull(),
  preferredCallbackTime: text("preferred_callback_time"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPhysicianLeadSchema = createInsertSchema(physicianLeadsTable).omit({ id: true, createdAt: true });
export type InsertPhysicianLead = z.infer<typeof insertPhysicianLeadSchema>;
export type PhysicianLead = typeof physicianLeadsTable.$inferSelect;
