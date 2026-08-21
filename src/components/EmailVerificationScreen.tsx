import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Mail,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  KeyRound
} from 'lucide-react';
import { sound } from '../utils/sound';

interface EmailVerificationScreenProps {
  email: string;
  maskedEmail?: string;
  type?: 'registration' | 'password_reset' | 'email_change' | 'login_verify';
  initialCooldownSeconds?: number;
  initialExpiresInSeconds?: number;
  initialDevCode?: string;
  onVerify: (code: string) => Promise<{ success: boolean; error?: string; remainingAttempts?: number }>;
  onResend: () => Promise<{ success: boolean; error?: string; cooldownSeconds?: number; maskedEmail?: string; devCode?: string }>;
  onBackOrChangeEmail?: () => void;
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  isModal?: boolean;
}

export const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({
  email,
  maskedEmail: initialMaskedEmail,
  type = 'registration',
  initialCooldownSeconds = 60,
  initialExpiresInSeconds = 600,
  initialDevCode,
  onVerify,
  onResend,
  onBackOrChangeEmail,
  title = 'Check your email',
  subtitle = 'We sent a 6-digit verification code to',
  submitLabel = 'Verify & Activate Account',
  isModal = true
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [maskedEmail, setMaskedEmail] = useState<string>(initialMaskedEmail || email);
  const [cooldown, setCooldown] = useState<number>(initialCooldownSeconds);
  const [expiresIn, setExpiresIn] = useState<number>(initialExpiresInSeconds);
  const [loading, setLoading] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [devCode, setDevCode] = useState<string | undefined>(initialDevCode);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input box on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Expiration countdown timer
  useEffect(() => {
    if (expiresIn <= 0) return;
    const interval = setInterval(() => {
      setExpiresIn((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresIn]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDigitChange = (index: number, value: string) => {
    setError(null);

    const cleanChar = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleanChar;
    setDigits(newDigits);

    if (cleanChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all 6 digits filled
    const fullCode = newDigits.join('');
    if (fullCode.length === 6 && !newDigits.includes('')) {
      triggerVerification(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setError(null);
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 6);

    if (!pastedData) return;

    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i];
    }
    setDigits(newDigits);

    if (pastedData.length === 6) {
      inputRefs.current[5]?.focus();
      triggerVerification(pastedData);
    } else {
      inputRefs.current[pastedData.length]?.focus();
    }
  };

  const triggerVerification = async (codeToVerify?: string) => {
    const code = codeToVerify || digits.join('');
    if (code.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      sound.playError();
      return;
    }

    if (expiresIn <= 0) {
      setError('This verification code has expired. Please request a new code.');
      sound.playError();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await onVerify(code);
      if (res.success) {
        setSuccess(true);
        sound.playSuccess();
      } else {
        setError(res.error || 'Invalid verification code. Please check and try again.');
        sound.playError();
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please try again.');
      sound.playError();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError(null);

    try {
      const res = await onResend();
      if (res.success) {
        sound.playClick();
        setCooldown(res.cooldownSeconds || 60);
        setExpiresIn(600);
        setDigits(['', '', '', '', '', '']);
        if (res.maskedEmail) setMaskedEmail(res.maskedEmail);
        if (res.devCode) setDevCode(res.devCode);
        inputRefs.current[0]?.focus();
      } else {
        setError(res.error || 'Failed to resend verification code.');
        sound.playError();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to resend code.');
      sound.playError();
    } finally {
      setResending(false);
    }
  };

  const content = (
    <div className="w-full max-w-md mx-auto text-center select-none">
      {/* Top Shield Icon Badge */}
      <div className="relative mx-auto w-16 h-16 mb-5 flex items-center justify-center">
        <div className="absolute inset-0 bg-violet-600/20 rounded-2xl blur-xl animate-pulse" />
        <div className="relative w-16 h-16 bg-[#0e111a] border border-violet-500/30 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md">
          {success ? (
            <CheckCircle2 className="w-8 h-8 text-violet-400 animate-bounce" />
          ) : (
            <Mail className="w-8 h-8 text-violet-400" />
          )}
        </div>
      </div>

      {/* Main Heading */}
      <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
        {success ? 'Identity Verified' : title}
      </h2>

      {/* Subtitle & Masked Email Display */}
      <p className="text-slate-400 text-sm mb-3">
        {success ? 'Your account is activated and ready for cloud synchronization.' : subtitle}
      </p>

      {!success && (
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121522] border border-violet-500/20 mb-6 shadow-inner">
          <Mail className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-sm font-mono text-violet-200 font-medium tracking-wide">
            {maskedEmail}
          </span>
        </div>
      )}

      {/* Dev fallback notice if running without live EmailJS credentials */}
      {devCode && !success && (
        <div className="mb-6 p-3 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs flex items-center justify-between gap-2 text-left">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-violet-400" />
            <span>
              <strong>Dev Code:</strong> <code className="bg-violet-500/20 px-1.5 py-0.5 rounded font-mono font-bold text-violet-200">{devCode}</code>
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              const codeArr = devCode.split('').slice(0, 6);
              setDigits(codeArr);
              triggerVerification(devCode);
            }}
            className="text-[11px] bg-violet-600/30 hover:bg-violet-600/50 text-violet-200 px-2.5 py-1 rounded-lg transition-colors font-medium cursor-pointer"
          >
            Auto-fill
          </button>
        </div>
      )}

      {/* 6-Digit OTP Boxes */}
      {!success ? (
        <div className="space-y-5">
          <div className="flex items-center justify-center gap-2 sm:gap-2.5">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={loading || success}
                className={`w-11 h-14 sm:w-12 sm:h-15 text-center text-2xl font-mono font-bold rounded-xl border bg-[#0b0e17] text-white shadow-lg transition-all duration-200 focus:outline-none ${
                  error
                    ? 'border-red-500/60 shadow-red-500/10 focus:ring-2 focus:ring-red-500/40'
                    : digit
                    ? 'border-violet-500/70 shadow-violet-500/20 bg-violet-950/20'
                    : 'border-white/10 hover:border-white/20 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30'
                }`}
              />
            ))}
          </div>

          {/* Expiration & Error alerts */}
          <AnimatePresence mode="wait">
            {error ? (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center justify-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-2 text-xs text-slate-400"
              >
                <Clock className={`w-3.5 h-3.5 ${expiresIn < 60 ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
                <span>
                  Code expires in:{' '}
                  <strong className={`font-mono ${expiresIn < 60 ? 'text-amber-400' : 'text-slate-300'}`}>
                    {formatTime(expiresIn)}
                  </strong>
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Primary Action Button */}
          <button
            type="button"
            id="verify-email-submit-btn"
            onClick={() => triggerVerification()}
            disabled={loading || digits.join('').length < 6 || expiresIn <= 0}
            className="w-full py-3 px-6 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-600/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Verifying code...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>{submitLabel}</span>
              </>
            )}
          </button>

          {/* Resend & Back controls */}
          <div className="pt-2 flex items-center justify-between gap-3 text-xs">
            {onBackOrChangeEmail && (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onBackOrChangeEmail();
                }}
                disabled={loading}
                className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change email / Back</span>
              </button>
            )}

            <button
              type="button"
              id="resend-verification-code-btn"
              onClick={handleResend}
              disabled={cooldown > 0 || resending || loading}
              className={`flex items-center gap-1.5 transition-colors font-medium ml-auto cursor-pointer ${
                cooldown > 0
                  ? 'text-slate-500 cursor-not-allowed'
                  : 'text-violet-400 hover:text-violet-300 underline underline-offset-4'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              <span>
                {resending
                  ? 'Sending code...'
                  : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : 'Resend code'}
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="py-6 space-y-4">
          <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/30 text-violet-300 text-sm flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            <span>Success! Initializing your authenticated cloud session...</span>
          </div>
        </div>
      )}
    </div>
  );

  if (!isModal) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-[#0a0c13]/95 border border-white/10 shadow-2xl shadow-violet-950/40 relative overflow-hidden backdrop-blur-2xl"
      >
        {/* Ambient background decorations */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {content}
      </motion.div>
    </div>
  );
};
