import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { pingMinecraftServer, MCServerStatusResult } from './mcProtocol';
import { MinecraftRconClient } from './rconClient';
import { MinecraftLogWatcher, ParsedLogEntry } from './logWatcher';
import { MinecraftProcessManager } from './processManager';

// Load environment variables
dotenv.config();

export interface LiveMinecraftState {
  online: boolean;
  status: 'ONLINE' | 'OFFLINE' | 'STARTING' | 'STOPPING' | 'RESTARTING' | 'CRASHED' | 'MAINTENANCE';
  serverName: string;
  motd: string;
  version: string;
  software: string;
  loader: string;
  ip: string;
  port: number;
  rconPort: number;
  rconConnected: boolean;
  rconConfigured: boolean;
  playersOnline: number;
  maxPlayers: number;
  playersList: Array<{
    username: string;
    uuid: string;
    ping: number;
    health: number;
    food: number;
    gamemode: string;
    dimension: string;
    isOp: boolean;
    online: boolean;
  }>;
  tps: number;
  mspt: number;
  ping: number;
  uptimeSeconds: number;
  cpuPercent: number;
  ramUsageMB: number;
  ramMaxMB: number;
  diskUsageGB: number;
  diskMaxGB: number;
  maintenanceMode: boolean;
  isCrashDetected: boolean;
  crashTimestamp: string | null;
  crashReason: string | null;
  connectionError?: string;
}

export class MinecraftBridge {
  private static instance: MinecraftBridge;

  public host: string;
  public port: number;
  public rconPort: number;
  private rconPassword?: string;
  public serverDir: string;
  public startCommand: string;

  private rconClient: MinecraftRconClient;
  private logWatcher: MinecraftLogWatcher;
  private processManager: MinecraftProcessManager;

  private state: LiveMinecraftState;
  private pollTimer: NodeJS.Timeout | null = null;
  private lastStartTime: number = Date.now();
  private isTransitioningState: 'STARTING' | 'STOPPING' | 'RESTARTING' | null = null;

  private auditLogs: Array<{
    id: string;
    timestamp: string;
    admin: string;
    action: string;
    target: string;
    result: 'SUCCESS' | 'FAILED';
    details?: string;
  }> = [];

  private serverEvents: Array<{
    id: string;
    timestamp: string;
    type: string;
    title: string;
    detail: string;
    severity: 'info' | 'success' | 'warning' | 'error';
  }> = [];

  private chatMessages: Array<{
    id: string;
    timestamp: string;
    sender: string;
    message: string;
    isSystem?: boolean;
    isOp?: boolean;
  }> = [];

  private constructor() {
    this.host = process.env.MINECRAFT_HOST || '127.0.0.1';
    this.port = parseInt(process.env.MINECRAFT_PORT || '25565', 10);
    this.rconPort = parseInt(process.env.RCON_PORT || '25575', 10);
    this.rconPassword = process.env.RCON_PASSWORD || '';
    this.serverDir = process.env.MINECRAFT_SERVER_DIR || '.';
    this.startCommand = process.env.START_COMMAND || 'java -Xms2G -Xmx4G -jar server.jar nogui';

    this.rconClient = new MinecraftRconClient({
      host: this.host,
      port: this.rconPort,
      password: this.rconPassword
    });

    this.logWatcher = new MinecraftLogWatcher(this.serverDir);
    this.processManager = new MinecraftProcessManager(this.serverDir, this.startCommand);

    this.state = {
      online: false,
      status: 'OFFLINE',
      serverName: 'Minecraft Codespaces Server',
      motd: '§a⚔ Minecraft Java Server §7[Codespaces]',
      version: '1.20.4',
      software: 'Paper / Fabric',
      loader: 'Java Edition',
      ip: this.host,
      port: this.port,
      rconPort: this.rconPort,
      rconConnected: false,
      rconConfigured: !!this.rconPassword,
      playersOnline: 0,
      maxPlayers: 20,
      playersList: [],
      tps: 20.0,
      mspt: 15.0,
      ping: 0,
      uptimeSeconds: 0,
      cpuPercent: 5.0,
      ramUsageMB: 512,
      ramMaxMB: 4096,
      diskUsageGB: 4.2,
      diskMaxGB: 32.0,
      maintenanceMode: false,
      isCrashDetected: false,
      crashTimestamp: null,
      crashReason: null
    };

    // Forward log lines from logWatcher to chat or events if appropriate
    this.logWatcher.onNewLog((entry) => {
      if (entry.level === 'CHAT') {
        const chatMatch = entry.message.match(/^<([^>]+)>\s+(.*)$/);
        if (chatMatch) {
          this.chatMessages.push({
            id: entry.id,
            timestamp: entry.timestamp,
            sender: chatMatch[1],
            message: chatMatch[2]
          });
        }
      }
    });

    // Start background telemetry polling
    this.startPolling();
  }

