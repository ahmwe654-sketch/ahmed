import React, { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Check,
  X,
  Loader2,
  KeyRound
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
  const [isSending, setIsSending] = useState(false);
  
  // مراحل التحقق
  const [step, setStep] = useState<1 | 2>(1); // 1: Login, 2: Verification Code
  const [generatedCode, setGeneratedCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [timer, setTimer] = useState(300); // 5 دقائق
  const [errorMsg, setErrorMsg] = useState('');

  // إدارة عداد الـ 5 دقائق للكود
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0 && step === 2) {
      setErrorMsg('انتهت صلاحية الكود. أعد الإرسال.');
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // إرسال كود التحقق عبر EmailJS
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setErrorMsg('');

    const targetEmail = emailOrUser.includes('@') 
      ? emailOrUser 
      : `${emailOrUser}@aegis-smp.net`;

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);

    try {
      await emailjs.send(
        'service_hqewk0j',
        'template_tht3dk6',
        {
          email: targetEmail,
          passcode: code,
          to_email: targetEmail
        },
        'kfxnN3n5Q3scuoOXx'
      );

      sound.playSuccess();
      setStep(2); // الانتقال لمرحلة إدخال الكود بنفس الكارت
      setTimer(300);
    } catch (error) {
      console.error('EmailJS Error:', error);
      setErrorMsg('حدث خطأ أثناء إرسال الكود. تأكد من البريد وحاول مجدداً.');
    } finally {
      setIsSending(false);
    }
  };

  // التحقق من الكود المدخل
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (timer === 0) {
      setErrorMsg('الكود منتهي الصلاحية، اضغط إعادة إرسال.');
      return;
    }

    if (inputCode.trim() === generatedCode) {
      sound.playSuccess();
      const targetEmail = emailOrUser.includes('@') ? emailOrUser : `${emailOrUser}@aegis-smp.net`;
      onSuccess({
        name: emailOrUser.includes('@') ? emailOrUser.split('@')[0] : emailOrUser,
        email: targetEmail,
        role: 'owner',
        rememberMe
      });
    } else {
      sound.playClick();
      setErrorMsg('كود التحقق غير صحيح! تأكد منه وحاول ثانية.');
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07080b]/90 backdrop-blur-xl animate-in fade-in select-none bg-ambient-deck">
      <div className="absolute w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -top-10" />
      <div className="absolute w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none -bottom-10" />

      <div className="relative z-10 max-w-md w-full glass-panel-high rounded-3xl p-6 sm:p-8 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-300">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-violet-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.25)]">
            {step === 1 ? <Shield className="w-7 h-7" /> : <KeyRound className="w-7 h-7 text-emerald-400" />}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {step === 1 ? getTranslation(lang, 'login_title') : 'إدخال كود التحقق'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {step === 1 
                ? getTranslation(lang, 'login_desc') 
                : `تم إرسال كود مكون من 6 أرقام إلى بريدك`}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center animate-in fade-in">
            {errorMsg}
          </div>
        )}

        {/* Step 1: Login Form */}
        {step === 1 ? (
          <form onSubmit={handleSendCode} className="space-y-4">
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
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                {getTranslation(lang, 'login_password')}
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={getTranslation(lang, 'login_password_placeholder')}
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-extrabold text-xs tracking-wide transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري إرسال كود التحقق...</span>
                </>
              ) : (
                <>
                  <span>تسجيل الدخول وإرسال الكود</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Step 2: Verification Form */
          <form onSubmit={handleVerifyCode} className="space-y-4 animate-in fade-in">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  كود التحقق (6 أرقام)
                </label>
                <span className={`text-xs font-mono font-bold ${timer < 60 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {formatTime(timer)}
                </span>
              </div>
              <input
                type="text"
                maxLength={6}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="000000"
                required
                autoFocus
                className="w-full bg-black/60 border border-emerald-500/40 rounded-xl py-3 text-center text-xl text-emerald-400 font-mono tracking-[0.4em] font-bold focus:outline-none focus:border-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-extrabold text-xs tracking-wide transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>تأكيد الكود والدخول</span>
              <Check className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ← تغيير البريد
              </button>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={isSending}
                className="text-emerald-400 hover:underline disabled:opacity-50"
              >
                إعادة إرسال الكود
              </button>
            </div>
          </form>
        )}

        {/* Footer Link */}
        <div className="mt-5 pt-4 border-t border-white/8 text-center text-xs text-slate-400">
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
  );
};