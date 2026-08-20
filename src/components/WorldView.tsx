import React, { useState } from 'react';
import {
  Globe,
  Sun,
  Moon,
  CloudRain,
  CloudLightning,
  Sparkles,
  Shield,
  Clock,
  Compass,
  AlertTriangle,
  Sliders
} from 'lucide-react';
import { WorldSettings, UserRole } from '../types';
import { sound } from '../utils/sound';

interface WorldViewProps {
  world: WorldSettings | null;
  userRole: UserRole;
  onSetTime: (ticksOrPreset: number | string) => void;
  onSetWeather: (weather: 'clear' | 'rain' | 'thunder') => void;
  onSetGamerule: (rule: string, value: any) => void;
  onSetSeed: (seed: string) => void;
  onSaveWorld: () => void;
}

export const WorldView: React.FC<WorldViewProps> = ({
  world,
  userRole,
  onSetTime,
  onSetWeather,
  onSetGamerule,
  onSetSeed,
}) => {
  const [timeSlider, setTimeSlider] = useState(world?.timeTicks || 6000);
  const [activeDimension, setActiveDimension] = useState<'Overworld' | 'The Nether' | 'The End'>('Overworld');
  const [seedInput, setSeedInput] = useState(world?.seed || '-839104829104829104');
  const [showSeedWarning, setShowSeedWarning] = useState(false);

  const canControl = userRole === 'owner' || userRole === 'admin';

  const timePresets = [
    { label: 'Day (1000)', ticks: 1000, icon: Sun, color: 'text-amber-400' },
    { label: 'Noon (6000)', ticks: 6000, icon: Sun, color: 'text-yellow-400' },
    { label: 'Sunset (12000)', ticks: 12000, icon: Moon, color: 'text-orange-400' },
    { label: 'Midnight (18000)', ticks: 18000, icon: Moon, color: 'text-indigo-400' }
  ];

  const gamerulesList = [
    { key: 'keepInventory', label: 'Keep Inventory', desc: 'Players retain gear and items upon death' },
    { key: 'mobGriefing', label: 'Mob Griefing', desc: 'Allow Creepers and Endermen to destroy terrain' },
    { key: 'doDaylightCycle', label: 'Daylight Cycle', desc: 'Sun and moon progress with in-game time' },
    { key: 'doWeatherCycle', label: 'Weather Cycle', desc: 'Dynamic rain and thunderstorm occurrences' },
    { key: 'doMobSpawning', label: 'Mob Spawning', desc: 'Natural hostile and passive entity spawning' },
    { key: 'doFireTick', label: 'Fire Spread', desc: 'Fire propagates across flammable wooden blocks' },
    { key: 'naturalRegeneration', label: 'Natural Health Regen', desc: 'Regenerate hearts when food hunger bar is full' },
    { key: 'fallDamage', label: 'Fall Damage', desc: 'Inflict damage when falling from high altitudes' },
    { key: 'pvp', label: 'Player vs Player (PvP)', desc: 'Allow combat and damage between players' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Dimension Switcher Header */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">World & Climate Manager</h2>
            <p className="text-xs text-slate-400">
              World Name: <span className="font-semibold text-emerald-300">{world?.name || 'world'}</span> • Size: {world?.sizeMB || 4120} MB
            </p>
          </div>
        </div>

        {/* Dimension Pills */}
        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/8">
          {(['Overworld', 'The Nether', 'The End'] as const).map((dim) => (
            <button
              key={dim}
              type="button"
              onClick={() => {
                sound.playClick();
                setActiveDimension(dim);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeDimension === dim
                  ? dim === 'Overworld'
                    ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : dim === 'The Nether'
                    ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                    : 'bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {dim}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Time & Weather Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Time of Day Card */}
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/8 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Time of Day Control
              </h3>
            </div>
            <span className="text-xs font-mono text-amber-300 font-bold">{timeSlider} Ticks</span>
          </div>

          {/* Quick Presets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {timePresets.map((preset) => {
              const Icon = preset.icon;
              return (
                <button
                  key={preset.label}
                  type="button"
                  disabled={!canControl}
                  onClick={() => {
                    sound.playClick();
                    setTimeSlider(preset.ticks);
                    onSetTime(preset.ticks);
                  }}
                  className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/6 hover:border-amber-500/30 flex flex-col items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
                >
                  <Icon className={`w-4 h-4 ${preset.color}`} />
                  <span className="text-[11px] font-semibold text-slate-300">{preset.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Custom Time Slider */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>0 (Sunrise)</span>
              <span>6000 (Noon)</span>
              <span>12000 (Dusk)</span>
              <span>18000 (Night)</span>
              <span>24000</span>
            </div>
            <input
              type="range"
              min="0"
              max="24000"
              step="500"
              value={timeSlider}
              disabled={!canControl}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setTimeSlider(val);
                onSetTime(val);
              }}
              className="w-full accent-amber-400 bg-black/40 h-2 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Weather Simulator Card */}
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/8 pb-3">
            <div className="flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Weather & Atmosphere
              </h3>
            </div>
            <span className="text-xs font-mono text-sky-300 uppercase font-bold">
              Current: {world?.weather || 'Clear'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              disabled={!canControl}
              onClick={() => {
                sound.playClick();
                onSetWeather('clear');
              }}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer disabled:opacity-40 ${
                world?.weather === 'clear'
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                  : 'bg-white/[0.03] border-white/6 text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="w-6 h-6 text-amber-400" />
              <span className="text-xs font-bold">Clear Skies</span>
            </button>

            <button
              type="button"
              disabled={!canControl}
              onClick={() => {
                sound.playClick();
                onSetWeather('rain');
              }}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer disabled:opacity-40 ${
                world?.weather === 'rain'
                  ? 'bg-sky-500/15 border-sky-500/50 text-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
                  : 'bg-white/[0.03] border-white/6 text-slate-400 hover:text-white'
              }`}
            >
              <CloudRain className="w-6 h-6 text-sky-400" />
              <span className="text-xs font-bold">Downpour</span>
            </button>

            <button
              type="button"
              disabled={!canControl}
              onClick={() => {
                sound.playClick();
                onSetWeather('thunder');
              }}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer disabled:opacity-40 ${
                world?.weather === 'thunder'
                  ? 'bg-violet-500/15 border-violet-500/50 text-violet-300 shadow-[0_0_20px_rgba(139,92,246,0.25)]'
                  : 'bg-white/[0.03] border-white/6 text-slate-400 hover:text-white'
              }`}
            >
              <CloudLightning className="w-6 h-6 text-violet-400" />
              <span className="text-xs font-bold">Thunderstorm</span>
            </button>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Weather states instantly dispatch packets to all connected clients.</span>
          </div>
        </div>
      </div>

      {/* World Gamerules Grid */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/8 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Minecraft Java Gamerules Matrix
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">9 Core Gamerules</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {gamerulesList.map((rule) => {
            const isEnabled = (world?.gamerules as any)?.[rule.key] ?? false;

            return (
              <div
                key={rule.key}
                className="p-3.5 rounded-xl bg-white/[0.02] border border-white/6 flex items-start justify-between gap-3 hover:border-white/12 transition-all"
              >
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-200">{rule.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{rule.desc}</div>
                </div>

                <button
                  type="button"
                  disabled={!canControl}
                  onClick={() => {
                    sound.playClick();
                    onSetGamerule(rule.key, !isEnabled);
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 disabled:opacity-40 ${
                    isEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      isEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* World Seed Inspector */}
      <div className="glass-panel rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 border-b border-white/8 pb-3">
          <Compass className="w-4 h-4 text-violet-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            World Seed & Generation Inspector
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <input
              type="text"
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              disabled={!canControl}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <button
            type="button"
            disabled={!canControl}
            onClick={() => setShowSeedWarning(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] cursor-pointer disabled:opacity-40"
          >
            Update Seed
          </button>
        </div>

        {showSeedWarning && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
            <div className="flex-1">
              <span className="font-bold">Caution: </span>
              Changing the world seed will only affect newly generated chunks. Existing terrain will not be regenerated.
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSetSeed(seedInput);
                    setShowSeedWarning(false);
                  }}
                  className="px-3 py-1 bg-amber-500 text-black font-bold rounded-lg cursor-pointer"
                >
                  Confirm & Apply
                </button>
                <button
                  type="button"
                  onClick={() => setShowSeedWarning(false)}
                  className="px-3 py-1 bg-white/10 text-slate-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
