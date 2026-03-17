import { 
  type Session, type InsertSession, 
  type Violation, type InsertViolation,
  type ViolationType, type InsertViolationType,
  type User, type Driver
} from "@shared/schema";

// Helper to handle dates in JSON
const parseJSON = (text: string | null) => {
  if (!text) return null;
  return JSON.parse(text, (key, value) => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return new Date(value);
    }
    return value;
  });
};

const STORAGE_KEYS = {
  SESSIONS: 'bus_ops_sessions',
  VIOLATIONS: 'bus_ops_violations',
  VIOLATION_TYPES: 'bus_ops_violation_types',
  DRIVERS: 'bus_ops_drivers',
  USERS: 'bus_ops_users',
  CURRENT_USER: 'bus_ops_current_user'
};

class OfflineStorage {
  private get<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? parseJSON(data) : [];
  }

  private set<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // USERS
  async getCurrentUser(): Promise<User | null> {
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? parseJSON(user) : null;
  }

  async login(username: string): Promise<User> {
    let users = this.get<User>(STORAGE_KEYS.USERS);
    let user = users.find(u => u.username === username);
    
    if (!user) {
      user = {
        id: Math.floor(Math.random() * 1000000),
        username,
        createdAt: new Date()
      };
      users.push(user);
      this.set(STORAGE_KEYS.USERS, users);
    }
    
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return user;
  }

  async logout(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  // SESSIONS
  async getSessions(): Promise<Session[]> {
    const user = await this.getCurrentUser();
    if (!user) return [];
    return this.get<Session>(STORAGE_KEYS.SESSIONS)
      .filter(s => s.userId === user.id)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  async getSession(id: number): Promise<Session | null> {
    const user = await this.getCurrentUser();
    if (!user) return null;
    const session = this.get<Session>(STORAGE_KEYS.SESSIONS).find(s => s.id === id && s.userId === user.id);
    return session || null;
  }

  async createSession(data: InsertSession): Promise<Session> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("Not authenticated");
    
    const sessions = this.get<Session>(STORAGE_KEYS.SESSIONS);
    const newSession: Session = {
      ...data,
      id: Math.floor(Math.random() * 1000000),
      userId: user.id,
      startTime: data.startTime || new Date(),
      endTime: null
    };
    
    sessions.push(newSession);
    this.set(STORAGE_KEYS.SESSIONS, sessions);
    
    if (data.driverName) {
      await this.upsertDriver(data.driverName, newSession.startTime);
    }
    
    return newSession;
  }

  async updateSession(id: number, data: Partial<InsertSession>): Promise<Session> {
    let sessions = this.get<Session>(STORAGE_KEYS.SESSIONS);
    const index = sessions.findIndex(s => s.id === id);
    if (index === -1) throw new Error("Session not found");
    
    const updated = { ...sessions[index], ...data };
    // Handle date strings from forms
    if (data.startTime && typeof data.startTime === 'string') {
      updated.startTime = new Date(data.startTime);
    }
    
    sessions[index] = updated;
    this.set(STORAGE_KEYS.SESSIONS, sessions);
    return updated;
  }

  async endSession(id: number, endTime: Date): Promise<Session> {
    let sessions = this.get<Session>(STORAGE_KEYS.SESSIONS);
    const index = sessions.findIndex(s => s.id === id);
    if (index === -1) throw new Error("Session not found");
    
    sessions[index].endTime = endTime;
    this.set(STORAGE_KEYS.SESSIONS, sessions);
    return sessions[index];
  }

  async deleteSession(id: number): Promise<void> {
    let sessions = this.get<Session>(STORAGE_KEYS.SESSIONS);
    this.set(STORAGE_KEYS.SESSIONS, sessions.filter(s => s.id !== id));
    
    let violations = this.get<Violation>(STORAGE_KEYS.VIOLATIONS);
    this.set(STORAGE_KEYS.VIOLATIONS, violations.filter(v => v.sessionId !== id));
  }

  async deleteAllSessions(): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) return;
    
    let sessions = this.get<Session>(STORAGE_KEYS.SESSIONS);
    const userSessionIds = sessions.filter(s => s.userId === user.id).map(s => s.id);
    
    this.set(STORAGE_KEYS.SESSIONS, sessions.filter(s => s.userId !== user.id));
    
    let violations = this.get<Violation>(STORAGE_KEYS.VIOLATIONS);
    this.set(STORAGE_KEYS.VIOLATIONS, violations.filter(v => !userSessionIds.includes(v.sessionId)));
  }

  // VIOLATIONS
  async getViolations(sessionId: number): Promise<Violation[]> {
    return this.get<Violation>(STORAGE_KEYS.VIOLATIONS)
      .filter(v => v.sessionId === sessionId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async createViolation(data: InsertViolation): Promise<Violation> {
    const violations = this.get<Violation>(STORAGE_KEYS.VIOLATIONS);
    const newViolation: Violation = {
      ...data,
      id: Math.floor(Math.random() * 1000000),
      timestamp: data.timestamp || new Date(),
      notes: data.notes || null
    };
    
    violations.push(newViolation);
    this.set(STORAGE_KEYS.VIOLATIONS, violations);
    return newViolation;
  }

  async deleteViolation(id: number): Promise<void> {
    let violations = this.get<Violation>(STORAGE_KEYS.VIOLATIONS);
    this.set(STORAGE_KEYS.VIOLATIONS, violations.filter(v => v.id !== id));
  }

  // VIOLATION TYPES
  async getViolationTypes(): Promise<ViolationType[]> {
    const defaults = [
      "Customer standing while bus in motion",
      "Ran red",
      "Excessive Honking",
      "Uniform",
      "Took off while customers standing"
    ];
    
    let types = this.get<ViolationType>(STORAGE_KEYS.VIOLATION_TYPES);
    
    // Ensure defaults exist
    let needsUpdate = false;
    defaults.forEach(name => {
      if (!types.find(t => t.name === name)) {
        types.push({ id: Math.floor(Math.random() * 1000000), name, isDefault: true });
        needsUpdate = true;
      }
    });
    
    if (needsUpdate) this.set(STORAGE_KEYS.VIOLATION_TYPES, types);
    return types;
  }

  async createViolationType(data: InsertViolationType): Promise<ViolationType> {
    const types = this.get<ViolationType>(STORAGE_KEYS.VIOLATION_TYPES);
    const newType: ViolationType = {
      ...data,
      id: Math.floor(Math.random() * 1000000),
      isDefault: data.isDefault || false
    };
    types.push(newType);
    this.set(STORAGE_KEYS.VIOLATION_TYPES, types);
    return newType;
  }

  // DRIVERS
  async getDrivers(): Promise<{ driverName: string, lastReportDate: Date }[]> {
    return this.get<Driver>(STORAGE_KEYS.DRIVERS)
      .filter(d => !d.isArchived)
      .map(d => ({ driverName: d.driverName, lastReportDate: d.lastReportDate }))
      .sort((a, b) => b.lastReportDate.getTime() - a.lastReportDate.getTime());
  }

  async upsertDriver(driverName: string, reportDate: Date): Promise<void> {
    let drivers = this.get<Driver>(STORAGE_KEYS.DRIVERS);
    const index = drivers.findIndex(d => d.driverName === driverName);
    
    if (index === -1) {
      drivers.push({
        id: Math.floor(Math.random() * 1000000),
        driverName,
        lastReportDate: reportDate,
        isArchived: false
      });
    } else if (drivers[index].lastReportDate < reportDate) {
      drivers[index].lastReportDate = reportDate;
    }
    
    this.set(STORAGE_KEYS.DRIVERS, drivers);
  }

  async deleteDriver(name: string): Promise<void> {
    let drivers = this.get<Driver>(STORAGE_KEYS.DRIVERS);
    const index = drivers.findIndex(d => d.driverName === name);
    if (index !== -1) {
      drivers[index].isArchived = true;
      this.set(STORAGE_KEYS.DRIVERS, drivers);
    }
  }

  async deleteAllDrivers(): Promise<void> {
    this.set(STORAGE_KEYS.DRIVERS, []);
  }

  async updateDriverDate(driverName: string, lastReportDate: Date): Promise<void> {
    let drivers = this.get<Driver>(STORAGE_KEYS.DRIVERS);
    const index = drivers.findIndex(d => d.driverName === driverName);
    if (index !== -1) {
      drivers[index].lastReportDate = lastReportDate;
      this.set(STORAGE_KEYS.DRIVERS, drivers);
    }
  }
}

export const offlineStorage = new OfflineStorage();
