import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Send,
  Trash2,
  Download,
  Search,
  ArrowDown,
  Sparkles,
  Command
} from 'lucide-react';
import { ConsoleLogMessage, UserRole } from '../types';
import { sound } from '../utils/sound';

interface ConsoleViewProps {
  logs: ConsoleLogMessage[];
  userRole: UserRole;
  onSendCommand: (cmd: string) => void;
  onClearLogs: () => void;
}

export const ConsoleView: React.FC<ConsoleViewProps> = ({
  logs,
  userRole,
  onSendCommand,
  onClearLogs
}) => {
  const [commandInput, setCommandInput] = useState('');
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR' | 'CHAT'>('ALL');
  const [searchLog, setSearchLog] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const canSend = userRole === 'owner' || userRole === 'admin';

  const quickCommands = [
    { label: '/list', cmd: 'list' },
    { label: '/tps', cmd: 'tps' },
    { label: '/save-all', cmd: 'save-all' },
    { label: '/help', cmd: 'help' },
    { label: '/whitelist list', cmd: 'whitelist list' },
    { label: '/reload', cmd: 'reload' }
  ];

  useEffect(() => {
    if (autoScroll) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleSend = () => {
    if (!commandInput.trim()) return;
    sound.playClick();
    onSendCommand(commandInput.trim());
    setCmdHistory((prev) => [commandInput.trim(), ...prev]);
    setHistoryIndex(-1);
    setCommandInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    } else if (e.key === 'ArrowUp') {
      if (cmdHistory.length > 0 && historyIndex < cmdHistory.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setCommandInput(cmdHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      if (historyIndex > 0) {
        const prevIdx = historyIndex - 1;
        setHistoryIndex(prevIdx);
        setCommandInput(cmdHistory[prevIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommandInput('');
      }
    }
  };

  const handleDownloadLogs = () => {
    sound.playClick();
    const content = logs.map((l) => `[${l.timestamp}] [${l.level}] ${l.message}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aegis-core-console-${new Date().toISOString().slice(0, 10)}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter((l) => {
    if (filterLevel !== 'ALL' && l.level !== filterLevel) return false;
    if (searchLog && !l.message.toLowerCase().includes(searchLog.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Console Top Toolbar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">RCON & Live Terminal</h2>
            <div className="text-[11px] text-slate-400 font-mono">Channel: stdout / Fabric RCON (Port 25575)</div>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchLog}
              onChange={(e) => setSearchLog(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 w-36 sm:w-44 font-mono"
            />
          </div>

          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as any)}
            className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="ALL">ALL LEVELS</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
            <option value="CHAT">CHAT</option>
          </select>

          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1.5 rounded-xl border text-xs transition-colors cursor-pointer ${
              autoScroll
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}
            title={autoScroll ? 'Auto-scroll is Active' : 'Auto-scroll is Paused'}
          >
            <ArrowDown className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleDownloadLogs}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors cursor-pointer"
            title="Download Log File"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClearLogs();
            }}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
            title="Clear Console View"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div className="glass-panel bg-[#050608]/95 rounded-2xl border border-white/10 p-4 h-[440px] overflow-y-auto custom-scrollbar font-mono text-xs leading-relaxed space-y-1 select-text relative">
        <div className="text-slate-400 pb-2 mb-2 border-b border-white/5 flex items-center justify-between text-[11px]">
          <span>=== Fabric Server Console v0.15.7 Output Stream ===</span>
          <span>Buffer: {filteredLogs.length} lines</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="text-slate-400 text-center py-20">Console buffer is currently clean.</div>
        ) : (
          filteredLogs.map((log) => {
            const isWarn = log.level === 'WARN';
            const isError = log.level === 'ERROR';
            const isSuccess = log.level === 'SUCCESS';
            const isChat = log.level === 'CHAT';

            return (
              <div
                key={log.id}
                className="flex items-start gap-2 hover:bg-white/[0.02] px-1.5 py-0.5 rounded transition-colors"
              >
                <span className="text-slate-400 shrink-0 select-none">[{log.timestamp}]</span>
                <span
                  className={`shrink-0 font-bold px-1 rounded text-[10px] select-none ${
                    isError
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : isWarn
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : isSuccess
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : isChat
                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                      : 'text-slate-400'
                  }`}
                >
                  [{log.level}]
                </span>
                <span
                  className={`flex-1 break-words ${
                    isError
                      ? 'text-red-300 font-bold'
                      : isWarn
                      ? 'text-amber-200'
                      : isSuccess
                      ? 'text-emerald-300 font-semibold'
                      : isChat
                      ? 'text-violet-200 font-medium'
                      : 'text-slate-300'
                  }`}
                >
                  {log.message}
                </span>
              </div>
            );
          })
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Quick Macro Command Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
          <Command className="w-3 h-3" /> Quick Presets:
        </span>
        {quickCommands.map((q) => (
          <button
            key={q.cmd}
            type="button"
            disabled={!canSend}
            onClick={() => {
              sound.playClick();
              onSendCommand(q.cmd);
            }}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 text-[11px] font-mono text-emerald-300 hover:text-white transition-colors cursor-pointer shrink-0 disabled:opacity-40"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Command Dispatcher Input */}
      <div className="glass-panel rounded-2xl p-2.5 flex items-center gap-2">
        <span className="text-emerald-400 font-mono text-sm pl-2 select-none font-bold">&gt;</span>
        <input
          type="text"
          placeholder={canSend ? 'Type a command or chat broadcast (e.g. say Hello, op player, save-all)...' : 'Viewing mode (Permissions required to dispatch commands)'}
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!canSend}
          className="flex-1 bg-transparent border-none text-xs sm:text-sm font-mono text-white placeholder-slate-400 focus:outline-none"
        />

        <button
          id="send-console-cmd-btn"
          type="button"
          disabled={!canSend || !commandInput.trim()}
          onClick={handleSend}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5 fill-black" />
        </button>
      </div>
    </div>
  );
};
