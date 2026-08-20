import React, { useState } from 'react';
import {
  Server,
  Play,
  Square,
  RotateCw,
  AlertTriangle,
  Cpu,
  Layers,
  Terminal,
  Activity
} from 'lucide-react';
import { ServerStatusData, ServerInfoData, UserRole } from '../types';
import { sound } from '../utils/sound';

interface ServerControlViewProps {
  status: ServerStatusData | null;
  info: ServerInfoData | null;
  userRole: UserRole;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onKill: () => void;
}

export const ServerControlView: React.FC<ServerControlViewProps> = ({
  status,
  info,
  userRole,
  onStart,
  onStop,
  onRestart,
  onKill
}) => {
  const [ramAlloc, setRamAlloc] = useState('8G');

  const isOnline = status?.status === 'ONLINE';
  const isBusy = status?.status === 'STARTING' || status?.status === 'STOPPING' || status?.status === 'RESTARTING';
  const canControl = userRole === 'owner' || userRole === 'admin';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Crash Detection Alert (if detected) */}
      {status?.isCrashDetected && (
        <div className="glass-panel border-red-500/50 bg-red-950/40 rounded-2xl p-5 shadow-[0_0_30px_rgba(239,68,68,0.25)] flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-red-300">Server Crash Detected</h3>
            <p className="text-xs text-red-200/80 mt-1 leading-relaxed">
              The server process exited unexpectedly at {status.crashTimestamp || 'recently'}. Possible cause: {status.crashReason || 'Out of memory / Mod exception'}.
            </p>
            <div className="flex items-center gap-3 mt-3">
              <button
                type="button"
                onClick={onRestart}
                className="px-4 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-black text-xs font-bold transition-colors cursor-pointer"
              >
                Auto-Restart Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Lifecycle Control Deck */}
      <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Lifecycle Process Manager</h2>
                <p className="text-xs text-slate-400">Control the Fabric Java server process daemon safely</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              id="server-ctrl-start"
              type="button"
              disabled={isOnline || isBusy || !canControl}
              onClick={() => {
                sound.playClick();
                onStart();
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2 disabled:opacity-40 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Start</span>
            </button>

            <button
              id="server-ctrl-restart"
              type="button"
              disabled={!isOnline || isBusy || !canControl}
              onClick={() => {
                sound.playClick();
                onRestart();
              }}
              className="px-5 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-40 cursor-pointer"
            >
              <RotateCw className={`w-4 h-4 ${isBusy ? 'animate-spin' : ''}`} />
              <span>Restart</span>
            </button>

            <button
              id="server-ctrl-stop"
              type="button"
              disabled={!isOnline || isBusy || !canControl}
              onClick={() => {
                sound.playClick();
                onStop();
              }}
              className="px-5 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-300 text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-40 cursor-pointer"
            >
              <Square className="w-4 h-4" />
              <span>Graceful Stop</span>
            </button>

            <button
              id="server-ctrl-kill"
              type="button"
              disabled={!isOnline || !canControl}
              onClick={() => {
                sound.playWarning();
                onKill();
              }}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-slate-400 hover:text-red-300 text-xs font-semibold transition-all cursor-pointer disabled:opacity-40"
              title="Force Kill (SIGKILL)"
            >
              Kill Process
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Server Specifications & Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Spec Card */}
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/8 pb-3">
            <Layers className="w-4 h-4 text-violet-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Minecraft & Runtime Specifications
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-white/4">
              <span className="text-slate-400">Server Edition</span>
              <span className="font-bold text-white">Minecraft: Java Edition</span>
            </div>

            <div className="flex justify-between py-1 border-b border-white/4">
              <span className="text-slate-400">Target Version</span>
              <span className="font-mono font-bold text-emerald-400">1.20.4</span>
            </div>

            <div className="flex justify-between py-1 border-b border-white/4">
              <span className="text-slate-400">Mod Loader</span>
              <span className="font-bold text-violet-300">Fabric Loader v0.15.7</span>
            </div>

            <div className="flex justify-between py-1 border-b border-white/4">
              <span className="text-slate-400">Java Virtual Machine</span>
              <span className="font-mono text-slate-200">{info?.javaVersion || 'Java 21 OpenJDK (64-Bit)'}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-white/4">
              <span className="text-slate-400">Host / Daemon IP</span>
              <span className="font-mono text-slate-200">0.0.0.0:25565</span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-400">RCON Controller Port</span>
              <span className="font-mono text-emerald-400">25575 (Internal Daemon)</span>
            </div>
          </div>
        </div>

        {/* JVM Flags & Memory Allocator */}
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/8 pb-3">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              JVM Memory & Launch Flags
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Max Heap Memory Allocation</label>
              <div className="grid grid-cols-4 gap-2">
                {['4G', '6G', '8G', '12G'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setRamAlloc(opt)}
                    className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      ramAlloc === opt
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Fabric Optimized Flags (Aikar Standard)</label>
              <div className="p-3 rounded-xl bg-black/40 border border-white/8 font-mono text-[11px] text-slate-300 leading-relaxed overflow-x-auto">
                -Xms2G -Xmx{ramAlloc} -XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 shrink-0" />
              <span>G1 Garbage Collector configured for low-latency sub-20ms MSPT ticks.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
