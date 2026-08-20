import React, { useState } from 'react';
import {
  Play,
  Square,
  RotateCw,
  Save,
  Users,
  Activity,
  Cpu,
  Clock,
  Wifi,
  HardDrive,
  Copy,
  Check,
  Edit2,
  X,
  ArrowRight,
  Radio,
  Sparkles,
  Zap,
  Info,
  Server as ServerIcon,
  Layers,
  Terminal,
  ShieldCheck,
  FileCode
} from 'lucide-react';
import {
  ServerStatusData,
  ServerMetricsData,
  NavigationTab,
  UserRole,
  Player,
  Language
} from '../types';
import { getTranslation } from '../utils/i18n';
import { sound } from '../utils/sound';
import { MetricDonutCard } from './dashboard/MetricDonutCard';
import { ControlGlassButton } from './dashboard/ControlGlassButton';

interface DashboardViewProps {
  status: ServerStatusData | null;
  metrics: ServerMetricsData | null;
  players?: Player[];
  userRole: UserRole;
  lang: Language;
  onStartServer: () => void;
  onStopServer: () => void;
  onRestartServer: () => void;
  onSaveWorld: () => void;
  onPurgeLag?: () => void;
  onToggleWhitelist?: () => void;
  onToggleMaintenance?: () => void;
  onRenameServer: (newName: string) => void;
  onNavigateTab: (tab: NavigationTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  status,
  metrics,
  players = [],
  userRole,
  lang,
  onStartServer,
  onStopServer,
  onRestartServer,
  onSaveWorld,
  onPurgeLag,
  onToggleWhitelist,
  onToggleMaintenance,
  onRenameServer,
  onNavigateTab,
}) => {
  const [copiedIp, setCopiedIp] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [serverNameInput, setServerNameInput] = useState(status?.serverName || 'Aegis Core SMP');
  const [isActionPending, setIsActionPending] = useState(false);

  const isOnline = status?.status === 'ONLINE' || status?.online !== false;
  const lifecycleState = status?.status || (isOnline ? 'ONLINE' : 'OFFLINE');
  const isBusy =
    lifecycleState === 'STARTING' ||
    lifecycleState === 'STOPPING' ||
    lifecycleState === 'RESTARTING' ||
    isActionPending;
  const canControl = userRole === 'owner' || userRole === 'admin';

  // Format Uptime helper
  const formatUptime = (seconds: number) => {
    if (!seconds) return '0h 0m';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 24) {
      const days = Math.floor(hrs / 24);
      return `${days}d ${hrs % 24}h`;
    }
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const currentServerName = status?.serverName || 'Aegis Core SMP';
  const serverIp = status?.ip ? `${status.ip}:25565` : 'aegis-smp.ply.gg:25565';

  const handleCopyIp = () => {
    navigator.clipboard.writeText(serverIp);
    sound.playClick();
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2000);
  };

  const handleSaveRename = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!serverNameInput.trim()) return;
    sound.playClick();
    onRenameServer(serverNameInput.trim());
    setIsEditingName(false);
  };

  const handleCancelRename = () => {
    setServerNameInput(currentServerName);
    setIsEditingName(false);
  };

  // Action triggers with safe debounce
  const triggerLifecycleAction = async (action: 'start' | 'stop' | 'restart' | 'save') => {
    if (isBusy || !canControl) return;
    setIsActionPending(true);
    sound.playClick();

    try {
      if (action === 'start') onStartServer();
      else if (action === 'stop') onStopServer();
      else if (action === 'restart') onRestartServer();
      else if (action === 'save') onSaveWorld();
    } finally {
      setTimeout(() => setIsActionPending(false), 800);
    }
  };

  // Metrics extraction directly from real server state
  const tpsVal = isOnline ? (metrics?.tps !== undefined ? metrics.tps : (status?.tps ?? 20.0)) : 0;
  const msptVal = isOnline ? (metrics?.mspt !== undefined ? metrics.mspt : (status?.mspt ?? 0)) : 0;
  const ramUsedMB = isOnline ? (metrics?.ramUsedMB || 0) : 0;
  const ramTotalMB = metrics?.ramTotalMB || 8192;
  const ramUsedGB = (ramUsedMB / 1024).toFixed(1);
  const ramTotalGB = (ramTotalMB / 1024).toFixed(0);
  const ramPercent = Math.min(100, Math.round((ramUsedMB / (ramTotalMB || 1)) * 100));
  const cpuPercent = isOnline ? (metrics?.cpuUsage || 0) : 0;
  const playersCount = isOnline ? (status?.playersOnline ?? players.length) : 0;
  const maxPlayers = status?.maxPlayers || 20;
  const pingVal = isOnline ? (metrics?.pingMs || 0) : 0;
  const pingPct = Math.min(100, Math.round((pingVal / 150) * 100));
  const uptimeVal = isOnline ? formatUptime(status?.uptimeSeconds || 0) : '0m';

  // Last updated timestamp
  const lastUpdatedTime = new Date().toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="space-y-6 sm:space-y-7 animate-in fade-in duration-300 select-none pb-8">
      {/* ========================================================================= */}
      {/* 1. SERVER CONTROL CENTER                                                  */}
      {/* ========================================================================= */}
      <div className="glass-panel-high rounded-3xl p-6 sm:p-7 relative overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
        {/* Subtle Cyberpunk Ambient Neon Gradients */}
        <div className="absolute -top-16 -right-16 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Server Identity & Status */}
          <div className="flex items-start gap-4 sm:gap-5 flex-1 min-w-0">
            {/* Status Pulse Sphere */}
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 ${
                isOnline
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.35)]'
                  : lifecycleState === 'CRASHED'
                  ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.4)]'
                  : 'bg-slate-800/40 border-white/10 text-slate-400'
              }`}
            >
              {isBusy ? (
                <RotateCw className="w-7 h-7 animate-spin text-amber-400" />
              ) : isOnline ? (
                <Radio className="w-7 h-7 text-emerald-400 animate-pulse" />
              ) : (
                <Activity className="w-7 h-7 text-red-400" />
              )}
            </div>

            <div className="space-y-2 flex-1 min-w-0">
              {/* Top Tags & Status Pill */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  {getTranslation(lang, 'server_control_center')}
                </span>

                {/* Status Badge */}
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-mono font-extrabold uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
                    isOnline
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                      : lifecycleState === 'CRASHED'
                      ? 'bg-red-500/20 text-red-300 border-red-500/40'
                      : 'bg-white/5 text-slate-400 border-white/10'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOnline ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-red-400'
                    }`}
                  />
                  {getTranslation(lang, `state_${lifecycleState.toLowerCase()}`)}
                </span>

                <span className="px-2.5 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-bold font-mono">
                  Fabric 1.20.4
                </span>

                {/* Development Simulator Mode indicator */}
                <span
                  title="Aegis Core is currently operating with simulated background telemetry. Ready for direct connection to Minecraft Java daemon."
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-[10px] font-mono font-bold cursor-help"
                >
                  <Info className="w-3 h-3" />
                  <span>SIMULATED FEED</span>
                </span>
              </div>

              {/* Editable Server Realm Name */}
              {isEditingName ? (
                <form onSubmit={handleSaveRename} className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={serverNameInput}
                    onChange={(e) => setServerNameInput(e.target.value)}
                    placeholder="Enter server name..."
                    autoFocus
                    maxLength={48}
                    className="px-3.5 py-1.5 bg-black/70 border border-emerald-500/50 rounded-xl text-white font-extrabold text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelRename}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight truncate">
                    {currentServerName}
                  </h1>
                  {canControl && (
                    <button
                      type="button"
                      onClick={() => {
                        setServerNameInput(currentServerName);
                        setIsEditingName(true);
                        sound.playClick();
                      }}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-300 border border-white/5 transition-all cursor-pointer"
                      title="Rename Server"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Server Info Details Strip */}
              <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap pt-1">
                {/* IP Address with Quick Copy */}
                <button
                  type="button"
                  onClick={handleCopyIp}
                  className="inline-flex items-center gap-1.5 font-mono text-slate-300 hover:text-emerald-300 bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1 rounded-xl border border-white/8 transition-all cursor-pointer group"
                  title={getTranslation(lang, 'click_to_copy')}
                >
                  <span className="font-semibold">{serverIp}</span>
                  {copiedIp ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
                  )}
                </button>

                <span className="text-slate-600">•</span>

                {/* MOTD */}
                <span className="text-slate-400 font-mono truncate max-w-xs sm:max-w-sm">
                  {status?.motd?.replace(/§[0-9a-fk-or]/g, '') || 'High Performance Fabric Minecraft Server'}
                </span>

                <span className="text-slate-600">•</span>

                {/* Last Updated Timestamp */}
                <span className="text-[11px] text-slate-500 font-mono">
                  {getTranslation(lang, 'last_updated')}: <span className="text-slate-400">{lastUpdatedTime}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Master Action Controls (Refined Glass Buttons) */}
          <div className="flex items-center gap-2.5 flex-wrap sm:justify-end shrink-0 pt-2 lg:pt-0">
            {isOnline ? (
              <>
                {/* Save World */}
                <ControlGlassButton
                  id="dashboard-save-world-btn"
                  variant="save"
                  label={getTranslation(lang, 'action_save_world')}
                  disabled={!canControl || isBusy}
                  onClick={() => triggerLifecycleAction('save')}
                  title="Flush modified chunks to storage"
                />

                {/* Restart */}
                <ControlGlassButton
                  id="dashboard-restart-btn"
                  variant="restart"
                  label={getTranslation(lang, 'action_restart')}
                  disabled={!canControl || isBusy}
                  isLoading={isBusy && lifecycleState === 'RESTARTING'}
                  onClick={() => triggerLifecycleAction('restart')}
                  title="Safely restart Fabric daemon"
                />

                {/* Stop */}
                <ControlGlassButton
                  id="dashboard-stop-btn"
                  variant="stop"
                  label={getTranslation(lang, 'action_stop')}
                  disabled={!canControl || isBusy}
                  isLoading={isBusy && lifecycleState === 'STOPPING'}
                  onClick={() => triggerLifecycleAction('stop')}
                  title="Gracefully halt server"
                />
              </>
            ) : (
              /* Start Button when Offline */
              <ControlGlassButton
                id="dashboard-start-btn"
                variant="start"
                label={getTranslation(lang, 'action_start')}
                disabled={!canControl || isBusy}
                isLoading={isBusy && lifecycleState === 'STARTING'}
                onClick={() => triggerLifecycleAction('start')}
                title="Initialize Minecraft server process"
                className="px-8 py-3 text-sm"
              />
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CIRCULAR DONUT METRICS: CPU, RAM, PING                                 */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* CPU LOAD DONUT */}
        <MetricDonutCard
          id="metric-card-cpu"
          title={getTranslation(lang, 'metric_cpu')}
          icon={Cpu}
          theme={cpuPercent > 80 ? 'red' : cpuPercent > 60 ? 'amber' : 'violet'}
          percentage={cpuPercent}
          valueDisplay={isOnline ? `${cpuPercent}%` : '0%'}
          statusText={
            !isOnline ? 'Offline' : cpuPercent > 80 ? 'Heavy Load' : cpuPercent > 50 ? 'Moderate' : 'Optimal'
          }
          subtitle={isOnline ? '8 Cores • 3.8 GHz' : 'Engine Idle'}
          onClick={() => onNavigateTab('performance')}
          isSimulated={true}
          actionHint="View Performance"
        />

        {/* RAM USAGE DONUT */}
        <MetricDonutCard
          id="metric-card-ram"
          title={getTranslation(lang, 'metric_ram')}
          icon={HardDrive}
          theme={ramPercent > 85 ? 'red' : ramPercent > 70 ? 'amber' : 'emerald'}
          percentage={ramPercent}
          valueDisplay={isOnline ? `${ramUsedGB}` : '0'}
          unit={isOnline ? `/ ${ramTotalGB} GB` : 'GB'}
          statusText={
            !isOnline ? 'Offline' : ramPercent > 85 ? 'High Alloc' : `${ramPercent}% Allocated`
          }
          subtitle={isOnline ? `${ramUsedMB} MB / ${ramTotalMB} MB` : '0 MB Allocated'}
          onClick={() => onNavigateTab('performance')}
          isSimulated={true}
          actionHint="Memory Profiler"
        />

        {/* PING / LATENCY DONUT */}
        <MetricDonutCard
          id="metric-card-ping"
          title={getTranslation(lang, 'metric_ping')}
          icon={Wifi}
          theme={pingVal > 120 ? 'amber' : 'cyan'}
          percentage={pingPct}
          valueDisplay={isOnline ? `${pingVal}` : '0'}
          unit="ms"
          statusText={
            !isOnline ? 'Offline' : pingVal <= 50 ? getTranslation(lang, 'status_excellent') : 'Stable'
          }
          subtitle="WAN / LAN Gateway Probe"
          onClick={() => onNavigateTab('performance')}
          isSimulated={true}
          actionHint="Network Telemetry"
        />
      </div>

      {/* ========================================================================= */}
      {/* 3. SERVER HEALTH & QUICK INSIGHTS (COMPACT STATUS STRIP)                  */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 font-mono">
              {getTranslation(lang, 'server_health_title')}
            </h2>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
            <span>{getTranslation(lang, 'live_health')}</span>
          </span>
        </div>

        {/* 7 Compact Health Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
          {/* CARD 1: TPS */}
          <div
            onClick={() => {
              sound.playClick();
              onNavigateTab('performance');
            }}
            className="glass-panel rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/40 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                {getTranslation(lang, 'metric_tps')}
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">↗</span>
            </div>
            <div className="space-y-1">
              <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
                {isOnline ? tpsVal.toFixed(1) : '0.0'}
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-emerald-400 font-bold font-mono">
                  {isOnline ? getTranslation(lang, 'status_healthy') : 'Offline'}
                </span>
                <span className="text-slate-500 font-mono">/ 20.0</span>
              </div>
            </div>
          </div>

          {/* CARD 2: MSPT */}
          <div
            onClick={() => {
              sound.playClick();
              onNavigateTab('performance');
            }}
            className="glass-panel rounded-2xl p-4 flex flex-col justify-between hover:border-sky-500/40 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                {getTranslation(lang, 'metric_mspt')}
              </span>
              <span className="text-[10px] text-sky-400 font-mono">→</span>
            </div>
            <div className="space-y-1">
              <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
                {isOnline ? `${msptVal.toFixed(1)}` : '0'} <span className="text-xs font-normal text-slate-400">ms</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-sky-400 font-bold font-mono">
                  {isOnline ? getTranslation(lang, 'status_excellent') : 'Offline'}
                </span>
                <span className="text-slate-500 font-mono">&lt; 50ms</span>
              </div>
            </div>
          </div>

          {/* CARD 3: RAM */}
          <div
            onClick={() => {
              sound.playClick();
              onNavigateTab('performance');
            }}
            className="glass-panel rounded-2xl p-4 flex flex-col justify-between hover:border-violet-500/40 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                {getTranslation(lang, 'metric_ram')}
              </span>
              <span className="text-[10px] text-violet-400 font-mono">{ramPercent}%</span>
            </div>
            <div className="space-y-1">
              <div className="text-lg sm:text-xl font-black font-mono text-white tracking-tight truncate">
                {isOnline ? `${ramUsedGB} / ${ramTotalGB}` : '0 / 8'} <span className="text-xs font-normal text-slate-400">GB</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-violet-400 font-bold font-mono">
                  {isOnline ? getTranslation(lang, 'status_normal') : 'Offline'}
                </span>
                <span className="text-slate-500 font-mono">{ramPercent}%</span>
              </div>
            </div>
          </div>

          {/* CARD 4: CPU */}
          <div
            onClick={() => {
              sound.playClick();
              onNavigateTab('performance');
            }}
            className="glass-panel rounded-2xl p-4 flex flex-col justify-between hover:border-indigo-500/40 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                {getTranslation(lang, 'metric_cpu')}
              </span>
              <span className="text-[10px] text-indigo-400 font-mono">→</span>
            </div>
            <div className="space-y-1">
              <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
                {isOnline ? `${cpuPercent}%` : '0%'}
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-indigo-400 font-bold font-mono">
                  {isOnline ? getTranslation(lang, 'status_normal') : 'Offline'}
                </span>
                <span className="text-slate-500 font-mono">8 Cores</span>
              </div>
            </div>
          </div>

          {/* CARD 5: PLAYERS */}
          <div
            onClick={() => {
              sound.playClick();
              onNavigateTab('players');
            }}
            className="glass-panel rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/40 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                {getTranslation(lang, 'metric_players')}
              </span>
              <Users className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
                {isOnline ? `${playersCount}` : '0'} <span className="text-xs font-normal text-slate-400">/ {maxPlayers}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-emerald-400 font-bold font-mono">
                  {playersCount > 0 ? 'Active' : 'Empty'}
                </span>
                <span className="text-slate-500 font-mono">Slots</span>
              </div>
            </div>
          </div>

          {/* CARD 6: PING */}
          <div
            onClick={() => {
              sound.playClick();
              onNavigateTab('performance');
            }}
            className="glass-panel rounded-2xl p-4 flex flex-col justify-between hover:border-teal-500/40 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                {getTranslation(lang, 'metric_ping')}
              </span>
              <Wifi className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="space-y-1">
              <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
                {isOnline ? `${pingVal}` : '0'} <span className="text-xs font-normal text-slate-400">ms</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-teal-400 font-bold font-mono">
                  {isOnline ? getTranslation(lang, 'status_excellent') : 'Offline'}
                </span>
                <span className="text-slate-500 font-mono">LAN/WAN</span>
              </div>
            </div>
          </div>

          {/* CARD 7: UPTIME */}
          <div
            onClick={() => {
              sound.playClick();
              onNavigateTab('server');
            }}
            className="glass-panel rounded-2xl p-4 flex flex-col justify-between hover:border-blue-500/40 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                {getTranslation(lang, 'metric_uptime')}
              </span>
              <Clock className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="space-y-1">
              <div className="text-base sm:text-lg font-black font-mono text-white tracking-tight truncate">
                {uptimeVal}
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-blue-400 font-bold font-mono">
                  {isOnline ? getTranslation(lang, 'status_stable') : 'Offline'}
                </span>
                <span className="text-slate-500 font-mono">Daemon</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. QUICK ACCESS DESTINATIONS                                              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-1">
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onNavigateTab('players');
          }}
          className="glass-panel rounded-2xl p-4 text-left hover:border-emerald-500/30 transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
              {getTranslation(lang, 'nav_players')}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              {playersCount} {getTranslation(lang, 'metric_players').toLowerCase()}
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onNavigateTab('console');
          }}
          className="glass-panel rounded-2xl p-4 text-left hover:border-violet-500/30 transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors">
              {getTranslation(lang, 'nav_console')}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">RCON Terminal</div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onNavigateTab('mods');
          }}
          className="glass-panel rounded-2xl p-4 text-left hover:border-blue-500/30 transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
              {getTranslation(lang, 'nav_mods')}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">14 active mods</div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onNavigateTab('backups');
          }}
          className="glass-panel rounded-2xl p-4 text-left hover:border-amber-500/30 transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
              {getTranslation(lang, 'nav_backups')}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">Auto-sync daily</div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
        </button>
      </div>
    </div>
  );
};
