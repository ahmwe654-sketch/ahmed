// ============================================================================
// AEGIS CORE - CENTRAL SERVICE LAYER
// Real Production Service + Optional Mock Development Service
// ============================================================================

import {
  ServerStatusData,
  ServerMetricsData,
  ServerInfoData,
  Player,
  WorldSettings,
  FabricMod,
  WorldBackup,
  ConsoleLogMessage,
  ChatMessage,
  CustomWaypoint,
  ScheduledTask,
  ServerEventItem,
  AuditLogItem,
  DeathRecord,
  WhitelistEntry,
  BanEntry,
  ServerConfigFile,
  ConnectionConfig
} from '../types';

import {
  IMinecraftService,
  PairingCodeResponse,
  ConnectionTestResult
} from './MinecraftService';

export class RealMinecraftService implements IMinecraftService {
  private sessionToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('aegis_session_token') : null;

  public setSessionToken(token: string | null) {
    this.sessionToken = token;
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('aegis_session_token', token);
      else localStorage.removeItem('aegis_session_token');
    }
  }

  public getSessionToken(): string | null {
    if (!this.sessionToken && typeof window !== 'undefined') {
      this.sessionToken = localStorage.getItem('aegis_session_token');
    }
    return this.sessionToken;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options?.headers as Record<string, string> || {})
      };

      const token = this.getSessionToken();
      if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(endpoint, {
        credentials: 'include',
        headers,
        ...options
      });

      const contentType = response.headers.get('content-type') || '';

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status} (${response.statusText})`;
        if (contentType.includes('application/json')) {
          try {
            const errData = await response.json();
            if (errData?.error) errorMessage = errData.error;
            else if (errData?.message) errorMessage = errData.message;
          } catch {
            // Ignore parse failure
          }
        }
        throw new Error(errorMessage);
      }

      if (contentType.includes('application/json')) {
        return await response.json();
      } else {
        const text = await response.text();
        if (text.startsWith('{') || text.startsWith('[')) {
          return JSON.parse(text);
        }
        throw new Error(`Server returned non-JSON response from ${endpoint}`);
      }
    } catch (err: any) {
      console.warn(`[API Info] ${endpoint}: ${err?.message || err}`);
      throw err;
    }
  }

  // --- Authentication & Cloud Profile ---
  async register(data: {
    name: string;
    username: string;
    email: string;
    password?: string;
    language?: string;
    appearance?: any;
    notifications?: any;
    serverName?: string;
    serverType?: string;
    mcVersion?: string;
    rememberMe?: boolean;
  }): Promise<{ success: boolean; requireVerification?: boolean; email?: string; maskedEmail?: string; cooldownSeconds?: number; expiresInSeconds?: number; devCode?: string; isDevFallback?: boolean; user?: any; token?: string; message?: string }> {
    const res = await this.request<{ success: boolean; requireVerification?: boolean; email?: string; maskedEmail?: string; cooldownSeconds?: number; expiresInSeconds?: number; devCode?: string; isDevFallback?: boolean; user?: any; token?: string; message?: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res.token) {
      this.setSessionToken(res.token);
    }
    return res;
  }

  async login(data: { identifier: string; password?: string; rememberMe?: boolean }): Promise<{ success: boolean; requireVerification?: boolean; email?: string; maskedEmail?: string; cooldownSeconds?: number; expiresInSeconds?: number; devCode?: string; isDevFallback?: boolean; user?: any; token?: string; message?: string }> {
    const res = await this.request<{ success: boolean; requireVerification?: boolean; email?: string; maskedEmail?: string; cooldownSeconds?: number; expiresInSeconds?: number; devCode?: string; isDevFallback?: boolean; user?: any; token?: string; message?: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res.token) {
      this.setSessionToken(res.token);
    }
    return res;
  }

  async sendVerificationCode(data: { email: string; type?: string; newEmail?: string }): Promise<{ success: boolean; cooldownSeconds?: number; expiresInSeconds?: number; maskedEmail?: string; devCode?: string; isDevFallback?: boolean; message?: string }> {
    return this.request('/api/auth/send-code', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async verifyCode(data: { email: string; code: string; type?: string; rememberMe?: boolean }): Promise<{ success: boolean; user?: any; token?: string; remainingAttempts?: number; message?: string }> {
    const res = await this.request<{ success: boolean; user?: any; token?: string; remainingAttempts?: number; message?: string }>('/api/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res.token) {
      this.setSessionToken(res.token);
    }
    return res;
  }

  async forgotPassword(email: string): Promise<{ success: boolean; cooldownSeconds?: number; expiresInSeconds?: number; maskedEmail?: string; devCode?: string; isDevFallback?: boolean; message?: string }> {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async resetPasswordWithCode(data: { email: string; code: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    return this.request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async resetPassword(data: { email: string; code: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    return this.resetPasswordWithCode(data);
  }

  async requestEmailChange(newEmail: string): Promise<{ success: boolean; cooldownSeconds?: number; expiresInSeconds?: number; maskedEmail?: string; devCode?: string; isDevFallback?: boolean; message?: string }> {
    return this.request('/api/auth/request-email-change', {
      method: 'POST',
      body: JSON.stringify({ newEmail })
    });
  }

  async verifyEmailChange(code: string): Promise<{ success: boolean; user?: any; message: string }> {
    return this.request('/api/auth/verify-email-change', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
  }

  async logout(): Promise<{ success: boolean }> {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    this.setSessionToken(null);
    return { success: true };
  }

  async getSession(): Promise<{ success: boolean; authenticated?: boolean; user: any }> {
    return this.request<{ success: boolean; authenticated?: boolean; user: any }>('/api/auth/me');
  }

  async getActiveSessions(): Promise<{ sessions: any[] }> {
    return this.request<{ sessions: any[] }>('/api/auth/sessions');
  }

  async getSessions(): Promise<{ sessions: any[] }> {
    return this.getActiveSessions();
  }

  async revokeSession(sessionId: string): Promise<{ success: boolean }> {
    return this.request('/api/auth/sessions/revoke', {
      method: 'POST',
      body: JSON.stringify({ sessionId })
    });
  }

  async revokeOtherSessions(): Promise<{ success: boolean; count: number }> {
    return this.request('/api/auth/sessions/revoke-others', {
      method: 'POST'
    });
  }

  async revokeAllOtherSessions(): Promise<{ success: boolean; count?: number }> {
    return this.revokeOtherSessions();
  }

  async updateUserProfile(data: any): Promise<{ success: boolean; user: any }> {
    return this.request('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async updateProfile(data: any): Promise<{ success: boolean; user: any }> {
    return this.updateUserProfile(data);
  }

  async updateAppearance(data: any): Promise<{ success: boolean; appearance?: any; user?: any }> {
    return this.updateUserProfile({ appearance: data });
  }

  async updateNotifications(data: any): Promise<{ success: boolean; notifications?: any; user?: any }> {
    return this.updateUserProfile({ notifications: data });
  }

  async changePassword(data: { currentPassword?: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    return this.request('/api/auth/password', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async deleteAccount(data?: { confirmation: string }): Promise<{ success: boolean }> {
    const res = await this.request<{ success: boolean }>('/api/auth/delete-account', {
      method: 'POST',
      body: JSON.stringify(data || { confirmation: 'DELETE' })
    });
    this.setSessionToken(null);
    return res;
  }

  async exportAccountData(): Promise<any> {
    return this.request('/api/auth/export-data');
  }

  // --- Multi-Server & Members ---
  async getServers(): Promise<{ servers: any[]; activeServerId: string }> {
    return this.request('/api/servers');
  }

  async createServer(data: { name: string; type?: string; serverType?: string; mcVersion?: string; host?: string; port?: number; rconPort?: number; rconPassword?: string; serverDir?: string; startCommand?: string }): Promise<{ success: boolean; server: any }> {
    const payload = {
      ...data,
      type: data.serverType || data.type || 'Fabric'
    };
    return this.request('/api/servers', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async selectActiveServer(serverId: string): Promise<{ success: boolean; activeServerId: string; server?: any }> {
    return this.request('/api/servers/select', {
      method: 'POST',
      body: JSON.stringify({ serverId })
    });
  }

  async updateServer(serverId: string, data: any): Promise<{ success: boolean; server: any }> {
    return this.request(`/api/servers/${encodeURIComponent(serverId)}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async deleteServer(serverId: string): Promise<{ success: boolean }> {
    return this.request(`/api/servers/${encodeURIComponent(serverId)}`, {
      method: 'DELETE'
    });
  }

  async getServerMembers(serverId: string): Promise<{ members: any[] }> {
    return this.request(`/api/servers/${encodeURIComponent(serverId)}/members`);
  }

  async inviteServerMember(serverId: string, data: { usernameOrEmail: string; role: string }): Promise<{ success: boolean; member: any }> {
    return this.request(`/api/servers/${encodeURIComponent(serverId)}/members/invite`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async addServerMember(serverId: string, data: { username: string; role: string }): Promise<{ success: boolean; member: any }> {
    return this.inviteServerMember(serverId, { usernameOrEmail: data.username, role: data.role });
  }

  async updateServerMemberRole(serverId: string, userId: string, role: string): Promise<{ success: boolean }> {
    return this.request(`/api/servers/${encodeURIComponent(serverId)}/members/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
  }

  async removeServerMember(serverId: string, userId: string): Promise<{ success: boolean }> {
    return this.request(`/api/servers/${encodeURIComponent(serverId)}/members/${encodeURIComponent(userId)}`, {
      method: 'DELETE'
    });
  }

  // --- Connection & Pairing ---
  async getConnectionConfig(): Promise<ConnectionConfig> {
    return this.request<ConnectionConfig>('/api/connection');
  }

  async saveConnectionConfig(config: Partial<ConnectionConfig> & { rconPassword?: string }): Promise<{ success: boolean; message: string }> {
    return this.request('/api/connection/save', {
      method: 'POST',
      body: JSON.stringify(config)
    });
  }

  async testConnection(config: { host: string; port: number; rconPort?: number; rconPassword?: string }): Promise<ConnectionTestResult> {
    return this.request<ConnectionTestResult>('/api/connection/test', {
      method: 'POST',
      body: JSON.stringify(config)
    });
  }

  async generatePairingCode(): Promise<PairingCodeResponse> {
    return this.request<PairingCodeResponse>('/api/connection/pair/generate', {
      method: 'POST'
    });
  }

  async verifyPairingCode(code: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/connection/pair/verify', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
  }

  // --- Server Lifecycle & Diagnostics ---
  async getServerStatus(): Promise<{ status: ServerStatusData }> {
    return this.request<{ status: ServerStatusData }>('/api/server/status');
  }

  async getServerMetrics(): Promise<{ metrics: ServerMetricsData }> {
    return this.request<{ metrics: ServerMetricsData }>('/api/server/metrics');
  }

  async getServerInfo(): Promise<{ info: ServerInfoData }> {
    return this.request<{ info: ServerInfoData }>('/api/server/info');
  }

  async startServer(admin = 'Admin'): Promise<{ success: boolean; message: string; status?: ServerStatusData }> {
    return this.request('/api/server/start', {
      method: 'POST',
      body: JSON.stringify({ admin })
    });
  }

  async stopServer(admin = 'Admin'): Promise<{ success: boolean; message: string; status?: ServerStatusData }> {
    return this.request('/api/server/stop', {
      method: 'POST',
      body: JSON.stringify({ admin })
    });
  }

  async restartServer(admin = 'Admin'): Promise<{ success: boolean; message: string; status?: ServerStatusData }> {
    return this.request('/api/server/restart', {
      method: 'POST',
      body: JSON.stringify({ admin })
    });
  }

  async killServer(admin = 'Admin'): Promise<{ success: boolean; message: string }> {
    return this.request('/api/server/kill', {
      method: 'POST',
      body: JSON.stringify({ admin })
    });
  }

  async toggleMaintenance(enabled?: boolean): Promise<{ success: boolean; maintenanceMode: boolean; message: string }> {
    return this.request('/api/server/maintenance', {
      method: 'POST',
      body: JSON.stringify({ enabled })
    });
  }

  async renameServer(serverName: string, admin = 'Admin'): Promise<{ success: boolean; serverName: string; message: string }> {
    return this.request('/api/server/rename', {
      method: 'POST',
      body: JSON.stringify({ serverName, admin })
    });
  }

  // --- Players ---
  async getPlayers(): Promise<{ players: Player[] }> {
    return this.request<{ players: Player[] }>('/api/players');
  }

  async getPlayerDetails(username: string): Promise<{ player: Player }> {
    return this.request<{ player: Player }>(`/api/players/${encodeURIComponent(username)}`);
  }

  async executePlayerAction(
    action: string,
    username: string,
    payload?: any
  ): Promise<{ success: boolean; message: string }> {
    return this.request('/api/player/action', {
      method: 'POST',
      body: JSON.stringify({ action, username, payload })
    });
  }

  async kickPlayer(username: string, reason?: string): Promise<{ success: boolean; message: string }> {
    return this.executePlayerAction('kick', username, { reason });
  }

  async banPlayer(username: string, reason?: string): Promise<{ success: boolean; message: string }> {
    return this.executePlayerAction('ban', username, { reason });
  }

  async unbanPlayer(target: string): Promise<{ success: boolean; message: string }> {
    return this.executePlayerAction('unban', target);
  }

  async opPlayer(username: string): Promise<{ success: boolean; message: string }> {
    return this.executePlayerAction('op', username);
  }

  async deopPlayer(username: string): Promise<{ success: boolean; message: string }> {
    return this.executePlayerAction('deop', username);
  }

  async healPlayer(username: string): Promise<{ success: boolean; message: string }> {
    return this.executePlayerAction('heal', username);
  }

  async feedPlayer(username: string): Promise<{ success: boolean; message: string }> {
    return this.executePlayerAction('feed', username);
  }

  async teleportPlayer(options: {
    target: string;
    destination?: string;
    coords?: { x: number; y: number; z: number };
    dimension?: string;
  }): Promise<{ success: boolean; message: string }> {
    return this.request('/api/teleport', {
      method: 'POST',
      body: JSON.stringify(options)
    });
  }

  async addPlayer(username: string): Promise<{ success: boolean; player: Player }> {
    return this.request('/api/players/add', {
      method: 'POST',
      body: JSON.stringify({ username })
    });
  }

  // --- World & Environment ---
  async getWorldSettings(): Promise<{ world: WorldSettings }> {
    return this.request<{ world: WorldSettings }>('/api/world/settings');
  }

  async setWorldTime(presetOrTicks: string | number): Promise<{ success: boolean; message: string }> {
    const body = typeof presetOrTicks === 'number' ? { ticks: presetOrTicks } : { preset: presetOrTicks };
    return this.request('/api/world/time', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async setWorldWeather(type: 'clear' | 'rain' | 'thunder'): Promise<{ success: boolean; message: string }> {
    return this.request('/api/world/weather', {
      method: 'POST',
      body: JSON.stringify({ type })
    });
  }

  async setGamerule(rule: string, value: any): Promise<{ success: boolean; message: string }> {
    return this.request('/api/world/gamerules', {
      method: 'POST',
      body: JSON.stringify({ rule, value })
    });
  }

  async setWorldSeed(seed: string): Promise<{ success: boolean; message: string }> {
    return this.request('/api/world/seed', {
      method: 'POST',
      body: JSON.stringify({ seed })
    });
  }

  async saveWorld(): Promise<{ success: boolean; message: string }> {
    return this.request('/api/world/save', { method: 'POST' });
  }

  async purgeEntities(type: 'items' | 'monsters' | 'all' = 'items'): Promise<{ success: boolean; message: string; count: number }> {
    return this.request('/api/performance/purge-entities', {
      method: 'POST',
      body: JSON.stringify({ type })
    });
  }

  async purgeLag(type: 'items' | 'monsters' | 'all' = 'items'): Promise<{ success: boolean; message: string; count: number }> {
    return this.purgeEntities(type);
  }

  // --- Waypoints ---
  async getWaypoints(): Promise<{ waypoints: CustomWaypoint[] }> {
    return this.request<{ waypoints: CustomWaypoint[] }>('/api/waypoints');
  }

  async createWaypoint(data: { name: string; world: string; x: number; y: number; z: number; createdBy?: string }): Promise<{ success: boolean; waypoint: CustomWaypoint }> {
    return this.request('/api/waypoints', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async deleteWaypoint(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/waypoints/${id}`, { method: 'DELETE' });
  }

  // --- Whitelist & Bans ---
  async getWhitelist(): Promise<{ whitelist: { enabled: boolean; players: WhitelistEntry[] } }> {
    return this.request('/api/whitelist');
  }

  async toggleWhitelist(enabled?: boolean): Promise<{ success: boolean; enabled: boolean }> {
    return this.request('/api/whitelist/toggle', {
      method: 'POST',
      body: JSON.stringify({ enabled })
    });
  }

  async addWhitelist(username: string): Promise<{ success: boolean; message: string }> {
    return this.request('/api/whitelist/add', {
      method: 'POST',
      body: JSON.stringify({ username })
    });
  }

  async removeWhitelist(username: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/whitelist/${encodeURIComponent(username)}`, {
      method: 'DELETE'
    });
  }

  async getBans(): Promise<{ bans: BanEntry[] }> {
    return this.request('/api/bans');
  }

  // --- Fabric Mods ---
  async getMods(): Promise<{ mods: FabricMod[] }> {
    return this.request<{ mods: FabricMod[] }>('/api/mods');
  }

  async uploadMod(fileOrData: File | { name: string; fileName: string; version?: string; author?: string; description?: string }): Promise<{ success: boolean; mod: FabricMod }> {
    const data = fileOrData instanceof File ? {
      name: fileOrData.name.replace(/\.jar$/i, ''),
      fileName: fileOrData.name,
      version: '1.0.0',
      author: 'Custom',
      description: 'Uploaded mod package'
    } : fileOrData;

    return this.request('/api/mods/upload', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async toggleMod(id: string, enabled?: boolean): Promise<{ success: boolean; mod: FabricMod; message: string }> {
    return this.request(`/api/mods/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled })
    });
  }

  async deleteMod(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/mods/${id}`, { method: 'DELETE' });
  }

  // --- Backups ---
  async getBackups(): Promise<{ backups: WorldBackup[] }> {
    return this.request<{ backups: WorldBackup[] }>('/api/backups');
  }

  async createBackup(nameOrData?: string | { name?: string; dimension?: string; note?: string }): Promise<{ success: boolean; backup: WorldBackup }> {
    const data = typeof nameOrData === 'string' ? { name: nameOrData } : (nameOrData || {});
    return this.request('/api/backups', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async restoreBackup(id: string): Promise<{ success: boolean; message: string }> {
    return this.request('/api/backups/restore', {
      method: 'POST',
      body: JSON.stringify({ id })
    });
  }

  async deleteBackup(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/backups/${id}`, { method: 'DELETE' });
  }

  // --- Console & Commands ---
  async getConsoleLogs(): Promise<{ logs: ConsoleLogMessage[] }> {
    return this.request<{ logs: ConsoleLogMessage[] }>('/api/console');
  }

  async sendCommand(command: string): Promise<{ success: boolean; output: string }> {
    return this.request<{ success: boolean; output: string }>('/api/command', {
      method: 'POST',
      body: JSON.stringify({ command })
    });
  }

  async clearConsole(): Promise<{ success: boolean; message: string }> {
    return this.request('/api/console/clear', { method: 'POST' });
  }

  // --- Chat ---
  async getChatMessages(): Promise<{ messages: ChatMessage[] }> {
    return this.request<{ messages: ChatMessage[] }>('/api/chat');
  }

  async broadcastChat(message: string, sender = 'Admin'): Promise<{ success: boolean; message: string }> {
    return this.request('/api/chat/broadcast', {
      method: 'POST',
      body: JSON.stringify({ message, sender })
    });
  }

  async broadcastMessage(message: string, sender = 'Admin'): Promise<{ success: boolean; message: string }> {
    return this.broadcastChat(message, sender);
  }

  // --- Events, Audit, Deaths, Scheduler ---
  async getServerEvents(): Promise<{ events: ServerEventItem[] }> {
    return this.request<{ events: ServerEventItem[] }>('/api/events');
  }

  async getAuditLogs(): Promise<{ audit: AuditLogItem[] }> {
    return this.request<{ audit: AuditLogItem[] }>('/api/audit');
  }

  async getDeathHistory(): Promise<{ deaths: DeathRecord[] }> {
    return this.request<{ deaths: DeathRecord[] }>('/api/deaths');
  }

  async getSchedulerTasks(): Promise<{ tasks: ScheduledTask[] }> {
    return this.request<{ tasks: ScheduledTask[] }>('/api/scheduler');
  }

  async createSchedulerTask(task: Partial<ScheduledTask>): Promise<{ success: boolean; task: ScheduledTask }> {
    return this.request('/api/scheduler', {
      method: 'POST',
      body: JSON.stringify(task)
    });
  }

  async deleteSchedulerTask(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/scheduler/${id}`, { method: 'DELETE' });
  }

  async toggleSchedulerTask(id: string, enabled?: boolean): Promise<{ success: boolean; task: ScheduledTask }> {
    return this.request(`/api/scheduler/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled })
    });
  }

  // --- Files & Settings ---
  async getFiles(): Promise<{ files: ServerConfigFile[] }> {
    return this.request<{ files: ServerConfigFile[] }>('/api/files');
  }

  async readFile(name: string): Promise<{ name: string; content: string }> {
    return this.request(`/api/files/read?name=${encodeURIComponent(name)}`);
  }

  async saveFile(name: string, content: string): Promise<{ success: boolean; message: string }> {
    return this.request('/api/files/save', {
      method: 'POST',
      body: JSON.stringify({ name, content })
    });
  }

  async getSettings(): Promise<{ settings: any }> {
    return this.request('/api/settings');
  }

  async saveSettings(settings: any): Promise<{ success: boolean; message: string }> {
    return this.request('/api/settings', {
      method: 'POST',
      body: JSON.stringify({ settings })
    });
  }

  async saveServerSettings(settings: any): Promise<{ success: boolean; message: string }> {
    return this.saveSettings(settings);
  }
}

