// ============================================================================
// AEGIS CORE - TYPE DEFINITIONS
// Minecraft Java + Fabric Server Control Center
// ============================================================================

export type ServerLifecycleState =
  | 'ONLINE'
  | 'OFFLINE'
  | 'STARTING'
  | 'STOPPING'
  | 'RESTARTING'
  | 'CRASHED'
  | 'MAINTENANCE';

export type UserRole = 'owner' | 'admin' | 'moderator' | 'viewer';

export type Language = 'en' | 'ar';

export interface ServerEntity {
  id: string;
  name: string;
  type: 'Fabric' | 'Vanilla' | 'Forge' | 'Paper' | 'Other';
  mcVersion: string;
  host: string;
  port: number;
  rconPort: number;
  serverDir: string;
  startCommand: string;
  ownerId: string;
  userRole: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface ServerMemberItem {
  id: string;
  serverId: string;
  userId: string;
  role: UserRole;
  permissions: string[];
  joinedAt: string;
  invitedBy?: string;
  user: {
    id: string;
    name: string;
    username: string;
    email: string;
    avatar?: string;
  };
}

export interface AuthSession {
  id: string;
  userId: string;
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
  isCurrent?: boolean;
}

export interface UserProfile {
  id?: string;
  name: string;
  username?: string;
  email: string;
  role: UserRole;
  avatar?: string;
  serverName?: string;
  serverType?: string;
  mcVersion?: string;
  language?: Language;
  appearance?: AppearanceConfig;
  notifications?: NotificationConfig;
  onboardingCompleted?: boolean;
  activeServerId?: string;
  emailVerified?: boolean;
  servers?: ServerEntity[];
  createdAt?: string;
  lastLogin?: string;
  lastActive?: string;
  rememberMe?: boolean;
}

export interface VerificationSendResult {
  success: boolean;
  message?: string;
  cooldownSeconds?: number;
  expiresInSeconds?: number;
  maskedEmail?: string;
  devCode?: string;
  isDevFallback?: boolean;
  error?: string;
}

export interface VerificationVerifyResult {
  success: boolean;
  message?: string;
  user?: UserProfile;
  token?: string;
  requireVerification?: boolean;
  remainingAttempts?: number;
  error?: string;
}

export interface AppearanceConfig {
  theme: 'dark' | 'darker' | 'system';
  accent: 'emerald' | 'violet' | 'blue';
  animations: 'full' | 'reduced' | 'off';
  glassEffect: 'high' | 'medium' | 'low';
  compactMode: boolean;
}

export interface NotificationConfig {
  serverRestart: boolean;
  serverCrash: boolean;
  backupComplete: boolean;
  backupFailure: boolean;
  playerJoin: boolean;
  playerLeave: boolean;
  performanceWarning: boolean;
  scheduledBroadcast: boolean;
  modError: boolean;
}

export interface ServerStatusData {
  serverName?: string;
  status: ServerLifecycleState;
  state?: ServerLifecycleState;
  online: boolean;
  version: string;
  software?: string;
  loader?: string;
  fabricVersion?: string;
  ip: string;
  port: number;
  rconPort?: number;
  motd: string;
  tps: number;
  mspt?: number;
  uptimeSeconds: number;
  playersOnline: number;
  maxPlayers: number;
  rconConnected?: boolean;
  rconConfigured?: boolean;
  maintenanceMode?: boolean;
  isCrashDetected?: boolean;
  crashTimestamp?: string | null;
  crashReason?: string | null;
  connectionError?: string;
}

export interface ConnectionConfig {
  host: string;
  port: number;
  rconPort: number;
  rconConfigured: boolean;
  rconConnected: boolean;
  serverDir: string;
  startCommand: string;
  connectionError?: string;
}

export interface ServerMetricsData {
  cpuUsage: number;
  ramUsedMB: number;
  ramTotalMB: number;
  diskUsedGB: number;
  diskTotalGB: number;
  tps: number;
  mspt: number;
  pingMs: number;
  entitiesCount: number;
  loadedChunks: number;
  hostiles?: number;
  passives?: number;
  items?: number;
  villagers?: number;
}

export interface ServerInfoData {
  serverName: string;
  motd: string;
  minecraftVersion: string;
  edition: string;
  loader: string;
  javaVersion: string;
  jvmArguments: string;
  os: string;
  cores: number;
  worldName: string;
  worldSeed: string;
  worldSizeMB: number;
}

export interface PlayerInventoryItem {
  id: string;
  name: string;
  count: number;
  lore?: string[];
  enchantments?: string[];
}

export interface PlayerInventory {
  armor: {
    helmet: PlayerInventoryItem | null;
    chestplate: PlayerInventoryItem | null;
    leggings: PlayerInventoryItem | null;
    boots: PlayerInventoryItem | null;
  };
  offhand: PlayerInventoryItem | null;
  hotbar: (PlayerInventoryItem | null)[];
  main: (PlayerInventoryItem | null)[];
}

export interface PlayerStats {
  playtimeHours: number;
  sessionsCount?: number;
  blocksMined?: number;
  blocksPlaced?: number;
  mobsKilled?: number;
  playerKills?: number;
  deathsCount?: number;
  distanceTraveledKm?: number;
}

export interface Player {
  uuid: string;
  username: string;
  online: boolean;
  ping: number;
  isOp: boolean;
  isBanned?: boolean;
  health: number;
  food: number;
  gamemode: 'survival' | 'creative' | 'adventure' | 'spectator';
  x: number;
  y: number;
  z: number;
  dimension: 'Overworld' | 'The Nether' | 'The End' | string;
  playTimeHours?: number;
  lastSeen?: string;
  inventory?: PlayerInventory;
  stats?: PlayerStats;
  lastDeath?: {
    cause: string;
    killer?: string;
    x: number;
    y: number;
    z: number;
    world?: string;
    dimension?: string;
    timestamp: string;
  };
}

export interface WorldGamerules {
  keepInventory: boolean;
  mobGriefing: boolean;
  doDaylightCycle: boolean;
  doWeatherCycle: boolean;
  doMobSpawning: boolean;
  doFireTick: boolean;
  naturalRegeneration: boolean;
  fallDamage: boolean;
  pvp: boolean;
}

export interface WorldSettings {
  name: string;
  seed: string;
  sizeMB: number;
  difficulty: 'peaceful' | 'easy' | 'normal' | 'hard';
  pvp: boolean;
  timeTicks: number;
  weather: 'clear' | 'rain' | 'thunder';
  gamerules: WorldGamerules;
}

export interface FabricMod {
  id: string;
  name: string;
  fileName: string;
  version: string;
  author: string;
  description: string;
  enabled: boolean;
  sizeBytes: number;
  loader: string;
  compatibility: 'Compatible' | 'Warning' | 'Incompatible';
  updateAvailable?: boolean;
  latestVersion?: string;
  updatedAt: string;
}

export interface WorldBackup {
  id: string;
  name: string;
  fileName: string;
  sizeMB: number;
  createdAt: string;
  dimension: string;
  note: string;
  automatic: boolean;
  status: string;
}

export interface ConsoleLogMessage {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'CHAT';
  message: string;
}

export interface ChatMessage {
  id: string;
  timestamp: string;
  sender: string;
  message: string;
  isSystem?: boolean;
  isOp?: boolean;
}

export interface CustomWaypoint {
  id: string;
  name: string;
  world: string;
  x: number;
  y: number;
  z: number;
  createdBy?: string;
}

export interface ScheduledTask {
  id: string;
  name: string;
  type: 'restart' | 'backup' | 'broadcast' | 'command';
  timeOfDay?: string;
  intervalHours?: number;
  broadcastMessage?: string;
  command?: string;
  enabled: boolean;
  warnMinutesBefore?: number[];
}

export interface ServerEventItem {
  id: string;
  timestamp: string;
  type: string;
  title: string;
  detail: string;
  severity: 'info' | 'success' | 'warning' | 'error';
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  admin: string;
  action: string;
  target: string;
  result: 'SUCCESS' | 'FAILED';
  details?: string;
}

export interface DeathRecord {
  id: string;
  player: string;
  cause: string;
  killer?: string;
  world: string;
  dimension?: string;
  x: number;
  y: number;
  z: number;
  timestamp: string;
  timeAgo: string;
}

export interface WhitelistEntry {
  username: string;
  uuid: string;
  addedAt: string;
}

export interface BanEntry {
  username: string;
  uuid: string;
  reason: string;
  bannedBy: string;
  date: string;
  expires: string;
  status: string;
}

export interface ServerConfigFile {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  updatedAt: string;
  isEditable: boolean;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

export interface ConfirmationModalConfig {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export type NavigationTab =
  | 'dashboard'
  | 'server'
  | 'players'
  | 'world'
  | 'mods'
  | 'console'
  | 'chat'
  | 'teleport'
  | 'performance'
  | 'backups'
  | 'scheduler'
  | 'events'
  | 'deaths'
  | 'whitelist'
  | 'bans'
  | 'files'
  | 'settings';
