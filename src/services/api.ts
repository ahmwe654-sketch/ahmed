// ============================================================================
// AEGIS CORE - CENTRAL API CLIENT
// BACKEND INTEGRATION LAYER
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
  ServerConfigFile
} from '../types';

class ApiService {
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
        // Response was not JSON (e.g., HTML from fallback or plain text)
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

  async teleport(options: {
    target: string;
    destination?: string;
    coords?: { x: number; y: number; z: number };
    dimension?: string;
  }): Promise<{ success: boolean; message: string }> {
    return this.teleportPlayer(options);
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

  async purgeLag(): Promise<{ success: boolean; message: string; count: number }> {
    return this.purgeEntities('items');
  }

  // --- Waypoints ---
  async getWaypoints(): Promise<{ waypoints: CustomWaypoint[] }> {
    return this.request<{ waypoints: CustomWaypoint[] }>('/api/waypoints');
  }

  async createWaypoint(data: { name: string; world: string; x: number; y: number; z: number }): Promise<{ success: boolean; waypoint: CustomWaypoint }> {
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

  // --- Codespaces & Server Connection ---
  async getConnectionConfig(): Promise<{
    host: string;
    port: number;
    rconPort: number;
    rconConfigured: boolean;
    rconConnected: boolean;
    serverDir: string;
    startCommand: string;
    connectionError?: string;
  }> {
    return this.request('/api/connection');
  }

  async saveConnectionConfig(config: {
    host?: string;
    port?: number;
    rconPort?: number;
    rconPassword?: string;
    serverDir?: string;
    startCommand?: string;
  }): Promise<{ success: boolean; message: string }> {
    return this.request('/api/connection/save', {
      method: 'POST',
      body: JSON.stringify(config)
    });
  }
}

export const api = new ApiService();