// Development / Mock fallback implementation if explicitly in demo sandbox mode
export class MockMinecraftService implements IMinecraftService {
  async getConnectionConfig(): Promise<ConnectionConfig> {
    return {
      host: '127.0.0.1',
      port: 25565,
      rconPort: 25575,
      rconConfigured: false,
      rconConnected: false,
      serverDir: '/workspace/minecraft-server',
      startCommand: 'java -Xms2G -Xmx4G -jar fabric-server-launch.jar nogui'
    };
  }

  async saveConnectionConfig(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Mock configuration saved' };
  }

  async testConnection(): Promise<ConnectionTestResult> {
    return {
      reachable: false,
      online: false,
      error: 'Mock mode active. Connect to real server to view live state.'
    };
  }

  async generatePairingCode(): Promise<PairingCodeResponse> {
    return {
      code: 'AEGIS-DEMO-0000',
      expiresInSeconds: 600,
      serverCommand: '/aegis pair AEGIS-DEMO-0000'
    };
  }

  async verifyPairingCode(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Mock pairing verified' };
  }

  async getServerStatus(): Promise<{ status: ServerStatusData }> {
    return {
      status: {
        serverName: 'Aegis Core SMP (Demo)',
        status: 'OFFLINE',
        state: 'OFFLINE',
        online: false,
        version: '1.20.4',
        software: 'Fabric',
        loader: 'Fabric 0.15.7',
        ip: '127.0.0.1',
        port: 25565,
        rconPort: 25575,
        motd: 'Connect to your live Minecraft server',
        tps: 0,
        mspt: 0,
        uptimeSeconds: 0,
        playersOnline: 0,
        maxPlayers: 20,
        rconConnected: false,
        rconConfigured: false,
        maintenanceMode: false
      }
    };
  }

