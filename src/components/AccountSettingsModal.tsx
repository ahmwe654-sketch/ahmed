import React, { useState, useEffect } from 'react';
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
  HardDrive,
  Laptop,
  Smartphone,
  Trash2,
  Plus,
  RefreshCw,
  AlertCircle,
  Lock,
  LogOut,
  Users,
  CheckCircle2,
  Loader2,
  Mail,
  MailCheck
} from 'lucide-react';
import {
  Language,
  UserProfile,
  AppearanceConfig,
  NotificationConfig,
  UserRole,
  AuthSession,
  ServerEntity,
  ServerMemberItem
} from '../types';
import { getTranslation } from '../utils/i18n';
import { sound } from '../utils/sound';
import { api } from '../services/api';
import { EmailVerificationScreen } from './EmailVerificationScreen';

interface AccountSettingsModalProps {
  isOpen: boolean;
  initialTab?: 'profile' | 'appearance' | 'notifications' | 'security' | 'servers';
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
  onServerSwitched?: (server: ServerEntity) => void;
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
  onLogout,
  onServerSwitched
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'servers' | 'security' | 'appearance' | 'notifications'>(
    initialTab === 'security' || initialTab === 'servers' ? initialTab : (initialTab as any)
  );

  // Form State
  const [name, setName] = useState(userProfile.name || 'Ahmed');
  const [email, setEmail] = useState(userProfile.email || 'ahmed@aegis-smp.net');
  const [username, setUsername] = useState(userProfile.username || 'ahmed');
  const [serverName, setServerName] = useState(userProfile.serverName || 'Aegis Core SMP');
  const [selectedRole, setSelectedRole] = useState<UserRole>(userProfile.role || 'owner');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Email Change State
  const [showEmailChangeModal, setShowEmailChangeModal] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [emailCooldown, setEmailCooldown] = useState(60);
  const [emailDevCode, setEmailDevCode] = useState<string | undefined>();
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);

  // Security & Sessions State
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Servers State
  const [servers, setServers] = useState<ServerEntity[]>([]);
  const [serversLoading, setServersLoading] = useState(false);
  const [newServerName, setNewServerName] = useState('');
  const [newServerType, setNewServerType] = useState('Fabric');
  const [newServerVersion, setNewServerVersion] = useState('1.20.4');
  const [showAddServerForm, setShowAddServerForm] = useState(false);

  // Server Members State
  const [members, setMembers] = useState<ServerMemberItem[]>([]);
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<UserRole>('moderator');

  useEffect(() => {
    if (isOpen) {
      setName(userProfile.name || 'Ahmed');
      setEmail(userProfile.email || 'ahmed@aegis-smp.net');
      setUsername(userProfile.username || 'ahmed');
      setServerName(userProfile.serverName || 'Aegis Core SMP');
      setSelectedRole(userProfile.role || 'owner');
      loadSessions();
      loadServers();
    }
  }, [isOpen, userProfile]);

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await api.getSessions();
      if (res?.sessions) {
        setSessions(res.sessions);
      }
    } catch {
      // ignore
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadServers = async () => {
    setServersLoading(true);
    try {
      const res = await api.getServers();
      if (res?.servers) {
        setServers(res.servers);
        if (res.activeServerId) {
          loadMembers(res.activeServerId);
        }
      }
    } catch {
      // ignore
    } finally {
      setServersLoading(false);
    }
  };

  const loadMembers = async (serverId: string) => {
    try {
      const res = await api.getServerMembers(serverId);
      if (res?.members) {
        setMembers(res.members);
      }
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  const handleStartEmailChange = async () => {
    if (!email || email.trim() === userProfile.email) return;
    setEmailChangeLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.requestEmailChange(email.trim());
      if (res.success) {
        sound.playSuccess();
        setPendingEmail(email.trim());
        setEmailCooldown(res.cooldownSeconds || 60);
        setEmailDevCode(res.devCode);
        setShowEmailChangeModal(true);
      } else {
        throw new Error(res.message || 'Failed to send verification code.');
      }
    } catch (err: any) {
      sound.playAlert();
      setErrorMessage(err.message || 'Failed to request email change.');
    } finally {
      setEmailChangeLoading(false);
    }
  };

  const handleVerifyEmailChangeCode = async (code: string) => {
    try {
      const res = await api.verifyEmailChange(code);
      if (res.success && res.user) {
        sound.playSuccess();
        onUpdateProfile(res.user);
        setEmail(res.user.email);
        setTimeout(() => {
          setShowEmailChangeModal(false);
        }, 500);
        return { success: true };
      } else {
        return {
          success: false,
          error: res.message || 'Invalid code.'
        };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to verify email code.' };
    }
  };

  const handleResendEmailChangeCode = async () => {
    const res = await api.requestEmailChange(pendingEmail);
    return {
      success: res.success,
      error: res.message,
      cooldownSeconds: res.cooldownSeconds,
      maskedEmail: res.maskedEmail,
      devCode: res.devCode
    };
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const updateData = {
        name,
        email: userProfile.email, // email change goes through verification flow
        serverName,
        role: selectedRole,
        language: lang
      };

      const res = await api.updateProfile(updateData);
      if (res.success && res.user) {
        sound.playSuccess();
        onUpdateProfile(res.user);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        throw new Error((res as any).message || 'Failed to update profile.');
      }
    } catch (err: any) {
      sound.playAlert();
      setErrorMessage(err.message || 'Failed to save changes to cloud database.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevokeSession = async (token: string) => {
    sound.playClick();
    try {
      await api.revokeSession(token);
      setSessions((prev) => prev.filter((s) => s.token !== token));
    } catch {
      // ignore
    }
  };

  const handleRevokeAllOther = async () => {
    sound.playClick();
    try {
      await api.revokeAllOtherSessions();
      setSessions((prev) => prev.filter((s) => s.isCurrent));
    } catch {
      // ignore
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    try {
      const res = await api.changePassword({ currentPassword, newPassword });
      if (res.success) {
        sound.playSuccess();
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(false), 3500);
      } else {
        throw new Error(res.message || 'Password update failed');
      }
    } catch (err: any) {
      sound.playAlert();
      setPasswordError(err.message || 'Current password incorrect or update error.');
    }
  };

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServerName.trim()) return;

    try {
      const res = await api.createServer({
        name: newServerName.trim(),
        serverType: newServerType,
        mcVersion: newServerVersion
      });
      if (res.success && res.server) {
        sound.playSuccess();
        setServers((prev) => [...prev, res.server]);
        setShowAddServerForm(false);
        setNewServerName('');
        if (onServerSwitched) onServerSwitched(res.server);
      }
    } catch (err: any) {
      sound.playAlert();
      setErrorMessage(err.message || 'Failed to create server.');
    }
  };

  const handleSelectServer = async (serverId: string) => {
    sound.playClick();
    try {
      const res = await api.selectActiveServer(serverId);
      if (res.success && res.server) {
        sound.playSuccess();
        setServers((prev) =>
          prev.map((s) => ({ ...s, isPrimary: s.id === serverId }))
        );
        onUpdateProfile({
          serverName: res.server.name,
          serverType: res.server.serverType,
          mcVersion: res.server.mcVersion
        });
        loadMembers(serverId);
        if (onServerSwitched) onServerSwitched(res.server);
      }
    } catch {
      // ignore
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberUsername.trim()) return;

    const activeServer = servers.find((s) => s.isPrimary) || servers[0];
    if (!activeServer) return;

    try {
      const res = await api.addServerMember(activeServer.id, {
        username: newMemberUsername.trim(),
        role: newMemberRole
      });
      if (res.success && res.member) {
        sound.playSuccess();
        setMembers((prev) => [...prev, res.member]);
        setNewMemberUsername('');
      }
    } catch (err: any) {
      sound.playAlert();
      setErrorMessage(err.message || 'Failed to add member.');
    }
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
      <div className="relative max-w-3xl w-full glass-panel-high rounded-3xl border border-white/10 shadow-[0_25px_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  {getTranslation(lang, 'account_settings')}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Cloud Database Synced
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                @{userProfile.username || 'ahmed'} • {userProfile.name} ({getTranslation(lang, `role_${userProfile.role}`)})
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
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'profile'
                ? 'text-emerald-400 border-emerald-400 bg-white/[0.03]'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Cloud Profile</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('servers');
            }}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'servers'
                ? 'text-emerald-400 border-emerald-400 bg-white/[0.03]'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Servers & Realms</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('security');
            }}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'security'
                ? 'text-emerald-400 border-emerald-400 bg-white/[0.03]'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Active Sessions & Security</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('appearance');
            }}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
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
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'notifications'
                ? 'text-emerald-400 border-emerald-400 bg-white/[0.03]'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{getTranslation(lang, 'notification_settings')}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-slate-200">
          {savedSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Cloud profile synchronized to database!</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: Profile */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Database Persistence State</div>
                  <div className="text-[11px] text-slate-400">
                    Your profile and settings are saved server-side and automatically loaded when you log in from any other device.
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold border border-emerald-500/30">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  PERSISTENT
                </div>
              </div>

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
                    Username (@handle)
                  </label>
                  <input
                    type="text"
                    value={username}
                    disabled
                    className="w-full bg-black/60 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-400 font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Email Address
                  </label>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span>VERIFIED (EmailJS)</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                  />
                  {email.trim() !== userProfile.email && (
                    <button
                      type="button"
                      disabled={emailChangeLoading || !email.trim()}
                      onClick={handleStartEmailChange}
                      className="px-3.5 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {emailChangeLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <MailCheck className="w-3.5 h-3.5" />
                      )}
                      <span>Verify & Change</span>
                    </button>
                  )}
                </div>
                {email.trim() !== userProfile.email && (
                  <p className="text-[10px] text-amber-400">
                    * Changing your cloud account email requires entering a 6-digit verification code sent to the new address.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Primary Minecraft Server Name
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
                    <div className="font-bold text-white">Cloud Preference: Language</div>
                    <div className="text-slate-400 text-[11px]">
                      {lang === 'en' ? 'English (LTR)' : 'العربية (RTL محاذاة كاملة)'}
                    </div>
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
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-extrabold text-xs tracking-wide transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-2 cursor-pointer"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{getTranslation(lang, 'save_changes')}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Multi-Server Management */}
          {activeTab === 'servers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Connected Minecraft Servers</h3>
                  <p className="text-xs text-slate-400">Switch between your active server environments or add a new realm.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddServerForm(!showAddServerForm)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddServerForm ? 'Cancel' : 'Add Server'}</span>
                </button>
              </div>

              {showAddServerForm && (
                <form onSubmit={handleCreateServer} className="p-4 rounded-2xl bg-black/50 border border-emerald-500/30 space-y-3 animate-in fade-in">
                  <div className="text-xs font-bold text-emerald-400">Register New Server Instance</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Server Name (e.g. Vanilla Survival)"
                      value={newServerName}
                      onChange={(e) => setNewServerName(e.target.value)}
                      required
                      className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
                    />
                    <select
                      value={newServerType}
                      onChange={(e) => setNewServerType(e.target.value)}
                      className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="Fabric">Fabric (Modded)</option>
                      <option value="Vanilla">Vanilla (Mojang)</option>
                      <option value="Forge">Forge</option>
                      <option value="Paper">Paper / Spigot</option>
                    </select>
                    <select
                      value={newServerVersion}
                      onChange={(e) => setNewServerVersion(e.target.value)}
                      className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 font-mono"
                    >
                      <option value="1.20.4">1.20.4 (Recommended)</option>
                      <option value="1.20.2">1.20.2</option>
                      <option value="1.20.1">1.20.1</option>
                      <option value="1.19.4">1.19.4</option>
                    </select>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-extrabold text-xs cursor-pointer"
                    >
                      Connect & Save
                    </button>
                  </div>
                </form>
              )}

              {/* Server List */}
              <div className="space-y-2.5">
                {servers.map((srv) => (
                  <div
                    key={srv.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                      srv.isPrimary
                        ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                        : 'bg-black/30 border-white/8 hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        srv.isPrimary ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400'
                      }`}>
                        <Server className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{srv.name}</span>
                          {srv.isPrimary && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold border border-emerald-500/30">
                              ACTIVE REALM
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {srv.serverType} {srv.mcVersion} • {srv.ip}:{srv.port}
                        </div>
                      </div>
                    </div>

                    {!srv.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSelectServer(srv.id)}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-emerald-500 hover:text-black text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        Switch To This Realm
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Server Member Access Control */}
              <div className="pt-4 border-t border-white/8 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Users className="w-4 h-4 text-violet-400" />
                    <span>Server Members & Assigned Roles</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{members.length} team members</span>
                </div>

                <form onSubmit={handleAddMember} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Username to invite (e.g. steve)"
                    value={newMemberUsername}
                    onChange={(e) => setNewMemberUsername(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50"
                  />
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as UserRole)}
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/50"
                  >
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs cursor-pointer"
                  >
                    Invite
                  </button>
                </form>

                <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                  {members.map((m) => (
                    <div
                      key={m.userId}
                      className="p-2.5 rounded-xl bg-black/20 border border-white/6 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-white font-bold">{m.username}</span>
                        <span className="text-[10px] text-slate-500">Joined {new Date(m.joinedAt).toLocaleDateString()}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        {m.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Active Sessions & Security */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Active Sessions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Active Device Sessions</h3>
                    <p className="text-xs text-slate-400">
                      Devices currently signed into this account with real database session tokens.
                    </p>
                  </div>
                  {sessions.length > 1 && (
                    <button
                      type="button"
                      onClick={handleRevokeAllOther}
                      className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 text-xs font-bold transition-all cursor-pointer"
                    >
                      Log Out All Other Devices
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
                        s.isCurrent
                          ? 'bg-emerald-500/10 border-emerald-500/40'
                          : 'bg-black/30 border-white/6'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${s.isCurrent ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400'}`}>
                          {s.deviceInfo?.includes('Mobile') ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{s.deviceInfo || 'Web Browser'}</span>
                            {s.isCurrent && (
                              <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold border border-emerald-500/30">
                                THIS DEVICE
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            IP: {s.ipAddress} • Last active: {new Date(s.lastActiveAt).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {!s.isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleRevokeSession(s.token)}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Revoke Session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Password Change Form */}
              <div className="pt-4 border-t border-white/8 space-y-3">
                <h3 className="text-sm font-bold text-white">Change Master Password</h3>
                {passwordSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Password updated successfully across all devices!</span>
                  </div>
                )}
                {passwordError && (
                  <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="password"
                      placeholder="Current Password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                    />
                    <input
                      type="password"
                      placeholder="New Password (min 6 chars)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                    />
                    <input
                      type="password"
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-emerald-500 hover:text-black text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      Update Password
                    </button>
                  </div>
                </form>
              </div>

              {/* Roles & RBAC Overview */}
              <div className="pt-4 border-t border-white/8 space-y-3">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-slate-300 space-y-1">
                  <div className="font-bold text-emerald-400">Role-Based Access Control (RBAC)</div>
                  <p className="text-[11px] text-slate-400">
                    Granular permission levels enforced on the backend server for daemon execution, file writes, and live game controls.
                  </p>
                </div>

                <div className="space-y-2">
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
                        className={`w-full p-3.5 rounded-2xl border text-left flex items-start justify-between transition-all cursor-pointer ${
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
                          <p className="text-xs text-slate-300 pt-0.5">{r.desc}</p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Appearance */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
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
                          ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                          : 'bg-black/30 border-white/8 hover:border-white/20 text-slate-400'
                      }`}
                    >
                      {getTranslation(lang, `theme_${t}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {getTranslation(lang, 'accent_title')}
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { id: 'emerald', color: 'bg-emerald-500', name: 'Emerald' },
                    { id: 'violet', color: 'bg-violet-500', name: 'Violet' },
                    { id: 'cyan', color: 'bg-cyan-500', name: 'Cyan' },
                    { id: 'amber', color: 'bg-amber-500', name: 'Amber' }
                  ].map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        onUpdateAppearance({ accent: a.id as any });
                      }}
                      className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                        appearance.accent === a.id
                          ? 'bg-white/10 border-white/40 text-white'
                          : 'bg-black/30 border-white/8 text-slate-400'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${a.color}`} />
                      <span>{a.name}</span>
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

          {/* TAB 5: Notifications */}
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
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/8 bg-black/40 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onLogout();
            }}
            className="text-xs text-red-400 hover:text-red-300 font-bold hover:underline flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{getTranslation(lang, 'logout_btn')}</span>
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

      {/* Email Change Verification Modal Overlay */}
      {showEmailChangeModal && (
        <EmailVerificationScreen
          isModal={true}
          email={pendingEmail}
          maskedEmail={pendingEmail}
          type="email_change"
          initialCooldownSeconds={emailCooldown}
          initialDevCode={emailDevCode}
          title="Verify New Email Address"
          subtitle="We sent a 6-digit confirmation code to"
          submitLabel="Verify & Update Email"
          onVerify={handleVerifyEmailChangeCode}
          onResend={handleResendEmailChangeCode}
          onBackOrChangeEmail={() => {
            setShowEmailChangeModal(false);
          }}
          onClose={() => {
            setShowEmailChangeModal(false);
          }}
        />
      )}
    </div>
  );
};
