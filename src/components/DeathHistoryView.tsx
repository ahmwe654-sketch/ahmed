import React, { useState } from 'react';
import {
  Skull,
  Navigation,
  Compass,
  Search,
  Clock,
  ExternalLink
} from 'lucide-react';
import { DeathRecord, UserRole } from '../types';
import { sound } from '../utils/sound';

interface DeathHistoryViewProps {
  deaths: DeathRecord[];
  userRole: UserRole;
  onTeleportToDeath: (coords: { x: number; y: number; z: number; dimension: string }) => void;
}

export const DeathHistoryView: React.FC<DeathHistoryViewProps> = ({
  deaths,
  userRole,
  onTeleportToDeath
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const canTeleport = userRole === 'owner' || userRole === 'admin' || userRole === 'moderator';

  const filteredDeaths = deaths.filter(
    (d) =>
      d.player.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.cause.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.world.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
            <Skull className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Player Death Registry & Graves</h2>
            <p className="text-xs text-slate-400">Track player demise locations with one-click coordinate recovery</p>
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search deaths..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50 w-48"
          />
        </div>
      </div>

      {/* Deaths List */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Recorded Demises ({filteredDeaths.length})
        </h3>

        {filteredDeaths.length === 0 ? (
          <div className="text-slate-400 text-center py-12 text-xs">No recorded player deaths.</div>
        ) : (
          <div className="space-y-3">
            {filteredDeaths.map((d) => (
              <div
                key={d.id}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/6 hover:border-red-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={`https://mc-heads.net/avatar/${d.player}/40`}
                    alt={d.player}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-xl border border-white/10 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://mc-heads.net/avatar/Steve/40';
                    }}
                  />

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{d.player}</span>
                      <span className="text-xs text-red-300 font-medium">{d.cause}</span>
                    </div>

                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap font-mono">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Compass className="w-3 h-3 text-red-400" />
                        {d.x}, {d.y}, {d.z}
                      </span>
                      <span>•</span>
                      <span className="text-violet-300">{d.world || d.dimension || 'Overworld'}</span>
                      <span>•</span>
                      <span className="text-slate-400">[{d.timestamp}]</span>
                    </div>
                  </div>
                </div>

                {canTeleport && (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playSuccess();
                      onTeleportToDeath({
                        x: d.x,
                        y: d.y,
                        z: d.z,
                        dimension: d.world || d.dimension || 'Overworld'
                      });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>TP to Death Site</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
