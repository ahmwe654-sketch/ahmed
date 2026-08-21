import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  X,
  AlertCircle,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Language, UserProfile } from '../types';
import { getTranslation } from '../utils/i18n';
import { sound } from '../utils/sound';
import { api } from '../services/api';
import { EmailVerificationScreen } from './EmailVerificationScreen';

interface LoginModalProps {
  lang: Language;
  onSuccess: (profile: Partial<UserProfile>) => void;
  onSwitchToOnboarding: () => void;
  onClose?: () => void;
}

type LoginModalView =
  | 'login'
  | 'verify_unverified'
  | 'forgot_email'
  | 'forgot_verify'
  | 'forgot_new_password'
  | 'forgot_success';

export const LoginModal: React.FC<LoginModalProps> = ({
  lang,
  onSuccess,
  onSwitchToOnboarding,
  onClose
}) => {
  const [view, setView] = useState<LoginModalView>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitTimer, setRateLimitTimer] = useState<number | null>(null);

  // Email Verification State
  const [targetEmail, setTargetEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [cooldownSec, setCooldownSec] = useState(60);
  const [devCode, setDevCode] = useState<string | undefined>();
  const [resetCode, setResetCode] = useState('');

  // Password Reset State
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Rate limit countdown
  useEffect(() => {
    if (!rateLimitTimer || rateLimitTimer <= 0) return;
    const interval = setInterval(() => {
      setRateLimitTimer((prev) => {
        if (!prev || prev <= 1) {
          setIsRateLimited(false);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Please enter both your email/username and password.');
      return;
    }

    if (isRateLimited) {
      setErrorMessage(`Login locked due to repeated attempts. Please wait ${rateLimitTimer || 300}s.`);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.login({
        identifier: identifier.trim(),
        password: password.trim(),
        rememberMe
      });

      if (res.requireVerification) {
        setTargetEmail(res.email || identifier.trim());
        setMaskedEmail(res.maskedEmail || res.email || identifier.trim());
        setCooldownSec(res.cooldownSeconds || 60);
        setDevCode(res.devCode);
        setView('verify_unverified');
        return;
      }

      if (res.success && res.user) {
        sound.playSuccess();
        onSuccess(res.user);
      } else {
        throw new Error(res.message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      sound.playAlert();
      const errMsg = err.message || 'Invalid email or password.';
      setErrorMessage(errMsg);

      if (errMsg.toLowerCase().includes('too many') || errMsg.toLowerCase().includes('wait')) {
        setIsRateLimited(true);
        setRateLimitTimer(300);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Verification of unverified account on login
  const handleVerifyUnverified = async (code: string) => {
    try {
      const res = await api.verifyCode({
        email: targetEmail,
        code,
        type: 'login_verify',
        rememberMe
      });

      if (res.success && res.user) {
        sound.playSuccess();
        setTimeout(() => {
          onSuccess(res.user);
        }, 800);
        return { success: true };
      } else {
        return {
          success: false,
          error: res.message || 'Invalid code.',
          remainingAttempts: res.remainingAttempts
        };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Verification failed.' };
    }
  };

  const handleResendUnverified = async () => {
    try {
      const res = await api.sendVerificationCode({
        email: targetEmail,
        type: 'login_verify'
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

  // Forgot Password Step 1: Request Code
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setErrorMessage('Please enter your account email address.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.forgotPassword(forgotEmail.trim());
      if (res.success) {
        sound.playClick();
        setTargetEmail(forgotEmail.trim());
        setMaskedEmail(res.maskedEmail || forgotEmail.trim());
        setCooldownSec(res.cooldownSeconds || 60);
        setDevCode(res.devCode);
        setView('forgot_verify');
      } else {
        throw new Error(res.message || 'Could not find an account with that email.');
      }
    } catch (err: any) {
      sound.playAlert();
      setErrorMessage(err.message || 'Failed to send password reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password Step 2: Verification Code Handler
  const handleForgotVerify = async (code: string) => {
    try {
      const res = await api.verifyCode({
        email: targetEmail,
        code,
        type: 'password_reset'
      });

      if (res.success) {
        sound.playSuccess();
        setResetCode(code);
        setTimeout(() => {
          setView('forgot_new_password');
        }, 600);
        return { success: true };
      } else {
        return {
          success: false,
          error: res.message || 'Invalid code.',
          remainingAttempts: res.remainingAttempts
        };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Verification failed.' };
    }
  };

  const handleForgotResend = async () => {
    try {
      const res = await api.sendVerificationCode({
        email: targetEmail,
        type: 'password_reset'
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

  // Forgot Password Step 3: Set New Password
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.resetPassword({
        email: targetEmail,
        code: resetCode,
        newPassword
      });

      if (res.success) {
        sound.playSuccess();
        setView('forgot_success');
      } else {
        throw new Error(res.message || 'Failed to update password.');
      }
    } catch (err: any) {
      sound.playAlert();
      setErrorMessage(err.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-[#090b11]/95 border border-white/10 shadow-2xl shadow-violet-950/40 relative overflow-hidden backdrop-blur-2xl"
      >
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        {onClose && view === 'login' && (
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* VIEW 1: Standard Login Form */}
        {view === 'login' && (
          <div>
            {/* Header / Brand */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center shadow-lg shadow-violet-600/20">
                <Shield className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {getTranslation(lang, 'login_title')}
                </h2>
                <p className="text-xs text-slate-400">
                  {getTranslation(lang, 'login_subtitle')}
                </p>
              </div>
            </div>

            {/* Error / Warning Alert */}
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

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Identifier Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  {getTranslation(lang, 'login_email_label')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    id="login-identifier-input"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="name@example.com or username"
                    autoComplete="username"
                    required
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-[#0d101a] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    {getTranslation(lang, 'login_password_label')}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setErrorMessage(null);
                      setForgotEmail(identifier.includes('@') ? identifier : '');
                      setView('forgot_email');
                    }}
                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="login-password-input"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    required
                    disabled={isLoading}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-white/10 bg-[#0d101a] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-[#0d101a] text-violet-600 focus:ring-violet-500 focus:ring-offset-0 focus:ring-offset-transparent cursor-pointer"
                  />
                  <span className="text-xs text-slate-300">Remember this device</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="login-submit-btn"
                disabled={isLoading || isRateLimited}
                className="w-full py-3 px-4 mt-2 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-600/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>{getTranslation(lang, 'login_submit')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Switch to Registration */}
            <div className="mt-6 pt-4 border-t border-white/5 text-center">
              <p className="text-xs text-slate-400">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  id="switch-to-register-btn"
                  onClick={() => {
                    sound.playClick();
                    onSwitchToOnboarding();
                  }}
                  className="text-violet-400 hover:text-violet-300 font-semibold transition-colors cursor-pointer"
                >
                  Create Cloud Account
                </button>
              </p>
            </div>
          </div>
        )}

        {/* VIEW 2: Verify Unverified Account */}
        {view === 'verify_unverified' && (
          <EmailVerificationScreen
            isModal={false}
            email={targetEmail}
            maskedEmail={maskedEmail}
            type="login_verify"
            initialCooldownSeconds={cooldownSec}
            initialDevCode={devCode}
            onVerify={handleVerifyUnverified}
            onResend={handleResendUnverified}
            onBackOrChangeEmail={() => {
              setView('login');
              setErrorMessage(null);
            }}
            title="Verify Account Email"
            subtitle="Enter the 6-digit code sent to verify this account"
            submitLabel="Verify & Sign In"
          />
        )}

        {/* VIEW 3: Forgot Password - Request Code */}
        {view === 'forgot_email' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center shadow-lg shadow-violet-600/20">
                <KeyRound className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Reset Password</h2>
                <p className="text-xs text-slate-400">Enter your registered email address</p>
              </div>
            </div>

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

            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Account Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-[#0d101a] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !forgotEmail.trim()}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-600/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending reset code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-white/5 text-center">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setView('login');
                  setErrorMessage(null);
                }}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW 4: Forgot Password - Verify Code */}
        {view === 'forgot_verify' && (
          <EmailVerificationScreen
            isModal={false}
            email={targetEmail}
            maskedEmail={maskedEmail}
            type="password_reset"
            initialCooldownSeconds={cooldownSec}
            initialDevCode={devCode}
            onVerify={handleForgotVerify}
            onResend={handleForgotResend}
            onBackOrChangeEmail={() => {
              setView('forgot_email');
              setErrorMessage(null);
            }}
            title="Reset Code Verification"
            subtitle="Enter the 6-digit reset code sent to your email"
            submitLabel="Verify Reset Code"
          />
        )}

        {/* VIEW 5: Set New Password */}
        {view === 'forgot_new_password' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center shadow-lg shadow-violet-600/20">
                <Lock className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Create New Password</h2>
                <p className="text-xs text-slate-400">Choose a strong password (minimum 8 characters)</p>
              </div>
            </div>

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

            <form onSubmit={handleSetNewPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    minLength={8}
                    disabled={isLoading}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-white/10 bg-[#0d101a] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    minLength={8}
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-[#0d101a] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !newPassword || newPassword.length < 8 || newPassword !== confirmPassword}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-600/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating password...</span>
                  </>
                ) : (
                  <>
                    <span>Set New Password</span>
                    <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* VIEW 6: Password Reset Success */}
        {view === 'forgot_success' && (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center mx-auto shadow-xl shadow-violet-600/20">
              <CheckCircle2 className="w-8 h-8 text-violet-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Password Updated</h3>
              <p className="text-xs text-slate-400">Your password has been changed successfully. You can now sign in with your new credentials.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setView('login');
                setPassword('');
                setErrorMessage(null);
              }}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Back to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
