import React, { useState } from 'react';
import {
  Flame,
  Shield,
  Activity,
  Users,
  Lock,
  Clock,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { ServerEventItem, AuditLogItem, UserRole } from '../types';
import { sound } from '../utils/sound';

interface EventsAuditViewProps {
  events: ServerEventItem[];
  auditLogs: AuditLogItem[];
  userRole: UserRole;
}

export const EventsAuditView: React.FC<EventsAuditViewProps> = ({
  events,
  auditLogs
}) => {
  const [activeTab, setActiveTab] = useState<'events' | 'audit'>('events');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.detail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAudit = auditLogs.filter((a) =>
    a.admin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.target.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Events Timeline & Security Audit</h2>
            <p className="text-xs text-slate-400">Immutable ledger of server events and operator commands</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setActiveTab('events');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'events' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Server Events
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setActiveTab('audit');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'audit' ? 'bg-emerald-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Security Audit Log
            </button>
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={`Search ${activeTab === 'events' ? 'server events' : 'operator audit logs'}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
        />
      </div>

      {/* Content Stream */}
      {activeTab === 'events' ? (
        <div className="glass-panel rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Server Events Timeline ({filteredEvents.length})
          </h3>

          <div className="space-y-2.5">
            {filteredEvents.map((evt) => {
              const isError = evt.severity === 'error';
              const isWarning = evt.severity === 'warning';
              const isSuccess = evt.severity === 'success';

              return (
                <div
                  key={evt.id}
                  className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3 hover:border-white/10 transition-all"
                >
                  <div
                    className={`p-2 rounded-xl border shrink-0 mt-0.5 ${
                      isError
                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                        : isWarning
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : isSuccess
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-white/5 border-white/10 text-sky-400'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{evt.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">[{evt.timestamp}]</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{evt.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Operator Action Ledger ({filteredAudit.length})
          </h3>

          <div className="space-y-2.5">
            {filteredAudit.map((audit) => (
              <div
                key={audit.id}
                className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-4 hover:border-white/10 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold shrink-0">
                    {audit.admin[0]}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-300">{audit.admin}</span>
                      <span className="text-slate-400 text-xs">executed</span>
                      <span className="px-2 py-0.5 rounded bg-white/5 text-white font-mono text-[11px] font-bold">
                        {audit.action}
                      </span>
                      {audit.target && (
                        <>
                          <span className="text-slate-400 text-xs">on</span>
                          <span className="text-white text-xs font-semibold">{audit.target}</span>
                        </>
                      )}
                    </div>
                    {audit.details && (
                      <p className="text-[11px] text-slate-400 mt-0.5">{audit.details}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {audit.result}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">[{audit.timestamp}]</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
