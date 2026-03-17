import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================
// USERS & AUTH
// ============================================

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const authSessions = pgTable("auth_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================
// BUS SESSIONS & VIOLATIONS
// ============================================

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Foreign key to users
  busNumber: text("bus_number").notNull(),
  driverName: text("driver_name").notNull(),
  stopBoarded: text("stop_boarded").notNull(),
  route: text("route").notNull(),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
});

export const violations = pgTable("violations", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(), // Foreign key references sessions(id)
  type: text("type").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  notes: text("notes"),
});

export const violationTypes = pgTable("violation_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  isDefault: boolean("is_default").notNull().default(false),
});

export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  driverName: text("driver_name").notNull().unique(),
  lastReportDate: timestamp("last_report_date").notNull().defaultNow(),
  isArchived: boolean("is_archived").notNull().default(false),
});

// ============================================
// SCHEMAS
// ============================================

// User schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
});

// Session schemas
export const insertSessionSchema = createInsertSchema(sessions, {
  startTime: z.coerce.date(),
}).omit({ id: true, endTime: true, userId: true });
export const insertViolationSchema = createInsertSchema(violations, {
  timestamp: z.coerce.date(),
}).omit({ id: true });
export const insertViolationTypeSchema = createInsertSchema(violationTypes).omit({ id: true });

// ============================================
// TYPES
// ============================================

// User types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type AuthSession = typeof authSessions.$inferSelect;

// Session types
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Violation = typeof violations.$inferSelect;
export type InsertViolation = z.infer<typeof insertViolationSchema>;
export type ViolationType = typeof violationTypes.$inferSelect;
export type InsertViolationType = z.infer<typeof insertViolationTypeSchema>;
export type Driver = typeof drivers.$inferSelect;

// ============================================
// API PAYLOADS
// ============================================

export type CreateSessionRequest = InsertSession;
export type EndSessionRequest = { endTime: string }; // ISO string
export type CreateViolationRequest = InsertViolation;
export type CreateViolationTypeRequest = InsertViolationType;
export type LoginRequest = z.infer<typeof loginSchema>;
