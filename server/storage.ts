import { db } from "./db";
import { 
  sessions, violations, violationTypes, users, authSessions, drivers,
  type Session, type InsertSession, 
  type Violation, type InsertViolation,
  type ViolationType, type InsertViolationType,
  type User, type AuthSession, type Driver
} from "@shared/schema";
import { eq, desc, and, gt, lt } from "drizzle-orm";

export interface DriverInfo {
  driverName: string;
  lastReportDate: Date;
}

export interface IStorage {
  // Users
  createUser(username: string): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  
  // Auth Sessions
  createAuthSession(userId: number, token: string, expiresAt: Date): Promise<AuthSession>;
  getAuthSessionByToken(token: string): Promise<AuthSession | undefined>;
  deleteAuthSession(token: string): Promise<void>;
  deleteExpiredSessions(): Promise<void>;
  deleteUserSessions(userId: number): Promise<void>;
  
  // Bus Sessions
  createSession(session: InsertSession, userId: number): Promise<Session>;
  updateSession(id: number, userId: number, data: Partial<InsertSession>): Promise<Session | undefined>;
  endSession(id: number, userId: number, endTime: Date): Promise<Session | undefined>;
  getUserSession(id: number, userId: number): Promise<Session | undefined>;
  getUserSessions(userId: number): Promise<Session[]>;
  deleteSession(id: number, userId: number): Promise<boolean>;
  deleteAllUserSessions(userId: number): Promise<void>;
  
  // Violations
  createViolation(violation: InsertViolation): Promise<Violation>;
  getViolationById(id: number): Promise<Violation | undefined>;
  getViolations(sessionId: number): Promise<Violation[]>;
  deleteViolation(id: number): Promise<void>;
  
  // Violation Types
  createViolationType(type: InsertViolationType): Promise<ViolationType>;
  getViolationTypes(): Promise<ViolationType[]>;
  getViolationTypeByName(name: string): Promise<ViolationType | undefined>;
  deleteCustomViolationTypes(): Promise<void>;
  