  async getServerMetrics(): Promise<{ metrics: ServerMetricsData }> {
    return {
      metrics: {
        cpuUsage: 0,
        ramUsedMB: 0,
        ramTotalMB: 8192,
        diskUsedGB: 0,
        diskTotalGB: 50,
        tps: 0,
        mspt: 0,
        pingMs: 0,
        entitiesCount: 0,
        loadedChunks: 0
      }
    };
  }

  async getServerInfo(): Promise<{ info: ServerInfoData }> {
    return {
      info: {
        serverName: 'Aegis Core SMP (Demo)',
        motd: 'Connect your real server in the setup screen',
        minecraftVersion: '1.20.4',
        edition: 'Java Edition',
        loader: 'Fabric',
        javaVersion: 'Java 21 OpenJDK',
        jvmArguments: '-Xms2G -Xmx4G',
        os: 'Linux',
        cores: 4,
        worldName: 'world',
        worldSeed: 'N/A',
        worldSizeMB: 0
      }
    };
  }

  async startServer(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Mock server start simulated' };
  }

  async stopServer(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Mock server stop simulated' };
  }

  async restartServer(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Mock server restart simulated' };
  }

  async killServer(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Mock kill simulated' };
  }

  async toggleMaintenance(): Promise<{ success: boolean; maintenanceMode: boolean; message: string }> {
    return { success: true, maintenanceMode: false, message: 'Maintenance mode toggled' };
  }