  public static getInstance(): MinecraftBridge {
    if (!MinecraftBridge.instance) {
      MinecraftBridge.instance = new MinecraftBridge();
    }
    return MinecraftBridge.instance;
  }

  public updateConnectionConfig(newConfig: {
    host?: string;
    port?: number;
    rconPort?: number;
    rconPassword?: string;
    serverDir?: string;
    startCommand?: string;
  }) {
    if (newConfig.host) this.host = newConfig.host;
    if (newConfig.port) this.port = newConfig.port;
    if (newConfig.rconPort) this.rconPort = newConfig.rconPort;
    if (newConfig.rconPassword !== undefined) this.rconPassword = newConfig.rconPassword;
    if (newConfig.serverDir) this.serverDir = newConfig.serverDir;
    if (newConfig.startCommand) this.startCommand = newConfig.startCommand;

    this.rconClient.updateConfig(this.host, this.rconPort, this.rconPassword);
    this.logWatcher.setServerDir(this.serverDir);
    this.processManager.updateConfig(this.serverDir, this.startCommand);

    this.state.ip = this.host;
    this.state.port = this.port;
    this.state.rconPort = this.rconPort;
    this.state.rconConfigured = !!this.rconPassword;

    // Trigger immediate refresh
    this.pollServer();
  }

  private startPolling() {
    this.pollServer();
    this.pollTimer = setInterval(() => {
      this.pollServer();
    }, 3000);
  }

  public async pollServer(): Promise<LiveMinecraftState> {
    try {
      const pingResult: MCServerStatusResult = await pingMinecraftServer(this.host, this.port, 3500);

      const sysMetrics = this.processManager.getSystemMetrics();

      if (pingResult.online) {
        if (!this.state.online) {
          this.lastStartTime = Date.now();
          this.logEvent('SERVER_ONLINE', 'Minecraft Server Online', `Server responded on port ${this.port}`, 'success');
        }

        this.state.online = true;
        this.state.status = this.state.maintenanceMode ? 'MAINTENANCE' : (this.isTransitioningState || 'ONLINE');
        this.state.ping = pingResult.pingMs || 10;
        this.state.connectionError = undefined;

        if (pingResult.version?.name) {
          this.state.version = pingResult.version.name;
        }
        if (pingResult.description) {
          this.state.motd = pingResult.description;
        }
        if (pingResult.players) {
          this.state.playersOnline = pingResult.players.online;
          this.state.maxPlayers = pingResult.players.max;
        }

        this.state.uptimeSeconds = Math.floor((Date.now() - this.lastStartTime) / 1000);
        this.state.cpuPercent = sysMetrics.cpuUsage;
        this.state.ramUsageMB = sysMetrics.ramUsedMB;
        this.state.ramMaxMB = sysMetrics.ramTotalMB;

        // Query RCON for accurate live player names and TPS
        await this.syncWithRcon(pingResult);
      } else {
        // Server is not responding on Minecraft port 25565
        this.state.online = false;
        this.state.status = this.isTransitioningState || 'OFFLINE';
        this.state.playersOnline = 0;
        this.state.playersList = [];
        this.state.ping = 0;
        this.state.tps = 0;
        this.state.mspt = 0;
        this.state.uptimeSeconds = 0;
        this.state.rconConnected = false;
        this.state.connectionError = pingResult.error || 'Server offline or unreachable on game port';
      }
    } catch (err: any) {
      this.state.online = false;
      this.state.status = this.isTransitioningState || 'OFFLINE';
      this.state.connectionError = err.message;
    }

    return this.state;
  }

  private async syncWithRcon(pingResult: MCServerStatusResult) {
    if (!this.rconPassword) {
      this.state.rconConnected = false;
      this.state.rconConfigured = false;
      // Synthesize players from ping sample if available
      if (pingResult.players?.sample) {
        this.state.playersList = pingResult.players.sample.map((s) => ({
          username: s.name,
          uuid: s.id,
          ping: this.state.ping,
          health: 20,
          food: 20,
          gamemode: 'survival',
          dimension: 'Overworld',
          isOp: false,
          online: true
        }));
      }
      return;
    }

    this.state.rconConfigured = true;

    try {
      if (!this.rconClient.isConnectedAndAuthenticated()) {
        await this.rconClient.connect();
      }

      this.state.rconConnected = true;

      // 1. Fetch exact player names with /list
      const listOutput = await this.rconClient.sendCommand('list');
      this.parsePlayerListOutput(listOutput, pingResult.players?.sample);

      // 2. Fetch TPS if available
      try {
        const tpsOutput = await this.rconClient.sendCommand('tps');
        this.parseTpsOutput(tpsOutput);
      } catch {
        // Fallback TPS when server is standard vanilla
        this.state.tps = 20.0;
        this.state.mspt = Math.max(8.0, +(this.state.ping * 0.6).toFixed(1));
      }
    } catch (rconErr: any) {
      this.state.rconConnected = false;
      // RCON connection failed (e.g. invalid password or rcon not enabled in server.properties)
      if (pingResult.players?.sample) {
        this.state.playersList = pingResult.players.sample.map((s) => ({
          username: s.name,
          uuid: s.id,
          ping: this.state.ping,
          health: 20,
          food: 20,
          gamemode: 'survival',
          dimension: 'Overworld',
          isOp: false,
          online: true
        }));
      }
    }
  }

