import { v4 as uuid } from 'uuid';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Tenant {
  id: string;
  name: string;
  plan: TenantPlan;
  settings: TenantSettings;
  createdAt: Date;
}

export type TenantPlan = 'free' | 'pro' | 'enterprise';

export interface TenantSettings {
  maxEntities: number;
  maxMemorySize: number;
  maxApiCalls: number;
  allowedFrameworks: string[];
}

export interface Session {
  id: string;
  userId: string;
  tenantId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

const PLAN_LIMITS: Record<TenantPlan, TenantSettings> = {
  free: {
    maxEntities: 10,
    maxMemorySize: 1024 * 1024,
    maxApiCalls: 1000,
    allowedFrameworks: ['openai-agents'],
  },
  pro: {
    maxEntities: 100,
    maxMemorySize: 1024 * 1024 * 10,
    maxApiCalls: 10000,
    allowedFrameworks: ['openai-agents', 'langgraph', 'crewai', 'n8n', 'flowise'],
  },
  enterprise: {
    maxEntities: -1,
    maxMemorySize: -1,
    maxApiCalls: -1,
    allowedFrameworks: ['*'],
  },
};

export class AuthManager {
  private users: Map<string, User> = new Map();
  private tenants: Map<string, Tenant> = new Map();
  private sessions: Map<string, Session> = new Map();

  async createTenant(name: string, plan: TenantPlan): Promise<Tenant> {
    const tenant: Tenant = {
      id: uuid(),
      name,
      plan,
      settings: PLAN_LIMITS[plan],
      createdAt: new Date(),
    };
    this.tenants.set(tenant.id, tenant);
    return tenant;
  }

  async createUser(email: string, name: string, tenantId: string, role: UserRole = 'member'): Promise<User> {
    const user: User = {
      id: uuid(),
      email,
      name,
      role,
      tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async createSession(userId: string): Promise<Session | null> {
    const user = this.users.get(userId);
    if (!user) return null;

    const session: Session = {
      id: uuid(),
      userId,
      tenantId: user.tenantId,
      token: uuid(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async validateSession(token: string): Promise<{ valid: boolean; session?: Session; user?: User }> {
    const session = Array.from(this.sessions.values()).find(s => s.token === token);
    if (!session) return { valid: false };
    if (session.expiresAt < new Date()) {
      this.sessions.delete(session.id);
      return { valid: false };
    }

    const user = this.users.get(session.userId);
    return { valid: true, session, user };
  }

  async getTenant(tenantId: string): Promise<Tenant | null> {
    return this.tenants.get(tenantId) || null;
  }

  async getUser(userId: string): Promise<User | null> {
    return this.users.get(userId) || null;
  }

  async checkPermission(userId: string, permission: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    const permissions: Record<UserRole, string[]> = {
      owner: ['read', 'write', 'delete', 'admin', 'manage-users', 'manage-billing'],
      admin: ['read', 'write', 'delete', 'manage-users'],
      member: ['read', 'write'],
      viewer: ['read'],
    };

    return permissions[user.role].includes(permission);
  }

  async deleteUser(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    for (const [id, session] of this.sessions) {
      if (session.userId === userId) {
        this.sessions.delete(id);
      }
    }

    return this.users.delete(userId);
  }

  async deleteTenant(tenantId: string): Promise<boolean> {
    for (const [id, user] of this.users) {
      if (user.tenantId === tenantId) {
        this.users.delete(id);
      }
    }

    for (const [id, session] of this.sessions) {
      if (session.tenantId === tenantId) {
        this.sessions.delete(id);
      }
    }

    return this.tenants.delete(tenantId);
  }
}
