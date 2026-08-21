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

export interface PairingCodeResponse {
  code: string;
  expiresInSeconds: number;
  serverCommand: string;
}

export interface ConnectionTestResult {
  reachable: boolean;
  online: boolean;
  pingMs?: number;
  version?: string;
  motd?: string;
  playersOnline?: number;
  maxPlayers?: number;
  rconSuccess?: boolean;
  rconError?: string;
  error?: string;
}

export interface IMinecraftService {
  // Connection & Pairing
  getConnectionConfig(): Promise<ConnectionConfig>;
  saveConnectionConfig(config: Partial<ConnectionConfig> & { rconPassword?: string }): Promise<{ success: boolean; message: string }>;
  testConnection(config: { host: string; port: number; rconPort?: number; rconPassword?: string }): Promise<ConnectionTestResult>;
  generatePairingCode(): Promise<PairingCodeResponse>;
  verifyPairingCode(code: string): Promise<{ success: boolean; message: string }>;

  // Status & Telemetry
  getServerStatus(): Promise<{ status: ServerStatusData }>;
  getServerMetrics(): Promise<{ metrics: ServerMetricsData }>;
  getServerInfo(): Promise<{ info: ServerInfoData }>;

  // Lifecycle
  startServer(admin?: string): Promise<{ success: boolean; message: string; status?: ServerStatusData }>;
  stopServer(admin?: string): Promise<{ success: boolean; message: string; status?: ServerStatusData }>;
  restartServer(admin?: string): Promise<{ success: boolean; message: string; status?: ServerStatusData }>;
  killServer(admin?: string): Promise<{ success: boolean; message: string }>;
  toggleMaintenance(enabled?: boolean): Promise<{ success: boolean; maintenanceMode: boolean; message: string }>;
  renameServer(serverName: string, admin?: string): Promise<{ success: boolean; serverName: string; message: string }>;

  // Players
  getPlayers(): Promise<{ players: Player[] }>;
  getPlayerDetails(username: string): Promise<{ player: Player }>;
  executePlayerAction(action: string, username: string, payload?: any): Promise<{ success: boolean; message: string }>;
  kickPlayer(username: string, reason?: string): Promise<{ success: boolean; message: string }>;
  banPlayer(username: string, reason?: string): Promise<{ success: boolean; message: string }>;
  unbanPlayer(target: string): Promise<{ success: boolean; message: string }>;
  opPlayer(username: string): Promise<{ success: boolean; message: string }>;
  deopPlayer(username: string): Promise<{ success: boolean; message: string }>;
  healPlayer(username: string): Promise<{ success: boolean; message: string }>;
  feedPlayer(username: string): Promise<{ success: boolean; message: string }>;
  teleportPlayer(options: { target: string; destination?: string; coords?: { x: number; y: number; z: number }; dimension?: string }): Promise<{ success: boolean; message: string }>;

  // World & Environment
  getWorldSettings(): Promise<{ world: WorldSettings }>;
  setWorldTime(presetOrTicks: string | number): Promise<{ success: boolean; message: string }>;
  setWorldWeather(type: 'clear' | 'rain' | 'thunder'): Promise<{ success: boolean; message: string }>;
  setGamerule(rule: string, value: any): Promise<{ success: boolean; message: string }>;
  setWorldSeed(seed: string): Promise<{ success: boolean; message: string }>;
  saveWorld(): Promise<{ success: boolean; message: string }>;
  purgeLag(type?: 'items' | 'monsters' | 'all'): Promise<{ success: boolean; message: string; count: number }>;

  // Mods & Addons
  getMods(): Promise<{ mods: FabricMod[] }>;
  uploadMod(fileOrData: File | { name: string; fileName: string; version?: string; author?: string; description?: string }): Promise<{ success: boolean; mod: FabricMod }>;
  toggleMod(id: string, enabled?: boolean): Promise<{ success: boolean; mod: FabricMod; message: string }>;
  deleteMod(id: string): Promise<{ success: boolean; message: string }>;

  // Backups
  getBackups(): Promise<{ backups: WorldBackup[] }>;
  createBackup(nameOrData?: string | { name?: string; dimension?: string; note?: string }): Promise<{ success: boolean; backup: WorldBackup }>;
  restoreBackup(id: string): Promise<{ success: boolean; message: string }>;
  deleteBackup(id: string): Promise<{ success: boolean; message: string }>;

  // Console & Chat
  getConsoleLogs(): Promise<{ logs: ConsoleLogMessage[] }>;
  sendCommand(command: string): Promise<{ success: boolean; output: string }>;
  clearConsole(): Promise<{ success: boolean; message: string }>;
  getChatMessages(): Promise<{ messages: ChatMessage[] }>;
  broadcastChat(message: string, sender?: string): Promise<{ success: boolean; message: string }>;
  broadcastMessage(message: string, sender?: string): Promise<{ success: boolean; message: string }>;

  // Tasks & Audits
  getSchedulerTasks(): Promise<{ tasks: ScheduledTask[] }>;
  createSchedulerTask(task: Partial<ScheduledTask>): Promise<{ success: boolean; task: ScheduledTask }>;
  deleteSchedulerTask(id: string): Promise<{ success: boolean; message: string }>;
  toggleSchedulerTask(id: string, enabled?: boolean): Promise<{ success: boolean; task: ScheduledTask }>;
  getServerEvents(): Promise<{ events: ServerEventItem[] }>;
  getAuditLogs(): Promise<{ audit: AuditLogItem[] }>;
  getDeathHistory(): Promise<{ deaths: DeathRecord[] }>;