  async renameServer(serverName: string): Promise<{ success: boolean; serverName: string; message: string }> {
    return { success: true, serverName, message: `Renamed to ${serverName}` };
  }

  async getPlayers(): Promise<{ players: Player[] }> {
    return { players: [] };
  }

  async getPlayerDetails(): Promise<{ player: Player }> {
    throw new Error('Player not found');
  }

  async executePlayerAction(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Action executed in mock mode' };
  }

  async kickPlayer(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Player kicked' };
  }

  async banPlayer(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Player banned' };
  }

  async unbanPlayer(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Player unbanned' };
  }

  async opPlayer(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Player op granted' };
  }

  async deopPlayer(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Player op revoked' };
  }

  async healPlayer(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Player healed' };
  }

  async feedPlayer(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Player fed' };
  }

  async teleportPlayer(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Teleport executed' };
  }

  async addPlayer(): Promise<{ success: boolean; player: Player }> {
    throw new Error('Connect real server to manage players');
  }

  async getWorldSettings(): Promise<{ world: WorldSettings }> {
    return {
      world: {
        name: 'world',
        seed: 'N/A',
        sizeMB: 0,
        difficulty: 'hard',
        pvp: true,
        timeTicks: 6000,
        weather: 'clear',
        gamerules: {
          keepInventory: false,
          mobGriefing: true,
          doDaylightCycle: true,
          doWeatherCycle: true,
          doMobSpawning: true,
          doFireTick: true,
          naturalRegeneration: true,
          fallDamage: true,
          pvp: true
        }
      }
    };
  }

