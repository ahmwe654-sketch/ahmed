import React, { useState, useEffect } from 'react';
import {
  Server as ServerIcon,
  Shield,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Key,
  Globe,
  Terminal,
  ArrowRight,
  Sparkles,
  Lock,
  Copy,
  Check,
  Radio,
  FileCode,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { Language, ServerStatusData } from '../types';
import { api } from '../services/api';
import { sound } from '../utils/sound';
import { getTranslation } from '../utils/i18n';

interface ConnectServerScreenProps {
  lang: Language;
  onConnected: () => void;
  onSkipToDemo?: () => void;
  onToggleLang?: () => void;
}

export const ConnectServerScreen: React.FC<ConnectServerScreenProps> = ({
  lang,
  onConnected,
  onSkipToDemo,
  onToggleLang
}) => {
  const [activeMode, setActiveMode] = useState<'direct' | 'pairing' | 'codespaces'>('direct');

  // Direct Form State
  const [host, setHost] = useState('127.0.0.1');
  const [port, setPort] = useState('25565');
  const [rconPort, setRconPort] = useState('25575');
  const [rconPassword, setRconPassword] = useState('');
  const [serverDir, setServerDir] = useState('.');
  const [startCommand, setStartCommand] = useState('java -Xms2G -Xmx4G -jar server.jar nogui');

  // Pairing State
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingCommand, setPairingCommand] = useState<string>('');
  const [pairingExpires, setPairingExpires] = useState<number>(0);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  // Test & Status State
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    details?: {
      version?: string;
      pingMs?: number;
      motd?: string;
      players?: string;
      rconSuccess?: boolean;
      rconError?: string;
    };
  } | null>(null);

  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const isAr = lang === 'ar';

  // Load existing connection config on mount
  useEffect(() => {
    let isMounted = true;
    api.getConnectionConfig()
      .then((cfg) => {
        if (isMounted && cfg) {
          if (cfg.host) setHost(cfg.host);
          if (cfg.port) setPort(String(cfg.port));
          if (cfg.rconPort) setRconPort(String(cfg.rconPort));
          if (cfg.serverDir) setServerDir(cfg.serverDir);
          if (cfg.startCommand) setStartCommand(cfg.startCommand);
        }
      })
      .catch(() => {
        // use defaults
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle direct connection test
  const handleTestConnection = async () => {
    sound.playClick();
    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await api.testConnection({
        host: host.trim(),
        port: parseInt(port, 10) || 25565,
        rconPort: rconPort ? parseInt(rconPort, 10) : undefined,
        rconPassword: rconPassword || undefined
      });

      if (result.online) {
        sound.playSuccess();
        setTestResult({
          tested: true,
          success: true,
          message: `Server responded successfully (${result.pingMs || 12}ms ping)`,
          details: {
            version: result.version,
            pingMs: result.pingMs,
            motd: result.motd,
            players: `${result.playersOnline || 0} / ${result.maxPlayers || 20}`,
            rconSuccess: result.rconSuccess,
            rconError: result.rconError
          }
        });
      } else {
        sound.playWarning();
        setTestResult({
          tested: true,
          success: false,
          message: result.error || 'Server is offline or unreachable at this host and port.',
          details: {
            rconSuccess: false,
            rconError: result.error
          }
        });
      }
    } catch (err: any) {
      sound.playWarning();
      setTestResult({
        tested: true,
        success: false,
        message: err.message || 'Connection test failed to reach Minecraft port.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Handle saving and entering dashboard
  const handleSaveAndConnect = async () => {
    sound.playClick();
    setIsSaving(true);

    try {
      await api.saveConnectionConfig({
        host: host.trim(),
        port: parseInt(port, 10) || 25565,
        rconPort: rconPort ? parseInt(rconPort, 10) : undefined,
        rconPassword: rconPassword || undefined,
        serverDir: serverDir.trim(),
        startCommand: startCommand.trim()
      });

      sound.playSuccess();
      onConnected();
    } catch (err: any) {
      sound.playWarning();
      setTestResult({
        tested: true,
        success: false,
        message: `Failed to save configuration: ${err.message}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Generate pairing code
  const handleGeneratePairingCode = async () => {
    sound.playClick();
    setIsGeneratingCode(true);
    try {
      const res = await api.generatePairingCode();
      setPairingCode(res.code);
      setPairingCommand(res.serverCommand);
      setPairingExpires(res.expiresInSeconds);
    } catch (err: any) {
      setTestResult({
        tested: true,
        success: false,
        message: `Pairing error: ${err.message}`
      });
    } finally {
      setIsGeneratingCode(false);
    }
  };

  // Verify pairing code
  const handleVerifyPairingCode = async () => {
    const codeToVerify = manualCodeInput.trim() || pairingCode;
    if (!codeToVerify) return;

    sound.playClick();
    setIsVerifyingCode(true);
    try {
      const res = await api.verifyPairingCode(codeToVerify);
      if (res.success) {
        sound.playSuccess();
        onConnected();
      } else {
        sound.playWarning();
        setTestResult({
          tested: true,
          success: false,
          message: res.message || 'Verification failed.'
        });
      }
    } catch (err: any) {
      sound.playWarning();
      setTestResult({
        tested: true,
        success: false,
        message: err.message || 'Pairing verification failed.'
      });
    } finally {
      setIsVerifyingCode(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 select-none bg-ambient-deck">
      {/* Top Header info */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-white tracking-wider">AEGIS CORE</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold">
                REAL SERVER BRIDGE
              </span>
            </div>
            <span className="text-xs text-slate-400">Step 2: Server Verification & Uplink</span>
          </div>
        </div>

        {onToggleLang && (
          <button
            type="button"
            onClick={onToggleLang}
            className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/40 text-xs text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer font-mono"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isAr ? 'English' : 'العربية'}</span>
          </button>
        )}
      </div>

      {/* Main Glass Card */}
      <div className="w-full max-w-4xl glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Title & Subtitle */}
        <div className="space-y-2 mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <ServerIcon className="w-7 h-7 text-emerald-400" />
            {isAr ? 'ربط خادم ماينكرافت الحقيقي' : 'Connect Your Minecraft Server'}
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
            {isAr
              ? 'اربط خادم Minecraft Java الخاص بك بـ Aegis Core لبدء التحكم المباشر عبر بروتوكول SLP وبروتوكول RCON الثنائي الآمن. لا يتم حفظ كلمات المرور السرية في المتصفح.'
              : 'Connect your Minecraft Java server to Aegis Core for live SLP telemetry, RCON console control, player administration, and automated realm management. Credentials are handled securely server-side.'}
          </p>
        </div>

        {/* Connection Method Selector Tabs */}
        <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/8 mb-6">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveMode('direct');
            }}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeMode === 'direct'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>{isAr ? 'الاتصال المباشر (RCON / IP)' : 'Direct RCON / IP'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveMode('pairing');
              if (!pairingCode) handleGeneratePairingCode();
            }}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeMode === 'pairing'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>{isAr ? 'رمز الاقتران السريع' : 'Instant Pairing Code'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveMode('codespaces');
            }}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeMode === 'codespaces'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>{isAr ? 'خادم Codespaces المحلي' : 'Codespaces Local Daemon'}</span>
          </button>
        </div>

        {/* Tab 1: Direct IP & RCON Connection */}
        {activeMode === 'direct' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Server Host / IP */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  {isAr ? 'عنوان الخادم أو الآي بي' : 'Server Host / IP'}
                </label>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="e.g. 127.0.0.1 or mc.yourdomain.com"
                  className="w-full px-4 py-2.5 bg-black/50 border border-white/10 focus:border-emerald-500 rounded-xl text-white placeholder-slate-500 text-sm font-mono transition-all outline-none"
                />
              </div>

              {/* Game Port */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  {isAr ? 'منفذ لعبة ماينكرافت' : 'Game Port (SLP Ping)'}
                </label>
                <input
                  type="text"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="25565"
                  className="w-full px-4 py-2.5 bg-black/50 border border-white/10 focus:border-emerald-500 rounded-xl text-white placeholder-slate-500 text-sm font-mono transition-all outline-none"
                />
              </div>

              {/* RCON Port */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  {isAr ? 'منفذ RCON للتحكم' : 'RCON Port'}
                </label>
                <input
                  type="text"
                  value={rconPort}
                  onChange={(e) => setRconPort(e.target.value)}
                  placeholder="25575"
                  className="w-full px-4 py-2.5 bg-black/50 border border-white/10 focus:border-emerald-500 rounded-xl text-white placeholder-slate-500 text-sm font-mono transition-all outline-none"
                />
              </div>

              {/* RCON Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  {isAr ? 'كلمة سر RCON (سرية بالكامل)' : 'RCON Password (Secure)'}
                </label>
                <input
                  type="password"
                  value={rconPassword}
                  onChange={(e) => setRconPassword(e.target.value)}
                  placeholder="From server.properties (rcon.password)"
                  className="w-full px-4 py-2.5 bg-black/50 border border-white/10 focus:border-emerald-500 rounded-xl text-white placeholder-slate-500 text-sm font-mono transition-all outline-none"
                />
              </div>
            </div>

            {/* Quick config hint */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/8 text-xs text-slate-300 flex items-start gap-3">
              <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">server.properties check:</span> Ensure{' '}
                <code className="text-violet-300 bg-black/40 px-1 py-0.5 rounded">enable-rcon=true</code> and{' '}
                <code className="text-violet-300 bg-black/40 px-1 py-0.5 rounded">rcon.port=25575</code> are set in your server configuration.
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Pairing Code */}
        {activeMode === 'pairing' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-5 rounded-2xl bg-black/50 border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-400 font-mono">Your Server Pairing Token</span>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-violet-400 tracking-wider mt-1">
                    {pairingCode || 'GENERATING...'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGeneratePairingCode}
                  disabled={isGeneratingCode}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 flex items-center gap-2 transition-all cursor-pointer shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingCode ? 'animate-spin' : ''}`} />
                  <span>{isAr ? 'توليد رمز جديد' : 'New Code'}</span>
                </button>
              </div>

              {pairingCommand && (
                <div className="space-y-1.5 pt-2 border-t border-white/10">
                  <span className="text-[11px] text-slate-400 font-mono">Run this in your server console:</span>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/80 border border-white/10 font-mono text-xs text-violet-300">
                    <span className="truncate">{pairingCommand}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(pairingCommand);
                        sound.playClick();
                        setCopiedCmd(true);
                        setTimeout(() => setCopiedCmd(false), 2000);
                      }}
                      className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer shrink-0 ml-2"
                    >
                      {copiedCmd ? <Check className="w-3.5 h-3.5 text-violet-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Manual Code Entry */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                {isAr ? 'أو أدخل رمز الاقتران يدوياً' : 'Or Enter Existing Verification Code'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCodeInput}
                  onChange={(e) => setManualCodeInput(e.target.value.toUpperCase())}
                  placeholder="AEGIS-XXXX-YYYY"
                  className="flex-1 px-4 py-2.5 bg-black/50 border border-white/10 focus:border-violet-500 rounded-xl text-white placeholder-slate-500 text-sm font-mono uppercase tracking-widest outline-none"
                />
                <button
                  type="button"
                  onClick={handleVerifyPairingCode}
                  disabled={isVerifyingCode || (!manualCodeInput.trim() && !pairingCode)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] disabled:opacity-50 cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  {isVerifyingCode ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{isAr ? 'تحقق وربط' : 'Verify & Link'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Codespaces Local Daemon */}
        {activeMode === 'codespaces' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-white">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span>Codespaces Container Integration</span>
              </div>
              <p className="text-slate-300">
                Aegis Core can manage a local Minecraft Java server directly inside this environment workspace via native daemon spawning and live port 25565 forwarding.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-300 font-mono">Server Directory</label>
                <input
                  type="text"
                  value={serverDir}
                  onChange={(e) => setServerDir(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white text-sm font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-300 font-mono">Launch Command</label>
                <input
                  type="text"
                  value={startCommand}
                  onChange={(e) => setStartCommand(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white text-sm font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Live Diagnostics Result Box */}
        {testResult && (
          <div
            className={`mt-6 p-4 rounded-2xl border text-xs animate-in fade-in ${
              testResult.success
                ? 'bg-violet-500/10 border-violet-500/30 text-violet-200'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1">
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-violet-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              )}
              <span>{testResult.message}</span>
            </div>

            {testResult.details && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-white/10 font-mono text-[11px] text-slate-300">
                {testResult.details.version && (
                  <div>
                    <span className="text-slate-500 block">Version:</span>
                    <span className="text-white font-bold">{testResult.details.version}</span>
                  </div>
                )}
                {testResult.details.pingMs !== undefined && (
                  <div>
                    <span className="text-slate-500 block">Ping:</span>
                    <span className="text-violet-400 font-bold">{testResult.details.pingMs} ms</span>
                  </div>
                )}
                {testResult.details.players && (
                  <div>
                    <span className="text-slate-500 block">Players:</span>
                    <span className="text-white font-bold">{testResult.details.players}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 block">RCON Auth:</span>
                  <span className={testResult.details.rconSuccess ? 'text-violet-400 font-bold' : 'text-amber-400'}>
                    {testResult.details.rconSuccess ? 'Connected' : testResult.details.rconError || 'Not configured'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-white/10">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting || isSaving}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/40 text-slate-200 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin text-violet-400' : ''}`} />
            <span>{isTesting ? (isAr ? 'جارِ الاختبار...' : 'Probing...') : (isAr ? 'اختبار الاتصال المباشر' : 'Test Live Connection')}</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {onSkipToDemo && (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onSkipToDemo();
                }}
                className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl text-xs font-bold text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
              >
                {isAr ? 'تخطي للوضع التجريبي' : 'Skip / Demo Mode'}
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveAndConnect}
              disabled={isSaving}
              className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-[0_0_25px_rgba(139,92,246,0.35)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isSaving ? (isAr ? 'جارِ الحفظ...' : 'Connecting...') : (isAr ? 'حفظ ودخول لوحة التحكم' : 'Save & Open Dashboard')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
