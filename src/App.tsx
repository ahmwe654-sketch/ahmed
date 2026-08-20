import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
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
  NavigationTab,
  UserRole,
  UserProfile,
  AppearanceConfig,
  NotificationConfig,
  Language,
  ToastNotification,
  ConfirmationModalConfig
} from './types';

// Components
import { WelcomeScreen } from './components/WelcomeScreen';
import { OnboardingModal } from './components/OnboardingModal';
import { LoginModal } from './components/LoginModal';
import { AccountSettingsModal } from './components/AccountSettingsModal';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/ToastContainer';
import { ConfirmModal } from './components/ConfirmModal';

// Views
import { DashboardView } from './components/DashboardView';
import { ServerControlView } from './components/ServerControlView';
import { PlayersView } from './components/PlayersView';
import { WorldView } from './components/WorldView';
import { ModsView } from './components/ModsView';
import { ConsoleView } from './components/ConsoleView';
import { LiveChatView } from './components/LiveChatView';
import { TeleportView } from './components/TeleportView';
import { PerformanceView } from './components/PerformanceView';
import { BackupsView } from './components/BackupsView';
import { SchedulerView } from './components/SchedulerView';
import { EventsAuditView } from './components/EventsAuditView';
import { DeathHistoryView } from './components/DeathHistoryView';
import { WhitelistBansView } from './components/WhitelistBansView';
import { FileManagerView } from './components/FileManagerView';
import { SettingsView } from './components/SettingsView';

import { isRTL } from './utils/i18n';