  // Drivers (cross-user, persisted independently)
  getAllDrivers(): Promise<DriverInfo[]>;
  upsertDriver(driverName: string, reportDate: Date): Promise<void>;
  insertDriverIfNew(driverName: string, reportDate: Date): Promise<boolean>;
  updateDriverDate(driverName: string, newDate: Date): Promise<DriverInfo | undefined>;
  deleteDriverByName(driverName: string): Promise<void>;
  deleteAllDrivers(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async createUser(username: string): Promise<User> {
    const [newUser] = await db!.insert(users).values({
      username,
    }).returning();
    return newUser;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db!.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db!.select().from(users).where(eq(users.id, id));
    return user;
  }

  // Auth Sessions
  async createAuthSession(userId: number, token: string, expiresAt: Date): Promise<AuthSession> {
    const [session] = await db!.insert(authSessions).values({
      userId,
      token,
      expiresAt,
    }).returning();
    return session;
  }

  async getAuthSessionByToken(token: string): Promise<AuthSession | undefined> {
    const [session] = await db!.select().from(authSessions).where(
      and(eq(authSessions.token, token), gt(authSessions.expiresAt, new Date()))
    );
    return session;
  }

  async deleteAuthSession(token: string): Promise<void> {
    await db!.delete(authSessions).where(eq(authSessions.token, token));
  }

  async deleteExpiredSessions(): Promise<void> {
    await db!.delete(authSessions).where(lt(authSessions.expiresAt, new Date()));
  }

  async deleteUserSessions(userId: number): Promise<void> {
    await db!.delete(authSessions).where(eq(authSessions.userId, userId));
  }

  // Bus Sessions
  async createSession(session: InsertSession, userId: number): Promise<Session> {
    const [newSession] = await db!.insert(sessions).values({ ...session, userId }).returning();
    if (session.driverName && session.driverName.trim() !== '') {
      await this.upsertDriver(session.driverName, newSession.startTime);
    }
    return newSession;
  }
  
  async getUserSessions(userId: number): Promise<Session[]> {
    return await db!.select().from(sessions).where(eq(sessions.userId, userId)).orderBy(desc(sessions.startTime));
  }

  async updateSession(id: number, userId: number, data: Partial<InsertSession>): Promise<Session | undefined> {
    const [updatedSession] = await db!
      .update(sessions)
      .set(data)
      .where(and(eq(sessions.id, id), eq(sessions.userId, userId)))
      .returning();
    return updatedSession;
  }

  async endSession(id: number, userId: number, endTime: Date): Promise<Session | undefined> {
    const [updatedSession] = await db!
      .update(sessions)
      .set({ endTime })
      .where(and(eq(sessions.id, id), eq(sessions.userId, userId)))
      .returning();
    return updatedSession;
  }

  async getUserSession(id: number, userId: number): Promise<Session | undefined> {
    const [session] = await db!.select().from(sessions).where(
      and(eq(sessions.id, id), eq(sessions.userId, userId))
    );
    return session;
  }

  async deleteSession(id: number, userId: number): Promise<boolean> {
    const session = await this.getUserSession(id, userId);
    if (!session) return false;
    await db!.delete(violations).where(eq(violations.sessionId, id));
    await db!.delete(sessions).where(and(eq(sessions.id, id), eq(sessions.userId, userId)));
    return true;
  }

  async deleteAllUserSessions(userId: number): Promise<void> {
    const userSessions = await this.getUserSessions(userId);
    for (const session of userSessions) {
      await db!.delete(violations).where(eq(violations.sessionId, session.id));
    }
    await db!.delete(sessions).where(eq(sessions.userId, userId));
  }

  // Violations
  async createViolation(violation: InsertViolation): Promise<Violation> {
    const [newViolation] = await db!.insert(violations).values(violation).returning();
    return newViolation;
  }

  async getViolationById(id: number): Promise<Violation | undefined> {
    const [violation] = await db!.select().from(violations).where(eq(violations.id, id));
    return violation;
  }

  async getViolations(sessionId: number): Promise<Violation[]> {
    return await db!
      .select()
      .from(violations)
      .where(eq(violations.sessionId, sessionId))
      .orderBy(desc(violations.timestamp));
  }

  async deleteViolation(id: number): Promise<void> {
    await db!.delete(violations).where(eq(violations.id, id));
  }

  // Violation Types
  async createViolationType(type: InsertViolationType): Promise<ViolationType> {
    const [newType] = await db!.insert(violationTypes).values(type).returning();
    return newType;
  }

  async getViolationTypes(): Promise<ViolationType[]> {
    return await db!.select().from(violationTypes);
  }

  async getViolationTypeByName(name: string): Promise<ViolationType | undefined> {
    const [type] = await db!.select().from(violationTypes).where(eq(violationTypes.name, name));
    return type;
  }

  async deleteCustomViolationTypes(): Promise<void> {
    await db!.delete(violationTypes).where(eq(violationTypes.isDefault, false));
  }

  async getAllDrivers(): Promise<DriverInfo[]> {
    const result = await db!
      .select()
      .from(drivers)
      .where(eq(drivers.isArchived, false))
      .orderBy(desc(drivers.lastReportDate));
    
    return result.map(r => ({
      driverName: r.driverName,
      lastReportDate: new Date(r.lastReportDate),
    }));
  }

  async upsertDriver(driverName: string, reportDate: Date): Promise<void> {
    if (!driverName || driverName.trim() === '') return;
    
    const existing = await db.select().from(drivers).where(eq(drivers.driverName, driverName));
    if (existing.length === 0) {
      await db!.insert(drivers).values({ driverName, lastReportDate: reportDate });
    } else if (existing[0].lastReportDate < reportDate) {
      await db!.update(drivers).set({ lastReportDate: reportDate }).where(eq(drivers.driverName, driverName));
    }
  }

  async insertDriverIfNew(driverName: string, reportDate: Date): Promise<boolean> {
    if (!driverName || driverName.trim() === '') return false;
    
    const existing = await db.select().from(drivers).where(eq(drivers.driverName, driverName));
    if (existing.length === 0) {
      await db!.insert(drivers).values({ driverName, lastReportDate: reportDate });
      return true;
    }
    // If driver exists but is archived, don't unarchive (respect manual deletion)
    return false;
  }

  async updateDriverDate(driverName: string, newDate: Date): Promise<DriverInfo | undefined> {
    const [updated] = await db!
      .update(drivers)
      .set({ lastReportDate: newDate })
      .where(eq(drivers.driverName, driverName))
      .returning();
    if (!updated) return undefined;
    return { driverName: updated.driverName, lastReportDate: updated.lastReportDate };
  }

  async deleteDriverByName(driverName: string): Promise<void> {
    await db!.update(drivers).set({ isArchived: true }).where(eq(drivers.driverName, driverName));
  }

  async deleteAllDrivers(): Promise<void> {
    await db.delete(drivers);
  }
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private authSessions: Map<string, AuthSession>;
  private sessions: Map<number, Session>;
  private violations: Map<number, Violation>;
  private violationTypes: Map<number, ViolationType>;
  private drivers: Map<string, Driver>;
  private currentId: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.authSessions = new Map();
    this.sessions = new Map();
    this.violations = new Map();
    this.violationTypes = new Map();
    this.drivers = new Map();
    this.currentId = { users: 1, authSessions: 1, sessions: 1, violations: 1, violationTypes: 1, drivers: 1 };
    
    // Seed default violation types
    const defaults = ["Customer standing while bus in motion", "Ran red", "Excessive Honking", "Uniform", "Took off while customers standing"];
    defaults.forEach(name => {
      const id = this.currentId.violationTypes++;
      this.violationTypes.set(id, { id, name, isDefault: true });
    });
  }

