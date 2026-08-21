import React from 'react';
import { Shield, ArrowRight, LogIn, Sparkles, Globe, Server } from 'lucide-react';
import { ServerStatusData, Language } from '../types';
import { getTranslation } from '../utils/i18n';
import { sound } from '../utils/sound';

interface WelcomeScreenProps {
  serverStatus: ServerStatusData | null;
  lang: Language;
  onGetStarted: () => void;
  onLogin: () => void;
  onToggleLang: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  serverStatus,
  lang,
  onGetStarted,
  onLogin,
  onToggleLang
}) => {
  const isOnline = serverStatus?.status === 'ONLINE' || serverStatus?.online !== false;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#07080b] text-slate-100 px-4 overflow-hidden select-none bg-ambient-deck">
      {/* Subtle Ambient Radial Glows */}
      <div className="absolute w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none -top-24" />
      <div className="absolute w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none -bottom-24" />

      {/* Language Switch in top corner */}
      <div className="absolute top-6 right-6 z-20">
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onToggleLang();
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 transition-colors cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-violet-400" />
          <span>{lang === 'en' ? 'العربية' : 'English'}</span>
        </button>
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-lg w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
        {/* Shield Logo with Ambient Aura */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600/25 via-indigo-600/15 to-blue-600/20 border border-violet-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(139,92,246,0.3)]">
            <Shield className="w-10 h-10 text-violet-400" />
          </div>
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#07080b] flex items-center justify-center">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isOnline ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-red-400'
              }`}
            />
          </span>
        </div>

        {/* Server Greeting */}
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-[11px] font-mono font-semibold tracking-wider uppercase">
            <Sparkles className="w-3 h-3 text-violet-400" />
            <span>Minecraft Java • Aegis Core Suite</span>
          </span>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {getTranslation(lang, 'welcome_title')}
          </h1>
          <p className="text-sm sm:text-base text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
            {getTranslation(lang, 'welcome_subtitle')}
          </p>
        </div>

        {/* Status Pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-black/50 border border-white/10 text-xs font-mono text-slate-300">
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]' : 'bg-red-400'
            }`}
          />
          <span className="text-white font-semibold">
            {isOnline ? getTranslation(lang, 'state_online') : getTranslation(lang, 'state_offline')}
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">{serverStatus?.ip || 'aegis-smp.ply.gg:25565'}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm pt-2">
          <button
            id="welcome-get-started-btn"
            type="button"
            onClick={() => {
              sound.playClick();
              onGetStarted();
            }}
            className="w-full sm:flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(139,92,246,0.35)] cursor-pointer group"
          >
            <span>{getTranslation(lang, 'get_started')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            id="welcome-login-btn"
            type="button"
            onClick={() => {
              sound.playClick();
              onLogin();
            }}
            className="w-full sm:flex-1 py-3 px-6 rounded-2xl bg-white/[0.06] hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-violet-400" />
            <span>{getTranslation(lang, 'login_btn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