export function App() {
  // Navigation & Session State
  const [authView, setAuthView] = useState<'welcome' | 'onboarding' | 'login' | 'authenticated'>('welcome');
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('aegis_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      name: 'Ahmed',
      email: 'ahmed@aegis-smp.net',
      role: 'owner',
      serverName: 'Aegis Core SMP',
      serverType: 'Fabric',
      mcVersion: '1.20.4',
      rememberMe: true
    };
  });

  // Language & RTL
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('aegis_lang') as Language;
    return saved === 'ar' ? 'ar' : 'en';
  });

  // Appearance Settings
  const [appearance, setAppearance] = useState<AppearanceConfig>(() => {
    const saved = localStorage.getItem('aegis_appearance');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      theme: 'dark',
      accent: 'emerald',
      animations: 'full',
      glassEffect: 'high',
      compactMode: false
    };
  });

  // Notification Settings
  const [notifications, setNotifications] = useState<NotificationConfig>(() => {
    const saved = localStorage.getItem('aegis_notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      serverRestart: true,
      serverCrash: true,
      backupComplete: true,
      backupFailure: true,
      playerJoin: true,
      playerLeave: true,
      performanceWarning: true,
      scheduledBroadcast: true,
      modError: true
    };
  });

  // Modals
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
  const [accountSettingsInitialTab, setAccountSettingsInitialTab] = useState<
    'profile' | 'appearance' | 'notifications' | 'security'
  >('profile');

  // Server Live State
  const [serverStatus, setServerStatus] = useState<ServerStatusData | null>(null);
  const [serverMetrics, setServerMetrics] = useState<ServerMetricsData | null>(null);
  const [serverInfo, setServerInfo] = useState<ServerInfoData | null>(null);

  // Entities & Collections
  const [players, setPlayers] = useState<Player[]>([]);
  const [worldSettings, setWorldSettings] = useState<WorldSettings | null>(null);
  const [mods, setMods] = useState<FabricMod[]>([]);
  const [backups, setBackups] = useState<WorldBackup[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLogMessage[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [waypoints, setWaypoints] = useState<CustomWaypoint[]>([]);
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [serverEvents, setServerEvents] = useState<ServerEventItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [deaths, setDeaths] = useState<DeathRecord[]>([]);
  const [whitelist, setWhitelist] = useState<{ enabled: boolean; players: WhitelistEntry[] }>({
    enabled: false,
    players: []
  });
  const [bans, setBans] = useState<BanEntry[]>([]);
  const [files, setFiles] = useState<ServerConfigFile[]>([]);

  // UI Feedback
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmationModalConfig | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('aegis_sidebar_collapsed') === 'true';
  });

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('aegis_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Synchronize HTML attributes for RTL & Appearance
  useEffect(() => {
    document.documentElement.dir = isRTL(lang) ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    localStorage.setItem('aegis_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('aegis_appearance', JSON.stringify(appearance));
    // Apply theme classes to body
    if (appearance.theme === 'darker') {
      document.body.classList.add('bg-darker-deck');
    } else {
      document.body.classList.remove('bg-darker-deck');
    }

    if (appearance.compactMode) {
      document.body.classList.add('compact-mode');
    } else {
      document.body.classList.remove('compact-mode');
    }

    if (appearance.animations === 'off') {
      document.body.classList.add('anim-off');
      document.body.classList.remove('anim-reduced');
    } else if (appearance.animations === 'reduced') {
      document.body.classList.add('anim-reduced');
      document.body.classList.remove('anim-off');
    } else {
      document.body.classList.remove('anim-off', 'anim-reduced');
    }
  }, [appearance]);

  useEffect(() => {
    localStorage.setItem('aegis_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('aegis_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addToast = (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // --- Initial & Periodic Data Fetching ---
  const fetchCriticalData = useCallback(async () => {
    try {
      const [statusRes, metricsRes] = await Promise.all([
        api.getServerStatus().catch(() => null),
        api.getServerMetrics().catch(() => null)
      ]);
      if (statusRes?.status) setServerStatus(statusRes.status);
      if (metricsRes?.metrics) setServerMetrics(metricsRes.metrics);
    } catch (err) {
      console.warn('Error polling server critical telemetry', err);
    }
  }, []);

  const fetchFullState = useCallback(async () => {
    try {
      const [
        statusRes,
        metricsRes,
        infoRes,
        playersRes,
        worldRes,
        modsRes,
        backupsRes,
        logsRes,
        chatRes,
        waypointsRes,
        tasksRes,
        eventsRes,
        auditRes,
        deathsRes,
        whitelistRes,
        bansRes,
        filesRes
      ] = await Promise.all([
        api.getServerStatus().catch(() => null),
        api.getServerMetrics().catch(() => null),
        api.getServerInfo().catch(() => null),
        api.getPlayers().catch(() => ({ players: [] })),
        api.getWorldSettings().catch(() => null),
        api.getMods().catch(() => ({ mods: [] })),
        api.getBackups().catch(() => ({ backups: [] })),
        api.getConsoleLogs().catch(() => ({ logs: [] })),
        api.getChatMessages().catch(() => ({ messages: [] })),
        api.getWaypoints().catch(() => ({ waypoints: [] })),
        api.getSchedulerTasks().catch(() => ({ tasks: [] })),
        api.getServerEvents().catch(() => ({ events: [] })),
        api.getAuditLogs().catch(() => ({ audit: [] })),
        api.getDeathHistory().catch(() => ({ deaths: [] })),
        api.getWhitelist().catch(() => ({ whitelist: { enabled: false, players: [] } })),
        api.getBans().catch(() => ({ bans: [] })),
        api.getFiles().catch(() => ({ files: [] }))
      ]);

      if (statusRes?.status) setServerStatus(statusRes.status);
      if (metricsRes?.metrics) setServerMetrics(metricsRes.metrics);
      if (infoRes?.info) setServerInfo(infoRes.info);
      if (playersRes?.players) setPlayers(playersRes.players);
      if (worldRes?.world) setWorldSettings(worldRes.world);
      if (modsRes?.mods) setMods(modsRes.mods);
      if (backupsRes?.backups) setBackups(backupsRes.backups);
      if (logsRes?.logs) setConsoleLogs(logsRes.logs);
      if (chatRes?.messages) setChatMessages(chatRes.messages);
      if (waypointsRes?.waypoints) setWaypoints(waypointsRes.waypoints);
      if (tasksRes?.tasks) setTasks(tasksRes.tasks);
      if (eventsRes?.events) setServerEvents(eventsRes.events);
      if (auditRes?.audit) setAuditLogs(auditRes.audit);
      if (deathsRes?.deaths) setDeaths(deathsRes.deaths);
      if (whitelistRes?.whitelist) setWhitelist(whitelistRes.whitelist);
      if (bansRes?.bans) setBans(bansRes.bans);
      if (filesRes?.files) setFiles(filesRes.files);
    } catch (err) {
      console.warn('Error fetching full server state', err);
    }
  }, []);

  useEffect(() => {
    fetchFullState();
    const interval = setInterval(fetchCriticalData, 2500);
    return () => clearInterval(interval);
  }, [fetchFullState, fetchCriticalData]);

  // --- Handlers: Lifecycle Actions ---
  const handleStartServer = async () => {
    try {
      addToast('info', 'Dispatching startup instruction...', 'Server Starting');
      const res = await api.startServer();
      if (res.status) setServerStatus(res.status);
      addToast('success', 'Minecraft server boot sequence initialized', 'Server Online');
      fetchFullState();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to start daemon', 'Start Error');
    }
  };

  const handleStopServer = async () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Stop Minecraft Server?',
      description: 'Players will be safely disconnected and chunks flushed to disk.',
      confirmLabel: 'Stop Server',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          addToast('info', 'Stopping server...', 'Shutdown in Progress');
          const res = await api.stopServer();
          if (res.status) setServerStatus(res.status);
          addToast('warning', 'Minecraft server safely halted', 'Server Stopped');
          setConfirmConfig(null);
          fetchFullState();
        } catch (err: any) {
          addToast('error', err.message || 'Failed to stop daemon', 'Stop Error');
        }
      }
    });
  };

  const handleRestartServer = async () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Restart Server Realm?',
      description: 'The server will broadcast a 10-second warning, save all world chunks, and reboot.',
      confirmLabel: 'Restart Now',
      confirmVariant: 'warning',
      onConfirm: async () => {
        try {
          addToast('info', 'Rebooting Fabric server daemon...', 'Restarting');
          const res = await api.restartServer();
          if (res.status) setServerStatus(res.status);
          addToast('success', 'Server restarted successfully', 'Reboot Complete');
          setConfirmConfig(null);
          fetchFullState();
        } catch (err: any) {
          addToast('error', err.message || 'Failed to restart server', 'Restart Error');
        }
      }
    });
  };

  const handleSaveWorld = async () => {
    try {
      addToast('info', 'Flushing world chunks to disk...', 'Saving World');
      await api.saveWorld();
      addToast('success', 'World save complete. All chunks synchronized.', 'World Saved');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to save world', 'Save Failed');
    }
  };

  const handlePurgeLag = async () => {
    try {
      addToast('info', 'Scanning entity tree & clearing ground items...', 'Purging Lag');
      await api.purgeLag();
      addToast('success', 'Ground item entities purged. TPS stabilized.', 'Optimization Complete');
      fetchCriticalData();
    } catch (err: any) {
      addToast('error', err.message || 'Purge failed', 'Optimization Error');
    }
  };

  const handleToggleWhitelist = async () => {
    try {
      const next = !whitelist.enabled;
      await api.toggleWhitelist(next);
      setWhitelist((prev) => ({ ...prev, enabled: next }));
      addToast('info', `Whitelist filter is now ${next ? 'ENABLED' : 'DISABLED'}`);
    } catch (err: any) {
      addToast('error', err.message || 'Whitelist toggle failed');
    }
  };

  const handleToggleMaintenance = async () => {
    try {
      const next = !serverStatus?.maintenanceMode;
      await api.toggleMaintenance(next);
      setServerStatus((prev) => (prev ? { ...prev, maintenanceMode: next } : null));
      addToast('warning', `Server maintenance mode ${next ? 'ACTIVATED' : 'DEACTIVATED'}`);
    } catch (err: any) {
      addToast('error', err.message || 'Maintenance toggle failed');
    }
  };

  const handleRenameServer = async (newName: string) => {
    try {
      await api.renameServer(newName);
      setServerStatus((prev) => (prev ? { ...prev, serverName: newName } : null));
      setUserProfile((prev) => ({ ...prev, serverName: newName }));
      addToast('success', `Server realm renamed to "${newName}"`, 'Configuration Updated');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to rename server');
    }
  };

  // --- Handlers: Players ---
  const handleKickPlayer = async (username: string, reason?: string) => {
    try {
      await api.kickPlayer(username, reason);
      setPlayers((prev) => prev.filter((p) => p.username !== username));
      addToast('warning', `Player ${username} kicked`, 'Player Disconnected');
    } catch (err: any) {
      addToast('error', err.message || 'Kick failed');
    }
  };

  const handleBanPlayer = async (username: string, reason?: string) => {
    try {
      await api.banPlayer(username, reason);
      setPlayers((prev) => prev.filter((p) => p.username !== username));
      setBans((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          target: username,
          bannedBy: userProfile.name,
          reason: reason || 'Banned by operator',
          timestamp: new Date().toISOString()
        }
      ]);
      addToast('error', `Player ${username} has been permanently banned`, 'Ban Applied');
    } catch (err: any) {
      addToast('error', err.message || 'Ban failed');
    }
  };

  const handleUnban = async (target: string) => {
    try {
      await api.unbanPlayer(target);
      setBans((prev) => prev.filter((b) => b.target !== target));
      addToast('success', `Unbanned ${target}`, 'Ban Revoked');
    } catch (err: any) {
      addToast('error', err.message || 'Unban failed');
    }
  };

  const handleAddWhitelist = async (username: string) => {
    try {
      await api.addWhitelist(username);
      setWhitelist((prev) => ({
        ...prev,
        players: [
          ...prev.players,
          {
            id: Date.now().toString(),
            username,
            addedBy: userProfile.name,
            timestamp: new Date().toISOString()
          }
        ]
      }));
      addToast('success', `Added ${username} to whitelist`, 'Whitelist Updated');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to add to whitelist');
    }
  };

  const handleRemoveWhitelist = async (username: string) => {
    try {
      await api.removeWhitelist(username);
      setWhitelist((prev) => ({
        ...prev,
        players: prev.players.filter((p) => p.username !== username)
      }));
      addToast('info', `Removed ${username} from whitelist`, 'Whitelist Updated');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to remove from whitelist');
    }
  };

  // --- Handlers: World, Teleport, Mods, Backups, Chat, Console ---
  const handleSetTime = async (time: number | string) => {
    try {
      await api.setWorldTime(time);
      setWorldSettings((prev) => (prev ? { ...prev, time: typeof time === 'number' ? time : 6000 } : null));
      addToast('success', `Time set to ${time}`, 'World Updated');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update time');
    }
  };

  const handleSetWeather = async (weather: 'clear' | 'rain' | 'thunder') => {
    try {
      await api.setWorldWeather(weather);
      setWorldSettings((prev) => (prev ? { ...prev, weather } : null));
      addToast('success', `Weather changed to ${weather}`, 'Atmosphere Updated');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to set weather');
    }
  };

  const handleSetGamerule = async (rule: string, value: boolean | number) => {
    try {
      await api.setGamerule(rule, value);
      setWorldSettings((prev) =>
        prev
          ? {
              ...prev,
              gamerules: { ...prev.gamerules, [rule]: value }
            }
          : null
      );
      addToast('success', `Gamerule ${rule} set to ${value}`, 'Gamerule Applied');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to set gamerule');
    }
  };

  const handleSetSeed = async (seed: string) => {
    try {
      await api.setWorldSeed(seed);
      setWorldSettings((prev) => (prev ? { ...prev, seed } : null));
      addToast('success', 'World seed configuration updated', 'Seed Applied');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update seed');
    }
  };

  const handleTeleport = async (data: any) => {
    try {
      await api.teleportPlayer(data);
      addToast('success', `Spatial teleport command executed for ${data.target || 'player'}`, 'Teleport Dispatched');
    } catch (err: any) {
      addToast('error', err.message || 'Teleport failed');
    }
  };

  const handleToggleMod = async (id: string, enabled: boolean) => {
    try {
      await api.toggleMod(id, enabled);
      setMods((prev) => prev.map((m) => (m.id === id ? { ...m, enabled } : m)));
      addToast('info', `Mod status updated. Restart required to apply.`, 'Mod Configured');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to toggle mod');
    }
  };

  const handleDeleteMod = async (id: string) => {
    try {
      await api.deleteMod(id);
      setMods((prev) => prev.filter((m) => m.id !== id));
      addToast('warning', 'Mod jar unlinked from /mods folder', 'Mod Deleted');
    } catch (err: any) {
      addToast('error', err.message || 'Delete mod failed');
    }
  };

  const handleUploadMod = async (file: File) => {
    try {
      const res = await api.uploadMod(file);
      setMods((prev) => [...prev, res.mod]);
      addToast('success', `Mod ${file.name} installed into Fabric`, 'Mod Installed');
    } catch (err: any) {
      addToast('error', err.message || 'Mod upload failed');
    }
  };

  const handleCreateBackup = async (name?: string) => {
    try {
      addToast('info', 'Creating world snapshot archive...', 'Archiving');
      const res = await api.createBackup(name);
      setBackups((prev) => [res.backup, ...prev]);
      addToast('success', 'World snapshot created successfully', 'Backup Created');
    } catch (err: any) {
      addToast('error', err.message || 'Backup failed');
    }
  };

  const handleRestoreBackup = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Restore World Backup?',
      description: 'Current world state will be replaced with this snapshot. Server must be offline.',
      confirmLabel: 'Restore Snapshot',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          addToast('info', 'Restoring world archive...', 'Restoring');
          await api.restoreBackup(id);
          addToast('success', 'World restored from backup', 'Restore Complete');
          setConfirmConfig(null);
        } catch (err: any) {
          addToast('error', err.message || 'Restore failed');
        }
      }
    });
  };

  const handleDeleteBackup = async (id: string) => {
    try {
      await api.deleteBackup(id);
      setBackups((prev) => prev.filter((b) => b.id !== id));
      addToast('info', 'Backup archive deleted from storage', 'Backup Removed');
    } catch (err: any) {
      addToast('error', err.message || 'Delete backup failed');
    }
  };

  const handleSendCommand = async (cmd: string) => {
    try {
      const res = await api.sendCommand(cmd);
      setConsoleLogs((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          type: 'COMMAND',
          line: `> ${cmd}`
        },
        {
          id: (Date.now() + 1).toString(),
          timestamp: new Date().toISOString(),
          type: 'INFO',
          line: res.output || 'Command executed.'
        }
      ]);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to dispatch command');
    }
  };

  const handleClearLogs = () => {
    setConsoleLogs([]);
    addToast('info', 'Console buffer cleared');
  };

  const handleBroadcastMessage = async (msg: string) => {
    try {
      await api.broadcastMessage(msg);
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: `[ADMIN] ${userProfile.name}`,
          message: msg,
          timestamp: new Date().toISOString(),
          type: 'SYSTEM'
        }
      ]);
      addToast('success', 'Broadcast dispatched in-game', 'Message Sent');
    } catch (err: any) {
      addToast('error', err.message || 'Broadcast failed');
    }
  };

  const handleCreateTask = async (task: any) => {
    try {
      const res = await api.createSchedulerTask(task);
      setTasks((prev) => [...prev, res.task]);
      addToast('success', `Automated schedule "${task.name}" registered`, 'Task Scheduled');
    } catch (err: any) {
      addToast('error', err.message || 'Task creation failed');
    }
  };

  const handleToggleTask = async (id: string, enabled: boolean) => {
    try {
      await api.toggleSchedulerTask(id, enabled);
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, enabled } : t)));
      addToast('info', `Task ${enabled ? 'ENABLED' : 'DISABLED'}`);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to toggle task');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await api.deleteSchedulerTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      addToast('info', 'Scheduled automation task unlinked', 'Task Deleted');
    } catch (err: any) {
      addToast('error', err.message || 'Delete task failed');
    }
  };

  const handleReadFile = async (path: string) => {
    const res = await api.readFile(path);
    return res.content;
  };

  const handleSaveFile = async (path: string, content: string) => {
    await api.saveFile(path, content);
    addToast('success', `Saved ${path}`, 'File Saved');
  };

  const handleSaveSettings = async (settingsData: any) => {
    try {
      await api.saveServerSettings(settingsData);
      addToast('success', 'Server properties updated & serialized', 'Settings Saved');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to save server settings');
    }
  };

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  const handleOpenAccountSettings = (
    tab: 'profile' | 'appearance' | 'notifications' | 'security' = 'profile'
  ) => {
    setAccountSettingsInitialTab(tab);
    setIsAccountSettingsOpen(true);
  };

  const handleLogout = () => {
    setAuthView('welcome');
    addToast('info', 'Signed out from Aegis Core');
  };

  // --- Auth & Welcome Gate ---
  if (authView === 'welcome') {
    return (
      <>
        <WelcomeScreen
          serverStatus={serverStatus}
          lang={lang}
          onGetStarted={() => setAuthView('onboarding')}
          onLogin={() => setAuthView('login')}
          onToggleLang={handleToggleLang}
        />
        <ToastContainer toasts={toasts} onCloseToast={removeToast} />
      </>
    );
  }

  if (authView === 'onboarding') {
    return (
      <>
        <OnboardingModal
          lang={lang}
          onComplete={(newProfile) => {
            setUserProfile((prev) => ({ ...prev, ...newProfile }));
            setAuthView('authenticated');
            addToast('success', `Welcome aboard, ${newProfile.name || 'Admin'}!`, 'Setup Completed');
          }}
          onSwitchToLogin={() => setAuthView('login')}
        />
        <ToastContainer toasts={toasts} onCloseToast={removeToast} />
      </>
    );
  }

  if (authView === 'login') {
    return (
      <>
        <LoginModal
          lang={lang}
          onSuccess={(profile) => {
            setUserProfile((prev) => ({ ...prev, ...profile }));
            setAuthView('authenticated');
            addToast('success', `Signed in as ${profile.name || 'Ahmed'} (${userProfile.role.toUpperCase()})`);
          }}
          onSwitchToOnboarding={() => setAuthView('onboarding')}
          onClose={() => setAuthView('welcome')}
        />
        <ToastContainer toasts={toasts} onCloseToast={removeToast} />
      </>
    );
  }

  const rtl = isRTL(lang);

  return (
    <div className={`min-h-screen bg-[#07080b] text-slate-100 flex flex-col antialiased select-none bg-ambient-deck ${rtl ? 'rtl' : 'ltr'}`}>
      {/* Toast Overlay */}
      <ToastContainer toasts={toasts} onCloseToast={removeToast} />

      {/* Confirmation Modal */}
      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          description={confirmConfig.description}
          confirmLabel={confirmConfig.confirmLabel}
          confirmVariant={confirmConfig.confirmVariant}
          isLoading={confirmConfig.isLoading}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
        />
      )}

      {/* Account Settings & Appearance Modal */}
      <AccountSettingsModal
        isOpen={isAccountSettingsOpen}
        initialTab={accountSettingsInitialTab}
        userProfile={userProfile}
        appearance={appearance}
        notifications={notifications}
        lang={lang}
        onClose={() => setIsAccountSettingsOpen(false)}
        onUpdateProfile={(p) => setUserProfile((prev) => ({ ...prev, ...p }))}
        onUpdateAppearance={(a) => setAppearance((prev) => ({ ...prev, ...a }))}
        onUpdateNotifications={(n) => setNotifications((prev) => ({ ...prev, ...n }))}
        onToggleLang={handleToggleLang}
        onLogout={handleLogout}
      />

      {/* Fixed Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        serverStatus={serverStatus}
        lang={lang}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          rtl
            ? (isSidebarCollapsed ? 'lg:pr-[72px]' : 'lg:pr-64')
            : (isSidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64')
        }`}
      >
        {/* Top Header Bar */}
        <TopBar
          serverStatus={serverStatus}
          userRole={userProfile.role}
          userProfile={userProfile}
          appearance={appearance}
          notifications={notifications}
          lang={lang}
          onOpenSettings={handleOpenAccountSettings}
          onToggleLang={handleToggleLang}
          onLogout={handleLogout}
          onChangeRole={(r) => setUserProfile((prev) => ({ ...prev, role: r }))}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          activeTab={activeTab}
          sidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={handleToggleSidebarCollapse}
        />

        {/* View Router */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] 2xl:max-w-[1800px] w-full mx-auto space-y-6">
          {activeTab === 'dashboard' && (
            <DashboardView
              status={serverStatus}
              metrics={serverMetrics}
              players={players}
              userRole={userProfile.role}
              lang={lang}
              onStartServer={handleStartServer}
              onStopServer={handleStopServer}
              onRestartServer={handleRestartServer}
              onSaveWorld={handleSaveWorld}
              onPurgeLag={handlePurgeLag}
              onToggleWhitelist={handleToggleWhitelist}
              onToggleMaintenance={handleToggleMaintenance}
              onRenameServer={handleRenameServer}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'server' && (
            <ServerControlView
              status={serverStatus}
              metrics={serverMetrics}
              info={serverInfo}
              userRole={userProfile.role}
              onStart={handleStartServer}
              onStop={handleStopServer}
              onRestart={handleRestartServer}
              onSaveWorld={handleSaveWorld}
              onPurgeLag={handlePurgeLag}
              onToggleWhitelist={handleToggleWhitelist}
              onToggleMaintenance={handleToggleMaintenance}
              onRenameServer={handleRenameServer}
            />
          )}

          {activeTab === 'performance' && (
            <PerformanceView
              metrics={serverMetrics}
              status={serverStatus}
              userRole={userProfile.role}
              lang={lang}
              onPurgeLag={handlePurgeLag}
            />
          )}

          {activeTab === 'players' && (
            <PlayersView
              players={players}
              maxPlayers={serverStatus?.maxPlayers || 40}
              userRole={userProfile.role}
              onKick={handleKickPlayer}
              onBan={handleBanPlayer}
              onOp={async (u) => {
                await api.opPlayer(u);
                addToast('success', `Operator granted to ${u}`, 'Permission Elevated');
              }}
              onDeop={async (u) => {
                await api.deopPlayer(u);
                addToast('warning', `Operator revoked from ${u}`, 'Permission Demoted');
              }}
              onHeal={async (u) => {
                await api.healPlayer(u);
                addToast('success', `Player ${u} health and hunger restored`, 'Player Healed');
              }}
              onFeed={async (u) => {
                await api.feedPlayer(u);
                addToast('success', `Player ${u} hunger restored`, 'Player Fed');
              }}
              onTeleportTo={(t) => handleTeleport({ target: t })}
            />
          )}

          {activeTab === 'world' && (
            <WorldView
              world={worldSettings}
              userRole={userProfile.role}
              onSetTime={handleSetTime}
              onSetWeather={handleSetWeather}
              onSetGamerule={handleSetGamerule}
              onSetSeed={handleSetSeed}
              onSaveWorld={handleSaveWorld}
            />
          )}

          {activeTab === 'mods' && (
            <ModsView
              mods={mods}
              userRole={userProfile.role}
              onToggleMod={handleToggleMod}
              onDeleteMod={handleDeleteMod}
              onUploadMod={handleUploadMod}
            />
          )}

          {activeTab === 'teleport' && (
            <TeleportView
              players={players}
              waypoints={waypoints}
              userRole={userProfile.role}
              onTeleport={handleTeleport}
              onCreateWaypoint={async (data) => {
                const res = await api.createWaypoint(data);
                setWaypoints((prev) => [...prev, res.waypoint]);
                addToast('success', `Waypoint "${data.name}" saved`, 'Spatial Point Added');
              }}
              onDeleteWaypoint={async (id) => {
                await api.deleteWaypoint(id);
                setWaypoints((prev) => prev.filter((w) => w.id !== id));
                addToast('info', 'Waypoint removed', 'Waypoint Deleted');
              }}
            />
          )}

          {activeTab === 'console' && (
            <ConsoleView
              logs={consoleLogs}
              userRole={userProfile.role}
              onSendCommand={handleSendCommand}
              onClearLogs={handleClearLogs}
            />
          )}

          {activeTab === 'chat' && (
            <LiveChatView
              messages={chatMessages}
              userRole={userProfile.role}
              onSendMessage={handleBroadcastMessage}
            />
          )}

          {activeTab === 'backups' && (
            <BackupsView
              backups={backups}
              userRole={userProfile.role}
              onCreateBackup={handleCreateBackup}
              onRestoreBackup={handleRestoreBackup}
              onDeleteBackup={handleDeleteBackup}
            />
          )}

          {activeTab === 'scheduler' && (
            <SchedulerView
              tasks={tasks}
              userRole={userProfile.role}
              onCreateTask={handleCreateTask}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
            />
          )}

          {activeTab === 'events' && (
            <EventsAuditView
              events={serverEvents}
              auditLogs={auditLogs}
              userRole={userProfile.role}
            />
          )}

          {activeTab === 'deaths' && (
            <DeathHistoryView
              deaths={deaths}
              userRole={userProfile.role}
              onTeleportToDeath={(coords) => {
                if (players.length > 0) {
                  handleTeleport({
                    target: players[0].username,
                    coords: { x: coords.x, y: coords.y, z: coords.z },
                    dimension: coords.dimension
                  });
                } else {
                  addToast('warning', 'No online player available to teleport');
                }
              }}
            />
          )}

          {activeTab === 'whitelist' && (
            <WhitelistBansView
              whitelist={whitelist}
              bans={bans}
              userRole={userProfile.role}
              onToggleWhitelist={handleToggleWhitelist}
              onAddWhitelist={handleAddWhitelist}
              onRemoveWhitelist={handleRemoveWhitelist}
              onUnban={handleUnban}
            />
          )}

          {activeTab === 'bans' && (
            <WhitelistBansView
              whitelist={whitelist}
              bans={bans}
              userRole={userProfile.role}
              onToggleWhitelist={handleToggleWhitelist}
              onAddWhitelist={handleAddWhitelist}
              onRemoveWhitelist={handleRemoveWhitelist}
              onUnban={handleUnban}
            />
          )}

          {activeTab === 'files' && (
            <FileManagerView
              files={files}
              userRole={userProfile.role}
              onReadFile={handleReadFile}
              onSaveFile={handleSaveFile}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              userRole={userProfile.role}
              lang={lang}
              onSaveSettings={handleSaveSettings}
              onChangeLang={(l) => setLang(l)}
              onToggleLang={handleToggleLang}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
