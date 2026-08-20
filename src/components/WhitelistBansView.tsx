import React, { useState } from 'react';
import {
  ShieldCheck,
  Ban,
  Plus,
  Trash2,
  Lock,
  Unlock,
  UserX,
  Search,
  CheckCircle2
} from 'lucide-react';
import { WhitelistEntry, BanEntry, UserRole } from '../types';
import { sound } from '../utils/sound';

interface WhitelistBansViewProps {
  whitelist: { enabled: boolean; players: WhitelistEntry[] };
  bans: BanEntry[];
  userRole: UserRole;
  onToggleWhitelist: () => void;
  onAddWhitelist: (username: string) => void;
  onRemoveWhitelist: (username: string) => void;
  onUnban: (username: string) => void;
}

export const WhitelistBansView: React.FC<WhitelistBansViewProps> = ({
  whitelist,
  bans,
  userRole,
  onToggleWhitelist,
  onAddWhitelist,
  onRemoveWhitelist,
  onUnban
}) => {
  const [activeTab, setActiveTab] = useState<'whitelist' | 'bans'>('whitelist');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const canManage = userRole === 'owner' || userRole === 'admin';

  const handleAddWhitelistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    sound.playSuccess();
    onAddWhitelist(newPlayerName.trim());
    setNewPlayerName('');
  };

  const filteredWhitelist = whitelist.players.filter((p) =>
    p.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBans = bans.filter(
    (b) =>
      b.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Access Control & Security Rules</h2>
            <p className="text-xs text-slate-400">Manage server entrance whitelist permissions and punitive bans</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setActiveTab('whitelist');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'whitelist' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Whitelist ({whitelist.players.length})
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setActiveTab('bans');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'bans' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Ban List ({bans.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'whitelist' ? (
        <div className="space-y-5">
          {/* Whitelist Toggle Banner */}
          <div className="glass-panel rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  whitelist.enabled
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                {whitelist.enabled ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Server Whitelist Status: {whitelist.enabled ? 'Active (Strict Access)' : 'Disabled (Open Access)'}
                </h3>
                <p className="text-xs text-slate-400">
                  {whitelist.enabled
                    ? 'Only explicitly added players can join the Fabric server.'
                    : 'Any player with a valid Minecraft Java account can join.'}
                </p>
              </div>
            </div>

            {canManage && (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onToggleWhitelist();
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  whitelist.enabled
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                }`}
              >
                {whitelist.enabled ? 'Disable Whitelist' : 'Enable Whitelist'}
              </button>
            )}
          </div>

          {/* Add to Whitelist Form */}
          {canManage && (
            <form onSubmit={handleAddWhitelistSubmit} className="glass-panel rounded-2xl p-4 flex gap-3">
              <input
                type="text"
                placeholder="Enter player Minecraft username..."
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
              />
              <button
                type="submit"
                disabled={!newPlayerName.trim()}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
                <span>Add to Whitelist</span>
              </button>
            </form>
          )}

          {/* Whitelist Table */}
          <div className="glass-panel rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Authorized Players ({filteredWhitelist.length})
            </h3>

            <div className="space-y-2">
              {filteredWhitelist.map((w) => (
                <div
                  key={w.uuid || w.username}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3 hover:border-white/10 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://mc-heads.net/avatar/${w.username}/36`}
                      alt={w.username}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-lg border border-white/10"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://mc-heads.net/avatar/Steve/36';
                      }}
                    />
                    <div>
                      <span className="text-xs font-bold text-white">{w.username}</span>
                      <div className="text-[10px] text-slate-400 font-mono">Added: {w.addedAt}</div>
                    </div>
                  </div>

                  {canManage && (
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        onRemoveWhitelist(w.username);
                      }}
                      className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/5 cursor-pointer"
                      title="Remove from Whitelist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Banned Players Ledger ({filteredBans.length})
          </h3>

          {filteredBans.length === 0 ? (
            <div className="text-slate-400 text-center py-12 text-xs">No active player bans.</div>
          ) : (
            <div className="space-y-3">
              {filteredBans.map((ban) => (
                <div
                  key={ban.username}
                  className="p-4 rounded-xl bg-red-950/20 border border-red-500/20 flex items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={`https://mc-heads.net/avatar/${ban.username}/40`}
                      alt={ban.username}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-xl border border-red-500/30 shrink-0"
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{ban.username}</span>
                        <span className="px-2 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-red-300 text-[10px] font-bold">
                          BANNED
                        </span>
                      </div>
                      <p className="text-xs text-red-200/90 mt-0.5">Reason: {ban.reason}</p>
                      <div className="text-[10px] text-slate-400 mt-1 font-mono">
                        Banned by: {ban.bannedBy} on {ban.date}
                      </div>
                    </div>
                  </div>

                  {canManage && (
                    <button
                      type="button"
                      onClick={() => {
                        sound.playSuccess();
                        onUnban(ban.username);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-300 text-xs font-bold transition-all cursor-pointer"
                    >
                      Pardon & Unban
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
