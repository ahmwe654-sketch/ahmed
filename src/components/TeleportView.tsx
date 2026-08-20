import React, { useState } from 'react';
import {
  Navigation,
  Compass,
  Users,
  MapPin,
  Plus,
  Trash2,
  Send,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Player, CustomWaypoint, UserRole } from '../types';
import { sound } from '../utils/sound';

interface TeleportViewProps {
  players: Player[];
  waypoints: CustomWaypoint[];
  userRole: UserRole;
  onTeleport: (options: { target: string; destination?: string; coords?: { x: number; y: number; z: number }; dimension?: string }) => void;
  onCreateWaypoint: (data: { name: string; world: string; x: number; y: number; z: number }) => void;
  onDeleteWaypoint: (id: string) => void;
}

export const TeleportView: React.FC<TeleportViewProps> = ({
  players,
  waypoints,
  userRole,
  onTeleport,
  onCreateWaypoint,
  onDeleteWaypoint
}) => {
  // Player to Player state
  const [sourcePlayer, setSourcePlayer] = useState(players[0]?.username || '');
  const [destPlayer, setDestPlayer] = useState(players[1]?.username || players[0]?.username || '');

  // Custom Coords state
  const [coordTarget, setCoordTarget] = useState(players[0]?.username || '');
  const [coordX, setCoordX] = useState('0');
  const [coordY, setCoordY] = useState('64');
  const [coordZ, setCoordZ] = useState('0');
  const [coordDimension, setCoordDimension] = useState('Overworld');

  // New Waypoint state
  const [newWpName, setNewWpName] = useState('');
  const [newWpWorld, setNewWpWorld] = useState('Overworld');
  const [newWpX, setNewWpX] = useState('100');
  const [newWpY, setNewWpY] = useState('64');
  const [newWpZ, setNewWpZ] = useState('-200');

  const canTeleport = userRole === 'owner' || userRole === 'admin' || userRole === 'moderator';

  const quickLocations = [
    { name: 'World Spawn', world: 'Overworld', x: 0, y: 72, z: 0 },
    { name: 'Shopping District', world: 'Overworld', x: 420, y: 68, z: -150 },
    { name: 'Nether Hub', world: 'The Nether', x: 0, y: 120, z: 0 },
    { name: 'End Dragon Arena', world: 'The End', x: 0, y: 65, z: 0 },
    { name: 'Stronghold Portal', world: 'Overworld', x: 1280, y: 34, z: -890 }
  ];

  const handlePlayerToPlayer = () => {
    if (!sourcePlayer || !destPlayer) return;
    sound.playSuccess();
    onTeleport({ target: sourcePlayer, destination: destPlayer });
  };

  const handlePlayerToCoords = () => {
    if (!coordTarget) return;
    const x = parseFloat(coordX) || 0;
    const y = parseFloat(coordY) || 64;
    const z = parseFloat(coordZ) || 0;
    sound.playSuccess();
    onTeleport({ target: coordTarget, coords: { x, y, z }, dimension: coordDimension });
  };

  const handleAddWaypoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWpName.trim()) return;
    sound.playClick();
    onCreateWaypoint({
      name: newWpName.trim(),
      world: newWpWorld,
      x: parseFloat(newWpX) || 0,
      y: parseFloat(newWpY) || 64,
      z: parseFloat(newWpZ) || 0
    });
    setNewWpName('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="glass-panel rounded-2xl p-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Navigation className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">Teleportation & Spatial Grid</h2>
          <p className="text-xs text-slate-400">Instant vector-based coordinate teleportation across dimensions</p>
        </div>
      </div>

      {/* Grid: Player to Player + Coords */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Player to Player Card */}
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/8 pb-3">
            <Users className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Player to Player Teleport
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Source Player (Who to Teleport)</label>
              <select
                value={sourcePlayer}
                onChange={(e) => setSourcePlayer(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
              >
                {players.map((p) => (
                  <option key={p.uuid} value={p.username}>
                    {p.username} ({p.dimension})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-center my-1">
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Destination Player (Target Location)</label>
              <select
                value={destPlayer}
                onChange={(e) => setDestPlayer(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
              >
                {players.map((p) => (
                  <option key={p.uuid} value={p.username}>
                    {p.username} ({p.dimension})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              disabled={!canTeleport || !sourcePlayer || !destPlayer}
              onClick={handlePlayerToPlayer}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <span>Execute Player Teleport</span>
              <Send className="w-3.5 h-3.5 fill-black" />
            </button>
          </div>
        </div>

        {/* Player to Exact Coordinates */}
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/8 pb-3">
            <Compass className="w-4 h-4 text-violet-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Teleport to Coordinates
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Target Player</label>
              <select
                value={coordTarget}
                onChange={(e) => setCoordTarget(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
              >
                {players.map((p) => (
                  <option key={p.uuid} value={p.username}>
                    {p.username}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">X Coord</label>
                <input
                  type="text"
                  value={coordX}
                  onChange={(e) => setCoordX(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Y Coord (Height)</label>
                <input
                  type="text"
                  value={coordY}
                  onChange={(e) => setCoordY(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Z Coord</label>
                <input
                  type="text"
                  value={coordZ}
                  onChange={(e) => setCoordZ(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Dimension</label>
              <select
                value={coordDimension}
                onChange={(e) => setCoordDimension(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
              >
                <option value="Overworld">Overworld (minecraft:overworld)</option>
                <option value="The Nether">The Nether (minecraft:the_nether)</option>
                <option value="The End">The End (minecraft:the_end)</option>
              </select>
            </div>

            <button
              type="button"
              disabled={!canTeleport || !coordTarget}
              onClick={handlePlayerToCoords}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <span>Dispatch Coordinates</span>
              <Compass className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Server Waypoints & Custom Waypoint Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Quick Landmarks */}
        <div className="glass-panel rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-white/8 pb-3">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Quick World Landmarks
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {quickLocations.map((loc) => (
              <button
                key={loc.name}
                type="button"
                disabled={!canTeleport || players.length === 0}
                onClick={() => {
                  sound.playSuccess();
                  onTeleport({
                    target: players[0]?.username || 'Player',
                    coords: { x: loc.x, y: loc.y, z: loc.z },
                    dimension: loc.world
                  });
                }}
                className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/6 hover:border-emerald-500/30 text-left transition-all cursor-pointer group disabled:opacity-40"
              >
                <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-300">{loc.name}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {loc.x}, {loc.y}, {loc.z} • {loc.world}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Waypoints Creator */}
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/8 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Custom Waypoints ({waypoints.length})
              </h3>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleAddWaypoint} className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Waypoint Name..."
                value={newWpName}
                onChange={(e) => setNewWpName(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
              <select
                value={newWpWorld}
                onChange={(e) => setNewWpWorld(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
              >
                <option value="Overworld">Overworld</option>
                <option value="The Nether">The Nether</option>
                <option value="The End">The End</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="X"
                value={newWpX}
                onChange={(e) => setNewWpX(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 font-mono text-xs text-white"
              />
              <input
                type="text"
                placeholder="Y"
                value={newWpY}
                onChange={(e) => setNewWpY(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 font-mono text-xs text-white"
              />
              <input
                type="text"
                placeholder="Z"
                value={newWpZ}
                onChange={(e) => setNewWpZ(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 font-mono text-xs text-white"
              />
            </div>

            <button
              type="submit"
              disabled={!newWpName.trim()}
              className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Custom Waypoint</span>
            </button>
          </form>

          {/* List */}
          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
            {waypoints.map((wp) => (
              <div
                key={wp.id}
                className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between gap-2"
              >
                <div>
                  <span className="text-xs font-bold text-slate-200">{wp.name}</span>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {wp.x}, {wp.y}, {wp.z} ({wp.world})
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playSuccess();
                      onTeleport({
                        target: players[0]?.username || 'Player',
                        coords: { x: wp.x, y: wp.y, z: wp.z },
                        dimension: wp.world
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[11px] font-bold hover:bg-emerald-500/30 cursor-pointer"
                  >
                    TP
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      onDeleteWaypoint(wp.id);
                    }}
                    className="p-1 rounded-lg text-slate-500 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
