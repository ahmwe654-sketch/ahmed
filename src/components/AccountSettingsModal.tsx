import React, { useState } from 'react';
import {
  X,
  User,
  Shield,
  Palette,
  Bell,
  Globe,
  Sliders,
  Check,
  Zap,
  Activity,
  Server,
  Key,
  HardDrive
} from 'lucide-react';
import {
  Language,
  UserProfile,
  AppearanceConfig,
  NotificationConfig,
  UserRole
} from '../types';
import { getTranslation } from '../utils/i18n';
import { sound } from '../utils/sound';

interface AccountSettingsModalProps {
  isOpen: boolean;
  initialTab?: 'profile' | 'appearance' | 'notifications' | 'security';
  userProfile: UserProfile;
  appearance: AppearanceConfig;
  notifications: NotificationConfig;
  lang: Language;
  onClose: () => void;
  onUpdateProfile: (profile: Partial<UserProfile>) => void;
  onUpdateAppearance: (appearance: Partial<AppearanceConfig>) => void;
  onUpdateNotifications: (notifications: Partial<NotificationConfig>) => void;
  onToggleLang: () => void;
  onLogout: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  initialTab = 'profile',
  userProfile,
  appearance,
  notifications,
  lang,
  onClose,
  onUpdateProfile,
  onUpdateAppearance,
  onUpdateNotifications,
  onToggleLang,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'notifications' | 'security'>(initialTab);
  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [serverName, setServerName] = useState(userProfile.serverName);
  const [selectedRole, setSelectedRole] = useState<UserRole>(userProfile.role);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playSuccess();
    onUpdateProfile({
      name,
      email,
      serverName,
      role: selectedRole
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const roles: { role: UserRole; title: string; color: string; desc: string }[] = [
    {
      role: 'owner',
      title: getTranslation(lang, 'role_owner'),
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      desc: 'Master root supervisor. Full lifecycle, destruct, and config permissions.'
    },
    {
      role: 'admin',
      title: getTranslation(lang, 'role_admin'),
      color: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
      desc: 'High-privilege administrator. Server restart, files, mods, backups, players.'
    },
    {
      role: 'moderator',
      title: getTranslation(lang, 'role_moderator'),
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      desc: 'Community moderator. Kick/ban, chat broadcast, player teleport, logs.'
    },
    {
      role: 'viewer',
      title: getTranslation(lang, 'role_viewer'),
      color: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
      desc: 'Auditor & read-only spectator. View telemetry, events, and health metrics.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative max-w-2xl w-full glass-panel-high rounded-3xl border border-white/10 shadow-[0_25px_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                {getTranslation(lang, 'account_settings')}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {userProfile.name} • {getTranslation(lang, `role_${userProfile.role}`)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 pt-3 border-b border-white/8 gap-2 overflow-x-auto custom-scrollbar">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('profile');
            }}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'text-emerald-400 border-emerald-400 bg-white/[0.03]'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Server</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('appearance');
            }}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'appearance'
                ? 'text-emerald-400 border-emerald-400 bg-white/[0.03]'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>{getTranslation(lang, 'appearance_settings')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('notifications');
            }}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'notifications'
                ? 'text-emerald-400 border-emerald-400 bg-white/[0.03]'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{getTranslation(lang, 'notification_settings')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('security');
            }}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'text-emerald-400 border-emerald-400 bg-white/[0.03]'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Roles & Access</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-slate-200">
          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Changes updated successfully!</span>
            </div>
          )}

          {/* TAB 1: Profile & Server info */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Administrator Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Minecraft Server Realm Name
                </label>
                <input
                  type="text"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-bold text-white">Interface Language</div>
                    <div className="text-slate-400 text-[11px]">English / اللغة العربية مع محاذاة كاملة</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onToggleLang();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-emerald-500/20 hover:text-emerald-300 text-xs font-bold transition-all cursor-pointer"
                >
                  {lang === 'en' ? 'Switch to العربية' : 'Switch to English'}
                </button>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs tracking-wide transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
                >
                  {getTranslation(lang, 'save_changes')}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Appearance settings */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Theme Style */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {getTranslation(lang, 'theme_title')}
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['dark', 'darker', 'system'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        onUpdateAppearance({ theme: t });
                      }}
                      className={`p-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                        appearance.theme === t
                          ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                          : 'bg-black/30 border-white/8 hover:border-white/20 text-slate-400'
                      }`}
                    >
                      {getTranslation(lang, `theme_${t}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Palette */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {getTranslation(lang, 'accent_title')}
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['emerald', 'violet', 'blue'] as const).map((acc) => {
                    const isSelected = appearance.accent === acc;
                    return (
                      <button
                        key={acc}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          onUpdateAppearance({ accent: acc });
                        }}
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white/10 border-white/40 text-white shadow-lg'
                            : 'bg-black/30 border-white/8 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        <span
                          className={`w-3 h-3 rounded-full ${
                            acc === 'emerald'
                              ? 'bg-emerald-400'
                              : acc === 'violet'
                              ? 'bg-violet-400'
                              : 'bg-blue-400'
                          }`}
                        />
                        <span>{getTranslation(lang, `accent_${acc}`)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Animations */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {getTranslation(lang, 'animations_title')}
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['full', 'reduced', 'off'] as const).map((anim) => (
                    <button
                      key={anim}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        onUpdateAppearance({ animations: anim });
                      }}
                      className={`p-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                        appearance.animations === anim
                          ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                          : 'bg-black/30 border-white/8 hover:border-white/20 text-slate-400'
                      }`}
                    >
                      {getTranslation(lang, `anim_${anim}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Glass Effect */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {getTranslation(lang, 'glass_title')}
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['high', 'medium', 'low'] as const).map((glass) => (
                    <button
                      key={glass}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        onUpdateAppearance({ glassEffect: glass });
                      }}
                      className={`p-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                        appearance.glassEffect === glass
                          ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                          : 'bg-black/30 border-white/8 hover:border-white/20 text-slate-400'
                      }`}
                    >
                      {getTranslation(lang, `glass_${glass}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compact Mode Toggle */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{getTranslation(lang, 'compact_title')}</div>
                  <div className="text-[11px] text-slate-400">{getTranslation(lang, 'compact_desc')}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onUpdateAppearance({ compactMode: !appearance.compactMode });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    appearance.compactMode
                      ? 'bg-emerald-500 text-black font-extrabold shadow-[0_0_10px_#10b981]'
                      : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {appearance.compactMode ? getTranslation(lang, 'compact_on') : getTranslation(lang, 'compact_off')}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Notifications settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 mb-2">
                Configure real-time browser alerts and automated Minecraft daemon webhooks.
              </p>

              {[
                { key: 'serverRestart', title: getTranslation(lang, 'notif_restart'), desc: getTranslation(lang, 'notif_restart_desc') },
                { key: 'serverCrash', title: getTranslation(lang, 'notif_crash'), desc: getTranslation(lang, 'notif_crash_desc') },
                { key: 'backupComplete', title: getTranslation(lang, 'notif_backup_ok'), desc: getTranslation(lang, 'notif_backup_ok_desc') },
                { key: 'backupFailure', title: getTranslation(lang, 'notif_backup_fail'), desc: getTranslation(lang, 'notif_backup_fail_desc') },
                { key: 'playerJoin', title: getTranslation(lang, 'notif_join'), desc: getTranslation(lang, 'notif_join_desc') },
                { key: 'playerLeave', title: getTranslation(lang, 'notif_leave'), desc: getTranslation(lang, 'notif_leave_desc') },
                { key: 'performanceWarning', title: getTranslation(lang, 'notif_perf'), desc: getTranslation(lang, 'notif_perf_desc') },
                { key: 'scheduledBroadcast', title: getTranslation(lang, 'notif_broadcast'), desc: getTranslation(lang, 'notif_broadcast_desc') },
                { key: 'modError', title: getTranslation(lang, 'notif_mod_err'), desc: getTranslation(lang, 'notif_mod_err_desc') },
              ].map((item) => {
                const isEnabled = notifications[item.key as keyof NotificationConfig];
                return (
                  <div
                    key={item.key}
                    className="p-3.5 rounded-2xl bg-black/30 border border-white/6 hover:border-white/12 flex items-center justify-between transition-all"
                  >
                    <div className="pr-3">
                      <div className="text-xs font-bold text-white">{item.title}</div>
                      <div className="text-[11px] text-slate-400 leading-tight">{item.desc}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        onUpdateNotifications({ [item.key]: !isEnabled });
                      }}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        isEnabled ? 'bg-emerald-500' : 'bg-white/10'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          isEnabled ? 'right-1' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: Roles & Access Control (RBAC) */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-slate-300 space-y-1">
                <div className="font-bold text-emerald-400">Role-Based Access Control (RBAC)</div>
                <p className="text-[11px] text-slate-400">
                  Aegis Core enforces granular security layers to isolate destructive daemon actions, file modifications, and live player controls.
                </p>
              </div>

              <div className="space-y-2.5">
                {roles.map((r) => {
                  const isSelected = selectedRole === r.role;
                  return (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setSelectedRole(r.role);
                        onUpdateProfile({ role: r.role });
                      }}
                      className={`w-full p-4 rounded-2xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30'
                          : 'bg-black/30 border-white/6 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase border ${r.color}`}>
                            {r.title}
                          </span>
                          {r.role === userProfile.role && (
                            <span className="text-[10px] text-slate-400 font-mono">(Your Current Role)</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 pt-1">{r.desc}</p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/8 bg-black/40 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onLogout();
            }}
            className="text-xs text-red-400 hover:text-red-300 font-bold hover:underline cursor-pointer"
          >
            {getTranslation(lang, 'logout_btn')}
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
