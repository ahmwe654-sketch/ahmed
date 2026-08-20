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
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(options?.headers || {})
        },
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
}

// Export singleton instance of RealMinecraftService
export const api: IMinecraftService = new RealMinecraftService();
