import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { UserRole, AppearanceConfig, NotificationConfig, Language } from '../types';

export interface DbVerificationCode {
  code: string;
  type: 'registration' | 'password_reset' | 'email_change' | 'login_verify';
  createdAt: string;
  expiresAt: string;
  attempts: number;
  maxAttempts: number;
  lastSentAt: string;
  resendCount: number;
  pendingEmail?: string;
  pendingData?: any;
}

export interface DbUser {
  id: string;
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  salt: string;
  avatar: string;
  role: UserRole;
  language: Language;
  appearance: AppearanceConfig;
  notifications: NotificationConfig;
  onboardingCompleted: boolean;
  activeServerId: string;
  emailVerified: boolean;
  verification?: DbVerificationCode;
  createdAt: string;
  lastLogin: string;
  lastActive: string;
}

export interface DbSession {
  id: string;
  userId: string;
  token: string;
  createdAt: string;
  lastActive: string;
  expiresAt: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    browser: string;
    os: string;
    deviceName: string;
  };
  isRevoked: boolean;
}

export interface DbServer {
  id: string;
  name: string;
  type: 'Fabric' | 'Vanilla' | 'Forge' | 'Paper' | 'Other';
  mcVersion: string;
  host: string;
  port: number;
  rconPort: number;
  rconPassword?: string;
  serverDir: string;
  startCommand: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbServerMember {
  id: string;
  serverId: string;
  userId: string;
  role: UserRole;
  permissions: string[];
  invitedBy: string;
  joinedAt: string;
}

export interface DbAuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  username: string;
  action: string;
  target: string;
  result: 'SUCCESS' | 'FAILED';
  details?: string;
  ip?: string;
  serverId?: string;
}

export interface DatabaseSchema {
  version: number;
  users: DbUser[];
  sessions: DbSession[];
  servers: DbServer[];
  server_members: DbServerMember[];
  audit_logs: DbAuditLog[];
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DB_DIR, 'aegis_db.json');

export class DatabaseService {
  private static instance: DatabaseService;
  private data: DatabaseSchema;
  private isSaving = false;

