import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  ArrowRight,
  ArrowLeft,
  Check,
  Layers,
  Sparkles,
  Server,
  Cpu,
  Boxes,
  Lock,
  Mail,
  User,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Globe,
  Radio
} from 'lucide-react';
import { Language, UserProfile } from '../types';
import { getTranslation } from '../utils/i18n';
import { sound } from '../utils/sound';
import { api } from '../services/api';
import { EmailVerificationScreen } from './EmailVerificationScreen';

interface OnboardingModalProps {
  lang: Language;
  onComplete: (profile: Partial<UserProfile>) => void;
  onSwitchToLogin: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  lang,
  onComplete,
  onSwitchToLogin
}) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [serverName, setServerName] = useState('Aegis Core SMP');
  const [serverType, setServerType] = useState('Fabric');
  const [mcVersion, setMcVersion] = useState('1.20.4');
  const [selectedLang, setSelectedLang] = useState<Language>(lang);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Email verification state
  const [maskedEmail, setMaskedEmail] = useState('');
  const [cooldownSec, setCooldownSec] = useState(60);
  const [devCode, setDevCode] = useState<string | undefined>();

  const serverTypeOptions = [
    {
      id: 'Fabric',
      label: 'Fabric',
      desc: 'High performance, lightweight modding & optimization',
      badge: 'Recommended',
      icon: Layers
    },
    {
      id: 'Vanilla',
      label: 'Vanilla',
      desc: 'Standard official Mojang server core with zero mods',
      icon: Server
    },
    {
      id: 'Forge',
      label: 'Forge',
      desc: 'Extensive heavy modpack & legacy Forge mod compatibility',
      icon: Boxes
    },
    {
      id: 'Other',
      label: 'Paper / Spigot / Other',
      desc: 'High-concurrency plugin ecosystem & server loaders',
      icon: Cpu
    }
  ];

  const versionOptions = [
    { version: '1.20.4', status: 'Latest Stable (Recommended)' },
    { version: '1.20.2', status: 'Stable' },
    { version: '1.20.1', status: 'Extensive Modpack Support' },
    { version: '1.19.4', status: 'Legacy Stable' },
    { version: '1.21.0', status: 'Experimental / Tricky Trials' }
  ];

  const handleNext = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sound.playClick();
    setErrorMessage(null);

    // Step 1 validation: Credentials
    if (step === 1) {
      if (!name.trim()) {
        setErrorMessage('Please enter your full name or display name.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setErrorMessage('Please enter a valid email address.');
        return;
      }
      if (!password || password.length < 8) {
        setErrorMessage('Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }
      if (!username.trim()) {
        setUsername(name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'));
      }
      setStep(2);
      return;
    }

    // Step 2 validation: Server profile
    if (step === 2) {
      if (!serverName.trim()) {
        setServerName('Aegis Core SMP');
      }
      setStep(3);
      return;
    }

    // Step 3: Localization & Submit to backend registration
    if (step === 3) {
      setIsLoading(true);
      try {
        const regRes = await api.register({
          username: username.trim() || name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
          serverName: serverName.trim() || 'Aegis Core SMP',
          serverType,
          mcVersion,
          language: selectedLang
        });

        if (regRes.requireVerification) {
          sound.playSuccess();
          setMaskedEmail(regRes.maskedEmail || email.trim());
          setCooldownSec(regRes.cooldownSeconds || 60);
          setDevCode(regRes.devCode);
          setStep(4);
        } else if (regRes.success && regRes.user) {
          sound.playSuccess();
          onComplete(regRes.user);
        } else {
          throw new Error(regRes.message || 'Registration failed.');
        }
      } catch (err: any) {
        sound.playAlert();
        setErrorMessage(err.message || 'Failed to create cloud account.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVerifyEmail = async (code: string) => {
    try {
      const res = await api.verifyCode({
        email: email.trim().toLowerCase(),
        code,
        type: 'registration'
      });

      if (res.success && res.user) {
        sound.playSuccess();
        setTimeout(() => {
          onComplete(res.user);
        }, 800);
        return { success: true };
      } else {
        return {
          success: false,
          error: res.message || 'Invalid verification code.',
          remainingAttempts: res.remainingAttempts
        };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Verification failed.' };
    }
  };

  const handleResendCode = async () => {
    try {
      const res = await api.sendVerificationCode({
        email: email.trim().toLowerCase(),
        type: 'registration'
      });
      return {
        success: res.success,
        cooldownSeconds: res.cooldownSeconds || 60,
        maskedEmail: res.maskedEmail,
        devCode: res.devCode,
        error: res.message
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to resend code.' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="w-full max-w-xl p-6 sm:p-8 rounded-2xl bg-[#090b11]/95 border border-white/10 shadow-2xl shadow-violet-950/40 relative overflow-hidden backdrop-blur-2xl"
      >
        {/* Ambient Glows */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Progress Stepper */}
        {step <= 3 && (
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    s === step
                      ? 'w-8 bg-gradient-to-r from-violet-500 to-indigo-500'
                      : s < step
                      ? 'w-4 bg-violet-500/50'
                      : 'w-4 bg-white/10'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              STEP {step} OF 3
            </span>
          </div>
        )}

        {/* Error Alert */}
        <AnimatePresence mode="wait">
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <div className="flex-1">{errorMessage}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STEP 1: Account Credentials */}
        {step === 1 && (
          <form onSubmit={handleNext} className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center">
                <User className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Create Cloud Account</h2>
                <p className="text-xs text-slate-400">Set up your administrator credentials</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#0d101a] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Username (optional)</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="e.g. alex_admin"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#0d101a] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Email Address (for Verification)</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-[#0d101a] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 chars"
                    required
                    minLength={8}
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-white/10 bg-[#0d101a] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    required
                    minLength={8}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-[#0d101a] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onSwitchToLogin();
                }}
                className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Already have an account? <span className="text-violet-400 font-semibold">Sign In</span>
              </button>

              <button
                type="submit"
                className="py-2.5 px-5 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-600/25 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Minecraft Realm Info */}
        {step === 2 && (
          <form onSubmit={handleNext} className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center">
                <Server className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Configure Realm</h2>
                <p className="text-xs text-slate-400">Select server engine and software parameters</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Server Realm Name</label>
              <input
                type="text"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                placeholder="Aegis Core SMP"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#0d101a] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Server Software Core</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {serverTypeOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = serverType === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => {
                        sound.playClick();
                        setServerType(opt.id);
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-violet-500/80 bg-violet-950/20 shadow-lg shadow-violet-950/40'
                          : 'border-white/5 bg-[#0d101a] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-violet-400' : 'text-slate-400'}`} />
                          <span className="text-xs font-bold text-white">{opt.label}</span>
                        </div>
                        {opt.badge && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-300 font-medium">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{opt.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Target Minecraft Version</label>
              <select
                value={mcVersion}
                onChange={(e) => setMcVersion(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#0d101a] text-white text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all font-mono"
              >
                {versionOptions.map((v) => (
                  <option key={v.version} value={v.version} className="bg-[#090b11] text-white">
                    {v.version} - {v.status}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setStep(1);
                }}
                className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                className="py-2.5 px-5 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-600/25 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Language & Localization Preference */}
        {step === 3 && (
          <form onSubmit={handleNext} className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center">
                <Globe className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Localization & Finalize</h2>
                <p className="text-xs text-slate-400">Choose interface language and dispatch verification code</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Interface Language</label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => {
                    sound.playClick();
                    setSelectedLang('en');
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedLang === 'en'
                      ? 'border-violet-500/80 bg-violet-950/20 shadow-lg shadow-violet-950/40'
                      : 'border-white/5 bg-[#0d101a] hover:border-white/20'
                  }`}
                >
                  <div>
                    <span className="text-sm font-bold text-white block">English</span>
                    <span className="text-[11px] text-slate-400">Default (LTR)</span>
                  </div>
                  {selectedLang === 'en' && <Check className="w-4 h-4 text-violet-400" />}
                </div>

                <div
                  onClick={() => {
                    sound.playClick();
                    setSelectedLang('ar');
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedLang === 'ar'
                      ? 'border-violet-500/80 bg-violet-950/20 shadow-lg shadow-violet-950/40'
                      : 'border-white/5 bg-[#0d101a] hover:border-white/20'
                  }`}
                >
                  <div>
                    <span className="text-sm font-bold text-white block">العربية</span>
                    <span className="text-[11px] text-slate-400">Arabic (RTL)</span>
                  </div>
                  {selectedLang === 'ar' && <Check className="w-4 h-4 text-violet-400" />}
                </div>
              </div>
            </div>

            {/* Account Summary */}
            <div className="p-3.5 rounded-xl bg-[#0d101a] border border-white/5 space-y-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Account Summary</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Owner:</span>
                  <span className="text-white font-medium">{name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Email:</span>
                  <span className="text-white font-medium truncate">{email}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Server:</span>
                  <span className="text-white font-medium">{serverName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Core:</span>
                  <span className="text-white font-medium">{serverType} {mcVersion}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setStep(2);
                }}
                disabled={isLoading}
                className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="py-2.5 px-5 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-600/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Dispatching Verification...</span>
                  </>
                ) : (
                  <>
                    <span>Create & Send Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: Email Verification Screen */}
        {step === 4 && (
          <EmailVerificationScreen
            isModal={false}
            email={email}
            maskedEmail={maskedEmail}
            type="registration"
            initialCooldownSeconds={cooldownSec}
            initialDevCode={devCode}
            onVerify={handleVerifyEmail}
            onResend={handleResendCode}
            onBackOrChangeEmail={() => {
              setStep(1);
              setErrorMessage(null);
            }}
            title="Verify Your Email"
            subtitle="We dispatched a 6-digit confirmation code to"
            submitLabel="Verify & Activate Platform"
          />
        )}
      </motion.div>
    </div>
  );
};