  private parsePlayerListOutput(output: string, sampleList?: Array<{ name: string; id: string }>) {
    // Example output: "There are 2 of a max of 20 players online: Notch, Jeb_"
    const match = output.match(/:\s*(.*)$/);
    if (match && match[1]) {
      const names = match[1]
        .split(',')
        .map((n) => n.trim())
        .filter((n) => n.length > 0 && n !== '(none)');

      this.state.playersOnline = names.length;
      this.state.playersList = names.map((name) => {
        const sampleMatch = sampleList?.find((s) => s.name.toLowerCase() === name.toLowerCase());
        const existing = this.state.playersList.find((p) => p.username.toLowerCase() === name.toLowerCase());
        return {
          username: name,
          uuid: sampleMatch?.id || existing?.uuid || `uuid-${name.toLowerCase()}`,
          ping: existing?.ping || this.state.ping,
          health: existing?.health || 20,
          food: existing?.food || 20,
          gamemode: existing?.gamemode || 'survival',
          dimension: existing?.dimension || 'Overworld',
          isOp: existing?.isOp || false,
          online: true
        };
      });
    }
  }

  private parseTpsOutput(output: string) {
    // Paper / Spigot TPS output: "TPS from last 1m, 5m, 15m: 20.0, 19.98, 19.95"
    const tpsMatch = output.match(/(\d+\.\d+)/);
    if (tpsMatch) {
      const val = parseFloat(tpsMatch[1]);
      if (!isNaN(val)) {
        this.state.tps = Math.min(20.0, val);
        this.state.mspt = +(1000 / Math.max(1, this.state.tps)).toFixed(1);
      }
    }
  }

  // --- Real Actions ---

  public async executeCommand(command: string): Promise<string> {
    const clean = command.startsWith('/') ? command.slice(1) : command;
    this.logWatcher.addLog(`> /${clean}`, 'INFO');

    if (this.rconClient.isConnectedAndAuthenticated() || this.rconPassword) {
      try {
        const output = await this.rconClient.sendCommand(clean);
        if (output && output.trim()) {
          this.logWatcher.addLog(`[Server] ${output.trim()}`, 'INFO');
        }
        return output || 'Command executed successfully.';
      } catch (err: any) {
        // Fallback to process stdin if running locally
        if (this.processManager.isProcessRunning()) {
          this.processManager.sendStdin(clean);
          return `Command dispatched to process stdin: /${clean}`;
        }
        throw new Error(`RCON Execution Error: ${err.message}`);
      }
    } else if (this.processManager.isProcessRunning()) {
      this.processManager.sendStdin(clean);
      return `Command dispatched to server stdin: /${clean}`;
    } else {
      throw new Error('Cannot execute command: Server RCON is not connected and process stdin is unavailable.');
    }
  }