  private constructor() {
    this.data = this.loadDatabase();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.users)) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('[Database] Failed to read database from disk, bootstrapping fresh:', err);
    }

    return this.bootstrapDefaultDatabase();
  }

  private bootstrapDefaultDatabase(): DatabaseSchema {
    const salt = crypto.randomBytes(16).toString('hex');
    // Default password for seeded admin: "aegis123" or "password"
    const passwordHash = this.hashPassword('aegis123', salt);

    const defaultUserId = 'usr_ahmed_master';
    const defaultServerId = 'srv_aegis_main';

    const defaultUser: DbUser = {
      id: defaultUserId,
      name: 'Ahmed',
      username: 'ahmed',
      email: 'ahmed@aegis-smp.net',
      passwordHash,
      salt,
      avatar: '🛡️',
      role: 'owner',
      language: 'ar',
      appearance: {
        theme: 'dark',
        accent: 'emerald',
        animations: 'full',
        glassEffect: 'high',
        compactMode: false
      },
      notifications: {
        serverRestart: true,
        serverCrash: true,
        backupComplete: true,
        backupFailure: true,
        playerJoin: true,
        playerLeave: true,
        performanceWarning: true,
        scheduledBroadcast: true,
        modError: true
      },
      onboardingCompleted: true,
      activeServerId: defaultServerId,
      emailVerified: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };

    const defaultServer: DbServer = {
      id: defaultServerId,
      name: 'Aegis Survival SMP',
      type: 'Fabric',
      mcVersion: '1.20.4',
      host: 'reminded-truman.tun.ply.gg',
      port: 25565,
      rconPort: 25575,
      rconPassword: process.env.RCON_PASSWORD || 'your_secret_password_here',
      serverDir: '/workspaces/the-boy-11223',
      startCommand: 'java -Xms2G -Xmx4G -jar server.jar nogui',
      ownerId: defaultUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const defaultMember: DbServerMember = {
      id: 'mem_1',
      serverId: defaultServerId,
      userId: defaultUserId,
      role: 'owner',
      permissions: [
        'server.view',
        'server.start',
        'server.stop',
        'server.restart',
        'server.console',
        'players.view',
        'players.kick',
        'players.ban',
        'players.op',
        'players.inventory',
        'mods.manage',
        'backups.manage',
        'files.manage',
        'scheduler.manage',
        'settings.manage',
        'members.manage'
      ],
      invitedBy: 'SYSTEM',
      joinedAt: new Date().toISOString()
    };

    const initialDb: DatabaseSchema = {
      version: 1,
      users: [defaultUser],
      sessions: [],
      servers: [defaultServer],
      server_members: [defaultMember],
      audit_logs: [
        {
          id: `aud_${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: defaultUserId,
          username: 'Ahmed',
          action: 'SYSTEM_BOOTSTRAP',
          target: 'Database Initialized',
          result: 'SUCCESS',
          details: 'Aegis Core persistent database securely mounted.'
        }
      ]
    };

    this.saveToDisk(initialDb);
    return initialDb;
  }

  private saveToDisk(dataToSave?: DatabaseSchema) {
    if (this.isSaving) return;
    this.isSaving = true;
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      const data = dataToSave || this.data;
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('[Database] Failed to persist database to disk:', err);
    } finally {
      this.isSaving = false;
    }
  }

  // Cryptographic utilities
  public hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  }

  public generateSalt(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  public verifyPassword(password: string, salt: string, hash: string): boolean {
    if (!password || !salt || !hash) return false;
    try {
      // First try standard 100k iteration hash
      const computed = this.hashPassword(password, salt);
      if (crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'))) {
        return true;
      }
      // Backward compatibility for initial bootstrap (10k iterations)
      const legacyComputed = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
      return crypto.timingSafeEqual(Buffer.from(legacyComputed, 'hex'), Buffer.from(hash, 'hex'));
    } catch {
      return false;
    }
  }

  public generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // User queries & operations
  public findUserById(id: string): DbUser | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public findUserByUsernameOrEmail(identifier: string): DbUser | undefined {
    const clean = identifier.trim().toLowerCase();
    return this.data.users.find(
      (u) => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean
    );
  }

  public createUser(user: Omit<DbUser, 'id' | 'createdAt' | 'lastLogin' | 'lastActive'>): DbUser {
    const id = `usr_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();
    const newUser: DbUser = {
      ...user,
      id,
      createdAt: now,
      lastLogin: now,
      lastActive: now
    };
    this.data.users.push(newUser);
    this.saveToDisk();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<DbUser>): DbUser | null {
    const index = this.data.users.findIndex((u) => u.id === id);
    if (index === -1) return null;
    this.data.users[index] = {
      ...this.data.users[index],
      ...updates,
      lastActive: new Date().toISOString()
    };
    this.saveToDisk();
    return this.data.users[index];
  }

  public deleteUser(id: string): boolean {
    const index = this.data.users.findIndex((u) => u.id === id);
    if (index === -1) return false;
    // Remove user and user's sessions
    this.data.users.splice(index, 1);
    this.data.sessions = this.data.sessions.filter((s) => s.userId !== id);
    this.data.server_members = this.data.server_members.filter((m) => m.userId !== id);
    this.saveToDisk();
    return true;
  }

  // Verification Code Management
  public maskEmail(email: string): string {
    if (!email) return '';
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const name = parts[0];
    const domain = parts[1];
    if (name.length <= 2) {
      return `${name[0]}••••@${domain}`;
    }
    return `${name[0]}${'•'.repeat(Math.min(name.length - 1, 5))}@${domain}`;
  }

  public generate6DigitCode(): string {
    return Math.floor(100000 + crypto.randomInt(900000)).toString();
  }

  public createVerificationCode(
    userIdOrEmail: string,
    type: 'registration' | 'password_reset' | 'email_change' | 'login_verify',
    pendingEmail?: string,
    pendingData?: any
  ): {
    success: boolean;
    code?: string;
    expiresAt?: string;
    cooldownSeconds?: number;
    maskedEmail?: string;
    error?: string;
    isRateLimited?: boolean;
  } {
    const user =
      this.findUserById(userIdOrEmail) || this.findUserByUsernameOrEmail(userIdOrEmail);

    if (!user) {
      return { success: false, error: 'User account not found.' };
    }

    const now = Date.now();
    const existing = user.verification;

    // Check resend cooldown (60 seconds)
    if (existing && existing.lastSentAt) {
      const elapsedSec = Math.floor((now - new Date(existing.lastSentAt).getTime()) / 1000);
      if (elapsedSec < 60) {
        const remaining = 60 - elapsedSec;
        return {
          success: false,
          error: `Please wait ${remaining}s before requesting a new verification code.`,
          cooldownSeconds: remaining,
          isRateLimited: false
        };
      }

      // Check 15-minute rate limiting (max 5 resends in 15 mins)
      const windowElapsedMin = Math.floor((now - new Date(existing.createdAt).getTime()) / (60 * 1000));
      if (windowElapsedMin < 15 && existing.resendCount >= 5) {
        return {
          success: false,
          error: 'Too many verification attempts. Please try again after 15 minutes.',
          isRateLimited: true,
          cooldownSeconds: (15 - windowElapsedMin) * 60
        };
      }
    }

    const code = this.generate6DigitCode();
    const expiresAt = new Date(now + 10 * 60 * 1000).toISOString(); // 10 minutes
    const resendCount = existing ? existing.resendCount + 1 : 0;

    user.verification = {
      code,
      type,
      createdAt: existing && existing.createdAt ? existing.createdAt : new Date(now).toISOString(),
      expiresAt,
      attempts: 0,
      maxAttempts: 5,
      lastSentAt: new Date(now).toISOString(),
      resendCount,
      pendingEmail,
      pendingData
    };

    this.saveToDisk();

    const targetEmail = pendingEmail || user.email;

    return {
      success: true,
      code,
      expiresAt,
      cooldownSeconds: 60,
      maskedEmail: this.maskEmail(targetEmail)
    };
  }

  public verifyCode(
    userIdOrEmail: string,
    code: string,
    expectedType?: 'registration' | 'password_reset' | 'email_change' | 'login_verify'
  ): {
    success: boolean;
    error?: string;
    user?: DbUser;
    pendingEmail?: string;
    pendingData?: any;
    remainingAttempts?: number;
    isExpired?: boolean;
    isMaxAttempts?: boolean;
  } {
    const user =
      this.findUserById(userIdOrEmail) || this.findUserByUsernameOrEmail(userIdOrEmail);

    if (!user) {
      return { success: false, error: 'User account not found.' };
    }

    if (!user.verification) {
      if (user.emailVerified && expectedType === 'registration') {
        return { success: true, user };
      }
      return { success: false, error: 'No active verification code found. Please request a new code.' };
    }

    const v = user.verification;

    if (expectedType && v.type !== expectedType) {
      return { success: false, error: 'Invalid verification context. Please request a new code.' };
    }

    // Check maximum attempts
    if (v.attempts >= v.maxAttempts) {
      return {
        success: false,
        error: 'Too many attempts. This code is locked. Please request a new code.',
        isMaxAttempts: true
      };
    }

    // Check expiration
    if (new Date(v.expiresAt).getTime() < Date.now()) {
      return {
        success: false,
        error: 'This verification code has expired. Please request a new code.',
        isExpired: true
      };
    }

    // Check code match (clean string comparison)
    const cleanInput = String(code).trim();
    const cleanStored = String(v.code).trim();

    if (cleanInput !== cleanStored) {
      v.attempts += 1;
      const remainingAttempts = Math.max(0, v.maxAttempts - v.attempts);
      this.saveToDisk();

      if (remainingAttempts === 0) {
        return {
          success: false,
          error: 'Too many incorrect attempts. Please request a new verification code.',
          isMaxAttempts: true,
          remainingAttempts: 0
        };
      }

      return {
        success: false,
        error: `Incorrect verification code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`,
        remainingAttempts
      };
    }

    // Successfully verified!
    const pendingEmail = v.pendingEmail;
    const pendingData = v.pendingData;

    if (v.type === 'registration' || v.type === 'login_verify') {
      user.emailVerified = true;
    } else if (v.type === 'email_change' && pendingEmail) {
      user.email = pendingEmail;
      user.emailVerified = true;
    }

    // Clear verification payload
    delete user.verification;
    this.saveToDisk();

    return {
      success: true,
      user,
      pendingEmail,
      pendingData
    };
  }

  public resetPasswordWithCode(
    userIdOrEmail: string,
    code: string,
    newPassword: string
  ): { success: boolean; error?: string; user?: DbUser } {
    const verified = this.verifyCode(userIdOrEmail, code, 'password_reset');
    if (!verified.success || !verified.user) {
      return { success: false, error: verified.error || 'Password reset verification failed.' };
    }

    const user = verified.user;
    const newSalt = this.generateSalt();
    const newHash = this.hashPassword(newPassword, newSalt);

    user.salt = newSalt;
    user.passwordHash = newHash;
    user.emailVerified = true;

    // Revoke all existing sessions on password reset for security
    for (const session of this.data.sessions) {
      if (session.userId === user.id) {
        session.isRevoked = true;
      }
    }

    this.saveToDisk();
    return { success: true, user };
  }

  // Session operations
  public createSession(
    userId: string,
    deviceInfo: DbSession['deviceInfo'],
    rememberMe = true
  ): DbSession {
    const token = this.generateSessionToken();
    const id = `ses_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date();
    // 30 days expiration if remember me, 24 hours otherwise
    const expiresDays = rememberMe ? 30 : 1;
    const expiresAt = new Date(now.getTime() + expiresDays * 24 * 60 * 60 * 1000).toISOString();

    const session: DbSession = {
      id,
      userId,
      token,
      createdAt: now.toISOString(),
      lastActive: now.toISOString(),
      expiresAt,
      deviceInfo,
      isRevoked: false
    };

    this.data.sessions.push(session);
    this.saveToDisk();
    return session;
  }

  public findSessionByToken(token: string): DbSession | undefined {
    if (!token) return undefined;
    const session = this.data.sessions.find((s) => s.token === token && !s.isRevoked);
    if (!session) return undefined;

    // Check expiration
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      session.isRevoked = true;
      this.saveToDisk();
      return undefined;
    }

    // Update last active
    session.lastActive = new Date().toISOString();
    return session;
  }

  public getUserSessions(userId: string): DbSession[] {
    return this.data.sessions.filter(
      (s) => s.userId === userId && !s.isRevoked && new Date(s.expiresAt).getTime() > Date.now()
    );
  }

  public revokeSession(tokenOrId: string, userId: string): boolean {
    const session = this.data.sessions.find(
      (s) => (s.token === tokenOrId || s.id === tokenOrId) && s.userId === userId
    );
    if (session) {
      session.isRevoked = true;
      this.saveToDisk();
      return true;
    }
    return false;
  }

  public revokeOtherSessions(userId: string, currentToken: string): number {
    let count = 0;
    for (const session of this.data.sessions) {
      if (session.userId === userId && session.token !== currentToken && !session.isRevoked) {
        session.isRevoked = true;
        count++;
      }
    }
    if (count > 0) this.saveToDisk();
    return count;
  }

  // Server management
  public getUserServers(userId: string): (DbServer & { userRole: UserRole })[] {
    // 1. Servers where user is a member
    const memberships = this.data.server_members.filter((m) => m.userId === userId);
    const results: (DbServer & { userRole: UserRole })[] = [];

    for (const mem of memberships) {
      const server = this.data.servers.find((s) => s.id === mem.serverId);
      if (server) {
        results.push({
          ...server,
          userRole: mem.role
        });
      }
    }

    // 2. Servers where user is owner but membership record might be missing
    for (const server of this.data.servers) {
      if (server.ownerId === userId && !results.some((r) => r.id === server.id)) {
        results.push({
          ...server,
          userRole: 'owner'
        });
      }
    }

    return results;
  }

  public findServerById(serverId: string): DbServer | undefined {
    return this.data.servers.find((s) => s.id === serverId);
  }

  public createServer(
    server: Omit<DbServer, 'id' | 'createdAt' | 'updatedAt'>,
    ownerId: string
  ): DbServer {
    const id = `srv_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();
    const newServer: DbServer = {
      ...server,
      id,
      ownerId,
      createdAt: now,
      updatedAt: now
    };
    this.data.servers.push(newServer);

    // Add owner membership
    const member: DbServerMember = {
      id: `mem_${crypto.randomBytes(6).toString('hex')}`,
      serverId: id,
      userId: ownerId,
      role: 'owner',
      permissions: [
        'server.view',
        'server.start',
        'server.stop',
        'server.restart',
        'server.console',
        'players.view',
        'players.kick',
        'players.ban',
        'players.op',
        'players.inventory',
        'mods.manage',
        'backups.manage',
        'files.manage',
        'scheduler.manage',
        'settings.manage',
        'members.manage'
      ],
      invitedBy: ownerId,
      joinedAt: now
    };
    this.data.server_members.push(member);

    this.saveToDisk();
    return newServer;
  }

  public updateServer(serverId: string, updates: Partial<DbServer>): DbServer | null {
    const index = this.data.servers.findIndex((s) => s.id === serverId);
    if (index === -1) return null;
    this.data.servers[index] = {
      ...this.data.servers[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveToDisk();
    return this.data.servers[index];
  }

  public deleteServer(serverId: string, userId: string): boolean {
    const server = this.data.servers.find((s) => s.id === serverId);
    if (!server || server.ownerId !== userId) return false;

    this.data.servers = this.data.servers.filter((s) => s.id !== serverId);
    this.data.server_members = this.data.server_members.filter((m) => m.serverId !== serverId);
    this.saveToDisk();
    return true;
  }

  // Server Members
  public getServerMembers(serverId: string): { member: DbServerMember; user: DbUser }[] {
    const members = this.data.server_members.filter((m) => m.serverId === serverId);
    const result: { member: DbServerMember; user: DbUser }[] = [];

    for (const mem of members) {
      const user = this.data.users.find((u) => u.id === mem.userId);
      if (user) {
        result.push({ member: mem, user });
      }
    }
    return result;
  }

  public addServerMember(
    serverId: string,
    targetUserId: string,
    role: UserRole,
    invitedBy: string
  ): DbServerMember | null {
    const server = this.data.servers.find((s) => s.id === serverId);
    if (!server) return null;

    const existing = this.data.server_members.find(
      (m) => m.serverId === serverId && m.userId === targetUserId
    );
    if (existing) {
      existing.role = role;
      this.saveToDisk();
      return existing;
    }

    const permissions = this.getDefaultRolePermissions(role);
    const newMember: DbServerMember = {
      id: `mem_${crypto.randomBytes(6).toString('hex')}`,
      serverId,
      userId: targetUserId,
      role,
      permissions,
      invitedBy,
      joinedAt: new Date().toISOString()
    };

    this.data.server_members.push(newMember);
    this.saveToDisk();
    return newMember;
  }

  public removeServerMember(serverId: string, targetUserId: string): boolean {
    const prevLen = this.data.server_members.length;
    this.data.server_members = this.data.server_members.filter(
      (m) => !(m.serverId === serverId && m.userId === targetUserId)
    );
    if (this.data.server_members.length !== prevLen) {
      this.saveToDisk();
      return true;
    }
    return false;
  }

  public getUserRoleForServer(userId: string, serverId: string): UserRole | null {
    const server = this.data.servers.find((s) => s.id === serverId);
    if (server && server.ownerId === userId) return 'owner';

    const member = this.data.server_members.find(
      (m) => m.serverId === serverId && m.userId === userId
    );
    return member ? member.role : null;
  }

  public getDefaultRolePermissions(role: UserRole): string[] {
    switch (role) {
      case 'owner':
        return [
          'server.view',
          'server.start',
          'server.stop',
          'server.restart',
          'server.console',
          'players.view',
          'players.kick',
          'players.ban',
          'players.op',
          'players.inventory',
          'mods.manage',
          'backups.manage',
          'files.manage',
          'scheduler.manage',
          'settings.manage',
          'members.manage'
        ];
      case 'admin':
        return [
          'server.view',
          'server.start',
          'server.stop',
          'server.restart',
          'server.console',
          'players.view',
          'players.kick',
          'players.ban',
          'players.op',
          'players.inventory',
          'mods.manage',
          'backups.manage',
          'files.manage',
          'scheduler.manage',
          'settings.manage'
        ];
      case 'moderator':
        return [
          'server.view',
          'players.view',
          'players.kick',
          'players.ban',
          'players.inventory',
          'chat.broadcast',
          'teleport.manage'
        ];
      case 'viewer':
      default:
        return ['server.view', 'players.view'];
    }
  }

  // Audit Logs
  public logAudit(log: Omit<DbAuditLog, 'id' | 'timestamp'>): DbAuditLog {
    const item: DbAuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...log
    };
    this.data.audit_logs.unshift(item);
    // Keep max 500 audit logs
    if (this.data.audit_logs.length > 500) {
      this.data.audit_logs = this.data.audit_logs.slice(0, 500);
    }
    this.saveToDisk();
    return item;
  }

  public getAuditLogs(limit = 100): DbAuditLog[] {
    return this.data.audit_logs.slice(0, limit);
  }

  // Export & sanitization
  public sanitizeUser(user: DbUser) {
    const { passwordHash, salt, ...safe } = user;
    return safe;
  }
}