  async createUser(username: string): Promise<User> {
    const id = this.currentId.users++;
    const user: User = { id, username, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async createAuthSession(userId: number, token: string, expiresAt: Date): Promise<AuthSession> {
    const id = this.currentId.authSessions++;
    const session: AuthSession = { id, userId, token, expiresAt, createdAt: new Date() };
    this.authSessions.set(token, session);
    return session;
  }

  async getAuthSessionByToken(token: string): Promise<AuthSession | undefined> {
    const session = this.authSessions.get(token);
    if (session && session.expiresAt > new Date()) return session;
    return undefined;
  }

  async deleteAuthSession(token: string): Promise<void> {
    this.authSessions.delete(token);
  }

  async deleteExpiredSessions(): Promise<void> {
    const now = new Date();
    const tokens = Array.from(this.authSessions.keys());
    for (const token of tokens) {
      const session = this.authSessions.get(token);
      if (session && session.expiresAt < now) this.authSessions.delete(token);
    }
  }

  async deleteUserSessions(userId: number): Promise<void> {
    const tokens = Array.from(this.authSessions.keys());
    for (const token of tokens) {
      const session = this.authSessions.get(token);
      if (session && session.userId === userId) this.authSessions.delete(token);
    }
  }

  async createSession(session: InsertSession, userId: number): Promise<Session> {
    const id = this.currentId.sessions++;
    const newSession: Session = { 
      busNumber: session.busNumber,
      driverName: session.driverName,
      stopBoarded: session.stopBoarded,
      route: session.route,
      id, 
      userId, 
      startTime: session.startTime instanceof Date ? session.startTime : new Date(),
      endTime: null 
    };
    this.sessions.set(id, newSession);
    if (session.driverName) {
      await this.upsertDriver(session.driverName, newSession.startTime);
    }
    return newSession;
  }

  async updateSession(id: number, userId: number, data: Partial<InsertSession>): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (!session || session.userId !== userId) return undefined;
    
    // Explicitly update fields to handle Date coercion
    if (data.busNumber !== undefined) session.busNumber = data.busNumber;
    if (data.driverName !== undefined) session.driverName = data.driverName;
    if (data.route !== undefined) session.route = data.route;
    if (data.stopBoarded !== undefined) session.stopBoarded = data.stopBoarded;
    if (data.startTime !== undefined) {
      session.startTime = data.startTime instanceof Date ? data.startTime : new Date(data.startTime);
    }
    
    this.sessions.set(id, session);
    return session;
  }

  async endSession(id: number, userId: number, endTime: Date): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (!session || session.userId !== userId) return undefined;
    session.endTime = endTime;
    this.sessions.set(id, session);
    return session;
  }

