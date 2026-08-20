import React, { useState } from 'react';
import {
  Shield,
  ArrowRight,
  ArrowLeft,
  Check,
  Layers,
  Sparkles,
  Server,
  Cpu,
  Boxes
} from 'lucide-react';
import { Language, UserProfile } from '../types';
import { getTranslation } from '../utils/i18n';
import { sound } from '../utils/sound';

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
  const [serverName, setServerName] = useState('');
  const [serverType, setServerType] = useState('Fabric');
  const [mcVersion, setMcVersion] = useState('1.20.4');

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
      desc: 'Plugin ecosystem or custom hybrid Java server loaders',
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

  const handleNext = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sound.playClick();
    if (step === 1 && !name.trim()) return;
    if (step === 2 && !serverName.trim()) setServerName('Aegis Core SMP');
    if (step < 5) {
      setStep((s) => s + 1);
    } else {
      sound.playSuccess();
      onComplete({
        name: name.trim() || 'Ahmed',
        serverName: serverName.trim() || 'Aegis Core SMP',
        serverType,
        mcVersion,
        role: 'owner'
      });
    }
  };

  const handleBack = () => {
    sound.playClick();
    if (step > 1) setStep((s) => s - 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07080b]/90 backdrop-blur-xl animate-in fade-in select-none bg-ambient-deck">
      {/* Soft Ambient Neon Glows */}
      <div className="absolute w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -top-10" />
      <div className="absolute w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none -bottom-10" />

      {/* Onboarding Glass Card */}
      <div className="relative z-10 max-w-xl w-full glass-panel-high rounded-3xl p-6 sm:p-8 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Step Progress Dots */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-xs font-mono font-bold tracking-wider text-slate-300">
              AEGIS SETUP
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === i
                    ? 'w-6 bg-emerald-400 shadow-[0_0_8px_#10b981]'
                    : step > i
                    ? 'w-2.5 bg-emerald-500/50'
                    : 'w-2 bg-white/10'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-xs font-semibold text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer"
          >
            {getTranslation(lang, 'login_btn')}
          </button>
        </div>

        {/* STEP 1: What's your name? */}
        {step === 1 && (
          <form onSubmit={handleNext} className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                Step 1 / 4
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {getTranslation(lang, 'step_1_title')}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {getTranslation(lang, 'step_1_desc')}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <input
                id="onboarding-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={getTranslation(lang, 'step_1_placeholder')}
                autoFocus
                required
                className="w-full bg-black/50 border border-white/12 rounded-2xl px-5 py-3.5 text-base sm:text-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
              />
            </div>

            <div className="flex items-center justify-end pt-4">
              <button
                type="submit"
                disabled={!name.trim()}
                className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-extrabold text-xs tracking-wide transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2 cursor-pointer group"
              >
                <span>{getTranslation(lang, 'btn_next')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: What should we call your server? */}
        {step === 2 && (
          <form onSubmit={handleNext} className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                Step 2 / 4
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {getTranslation(lang, 'step_2_title')}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {getTranslation(lang, 'step_2_desc')}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <input
                id="onboarding-servername-input"
                type="text"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                placeholder={getTranslation(lang, 'step_2_placeholder')}
                autoFocus
                className="w-full bg-black/50 border border-white/12 rounded-2xl px-5 py-3.5 text-base sm:text-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{getTranslation(lang, 'btn_back')}</span>
              </button>

              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs tracking-wide transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2 cursor-pointer group"
              >
                <span>{getTranslation(lang, 'btn_next')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Server Type */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                Step 3 / 4
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {getTranslation(lang, 'step_3_title')}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {getTranslation(lang, 'step_3_desc')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {serverTypeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = serverType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setServerType(opt.id);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-400/40'
                        : 'bg-black/30 border-white/8 hover:bg-white/[0.04] hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isSelected
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-white/5 text-slate-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        {opt.badge && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">{opt.label}</h4>
                      <p className="text-[11px] text-slate-400 leading-snug">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{getTranslation(lang, 'btn_back')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleNext()}
                className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs tracking-wide transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2 cursor-pointer group"
              >
                <span>{getTranslation(lang, 'btn_next')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Minecraft Version */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                Step 4 / 4
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {getTranslation(lang, 'step_4_title')}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {getTranslation(lang, 'step_4_desc')}
              </p>
            </div>

            <div className="space-y-2 pt-1 max-h-56 overflow-y-auto custom-scrollbar pr-1">
              {versionOptions.map((opt) => {
                const isSelected = mcVersion === opt.version;
                return (
                  <button
                    key={opt.version}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setMcVersion(opt.version);
                    }}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                        : 'bg-black/30 border-white/6 hover:bg-white/[0.04] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm text-white">
                        {opt.version}
                      </span>
                      <span className="text-xs text-slate-400">{opt.status}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{getTranslation(lang, 'btn_back')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleNext()}
                className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs tracking-wide transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2 cursor-pointer group"
              >
                <span>{getTranslation(lang, 'btn_next')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: All Set Completion Screen */}
        {step === 5 && (
          <div className="space-y-6 text-center py-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {getTranslation(lang, 'all_set_title', { name: name || 'Ahmed' })}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                {getTranslation(lang, 'all_set_subtitle')}
              </p>
            </div>

            {/* Quick Summary Pill */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 max-w-sm mx-auto text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Server:</span>
                <span className="font-bold text-white">{serverName || 'Aegis Core SMP'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Core Engine:</span>
                <span className="font-bold text-violet-300">{serverType} {mcVersion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Security Role:</span>
                <span className="font-mono font-bold text-emerald-400">OWNER</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleNext()}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-extrabold text-sm tracking-wide transition-all shadow-[0_0_25px_rgba(16,185,129,0.35)] cursor-pointer"
              >
                {getTranslation(lang, 'enter_dashboard')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