  // Whitelist & Bans
  getWhitelist(): Promise<{ whitelist: { enabled: boolean; players: WhitelistEntry[] } }>;
  toggleWhitelist(enabled?: boolean): Promise<{ success: boolean; enabled: boolean }>;
  addWhitelist(username: string): Promise<{ success: boolean; message: string }>;
  removeWhitelist(username: string): Promise<{ success: boolean; message: string }>;
  getBans(): Promise<{ bans: BanEntry[] }>;

  // Authentication & Cloud Profile
  register(data: {
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
  }): Promise<{ success: boolean; requireVerification?: boolean; email?: string; maskedEmail?: string; cooldownSeconds?: number; expiresInSeconds?: number; devCode?: string; isDevFallback?: boolean; user?: any; token?: string; message?: string }>;
  login(data: { identifier: string; password?: string; rememberMe?: boolean }): Promise<{ success: boolean; requireVerification?: boolean; email?: string; maskedEmail?: string; cooldownSeconds?: number; expiresInSeconds?: number; devCode?: string; isDevFallback?: boolean; user?: any; token?: string; message?: string }>;
  sendVerificationCode(data: { email: string; type?: string; newEmail?: string }): Promise<{ success: boolean; cooldownSeconds?: number; expiresInSeconds?: number; maskedEmail?: string; devCode?: string; isDevFallback?: boolean; message?: string }>;
  verifyCode(data: { email: string; code: string; type?: string; rememberMe?: boolean }): Promise<{ success: boolean; user?: any; token?: string; remainingAttempts?: number; message?: string }>;
  forgotPassword(email: string): Promise<{ success: boolean; cooldownSeconds?: number; expiresInSeconds?: number; maskedEmail?: string; devCode?: string; isDevFallback?: boolean; message?: string }>;
  resetPasswordWithCode(data: { email: string; code: string; newPassword: string }): Promise<{ success: boolean; message: string }>;
  resetPassword(data: { email: string; code: string; newPassword: string }): Promise<{ success: boolean; message: string }>;
  requestEmailChange(newEmail: string): Promise<{ success: boolean; cooldownSeconds?: number; expiresInSeconds?: number; maskedEmail?: string; devCode?: string; isDevFallback?: boolean; message?: string }>;
  verifyEmailChange(code: string): Promise<{ success: boolean; user?: any; message: string }>;
  logout(): Promise<{ success: boolean }>;
  getSession(): Promise<{ success: boolean; authenticated?: boolean; user: any }>;
  getActiveSessions(): Promise<{ sessions: any[] }>;
  getSessions(): Promise<{ sessions: any[] }>;
  revokeSession(sessionId: string): Promise<{ success: boolean }>;
  revokeOtherSessions(): Promise<{ success: boolean; count: number }>;
  revokeAllOtherSessions(): Promise<{ success: boolean; count?: number }>;
  updateUserProfile(data: any): Promise<{ success: boolean; user: any }>;
  updateProfile(data: any): Promise<{ success: boolean; user: any }>;
  updateAppearance(data: any): Promise<{ success: boolean; appearance?: any; user?: any }>;
  updateNotifications(data: any): Promise<{ success: boolean; notifications?: any; user?: any }>;
  changePassword(data: { currentPassword?: string; newPassword: string }): Promise<{ success: boolean; message: string }>;
  deleteAccount(data?: { confirmation: string }): Promise<{ success: boolean }>;
  exportAccountData(): Promise<any>;

  // Multi-Server & Members
  getServers(): Promise<{ servers: any[]; activeServerId: string }>;
  createServer(data: { name: string; type?: string; serverType?: string; mcVersion?: string; host?: string; port?: number; rconPort?: number; rconPassword?: string; serverDir?: string; startCommand?: string }): Promise<{ success: boolean; server: any }>;
  selectActiveServer(serverId: string): Promise<{ success: boolean; activeServerId: string; server?: any }>;
  updateServer(serverId: string, data: any): Promise<{ success: boolean; server: any }>;
  deleteServer(serverId: string): Promise<{ success: boolean }>;
  getServerMembers(serverId: string): Promise<{ members: any[] }>;
  inviteServerMember(serverId: string, data: { usernameOrEmail: string; role: string }): Promise<{ success: boolean; member: any }>;
  addServerMember(serverId: string, data: { username: string; role: string }): Promise<{ success: boolean; member: any }>;
  updateServerMemberRole(serverId: string, userId: string, role: string): Promise<{ success: boolean }>;
  removeServerMember(serverId: string, userId: string): Promise<{ success: boolean }>;

  // Waypoints & Files
  getWaypoints(): Promise<{ waypoints: CustomWaypoint[] }>;
  createWaypoint(data: { name: string; world: string; x: number; y: number; z: number; createdBy?: string }): Promise<{ success: boolean; waypoint: CustomWaypoint }>;
  deleteWaypoint(id: string): Promise<{ success: boolean; message: string }>;
  getFiles(): Promise<{ files: ServerConfigFile[] }>;
  readFile(name: string): Promise<{ name: string; content: string }>;
  saveFile(name: string, content: string): Promise<{ success: boolean; message: string }>;
  getSettings(): Promise<{ settings: any }>;
  saveSettings(settings: any): Promise<{ success: boolean; message: string }>;
  saveServerSettings(settings: any): Promise<{ success: boolean; message: string }>;
}