  async getUserSession(id: number, userId: number): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    return session && session.userId === userId ? session : undefined;
  }

  async getUserSessions(userId: number): Promise<Session[]> {
    return Array.from(this.sessions.values())
      .filter(s => s.userId === userId)
      .sort((a,b) => b.startTime.getTime() - a.startTime.getTime());
  }

  async deleteSession(id: number, userId: number): Promise<boolean> {
    const session = this.sessions.get(id);
    if (!session || session.userId !== userId) return false;
    
    // Delete associated violations
    const vids = Array.from(this.violations.keys());
    for (const vid of vids) {
      const v = this.violations.get(vid);
      if (v && v.sessionId === id) this.violations.delete(vid);
    }
    
    this.sessions.delete(id);
    return true;
  }

  async deleteAllUserSessions(userId: number): Promise<void> {
    const userSessions = Array.from(this.sessions.values()).filter(s => s.userId === userId);
    for (const session of userSessions) {
      await this.deleteSession(session.id, userId);
    }
  }

  async createViolation(violation: InsertViolation): Promise<Violation> {
    const id = this.currentId.violations++;
    const newViolation: Violation = { 
      sessionId: violation.sessionId,
      type: violation.type,
      notes: violation.notes || null,
      id, 
      timestamp: violation.timestamp instanceof Date ? violation.timestamp : new Date() 
    };
    this.violations.set(id, newViolation);
    return newViolation;
  }

  async getViolationById(id: number): Promise<Violation | undefined> {
    return this.violations.get(id);
  }

  async getViolations(sessionId: number): Promise<Violation[]> {
    return Array.from(this.violations.values())
      .filter(v => v.sessionId === sessionId)
      .sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async deleteViolation(id: number): Promise<void> {
    this.violations.delete(id);
  }

  async createViolationType(type: InsertViolationType): Promise<ViolationType> {
    const id = this.currentId.violationTypes++;
    const newType: ViolationType = { 
      id, 
      name: type.name, 
      isDefault: type.isDefault ?? false 
    };
    this.violationTypes.set(id, newType);
    return newType;
  }

  async getViolationTypes(): Promise<ViolationType[]> {
    return Array.from(this.violationTypes.values());
  }

  async getViolationTypeByName(name: string): Promise<ViolationType | undefined> {
    return Array.from(this.violationTypes.values()).find(t => t.name === name);
  }

  async deleteCustomViolationTypes(): Promise<void> {
    const ids = Array.from(this.violationTypes.keys());
    for (const id of ids) {
      const t = this.violationTypes.get(id);
      if (t && !t.isDefault) this.violationTypes.delete(id);
    }
  }

  async getAllDrivers(): Promise<DriverInfo[]> {
    return Array.from(this.drivers.values())
      .filter(d => !d.isArchived)
      .map(d => ({ driverName: d.driverName, lastReportDate: d.lastReportDate }))
      .sort((a,b) => b.lastReportDate.getTime() - a.lastReportDate.getTime());
  }

  async upsertDriver(driverName: string, reportDate: Date): Promise<void> {
    if (!driverName || driverName.trim() === '') return;
    const existing = this.drivers.get(driverName);
    if (!existing) {
      const id = this.currentId.drivers++;
      this.drivers.set(driverName, { id, driverName, lastReportDate: reportDate, isArchived: false });
    } else if (existing.lastReportDate < reportDate) {
      existing.lastReportDate = reportDate;
    }
  }

  async insertDriverIfNew(driverName: string, reportDate: Date): Promise<boolean> {
    if (!driverName || driverName.trim() === '' || this.drivers.has(driverName)) return false;
    const id = this.currentId.drivers++;
    this.drivers.set(driverName, { id, driverName, lastReportDate: reportDate, isArchived: false });
    return true;
  }

  async updateDriverDate(driverName: string, newDate: Date): Promise<DriverInfo | undefined> {
    const driver = this.drivers.get(driverName);
    if (!driver) return undefined;
    driver.lastReportDate = newDate;
    return { driverName: driver.driverName, lastReportDate: driver.lastReportDate };
  }

  async deleteDriverByName(driverName: string): Promise<void> {
    const driver = this.drivers.get(driverName);
    if (driver) driver.isArchived = true;
  }

  async deleteAllDrivers(): Promise<void> {
    this.drivers.clear();
  }
}

export const storage = process.env.DATABASE_URL 
  ? new DatabaseStorage() 
  : new MemStorage();