  async setWorldTime(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Time set' };
  }

  async setWorldWeather(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Weather set' };
  }

  async setGamerule(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Gamerule set' };
  }

  async setWorldSeed(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Seed set' };
  }

  async saveWorld(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'World saved' };
  }

  async purgeLag(): Promise<{ success: boolean; message: string; count: number }> {
    return { success: true, message: 'Purge completed', count: 0 };
  }

  async getMods(): Promise<{ mods: FabricMod[] }> {
    return { mods: [] };
  }

  async uploadMod(): Promise<{ success: boolean; mod: FabricMod }> {
    throw new Error('Upload requires real connection');
  }

  async toggleMod(): Promise<{ success: boolean; mod: FabricMod; message: string }> {
    throw new Error('Toggle requires real connection');
  }

  async deleteMod(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Mod removed' };
  }

  async getBackups(): Promise<{ backups: WorldBackup[] }> {
    return { backups: [] };
  }

  async createBackup(): Promise<{ success: boolean; backup: WorldBackup }> {
    throw new Error('Backups require real server files');
  }

  async restoreBackup(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Backup restored' };
  }

  async deleteBackup(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Backup deleted' };
  }

  async getConsoleLogs(): Promise<{ logs: ConsoleLogMessage[] }> {
    return {
      logs: [
        {
          id: 'log-1',
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message: '[Aegis Core] Connect your Minecraft server in the setup screen to stream live console output.'
        }
      ]
    };
  }

  async sendCommand(command: string): Promise<{ success: boolean; output: string }> {
    return { success: true, output: `[Demo] Command /${command} queued. Connect real server to execute.` };
  }

  async clearConsole(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Console cleared' };
  }

  async getChatMessages(): Promise<{ messages: ChatMessage[] }> {
    return { messages: [] };
  }

  async broadcastChat(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Broadcast queued' };
  }

  async broadcastMessage(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Broadcast queued' };
  }

  async getSchedulerTasks(): Promise<{ tasks: ScheduledTask[] }> {
    return { tasks: [] };
  }

  async createSchedulerTask(): Promise<{ success: boolean; task: ScheduledTask }> {
    throw new Error('Scheduler requires server connection');
  }

  async deleteSchedulerTask(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Task deleted' };
  }

  async toggleSchedulerTask(): Promise<{ success: boolean; task: ScheduledTask }> {
    throw new Error('Requires server connection');
  }

  async getServerEvents(): Promise<{ events: ServerEventItem[] }> {
    return { events: [] };
  }

  async getAuditLogs(): Promise<{ audit: AuditLogItem[] }> {
    return { audit: [] };
  }

  async getDeathHistory(): Promise<{ deaths: DeathRecord[] }> {
    return { deaths: [] };
  }

  async getWhitelist(): Promise<{ whitelist: { enabled: boolean; players: WhitelistEntry[] } }> {
    return { whitelist: { enabled: false, players: [] } };
  }

  async toggleWhitelist(): Promise<{ success: boolean; enabled: boolean }> {
    return { success: true, enabled: false };
  }

  async addWhitelist(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Added' };
  }

  async removeWhitelist(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Removed' };
  }

  async getBans(): Promise<{ bans: BanEntry[] }> {
    return { bans: [] };
  }

  async getWaypoints(): Promise<{ waypoints: CustomWaypoint[] }> {
    return { waypoints: [] };
  }

  async createWaypoint(): Promise<{ success: boolean; waypoint: CustomWaypoint }> {
    throw new Error('Waypoints require active realm');
  }

  async deleteWaypoint(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Waypoint deleted' };
  }

  async getFiles(): Promise<{ files: ServerConfigFile[] }> {
    return { files: [] };
  }

  async readFile(): Promise<{ name: string; content: string }> {
    return { name: 'server.properties', content: '# Not connected' };
  }

  async saveFile(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Saved' };
  }

  async getSettings(): Promise<{ settings: any }> {
    return { settings: {} };
  }

  async saveSettings(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Settings saved' };
  }

  async saveServerSettings(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Settings saved' };
  }

  // Auth & Cloud Profile in Mock Mode
  async register(data: any): Promise<{ success: boolean; user: any; token?: string; message?: string }> {
    return {
      success: true,
      user: {
        id: 'mock-user-1',
        name: data.name || 'Ahmed',
        username: data.username || 'Ahmed',
        email: data.email || 'ahmed@aegis-smp.net',
        role: 'owner',
        language: data.language || 'en',
        appearance: data.appearance || { theme: 'dark', accent: 'emerald', animations: 'full', glassEffect: 'high', compactMode: false },
        notifications: data.notifications || { serverRestart: true, serverCrash: true, backupComplete: true, backupFailure: true, playerJoin: true, playerLeave: true, performanceWarning: true, scheduledBroadcast: true, modError: true },
        serverConnected: true
      },
      token: 'mock-token'
    };
  }

  async login(data: any): Promise<{ success: boolean; user: any; token?: string; message?: string }> {
    return {
      success: true,
      user: {
        id: 'mock-user-1',
        name: data.identifier === 'Ahmed' ? 'Ahmed' : 'Admin',
        username: data.identifier || 'Ahmed',
        email: 'ahmed@aegis-smp.net',
        role: 'owner',
        language: 'en',
        appearance: { theme: 'dark', accent: 'emerald', animations: 'full', glassEffect: 'high', compactMode: false },
        notifications: { serverRestart: true, serverCrash: true, backupComplete: true, backupFailure: true, playerJoin: true, playerLeave: true, performanceWarning: true, scheduledBroadcast: true, modError: true },
        serverConnected: true
      },
      token: 'mock-token'
    };
  }

  async sendVerificationCode(data: any): Promise<any> {
    return { success: true, cooldownSeconds: 60, expiresInSeconds: 600, maskedEmail: 'a•••••@gmail.com' };
  }

  async verifyCode(data: any): Promise<any> {
    return { success: true, user: { id: 'mock-user-1', name: 'Ahmed', email: 'ahmed@aegis-smp.net' }, token: 'mock-token' };
  }

  async forgotPassword(email: string): Promise<any> {
    return { success: true, cooldownSeconds: 60, expiresInSeconds: 600, maskedEmail: 'a•••••@gmail.com' };
  }

  async resetPasswordWithCode(data: any): Promise<any> {
    return { success: true, message: 'Password reset successful' };
  }

  async resetPassword(data: any): Promise<any> {
    return this.resetPasswordWithCode(data);
  }

  async requestEmailChange(newEmail: string): Promise<any> {
    return { success: true, cooldownSeconds: 60, expiresInSeconds: 600, maskedEmail: newEmail };
  }

  async verifyEmailChange(code: string): Promise<any> {
    return { success: true, user: { id: 'mock-user-1', email: 'new@aegis-smp.net' }, message: 'Email updated' };
  }

  async logout(): Promise<{ success: boolean }> {
    return { success: true };
  }

  async getSession(): Promise<{ success: boolean; authenticated?: boolean; user: any }> {
    return {
      success: true,
      authenticated: true,
      user: {
        id: 'mock-user-1',
        name: 'Ahmed',
        username: 'Ahmed',
        email: 'ahmed@aegis-smp.net',
        role: 'owner',
        language: 'en',
        appearance: { theme: 'dark', accent: 'emerald', animations: 'full', glassEffect: 'high', compactMode: false },
        notifications: { serverRestart: true, serverCrash: true, backupComplete: true, backupFailure: true, playerJoin: true, playerLeave: true, performanceWarning: true, scheduledBroadcast: true, modError: true },
        serverConnected: true
      }
    };
  }

  async getActiveSessions(): Promise<{ sessions: any[] }> {
    return {
      sessions: [
        {
          id: 'mock-sess-1',
          userId: 'mock-user-1',
          createdAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
          ipAddress: '127.0.0.1',
          userAgent: 'Current Browser',
          deviceType: 'desktop',
          browser: 'Chrome / Edge',
          os: 'Windows / Linux',
          isCurrent: true
        }
      ]
    };
  }

  async getSessions(): Promise<{ sessions: any[] }> {
    return this.getActiveSessions();
  }

  async revokeSession(): Promise<{ success: boolean }> {
    return { success: true };
  }

  async revokeOtherSessions(): Promise<{ success: boolean; count: number }> {
    return { success: true, count: 0 };
  }

  async revokeAllOtherSessions(): Promise<{ success: boolean; count?: number }> {
    return { success: true, count: 0 };
  }

  async updateUserProfile(data: any): Promise<{ success: boolean; user: any }> {
    return { success: true, user: { id: 'mock-user-1', ...data } };
  }

  async updateProfile(data: any): Promise<{ success: boolean; user: any }> {
    return this.updateUserProfile(data);
  }

  async updateAppearance(data: any): Promise<{ success: boolean; appearance?: any; user?: any }> {
    return { success: true, appearance: data };
  }

  async updateNotifications(data: any): Promise<{ success: boolean; notifications?: any; user?: any }> {
    return { success: true, notifications: data };
  }

  async changePassword(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Password updated successfully' };
  }

  async deleteAccount(): Promise<{ success: boolean }> {
    return { success: true };
  }

  async exportAccountData(): Promise<any> {
    return { user: { name: 'Ahmed', role: 'owner' } };
  }

  async getServers(): Promise<{ servers: any[]; activeServerId: string }> {
    return {
      servers: [
        {
          id: 'mock-server-1',
          name: 'Aegis Core SMP',
          serverType: 'Fabric',
          mcVersion: '1.20.4',
          host: '127.0.0.1',
          port: 25565,
          userRole: 'owner',
          createdAt: new Date().toISOString()
        }
      ],
      activeServerId: 'mock-server-1'
    };
  }

  async createServer(data: any): Promise<{ success: boolean; server: any }> {
    return {
      success: true,
      server: {
        id: 'mock-server-2',
        name: data.name || 'New Realm',
        serverType: data.serverType || data.type || 'Fabric',
        mcVersion: data.mcVersion || '1.20.4',
        host: data.host || '127.0.0.1',
        port: data.port || 25565,
        userRole: 'owner',
        createdAt: new Date().toISOString()
      }
    };
  }

  async selectActiveServer(serverId: string): Promise<{ success: boolean; activeServerId: string; server?: any }> {
    return { success: true, activeServerId: serverId };
  }

  async updateServer(serverId: string, data: any): Promise<{ success: boolean; server: any }> {
    return { success: true, server: { id: serverId, ...data } };
  }

  async deleteServer(): Promise<{ success: boolean }> {
    return { success: true };
  }

  async getServerMembers(): Promise<{ members: any[] }> {
    return {
      members: [
        {
          id: 'mem-1',
          userId: 'mock-user-1',
          serverId: 'mock-server-1',
          role: 'owner',
          name: 'Ahmed',
          username: 'Ahmed',
          email: 'ahmed@aegis-smp.net',
          joinedAt: new Date().toISOString()
        }
      ]
    };
  }

  async inviteServerMember(): Promise<{ success: boolean; member: any }> {
    return {
      success: true,
      member: {
        id: 'mem-2',
        role: 'operator',
        name: 'New Moderator',
        username: 'mod_alex',
        email: 'alex@aegis-smp.net',
        joinedAt: new Date().toISOString()
      }
    };
  }

  async addServerMember(serverId: string, data: { username: string; role: string }): Promise<{ success: boolean; member: any }> {
    return this.inviteServerMember();
  }

  async updateServerMemberRole(): Promise<{ success: boolean }> {
    return { success: true };
  }

  async removeServerMember(): Promise<{ success: boolean }> {
    return { success: true };
  }
}

// Export singleton instance of RealMinecraftService
export const api: IMinecraftService = new RealMinecraftService();
