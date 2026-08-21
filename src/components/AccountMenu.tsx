import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Shield,
  Palette,
  Bell,
  Globe,
  LogOut,
  ChevronDown,
  Sparkles,
  Sliders,
  Server,
  Key
} from 'lucide-react';
import { Language, UserProfile, AppearanceConfig, NotificationConfig } from '../types';
import { getTranslation } from '../utils/i18n';
import { sound } from '../utils/sound';

interface AccountMenuProps {
  userProfile: UserProfile;
  appearance: AppearanceConfig;
  notifications: NotificationConfig;
  lang: Language;
  onOpenSettings: (tab?: 'profile' | 'appearance' | 'notifications' | 'security' | 'servers') => void;
  onToggleLang: () => void;
  onLogout: () => void;
}

export const AccountMenu: React.FC<AccountMenuProps> = ({
  userProfile,
  appearance,
  notifications,
  lang,
  onOpenSettings,
  onToggleLang,
  onLogout
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'admin':
        return 'bg-violet-500/15 text-violet-300 border-violet-500/30';
      case 'moderator':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      default:
        return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Account Trigger Button */}
      <button
        id="account-profile-menu-trigger"
        type="button"
        onClick={() => {
          sound.playClick();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all cursor-pointer group"
      >
        {/* User Avatar */}
        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-500 to-violet-500 flex items-center justify-center text-black font-extrabold text-xs shadow-[0_0_10px_rgba(16,185,129,0.3)]">
          {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'A'}
        </div>

        {/* User Info */}
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-bold text-slate-100 tracking-tight leading-none group-hover:text-white transition-colors">
            {userProfile.name || 'Ahmed'}
          </span>
          <span
            className={`text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded mt-0.5 border inline-block leading-tight ${getRoleBadge(
              userProfile.role
            )}`}
          >
            {getTranslation(lang, `role_${userProfile.role}`)}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 glass-panel-high rounded-2xl border border-white/12 shadow-[0_20px_40px_rgba(0,0,0,0.8)] py-2 z-50 animate-in fade-in zoom-in-95 duration-200 text-slate-200 divide-y divide-white/8">
          {/* Header Info */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white truncate">{userProfile.name}</span>
              <span
                className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-full border ${getRoleBadge(
                  userProfile.role
                )}`}
              >
                {getTranslation(lang, `role_${userProfile.role}`)}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
              {userProfile.email || 'ahmed@aegis-smp.net'}
            </div>
            <div className="text-[10px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>{userProfile.serverName || 'Aegis Core SMP'}</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setIsOpen(false);
                onOpenSettings('profile');
              }}
              className="w-full px-4 py-2 text-xs text-left hover:bg-white/5 flex items-center gap-2.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <User className="w-4 h-4 text-emerald-400" />
              <span>Cloud Profile</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setIsOpen(false);
                onOpenSettings('servers');
              }}
              className="w-full px-4 py-2 text-xs text-left hover:bg-white/5 flex items-center gap-2.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Server className="w-4 h-4 text-sky-400" />
              <span>Servers & Realms</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setIsOpen(false);
                onOpenSettings('security');
              }}
              className="w-full px-4 py-2 text-xs text-left hover:bg-white/5 flex items-center gap-2.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Key className="w-4 h-4 text-amber-400" />
              <span>Active Sessions & Security</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setIsOpen(false);
                onOpenSettings('appearance');
              }}
              className="w-full px-4 py-2 text-xs text-left hover:bg-white/5 flex items-center gap-2.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Palette className="w-4 h-4 text-violet-400" />
              <span>{getTranslation(lang, 'appearance_settings')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setIsOpen(false);
                onOpenSettings('notifications');
              }}
              className="w-full px-4 py-2 text-xs text-left hover:bg-white/5 flex items-center gap-2.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4 text-blue-400" />
              <span>{getTranslation(lang, 'notification_settings')}</span>
            </button>
          </div>

          {/* Language Switch */}
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onToggleLang();
              }}
              className="w-full px-4 py-2 text-xs text-left hover:bg-white/5 flex items-center justify-between text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>{getTranslation(lang, 'language_select')}</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-emerald-300 font-mono">
                {lang === 'en' ? 'العربية' : 'EN'}
              </span>
            </button>
          </div>

          {/* Logout */}
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setIsOpen(false);
                onLogout();
              }}
              className="w-full px-4 py-2 text-xs text-left hover:bg-red-500/10 flex items-center gap-2.5 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{getTranslation(lang, 'logout_btn')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
