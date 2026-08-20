import React, { useState, useRef, useEffect } from 'react';
import {
  Shield,
  Activity,
  Users,
  Wifi,
  Bell,
  Volume2,
  VolumeX,
  Menu,
  Layers,
  Globe,
  Check,
  ChevronDown
} from 'lucide-react';
import {
  ServerStatusData,
  UserRole,
  UserProfile,
  AppearanceConfig,
  NotificationConfig,
  Language
} from '../types';
import { getTranslation, isRTL } from '../utils/i18n';
import { sound } from '../utils/sound';
import { AccountMenu } from './AccountMenu';

interface TopBarProps {
  serverStatus: ServerStatusData | null;
  userRole: UserRole;
  userProfile: UserProfile;
  appearance: AppearanceConfig;
  notifications: NotificationConfig;
  lang: Language;
  onOpenSettings: (tab?: 'profile' | 'appearance' | 'notifications' | 'security') => void;
  onToggleLang: () => void;
  onLogout: () => void;
  onChangeRole: (role: UserRole) => void;
  onOpenMobileMenu: () => void;
  activeTab: string;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  serverStatus,
  userProfile,
  appearance,
  notifications,
  lang,
  onOpenSettings,
  onToggleLang,
  onLogout,
  onOpenMobileMenu,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  const rtl = isRTL(lang);
  const isOnline = serverStatus?.status === 'ONLINE';
  const isStarting = serverStatus?.status === 'STARTING';
  const isStopping = serverStatus?.status === 'STOPPING';
  const isRestarting = serverStatus?.status === 'RESTARTING';
  const isMaintenance = serverStatus?.maintenanceMode;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleSound = () => {
    const next = sound.toggle();
    setSoundEnabled(next);
    if (next) sound.playClick();
  };

  const getStatusBadge = () => {
    if (isOnline) {
      return (
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold tracking-wide">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
          <span>{getTranslation(lang, 'state_online')}</span>
        </div>
      );
    }
    if (isStarting) {
      return (
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-400 text-xs font-bold tracking-wide">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-spin" />
          <span>{getTranslation(lang, 'state_starting')}</span>
        </div>
      );
    }
    if (isStopping || isRestarting) {
      return (
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-bold tracking-wide">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>{getTranslation(lang, `state_${serverStatus?.status?.toLowerCase() || 'stopping'}`)}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-bold tracking-wide">
        <span className="w-2 h-2 rounded-full bg-red-500" />
        <span>{getTranslation(lang, 'state_offline')}</span>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-30 w-full h-16 glass-panel border-b border-white/8 px-4 sm:px-6 flex items-center justify-between gap-4 select-none">
      {/* Mobile Drawer Trigger & Logo Badge */}
      <div className="flex items-center gap-3">
        <button
          id="mobile-drawer-toggle"
          type="button"
          onClick={() => {
            sound.playClick();
            onOpenMobileMenu();
          }}
          className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
          title="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-violet-500/20 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">AEGIS CORE</span>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-500/15 border border-violet-500/30 text-[10px] font-bold text-violet-300">
                <Layers className="w-2.5 h-2.5 text-violet-400" />
                Fabric 1.20.4
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <span>{serverStatus?.ip || '127.0.0.1'}</span>
              <span>:</span>
              <span>{serverStatus?.port || 25565}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Live Metrics Pill */}
      <div className="hidden md:flex items-center gap-3 bg-white/[0.03] border border-white/6 px-3.5 py-1.5 rounded-full">
        {getStatusBadge()}

        <div className="h-3 w-px bg-white/10" />

        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-bold text-white font-mono">{serverStatus?.playersOnline || 0}</span>
          <span className="text-slate-500 font-mono">/</span>
          <span className="text-slate-400 font-mono">{serverStatus?.maxPlayers || 20}</span>
        </div>

        <div className="h-3 w-px bg-white/10" />

        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-mono text-emerald-300 font-bold">
            {isOnline ? (serverStatus?.tps ?? 20.0).toFixed(1) : '0.0'}
          </span>
          <span className="text-slate-500 text-[10px]">TPS</span>
        </div>

        <div className="h-3 w-px bg-white/10" />

        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-mono text-slate-200">{isOnline ? '42ms' : '—'}</span>
        </div>

        {isMaintenance && (
          <>
            <div className="h-3 w-px bg-white/10" />
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
              MAINTENANCE
            </span>
          </>
        )}
      </div>

      {/* Right Controls: Sound, Language Switcher Dropdown, Notifications, Account Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Language Switcher Dropdown */}
        <div className="relative" ref={langMenuRef}>
          <button
            id="topbar-language-dropdown-btn"
            type="button"
            onClick={() => {
              sound.playClick();
              setLangMenuOpen(!langMenuOpen);
            }}
            title={lang === 'en' ? 'Language: English (US)' : 'اللغة: العربية (RTL)'}
            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-200 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-sm"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-mono font-bold text-[11px]">
              {lang === 'en' ? 'EN' : 'العربية'}
            </span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${langMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Language Dropdown Menu */}
          {langMenuOpen && (
            <div
              className={`absolute mt-2 w-52 rounded-2xl glass-panel-high border border-white/12 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 ${
                rtl ? 'left-0' : 'right-0'
              }`}
            >
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase font-mono border-b border-white/6 mb-1">
                {getTranslation(lang, 'language_select')}
              </div>

              {/* English Option */}
              <button
                type="button"
                onClick={() => {
                  if (lang !== 'en') {
                    onToggleLang();
                  }
                  setLangMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">🇺🇸</span>
                  <div className="flex flex-col text-left">
                    <span className="font-bold">English</span>
                    <span className="text-[9px] text-slate-400 font-mono">LTR Layout</span>
                  </div>
                </div>
                {lang === 'en' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>

              {/* Arabic Option */}
              <button
                type="button"
                onClick={() => {
                  if (lang !== 'ar') {
                    onToggleLang();
                  }
                  setLangMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 mt-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  lang === 'ar'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">🇸🇦</span>
                  <div className="flex flex-col text-right">
                    <span className="font-bold">العربية</span>
                    <span className="text-[9px] text-slate-400 font-mono">واجهة اليمين لليسار RTL</span>
                  </div>
                </div>
                {lang === 'ar' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            </div>
          )}
        </div>

        {/* Sound Toggle */}
        <button
          id="sound-toggle-btn"
          type="button"
          onClick={handleToggleSound}
          title={soundEnabled ? 'Disable sound feedback' : 'Enable sound feedback'}
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            soundEnabled
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifMenuRef}>
          <button
            id="notifications-btn"
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
          </button>

          {notificationsOpen && (
            <div
              className={`absolute mt-2 w-80 rounded-2xl glass-panel border border-white/12 p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 ${
                rtl ? 'left-0' : 'right-0'
              }`}
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/8">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {getTranslation(lang, 'live_health')}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">Real-time</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                  <span className="text-slate-300">Backend Daemon API</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">● Connected</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                  <span className="text-slate-300">Minecraft Java Server</span>
                  <span className={isOnline ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                    {isOnline ? '● Online (1.20.4)' : '● Offline'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                  <span className="text-slate-300">Fabric Mod Engine</span>
                  <span className="text-violet-400 font-bold">● 14 Mods Active</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Account & Profile Menu Component */}
        <AccountMenu
          userProfile={userProfile}
          appearance={appearance}
          notifications={notifications}
          lang={lang}
          onOpenSettings={onOpenSettings}
          onToggleLang={onToggleLang}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
};