  public async startServer(admin = 'Admin'): Promise<{ success: boolean; message: string }> {
    if (this.state.online) {
      return { success: false, message: 'Server is already online.' };
    }

    this.isTransitioningState = 'STARTING';
    this.state.status = 'STARTING';
    this.logEvent('SERVER_START', 'Server Start Initiated', `Boot triggered by ${admin}`, 'info');
    this.logWatcher.addLog(`[Aegis] Server boot initiated by ${admin}...`, 'INFO');

    this.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      admin,
      action: 'START_SERVER',
      target: 'Minecraft Server',
      result: 'SUCCESS'
    });

    try {
      const spawned = this.processManager.start(
        (stdout) => {
          this.logWatcher.addLog(stdout.trim(), 'INFO');
        },
        (stderr) => {
          this.logWatcher.addLog(stderr.trim(), 'ERROR');
        },
        (code, signal) => {
          this.isTransitioningState = null;
          this.pollServer();
        }
      );

      if (!spawned) {
        // External server or Codespaces background process
        this.logWatcher.addLog(`[Aegis] Checking for active Minecraft daemon on ${this.host}:${this.port}...`, 'INFO');
      }

      // Check for online within 15 seconds
      setTimeout(async () => {
        this.isTransitioningState = null;
        await this.pollServer();
      }, 5000);

      return { success: true, message: 'Server start sequence initiated.' };
    } catch (err: any) {
      this.isTransitioningState = null;
      throw err;
    }
  }

  public async stopServer(admin = 'Admin'): Promise<{ success: boolean; message: string }> {
    this.isTransitioningState = 'STOPPING';
    this.state.status = 'STOPPING';
    this.logEvent('SERVER_STOP', 'Server Stop Initiated', `Stop triggered by ${admin}`, 'warning');
    this.logWatcher.addLog(`[Aegis] Gracefully stopping Minecraft server (requested by ${admin})...`, 'WARN');

    this.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      admin,
      action: 'STOP_SERVER',
      target: 'Minecraft Server',
      result: 'SUCCESS'
    });

    try {
      if (this.rconClient.isConnectedAndAuthenticated()) {
        await this.rconClient.sendCommand('stop');
      } else if (this.processManager.isProcessRunning()) {
        this.processManager.stopGraceful();
      }

      setTimeout(async () => {
        this.isTransitioningState = null;
        await this.pollServer();
      }, 3000);

      return { success: true, message: 'Server stop command dispatched.' };
    } catch (err: any) {
      this.isTransitioningState = null;
      throw err;
    }
  }

  public async restartServer(admin = 'Admin'): Promise<{ success: boolean; message: string }> {
    this.isTransitioningState = 'RESTARTING';
    this.state.status = 'RESTARTING';
    this.logEvent('SERVER_RESTART', 'Server Restart Initiated', `Restart triggered by ${admin}`, 'info');
    this.logWatcher.addLog(`[Aegis] Initiating server restart: saving world and rebooting...`, 'WARN');

    this.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      admin,
      action: 'RESTART_SERVER',
      target: 'Minecraft Server',
      result: 'SUCCESS'
    });

    try {
      if (this.rconClient.isConnectedAndAuthenticated()) {
        try {
          await this.rconClient.sendCommand('save-all');
          await this.rconClient.sendCommand('stop');
        } catch {
          // ignore
        }
      } else if (this.processManager.isProcessRunning()) {
        this.processManager.stopGraceful();
      }

      setTimeout(async () => {
        try {
          await this.startServer(admin);
        } catch {
          // fallback
        }
      }, 4000);

      return { success: true, message: 'Server restart sequence initiated.' };
    } catch (err: any) {
      this.isTransitioningState = null;
      throw err;
    }
  }

  public async saveWorld(): Promise<{ success: boolean; message: string }> {
    this.logWatcher.addLog(`> /save-all (Saving world chunks to disk)`, 'INFO');
    try {
      const output = await this.executeCommand('save-all');
      return { success: true, message: output || 'World saved successfully to disk.' };
    } catch (err: any) {
      throw new Error(`Failed to save world: ${err.message}`);
    }
  }

  public killServer(): { success: boolean; message: string } {
    this.processManager.killForce();
    this.state.online = false;
    this.state.status = 'OFFLINE';
    this.rconClient.disconnect();
    this.logWatcher.addLog(`[ProcessManager] SIGKILL sent. Server process terminated.`, 'ERROR');
    return { success: true, message: 'Server process killed forcefully.' };
  }

  public toggleMaintenance(enabled?: boolean): boolean {
    this.state.maintenanceMode = enabled !== undefined ? enabled : !this.state.maintenanceMode;
    this.logWatcher.addLog(`[Aegis] Maintenance mode ${this.state.maintenanceMode ? 'ENABLED' : 'DISABLED'}`, 'WARN');
    return this.state.maintenanceMode;
  }

  public logEvent(type: string, title: string, detail: string, severity: 'info' | 'success' | 'warning' | 'error') {
    this.serverEvents.unshift({
      id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      title,
      detail,
      severity
    });
    if (this.serverEvents.length > 50) this.serverEvents.pop();
  }

  // --- Getters for Web API ---

  public getState(): LiveMinecraftState {
    return this.state;
  }

  public getLogs(): ParsedLogEntry[] {
    return this.logWatcher.getLogs();
  }

  public clearLogs() {
    this.logWatcher.clearLogs();
  }

  public getEvents() {
    return this.serverEvents;
  }

  public getAudit() {
    return this.auditLogs;
  }

  public getChat() {
    return this.chatMessages;
  }

  public broadcastChat(message: string, sender = 'Admin') {
    const time = new Date().toLocaleTimeString();
    this.chatMessages.push({
      id: `chat_${Date.now()}`,
      timestamp: time,
      sender,
      message,
      isOp: true
    });
    // Send /say via RCON
    try {
      this.executeCommand(`say [${sender}] ${message}`);
    } catch {
      // ignore
    }
  }
}
