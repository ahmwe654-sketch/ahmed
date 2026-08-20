import React, { useState } from 'react';
import {
  Users,
  Search,
  Shield,
  Heart,
  Utensils,
  Wifi,
  Sparkles,
  UserPlus,
  Compass,
  Sword,
  X,
  RefreshCw,
  Plus
} from 'lucide-react';
import { Player, UserRole, PlayerInventoryItem } from '../types';
import { sound } from '../utils/sound';

interface PlayersViewProps {
  players: Player[];
  userRole: UserRole;
  onRefresh: () => void;
  onPlayerAction: (action: string, username: string, payload?: any) => void;
  onAddPlayer: (username: string) => void;
  onTeleportTo: (target: string) => void;
}

export const PlayersView: React.FC<PlayersViewProps> = ({
  players,
  userRole,
  onRefresh,
  onPlayerAction,
  onAddPlayer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'online' | 'op'>('all');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const canModerate = userRole === 'owner' || userRole === 'admin' || userRole === 'moderator';

  // Filter players
  const filteredPlayers = players.filter((p) => {
    const matchesSearch = p.username.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (filterMode === 'online') return p.online;
    if (filterMode === 'op') return p.isOp;
    return true;
  });

  const renderSlot = (item: PlayerInventoryItem | null, index: number, label?: string) => {
    return (
      <div
        key={index}
        className="relative w-12 h-12 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center group hover:border-emerald-500/50 transition-all p-1"
        title={item ? `${item.name} x${item.count}${item.enchantments ? `\nEnchants: ${item.enchantments.join(', ')}` : ''}` : label || 'Empty Slot'}
      >
        {item ? (
          <>
            <div className="text-[11px] font-bold text-center text-slate-200 line-clamp-2 leading-tight">
              {item.name.replace(/_/g, ' ')}
            </div>
            {item.count > 1 && (
              <span className="absolute bottom-0.5 right-1 text-[10px] font-mono font-extrabold text-emerald-400 bg-black/70 px-1 rounded">
                {item.count}
              </span>
            )}
          </>
        ) : (
          <span className="text-[9px] text-slate-400 select-none uppercase font-mono">
            {label || '—'}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Filter Bar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search players by username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            {(['all', 'online', 'op'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setFilterMode(mode);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                  filterMode === mode ? 'bg-emerald-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onRefresh();
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors cursor-pointer"
            title="Refresh Player List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {canModerate && (
            <button
              id="add-player-btn"
              type="button"
              onClick={() => {
                sound.playClick();
                setShowAddModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Player</span>
            </button>
          )}
        </div>
      </div>

      {/* Players Cards Grid */}
      {filteredPlayers.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-400">
          <Users className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-300">No Players Found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or add a player.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlayers.map((player) => {
            const isOnline = player.online;

            return (
              <div
                key={player.uuid}
                className="glass-card rounded-2xl p-5 flex flex-col justify-between gap-4 border border-white/6 hover:border-white/15 transition-all group"
              >
                {/* Header: Avatar, Name, OP Badge, Ping */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {/* Minecraft Avatar (Crafatar Head fallback) */}
                    <div className="relative w-11 h-11 rounded-xl bg-slate-800 border border-white/10 overflow-hidden shrink-0 shadow-lg">
                      <img
                        src={`https://mc-heads.net/avatar/${player.username}/44`}
                        alt={player.username}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://mc-heads.net/avatar/Steve/44';
                        }}
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0d0f14] ${
                          isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-sm">{player.username}</span>
                        {player.isOp && (
                          <span
                            title="Server Operator"
                            className="p-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          >
                            <Shield className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 capitalize">{player.gamemode} Mode</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                    <Wifi className={`w-3 h-3 ${player.ping < 50 ? 'text-emerald-400' : 'text-amber-400'}`} />
                    <span>{player.ping}ms</span>
                  </div>
                </div>

                {/* Health & Food Bars */}
                <div className="space-y-1.5 bg-black/20 p-2.5 rounded-xl border border-white/4">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 text-red-400 font-semibold">
                      <Heart className="w-3 h-3 fill-red-400/30" /> HP
                    </span>
                    <span className="font-mono text-slate-300">{player.health}/20</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${(player.health / 20) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="flex items-center gap-1 text-amber-400 font-semibold">
                      <Utensils className="w-3 h-3" /> Food
                    </span>
                    <span className="font-mono text-slate-300">{player.food}/20</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${(player.food / 20) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Coordinates & Dimension */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 bg-white/[0.02] p-2 rounded-lg border border-white/4 font-mono">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Compass className="w-3 h-3 text-emerald-400" />
                    {player.x.toFixed(0)}, {player.y.toFixed(0)}, {player.z.toFixed(0)}
                  </span>
                  <span className="text-violet-300 font-semibold">{player.dimension}</span>
                </div>

                {/* Card Action Footer */}
                <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setSelectedPlayer(player);
                    }}
                    className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>View Gear & Details</span>
                  </button>

                  {canModerate && (
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        onPlayerAction(player.isOp ? 'deop' : 'op', player.username);
                      }}
                      className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                        player.isOp
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                      title={player.isOp ? 'Revoke OP Permission' : 'Grant Operator (OP)'}
                    >
                      <Shield className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Player Details & Minecraft Inventory Inspector Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedPlayer(null)} />

          <div className="relative z-10 w-full max-w-2xl bg-[#0d1017]/95 border border-white/12 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-4 border-b border-white/8">
              <div className="flex items-center gap-3">
                <img
                  src={`https://mc-heads.net/avatar/${selectedPlayer.username}/48`}
                  alt={selectedPlayer.username}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-xl border border-white/15"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{selectedPlayer.username}</h3>
                    {selectedPlayer.isOp && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                        OPERATOR
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">UUID: {selectedPlayer.uuid}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPlayer(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Operator Actions Bar */}
            {canModerate && (
              <div className="my-5 p-3 rounded-2xl bg-white/[0.02] border border-white/6 flex items-center gap-2 flex-wrap text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                  Actions:
                </span>

                <button
                  type="button"
                  onClick={() => onPlayerAction('heal', selectedPlayer.username)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-semibold cursor-pointer"
                >
                  Heal & Feed
                </button>

                <button
                  type="button"
                  onClick={() => onPlayerAction('gamemode', selectedPlayer.username, { gamemode: 'creative' })}
                  className="px-3 py-1.5 rounded-lg bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 text-violet-300 font-semibold cursor-pointer"
                >
                  Set Creative
                </button>

                <button
                  type="button"
                  onClick={() => onPlayerAction('gamemode', selectedPlayer.username, { gamemode: 'survival' })}
                  className="px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 font-semibold cursor-pointer"
                >
                  Set Survival
                </button>

                <button
                  type="button"
                  onClick={() => onPlayerAction('clear_inventory', selectedPlayer.username)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold cursor-pointer"
                >
                  Clear Gear
                </button>

                <button
                  type="button"
                  onClick={() => onPlayerAction('kill', selectedPlayer.username)}
                  className="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 font-semibold cursor-pointer"
                >
                  Kill
                </button>

                <button
                  type="button"
                  onClick={() => onPlayerAction('kick', selectedPlayer.username, { reason: 'Kicked by Administrator' })}
                  className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-semibold cursor-pointer"
                >
                  Kick
                </button>
              </div>
            )}

            {/* Minecraft Inventory Slots Matrix */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Sword className="w-3.5 h-3.5 text-emerald-400" />
                  Live Armor & Inventory Matrix
                </h4>
                <span className="text-[10px] text-slate-400">Slots: 36 + Armor + Offhand</span>
              </div>

              {/* Armor & Offhand Row */}
              <div className="p-3 rounded-2xl bg-black/30 border border-white/6 flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 w-16">
                  Armor:
                </span>
                <div className="flex items-center gap-2">
                  {renderSlot(selectedPlayer.inventory?.armor?.helmet || null, 101, 'Helmet')}
                  {renderSlot(selectedPlayer.inventory?.armor?.chestplate || null, 102, 'Chest')}
                  {renderSlot(selectedPlayer.inventory?.armor?.leggings || null, 103, 'Legs')}
                  {renderSlot(selectedPlayer.inventory?.armor?.boots || null, 104, 'Boots')}
                </div>
                <div className="h-8 w-px bg-white/10 mx-2" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Offhand:
                </span>
                {renderSlot(selectedPlayer.inventory?.offhand || null, 105, 'Offhand')}
              </div>

              {/* Main 27 Inventory Slots */}
              <div className="p-3.5 rounded-2xl bg-black/30 border border-white/6 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Main Storage (27 Slots)
                </span>
                <div className="grid grid-cols-9 gap-1.5">
                  {Array.from({ length: 27 }).map((_, idx) => {
                    const item = selectedPlayer.inventory?.main?.[idx] || null;
                    return renderSlot(item, idx);
                  })}
                </div>
              </div>

              {/* Hotbar (9 Slots) */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                  Quick Hotbar (9 Slots)
                </span>
                <div className="grid grid-cols-9 gap-1.5">
                  {Array.from({ length: 9 }).map((_, idx) => {
                    const item = selectedPlayer.inventory?.hotbar?.[idx] || null;
                    return renderSlot(item, idx + 200);
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Player Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowAddModal(false)} />
          <div className="relative z-10 w-full max-w-sm bg-[#0d1017] border border-white/12 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Register New Player</h3>
            <p className="text-xs text-slate-400 mb-4">Enter Minecraft Java username to add to database.</p>

            <input
              type="text"
              placeholder="e.g. Notch, Alex, Technoblade"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 mb-4 focus:outline-none focus:border-emerald-500/50"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (newPlayerName.trim()) {
                    onAddPlayer(newPlayerName.trim());
                    setNewPlayerName('');
                    setShowAddModal(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Player</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
