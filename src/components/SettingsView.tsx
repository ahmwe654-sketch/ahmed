import React, { useState } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Eye,
  Layers,
  Sparkles,
  Server,
  Globe,
  Swords,
  Wifi,
  Lock,
  Cpu,
  AlertTriangle,
  RotateCcw,
  Palette,
  Hash
} from 'lucide-react';
import { UserRole, Language } from '../types';
import { getTranslation } from '../utils/i18n';
import { sound } from '../utils/sound';

interface SettingsViewProps {
  userRole: UserRole;
  lang?: Language;
  onSaveSettings: (settings: any) => void;
  onChangeLang?: (lang: Language) => void;
  onToggleLang?: () => void;
  onOpenConnectServer?: () => void;
}

type SettingsTab = 'all' | 'localization' | 'general' | 'gameplay' | 'world' | 'network' | 'security' | 'advanced';

export const SettingsView: React.FC<SettingsViewProps> = ({
  userRole,
  lang = 'en',
  onSaveSettings,
  onChangeLang,
  onToggleLang,
  onOpenConnectServer
}) => {
  const [activeCategory, setActiveCategory] = useState<SettingsTab>('all');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // General Settings
  const [serverName, setServerName] = useState('Aegis Core SMP');
  const [motd, setMotd] = useState('§aAegis Core §8| §fFabric 1.20.4 §7[Survival & Mods]');
  const [mcVersion, setMcVersion] = useState('1.20.4');
  const [fabricVersion, setFabricVersion] = useState('0.15.7');
  const [javaVersion, setJavaVersion] = useState('Java 21 OpenJDK (64-Bit)');
  const [serverAddress, setServerAddress] = useState('0.0.0.0:25565');

  // Gameplay Settings
  const [difficulty, setDifficulty] = useState<'peaceful' | 'easy' | 'normal' | 'hard'>('normal');
  const [gamemode, setGamemode] = useState<'survival' | 'creative' | 'adventure' | 'spectator'>('survival');
  const [pvp, setPvp] = useState(true);
  const [commandBlocks, setCommandBlocks] = useState(true);
  const [allowFlight, setAllowFlight] = useState(false);
  const [friendlyFire, setFriendlyFire] = useState(true);
  const [keepInventory, setKeepInventory] = useState(false);
  const [hardcore, setHardcore] = useState(false);
  const [spawnProtection, setSpawnProtection] = useState(16);

  // World Settings
  const [worldName, setWorldName] = useState('world');
  const [seed, setSeed] = useState('-849201948201948201');
  const [worldType, setWorldType] = useState('default');
  const [generateStructures, setGenerateStructures] = useState(true);
  const [viewDistance, setViewDistance] = useState(10);
  const [simDistance, setSimDistance] = useState(8);

  // Network Settings
  const [maxPlayers, setMaxPlayers] = useState(40);
  const [serverPort, setServerPort] = useState(25565);
  const [onlineMode, setOnlineMode] = useState(true);
  const [networkCompression, setNetworkCompression] = useState(256);
  const [maxTickTime, setMaxTickTime] = useState(60000);

  // Security Settings
  const [whitelistEnabled, setWhitelistEnabled] = useState(false);
  const [preventProxy, setPreventProxy] = useState(true);
  const [hideOnlinePlayers, setHideOnlinePlayers] = useState(false);
  const [enforceSecureProfile, setEnforceSecureProfile] = useState(true);

  // Advanced & JVM Settings
  const [ramAlloc, setRamAlloc] = useState('8G');
  const [garbageCollector, setGarbageCollector] = useState('G1GC');
  const [jvmFlags, setJvmFlags] = useState('-XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions');
  const [autoRestartOnCrash, setAutoRestartOnCrash] = useState(true);
  const [rconPort, setRconPort] = useState(25575);

  // Danger Confirm Dialog State
  const [dangerModal, setDangerModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  const canEdit = userRole === 'owner' || userRole === 'admin';

  const markDirty = () => {
    if (!hasUnsavedChanges) setHasUnsavedChanges(true);
  };

  const handleApplySave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sound.playSuccess();
    onSaveSettings({
      serverName,
      motd,
      difficulty,
      gamemode,
      pvp,
      commandBlocks,
      allowFlight,
      friendlyFire,
      keepInventory,
      hardcore,
      spawnProtection,
      worldName,
      seed,
      worldType,
      generateStructures,
      viewDistance,
      simDistance,
      maxPlayers,
      serverPort,
      onlineMode,
      networkCompression,
      whitelistEnabled,
      preventProxy,
      hideOnlinePlayers,
      ramAlloc,
      garbageCollector,
      jvmFlags,
      autoRestartOnCrash,
      rconPort
    });
    setHasUnsavedChanges(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    sound.playWarning();
    setDifficulty('normal');
    setGamemode('survival');
    setPvp(true);
    setCommandBlocks(true);
    setAllowFlight(false);
    setFriendlyFire(true);
    setKeepInventory(false);
    setHardcore(false);
    setSpawnProtection(16);
    setViewDistance(10);
    setSimDistance(8);
    setMaxPlayers(40);
    setOnlineMode(true);
    markDirty();
  };

  const handleSelectLanguage = (targetLang: Language) => {
    if (lang === targetLang) return;
    sound.playClick();
    if (onChangeLang) {
      onChangeLang(targetLang);
    } else if (onToggleLang) {
      onToggleLang();
    }
  };

  const renderMotdPreview = (text: string) => {
    // Quick parse for color codes
    const parts = text.split(/(§[0-9a-fk-or])/g);
    let currentColorClass = 'text-white';

    const colorMap: Record<string, string> = {
      '§0': 'text-black',
      '§1': 'text-blue-700',
      '§2': 'text-emerald-600',
      '§3': 'text-cyan-600',
      '§4': 'text-red-600',
      '§5': 'text-purple-600',
      '§6': 'text-amber-500',
      '§7': 'text-slate-400',
      '§8': 'text-slate-600',
      '§9': 'text-blue-400',
      '§a': 'text-emerald-400',
      '§b': 'text-cyan-400',
      '§c': 'text-red-400',
      '§d': 'text-pink-400',
      '§e': 'text-yellow-300',
      '§f': 'text-white',
      '§r': 'text-white'
    };

    return (
      <div className="font-mono text-xs sm:text-sm bg-black/80 p-3.5 rounded-xl border border-white/10 select-none shadow-inner">
        {parts.map((part, i) => {
          if (colorMap[part]) {
            currentColorClass = colorMap[part];
            return null;
          }
          return (
            <span key={i} className={`${currentColorClass} font-semibold transition-colors`}>
              {part}
            </span>
          );
        })}
      </div>
    );
  };

  const categories: { id: SettingsTab; labelKey: string; icon: React.ElementType }[] = [
    { id: 'all', labelKey: 'cat_all', icon: Settings },
    { id: 'localization', labelKey: 'cat_localization', icon: Globe },
    { id: 'general', labelKey: 'cat_general', icon: Server },
    { id: 'gameplay', labelKey: 'cat_gameplay', icon: Swords },
    { id: 'world', labelKey: 'cat_world', icon: Globe },
    { id: 'network', labelKey: 'cat_network', icon: Wifi },
    { id: 'security', labelKey: 'cat_security', icon: Lock },
    { id: 'advanced', labelKey: 'cat_advanced', icon: Cpu }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 select-none pb-12">
      {/* Danger Confirmation Modal */}
      {dangerModal && dangerModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDangerModal(null)} />
          <div className="relative glass-panel-high border-red-500/50 bg-[#0e0b12] rounded-3xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(239,68,68,0.3)] space-y-4 z-10 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">{dangerModal.title}</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{dangerModal.description}</p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDangerModal(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                {getTranslation(lang, 'cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  dangerModal.onConfirm();
                  setDangerModal(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-black text-xs font-bold transition-colors cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.4)]"
              >
                {getTranslation(lang, 'confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)] shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {getTranslation(lang, 'settings_title')}
              </h1>
              {hasUnsavedChanges && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold animate-pulse">
                  {getTranslation(lang, 'settings_unsaved')}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {getTranslation(lang, 'settings_desc')}
            </p>
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2.5 relative z-10 flex-wrap">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{getTranslation(lang, 'settings_defaults')}</span>
            </button>

            <button
              id="apply-settings-btn"
              type="button"
              onClick={handleApplySave}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                hasUnsavedChanges
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_25px_rgba(16,185,129,0.4)] scale-105'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{getTranslation(lang, 'settings_save')}</span>
            </button>
          </div>
        )}
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{getTranslation(lang, 'settings_saved_msg')}</span>
        </div>
      )}

      {/* Category Sub-Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                sound.playClick();
                setActiveCategory(cat.id);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.07] border border-white/5'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{getTranslation(lang, cat.labelKey)}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 0. LANGUAGE & LOCALIZATION SETTINGS PANEL                                 */}
      {/* ========================================================================= */}
      {(activeCategory === 'all' || activeCategory === 'localization') && (
        <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-5 border border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-between border-b border-white/8 pb-3">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-emerald-400" />
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                  {getTranslation(lang, 'lang_section_title')}
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {getTranslation(lang, 'lang_section_desc')}
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold">
              {lang === 'en' ? 'EN • LTR' : 'AR • RTL'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* English (US) Option */}
            <button
              type="button"
              onClick={() => handleSelectLanguage('en')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                lang === 'en'
                  ? 'bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.2)]'
                  : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/8 hover:border-white/15'
              }`}
            >
              <div className="flex items-start justify-between w-full">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🇺🇸</span>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{getTranslation(lang, 'lang_en_title')}</span>
                      {lang === 'en' && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-mono font-bold">
                          {getTranslation(lang, 'lang_active_badge')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {getTranslation(lang, 'lang_en_desc')}
                    </p>
                  </div>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                    lang === 'en'
                      ? 'bg-emerald-500 border-emerald-400 text-black'
                      : 'border-white/20 bg-white/5'
                  }`}
                >
                  {lang === 'en' && <CheckCircle2 className="w-4 h-4" />}
                </div>
              </div>

              <div className="w-full pt-2 border-t border-white/6 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Direction: Left-to-Right (LTR)</span>
                <span className={lang === 'en' ? 'text-emerald-400 font-bold' : ''}>Active</span>
              </div>
            </button>

            {/* Arabic (AR) Option */}
            <button
              type="button"
              onClick={() => handleSelectLanguage('ar')}
              className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                lang === 'ar'
                  ? 'bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.2)]'
                  : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/8 hover:border-white/15'
              }`}
            >
              <div className="flex items-start justify-between w-full">
                <div
                  className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                    lang === 'ar'
                      ? 'bg-emerald-500 border-emerald-400 text-black'
                      : 'border-white/20 bg-white/5'
                  }`}
                >
                  {lang === 'ar' && <CheckCircle2 className="w-4 h-4" />}
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-sm font-bold text-white flex items-center justify-end gap-2">
                      {lang === 'ar' && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-mono font-bold">
                          {getTranslation(lang, 'lang_active_badge')}
                        </span>
                      )}
                      <span>{getTranslation(lang, 'lang_ar_title')}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {getTranslation(lang, 'lang_ar_desc')}
                    </p>
                  </div>
                  <span className="text-2xl">🇸🇦</span>
                </div>
              </div>

              <div className="w-full pt-2 border-t border-white/6 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className={lang === 'ar' ? 'text-emerald-400 font-bold' : ''}>مفعلة</span>
                <span>الاتجاه: من اليمين لليسار (RTL)</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. GENERAL SETTINGS PANEL                                                 */}
      {/* ========================================================================= */}
      {(activeCategory === 'all' || activeCategory === 'general') && (
        <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-white/8 pb-3">
            <div className="flex items-center gap-2.5">
              <Server className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                General Configuration &amp; MOTD Branding
              </h2>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">GENERAL</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
            {/* Server Display Name */}
            <div>
              <label className="block text-slate-400 mb-1.5 font-semibold">Server Realm Name</label>
              <input
                type="text"
                value={serverName}
                onChange={(e) => {
                  setServerName(e.target.value);
                  markDirty();
                }}
                disabled={!canEdit}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-semibold focus:outline-none focus:border-emerald-500/50 disabled:opacity-50"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Visible across the admin control deck</span>
            </div>

            {/* Server Address & Port (Read/Edit) */}
            <div>
              <label className="block text-slate-400 mb-1.5 font-semibold">Host Interface / Binding Address</label>
              <input
                type="text"
                value={serverAddress}
                onChange={(e) => {
                  setServerAddress(e.target.value);
                  markDirty();
                }}
                disabled={!canEdit}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500/50 disabled:opacity-50"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 0.0.0.0 (all network interfaces)</span>
            </div>
          </div>

          {/* MOTD Customizer */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-slate-400 text-xs font-semibold">
                Message of the Day (MOTD String - Supports § Color Codes)
              </label>
              <div className="flex items-center gap-1">
                {['§a', '§b', '§c', '§e', '§6', '§d', '§f', '§8'].map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      setMotd((prev) => prev + code);
                      markDirty();
                    }}
                    className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/15 text-[10px] font-mono text-slate-300 border border-white/10 cursor-pointer"
                    title={`Insert ${code}`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>

            <input
              type="text"
              value={motd}
              onChange={(e) => {
                setMotd(e.target.value);
                markDirty();
              }}
              disabled={!canEdit}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-emerald-500/50 disabled:opacity-50"
            />

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Client Multiplayer In-Game Preview
              </span>
              {renderMotdPreview(motd)}
            </div>
          </div>

          {/* Software & Runtime Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-slate-400 block text-[10px]">Minecraft Version</span>
              <span className="font-mono text-emerald-400 font-bold">{mcVersion}</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-slate-400 block text-[10px]">Mod Loader</span>
              <span className="font-mono text-violet-300 font-bold">Fabric {fabricVersion}</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-slate-400 block text-[10px]">Java Runtime</span>
              <span className="font-mono text-slate-200 font-bold truncate block">{javaVersion}</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-slate-400 block text-[10px]">Edition</span>
              <span className="font-mono text-cyan-300 font-bold">Java Edition</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. GAMEPLAY SETTINGS PANEL                                                */}
      {/* ========================================================================= */}
      {(activeCategory === 'all' || activeCategory === 'gameplay') && (
        <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-white/8 pb-3">
            <div className="flex items-center gap-2.5">
              <Swords className="w-4 h-4 text-violet-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                Gameplay Rules &amp; World Behavior
              </h2>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">GAMEPLAY</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            {/* Difficulty */}
            <div>
              <label className="block text-slate-400 mb-1.5 font-semibold">World Difficulty</label>
              <select
                value={difficulty}
                onChange={(e: any) => {
                  setDifficulty(e.target.value);
                  markDirty();
                }}
                disabled={!canEdit}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none focus:border-emerald-500/50 disabled:opacity-50 cursor-pointer"
              >
                <option value="peaceful" className="bg-slate-900 text-white">Peaceful (No Hostile Mobs)</option>
                <option value="easy" className="bg-slate-900 text-white">Easy</option>
                <option value="normal" className="bg-slate-900 text-white">Normal (Default)</option>
                <option value="hard" className="bg-slate-900 text-white">Hard (Intense)</option>
              </select>
            </div>

            {/* Gamemode */}
            <div>
              <label className="block text-slate-400 mb-1.5 font-semibold">Default Player Gamemode</label>
              <select
                value={gamemode}
                onChange={(e: any) => {
                  setGamemode(e.target.value);
                  markDirty();
                }}
                disabled={!canEdit}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none focus:border-emerald-500/50 disabled:opacity-50 cursor-pointer"
              >
                <option value="survival" className="bg-slate-900 text-white">Survival</option>
                <option value="creative" className="bg-slate-900 text-white">Creative</option>
                <option value="adventure" className="bg-slate-900 text-white">Adventure</option>
                <option value="spectator" className="bg-slate-900 text-white">Spectator</option>
              </select>
            </div>

            {/* Spawn Protection */}
            <div>
              <label className="block text-slate-400 mb-1.5 font-semibold">Spawn Protection Radius</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="128"
                  value={spawnProtection}
                  onChange={(e) => {
                    setSpawnProtection(parseInt(e.target.value, 10) || 0);
                    markDirty();
                  }}
                  disabled={!canEdit}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                />
                <span className="text-slate-400 font-mono">Blocks</span>
              </div>
            </div>
          </div>

          {/* Gameplay Boolean Switches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
            {[
              {
                key: 'pvp',
                label: 'Player vs Player (PvP)',
                desc: 'Allow combat between players',
                val: pvp,
                toggle: () => {
                  setPvp(!pvp);
                  markDirty();
                }
              },
              {
                key: 'commandBlocks',
                label: 'Command Blocks',
                desc: 'Allow execute command block automation',
                val: commandBlocks,
                toggle: () => {
                  setCommandBlocks(!commandBlocks);
                  markDirty();
                }
              },
              {
                key: 'allowFlight',
                label: 'Allow Survival Flight',
                desc: 'Prevent kicking for elytra/flight mods',
                val: allowFlight,
                toggle: () => {
                  setAllowFlight(!allowFlight);
                  markDirty();
                }
              },
              {
                key: 'friendlyFire',
                label: 'Friendly Fire',
                desc: 'Damage between team members',
                val: friendlyFire,
                toggle: () => {
                  setFriendlyFire(!friendlyFire);
                  markDirty();
                }
              },
              {
                key: 'keepInventory',
                label: 'Keep Inventory on Death',
                desc: 'Retain items and XP upon dying',
                val: keepInventory,
                toggle: () => {
                  setKeepInventory(!keepInventory);
                  markDirty();
                }
              },
              {
                key: 'hardcore',
                label: 'Hardcore Mode',
                desc: 'Permadeath & world deletion on death',
                val: hardcore,
                isDanger: true,
                toggle: () => {
                  if (!hardcore) {
                    setDangerModal({
                      isOpen: true,
                      title: 'Enable Hardcore Mode?',
                      description: 'Hardcore mode locks world difficulty to Hard and causes players to be permanently banned or switched to spectator upon dying. Are you sure you want to enable this?',
                      onConfirm: () => {
                        setHardcore(true);
                        markDirty();
                      }
                    });
                  } else {
                    setHardcore(false);
                    markDirty();
                  }
                }
              }
            ].map((item) => (
              <div
                key={item.key}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  item.isDanger && item.val
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-white/[0.02] border-white/6 hover:border-white/12'
                }`}
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="text-xs font-bold text-slate-200 truncate">{item.label}</div>
                  <div className="text-[10px] text-slate-400 leading-tight">{item.desc}</div>
                </div>

                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={item.toggle}
                  className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer shrink-0 disabled:opacity-40 ${
                    item.val
                      ? item.isDanger ? 'bg-red-500' : 'bg-emerald-500'
                      : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      item.val ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. WORLD SETTINGS PANEL                                                   */}
      {/* ========================================================================= */}
      {(activeCategory === 'all' || activeCategory === 'world') && (
        <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-white/8 pb-3">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                World Generation, Seed &amp; View Distance
              </h2>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">WORLD</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            {/* World Name */}
            <div>
              <label className="block text-slate-400 mb-1.5 font-semibold">World Folder Name</label>
              <input
                type="text"
                value={worldName}
                onChange={(e) => {
                  setWorldName(e.target.value);
                  markDirty();
                }}
                disabled={!canEdit}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            {/* Seed */}
            <div>
              <label className="block text-slate-400 mb-1.5 font-semibold">World Generation Seed</label>
              <input
                type="text"
                value={seed}
                onChange={(e) => {
                  setSeed(e.target.value);
                  markDirty();
                }}
                disabled={!canEdit}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            {/* World Type */}
            <div>
              <label className="block text-slate-400 mb-1.5 font-semibold">Level Type</label>
              <select
                value={worldType}
                onChange={(e) => {
                  setWorldType(e.target.value);
                  markDirty();
                }}
                disabled={!canEdit}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-semibold cursor-pointer"
              >
                <option value="default" className="bg-slate-900">Default (Normal Terrain)</option>
                <option value="flat" className="bg-slate-900">Superflat</option>
                <option value="large_biomes" className="bg-slate-900">Large Biomes</option>
                <option value="amplified" className="bg-slate-900">Amplified (Extreme Height)</option>
              </select>
            </div>

            {/* View Distance */}
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-slate-400 font-semibold">View Distance</label>
                <span className="font-mono text-emerald-400 font-bold">{viewDistance} Chunks</span>
              </div>
              <input
                type="range"
                min="4"
                max="32"
                value={viewDistance}
                onChange={(e) => {
                  setViewDistance(parseInt(e.target.value, 10));
                  markDirty();
                }}
                disabled={!canEdit}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>

            {/* Simulation Distance */}
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-slate-400 font-semibold">Simulation Distance</label>
                <span className="font-mono text-sky-400 font-bold">{simDistance} Chunks</span>
              </div>
              <input
                type="range"
                min="3"
                max="16"
                value={simDistance}
                onChange={(e) => {
                  setSimDistance(parseInt(e.target.value, 10));
                  markDirty();
                }}
                disabled={!canEdit}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

            {/* Generate Structures */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 self-end">
              <div>
                <div className="font-semibold text-slate-200">Generate Structures</div>
                <div className="text-[10px] text-slate-400">Villages, temples, mineshafts</div>
              </div>
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => {
                  setGenerateStructures(!generateStructures);
                  markDirty();
                }}
                className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                  generateStructures ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    generateStructures ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. NETWORK & CAPACITY PANEL                                               */}
      {/* ========================================================================= */}
      {(activeCategory === 'all' || activeCategory === 'network') && (
        <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-white/8 pb-3">
            <div className="flex items-center gap-2.5">
              <Wifi className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                Network Interfaces, Player Limits &amp; Compression
              </h2>
            </div>
            {onOpenConnectServer && (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onOpenConnectServer();
                }}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.15)]"
              >
                <Server className="w-3.5 h-3.5" />
                <span>Connect Server Setup</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
            {/* Max Players */}
            <div>
              <label className="block text-slate-400 mb-1.5 font-semibold">Max Player Capacity</label>
              <input
                type="number"
                min="1"
                max="500"
                value={maxPlayers}
                onChange={(e) => {
                  setMaxPlayers(parseInt(e.target.value, 10) || 20);
                  markDirty();
                }}
                disabled={!canEdit}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            {/* Server Port */}
            <div>
              <label className="block text-slate-400 mb-1.5 font-semibold">Minecraft Server Port</label>
              <input
                type="number"
                min="1024"
                max="65535"
                value={serverPort}
                onChange={(e) => {
                  setServerPort(parseInt(e.target.value, 10) || 25565);
                  markDirty();
                }}
                disabled={!canEdit}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            {/* Network Compression */}
            <div>
              <label className="block text-slate-400 mb-1.5 font-semibold">Packet Compression Threshold</label>
              <input
                type="number"
                min="-1"
                max="1024"
                value={networkCompression}
                onChange={(e) => {
                  setNetworkCompression(parseInt(e.target.value, 10) || 256);
                  markDirty();
                }}
                disabled={!canEdit}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            {/* Max Tick Time */}
            <div>
              <label className="block text-slate-400 mb-1.5 font-semibold">Watchdog Tick Timeout</label>
              <input
                type="number"
                min="0"
                max="300000"
                value={maxTickTime}
                onChange={(e) => {
                  setMaxTickTime(parseInt(e.target.value, 10) || 60000);
                  markDirty();
                }}
                disabled={!canEdit}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SECURITY & ACCESS CONTROL PANEL                                        */}
      {/* ========================================================================= */}
      {(activeCategory === 'all' || activeCategory === 'security') && (
        <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-white/8 pb-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                Authentication, Whitelist &amp; Access Controls
              </h2>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">SECURITY</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Online Mode (Mojang Auth) */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/6 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="font-bold text-white flex items-center gap-2">
                  <span>Online Mode (Mojang Account Authentication)</span>
                  {onlineMode ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">Active</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">Cracked Mode</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  Verify connecting players against official Mojang session servers. Disabling allows offline / cracked launchers.
                </div>
              </div>

              <button
                type="button"
                disabled={!canEdit}
                onClick={() => {
                  if (onlineMode) {
                    setDangerModal({
                      isOpen: true,
                      title: 'Disable Online Mode (Mojang Authentication)?',
                      description: 'Disabling Online Mode makes the server vulnerable to username spoofing and account impersonation. Are you sure you want to disable Mojang session authentication?',
                      onConfirm: () => {
                        setOnlineMode(false);
                        markDirty();
                      }
                    });
                  } else {
                    setOnlineMode(true);
                    markDirty();
                  }
                }}
                className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                  onlineMode ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    onlineMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Whitelist */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/6 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="font-bold text-white">Enforce Whitelist Access</div>
                <div className="text-[11px] text-slate-400">
                  Only approved players listed in whitelist.json can join this server.
                </div>
              </div>

              <button
                type="button"
                disabled={!canEdit}
                onClick={() => {
                  setWhitelistEnabled(!whitelistEnabled);
                  markDirty();
                }}
                className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                  whitelistEnabled ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    whitelistEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Prevent Proxy */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/6 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="font-bold text-white">Prevent Proxy / VPN Connections</div>
                <div className="text-[11px] text-slate-400">
                  Kick clients attempting to route through anonymous HTTP/SOCKS proxies.
                </div>
              </div>

              <button
                type="button"
                disabled={!canEdit}
                onClick={() => {
                  setPreventProxy(!preventProxy);
                  markDirty();
                }}
                className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                  preventProxy ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    preventProxy ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Hide Online Players */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/6 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="font-bold text-white">Hide Player Sample in Status Ping</div>
                <div className="text-[11px] text-slate-400">
                  Obscure username list in the client multiplayer server list hover.
                </div>
              </div>

              <button
                type="button"
                disabled={!canEdit}
                onClick={() => {
                  setHideOnlinePlayers(!hideOnlinePlayers);
                  markDirty();
                }}
                className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                  hideOnlinePlayers ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    hideOnlinePlayers ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. ADVANCED JVM & RUNTIME PANEL                                           */}
      {/* ========================================================================= */}
      {(activeCategory === 'all' || activeCategory === 'advanced') && (
        <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-white/8 pb-3">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-violet-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                Advanced JVM Flags, Memory Heap &amp; Daemon Parameters
              </h2>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">ADVANCED</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Heap Selector */}
            <div>
              <label className="block text-slate-400 mb-1.5 font-semibold">Max Heap Memory Allocation (-Xmx)</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {['4G', '6G', '8G', '12G', '16G'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => {
                      setRamAlloc(opt);
                      markDirty();
                    }}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      ramAlloc === opt
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {opt} RAM
                  </button>
                ))}
              </div>
            </div>

            {/* Garbage Collector */}
            <div>
              <label className="block text-slate-400 mb-1.5 font-semibold">JVM Garbage Collector Engine</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'G1GC', name: 'G1GC (Aikar Standard)', desc: 'Low latency sub-20ms pauses' },
                  { id: 'ZGC', name: 'ZGC (Generational)', desc: 'Ultra-low pause for 16GB+ heaps' },
                  { id: 'Shenandoah', name: 'Shenandoah GC', desc: 'Concurrent compaction' }
                ].map((gc) => (
                  <button
                    key={gc.id}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => {
                      setGarbageCollector(gc.id);
                      markDirty();
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      garbageCollector === gc.id
                        ? 'bg-violet-500/20 border-violet-500/50 text-violet-200 shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-white">{gc.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{gc.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* JVM Flags */}
            <div>
              <label className="block text-slate-400 mb-1.5 font-semibold">Custom JVM Startup Flags</label>
              <textarea
                rows={2}
                value={jvmFlags}
                onChange={(e) => {
                  setJvmFlags(e.target.value);
                  markDirty();
                }}
                disabled={!canEdit}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 font-mono text-[11px] text-slate-200 focus:outline-none focus:border-emerald-500/50 leading-relaxed"
              />
            </div>

            {/* RCON Port & Auto-Restart */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Crash Auto-Restart Daemon</div>
                  <div className="text-[10px] text-slate-400">Reboot server if process dies unexpectedly</div>
                </div>
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => {
                    setAutoRestartOnCrash(!autoRestartOnCrash);
                    markDirty();
                  }}
                  className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                    autoRestartOnCrash ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      autoRestartOnCrash ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Internal RCON Port</div>
                  <div className="text-[10px] text-slate-400">Daemon console communication channel</div>
                </div>
                <span className="font-mono text-emerald-400 font-bold text-xs">{rconPort}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
