import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Check,
  X
} from 'lucide-react';
import { Language, UserProfile } from '../types';
import { getTranslation } from '../utils/i18n';
import { sound } from '../utils/sound';

interface LoginModalProps {
  lang: Language;
  onSuccess: (profile: Partial<UserProfile>) => void;
  onSwitchToOnboarding: () => void;
  onClose?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  lang,
  onSuccess,
  onSwitchToOnboarding,
  onClose
}) => {
  const [emailOrUser, setEmailOrUser] = useState('ahmed@aegis-smp.net');
  const [password, setPassword] = useState('••••••••••••');
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playSuccess();
    onSuccess({
      name: emailOrUser.includes('@') ? emailOrUser.split('@')[0] : emailOrUser,
      email: emailOrUser.includes('@') ? emailOrUser : `${emailOrUser}@aegis-smp.net`,
      role: 'owner',
      rememberMe
    });
  };

  const handleDemoLogin = () => {
    sound.playSuccess();
    onSuccess({
      name: 'Ahmed',
      email: 'ahmed@aegis-smp.net',
      role: 'owner',
      rememberMe: true
    });
  };

  const handleForgot = () => {
    sound.playClick();
    setForgotSent(true);
    setTimeout(() => setForgotSent(false), 5000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07080b]/90 backdrop-blur-xl animate-in fade-in select-none bg-ambient-deck">
      {/* Soft Ambient Neon Glows */}
      <div className="absolute w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -top-10" />
      <div className="absolute w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none -bottom-10" />

      {/* Login Glass Card */}
      <div className="relative z-10 max-w-md w-full glass-panel-high rounded-3xl p-6 sm:p-8 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-violet-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.25)]">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {getTranslation(lang, 'login_title')}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {getTranslation(lang, 'login_desc')}
            </p>
          </div>
        </div>

        {forgotSent && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{getTranslation(lang, 'login_forgot_msg')}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
              {getTranslation(lang, 'login_email')}
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={emailOrUser}
                onChange={(e) => setEmailOrUser(e.target.value)}
                placeholder={getTranslation(lang, 'login_email_placeholder')}
                required
                className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                {getTranslation(lang, 'login_password')}
              </label>
              <button
                type="button"
                onClick={handleForgot}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                {getTranslation(lang, 'login_forgot')}
              </button>
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={getTranslation(lang, 'login_password_placeholder')}
                required
                className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all font-mono"
              />
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-white/20 bg-black/40 text-emerald-500 focus:ring-0 cursor-pointer"
              />
              <span>{getTranslation(lang, 'login_remember')}</span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-extrabold text-xs tracking-wide transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{getTranslation(lang, 'login_submit')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Divider & Quick Demo */}
        <div className="mt-5 pt-5 border-t border-white/8 space-y-3 text-center">
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-2.5 px-3 rounded-xl bg-white/[0.04] hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 text-xs font-semibold text-emerald-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{getTranslation(lang, 'login_demo')}</span>
          </button>

          <div className="text-xs text-slate-400">
            <span>{getTranslation(lang, 'login_need_account')} </span>
            <button
              type="button"
              onClick={onSwitchToOnboarding}
              className="text-emerald-400 font-bold hover:underline cursor-pointer ml-1"
            >
              {getTranslation(lang, 'login_create_account')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
