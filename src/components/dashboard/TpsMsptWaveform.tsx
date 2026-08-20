import React, { useState, useEffect, useRef } from 'react';
import { Activity, Gauge, TrendingUp, TrendingDown, Minus, Info, Zap } from 'lucide-react';
import { Language } from '../../types';
import { getTranslation } from '../../utils/i18n';

interface DataPoint {
  time: string;
  tps: number;
  mspt: number;
}

interface TpsMsptWaveformProps {
  currentTps: number;
  currentMspt: number;
  isOnline: boolean;
  lang: Language;
  isSimulated?: boolean;
}

export const TpsMsptWaveform: React.FC<TpsMsptWaveformProps> = ({
  currentTps,
  currentMspt,
  isOnline,
  lang,
  isSimulated = true
}) => {
  const [history, setHistory] = useState<DataPoint[]>(() => {
    // Generate initial 20 realistic telemetry data points
    const pts: DataPoint[] = [];
    const now = Date.now();
    for (let i = 19; i >= 0; i--) {
      const d = new Date(now - i * 3000);
      pts.push({
        time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        tps: isOnline ? +(19.8 + Math.random() * 0.2).toFixed(1) : 0,
        mspt: isOnline ? +(12.0 + Math.random() * 4.5).toFixed(1) : 0
      });
    }
    return pts;
  });

  const [hoveredPoint, setHoveredPoint] = useState<{
    index: number;
    point: DataPoint;
    x: number;
    yTps: number;
    yMspt: number;
  } | null>(null);

  const [activeView, setActiveView] = useState<'both' | 'tps' | 'mspt'>('both');

  // Push incoming live props into the history stream smoothly
  useEffect(() => {
    if (!isOnline) {
      setHistory((prev) => {
        const next = [...prev.slice(1)];
        next.push({
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          tps: 0,
          mspt: 0
        });
        return next;
      });
      return;
    }

    const timer = setInterval(() => {
      setHistory((prev) => {
        const next = [...prev.slice(1)];
        // Add slight natural server jitter if live prop doesn't change every subsecond
        const tpsJitter = +(currentTps - (Math.random() * 0.15 - 0.07)).toFixed(1);
        const msptJitter = +(currentMspt + (Math.random() * 1.8 - 0.9)).toFixed(1);
        next.push({
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          tps: Math.min(20, Math.max(0, tpsJitter)),
          mspt: Math.max(0, msptJitter)
        });
        return next;
      });
    }, 2800);

    return () => clearInterval(timer);
  }, [currentTps, currentMspt, isOnline]);

  // SVG Dimension Constants
  const width = 600;
  const height = 150;
  const paddingLeft = 32;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 26;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  // Coordinate converters
  const getX = (index: number) => paddingLeft + (index / (history.length - 1)) * chartW;
  const getYTps = (val: number) => {
    // TPS scale 0 to 20
    const ratio = Math.max(0, Math.min(20, val)) / 20;
    return paddingTop + chartH - ratio * chartH;
  };
  const getYMspt = (val: number) => {
    // MSPT scale 0 to 60 (Tick Budget is 50ms)
    const ratio = Math.max(0, Math.min(60, val)) / 60;
    return paddingTop + chartH - ratio * chartH;
  };

  // Generate smooth SVG Bezier path
  const makeSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  };

  const tpsPoints = history.map((pt, i) => ({ x: getX(i), y: getYTps(pt.tps) }));
  const msptPoints = history.map((pt, i) => ({ x: getX(i), y: getYMspt(pt.mspt) }));

  const tpsPath = makeSmoothPath(tpsPoints);
  const msptPath = makeSmoothPath(msptPoints);

  const tpsAreaPath = `${tpsPath} L ${paddingLeft + chartW},${paddingTop + chartH} L ${paddingLeft},${
    paddingTop + chartH
  } Z`;
  const msptAreaPath = `${msptPath} L ${paddingLeft + chartW},${paddingTop + chartH} L ${paddingLeft},${
    paddingTop + chartH
  } Z`;

  // Status & Trend assessment
  const tpsStatus = !isOnline
    ? 'Offline'
    : currentTps >= 19.5
    ? getTranslation(lang, 'status_healthy')
    : currentTps >= 16.0
    ? getTranslation(lang, 'status_warning')
    : getTranslation(lang, 'status_critical');

  const msptStatus = !isOnline
    ? 'Offline'
    : currentMspt <= 25
    ? getTranslation(lang, 'status_excellent')
    : currentMspt <= 45
    ? getTranslation(lang, 'status_normal')
    : getTranslation(lang, 'status_warning');

  // Trend computation
  const last2Tps = history.slice(-2);
  const tpsDelta = last2Tps.length === 2 ? last2Tps[1].tps - last2Tps[0].tps : 0;
  const msptDelta = last2Tps.length === 2 ? last2Tps[1].mspt - last2Tps[0].mspt : 0;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;
    if (mouseX < paddingLeft || mouseX > paddingLeft + chartW) {
      setHoveredPoint(null);
      return;
    }
    const idx = Math.round(((mouseX - paddingLeft) / chartW) * (history.length - 1));
    if (idx >= 0 && idx < history.length) {
      setHoveredPoint({
        index: idx,
        point: history[idx],
        x: getX(idx),
        yTps: getYTps(history[idx].tps),
        yMspt: getYMspt(history[idx].mspt)
      });
    }
  };

  return (
    <div className="glass-panel-high rounded-3xl p-5 sm:p-6 border border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.7)] relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-white font-mono">
                {getTranslation(lang, 'tps_waveform_title') || 'TPS & MSPT Real-Time Waveform'}
              </h2>
              {isSimulated && (
                <span
                  title="Telemetry metrics are currently simulated for demonstration. Real Fabric JMX / RCON connector feeds seamlessly into this view."
                  className="px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-[9px] font-mono font-bold flex items-center gap-1 cursor-help"
                >
                  <Info className="w-2.5 h-2.5" />
                  <span>SIMULATED</span>
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Live server tick budget & processing stability
            </span>
          </div>
        </div>

        {/* View toggles & 50ms Tick budget pill */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-0.5 text-[10px] font-mono font-bold">
            <button
              type="button"
              onClick={() => setActiveView('both')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeView === 'both'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dual Wave
            </button>
            <button
              type="button"
              onClick={() => setActiveView('tps')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeView === 'tps'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              TPS
            </button>
            <button
              type="button"
              onClick={() => setActiveView('mspt')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeView === 'mspt'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              MSPT
            </button>
          </div>

          <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/8 text-[10px] font-mono text-slate-400">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Budget: 50ms</span>
          </span>
        </div>
      </div>

      {/* Metric Callouts Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 mb-4">
        {/* TPS Callout */}
        <div className="bg-black/30 border border-white/8 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                TPS (Ticks Per Second)
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black font-mono text-white">
                {isOnline ? currentTps.toFixed(1) : '0.0'}
              </span>
              <span className="text-xs font-mono text-slate-500">/ 20.0 Target</span>
            </div>
          </div>

          <div className="text-right space-y-0.5">
            <div className="flex items-center gap-1 justify-end">
              {tpsDelta > 0.05 ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              ) : tpsDelta < -0.05 ? (
                <TrendingDown className="w-3.5 h-3.5 text-red-400" />
              ) : (
                <Minus className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span
                className={`text-xs font-mono font-extrabold ${
                  currentTps >= 19.5
                    ? 'text-emerald-400'
                    : currentTps >= 16.0
                    ? 'text-amber-400'
                    : 'text-red-400'
                }`}
              >
                {tpsStatus}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              {isOnline ? '100% tick rate' : 'Stopped'}
            </span>
          </div>
        </div>

        {/* MSPT Callout */}
        <div className="bg-black/30 border border-white/8 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                MSPT (Tick Duration)
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black font-mono text-white">
                {isOnline ? `${currentMspt.toFixed(1)}` : '0.0'}
              </span>
              <span className="text-xs font-mono text-slate-500">ms / &lt; 50ms</span>
            </div>
          </div>

          <div className="text-right space-y-0.5">
            <div className="flex items-center gap-1 justify-end">
              {msptDelta > 1 ? (
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              ) : msptDelta < -1 ? (
                <TrendingDown className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <Minus className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span
                className={`text-xs font-mono font-extrabold ${
                  currentMspt <= 25
                    ? 'text-cyan-400'
                    : currentMspt <= 45
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              >
                {msptStatus}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Tick computation</span>
          </div>
        </div>
      </div>

      {/* SVG Chart Waveform Canvas */}
      <div className="w-full bg-black/40 rounded-2xl p-2 border border-white/5 relative overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-28 sm:h-36 overflow-visible cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <defs>
            {/* TPS Gradient Area */}
            <linearGradient id="tpsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>

            {/* MSPT Gradient Area */}
            <linearGradient id="msptGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>

            {/* Glow Filters */}
            <filter id="chartGlowTps" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#10b981" floodOpacity="0.6" />
            </filter>
            <filter id="chartGlowMspt" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#06b6d4" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Background Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingTop + ratio * chartH;
            return (
              <g key={`grid-h-${i}`}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={paddingLeft + chartW}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
              </g>
            );
          })}

          {/* Left Y Axis Labels (TPS) */}
          <text x={paddingLeft - 6} y={paddingTop + 4} fill="#10b981" fontSize="9" textAnchor="end" fontFamily="monospace">
            20
          </text>
          <text x={paddingLeft - 6} y={paddingTop + chartH / 2 + 3} fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="end" fontFamily="monospace">
            10
          </text>
          <text x={paddingLeft - 6} y={paddingTop + chartH} fill="rgba(255,255,255,0.2)" fontSize="8" textAnchor="end" fontFamily="monospace">
            0
          </text>

          {/* 50ms Critical Tick Budget Line */}
          <line
            x1={paddingLeft}
            y1={getYMspt(50)}
            x2={paddingLeft + chartW}
            y2={getYMspt(50)}
            stroke="rgba(239, 68, 68, 0.25)"
            strokeDasharray="4 4"
            strokeWidth="1"
          />

          {/* Render MSPT Waveform (Cyan) */}
          {(activeView === 'both' || activeView === 'mspt') && (
            <>
              <path d={msptAreaPath} fill="url(#msptGradient)" />
              <path
                d={msptPath}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.2"
                strokeLinecap="round"
                filter="url(#chartGlowMspt)"
                className="transition-all duration-300"
              />
            </>
          )}

          {/* Render TPS Waveform (Emerald) */}
          {(activeView === 'both' || activeView === 'tps') && (
            <>
              <path d={tpsAreaPath} fill="url(#tpsGradient)" />
              <path
                d={tpsPath}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.2"
                strokeLinecap="round"
                filter="url(#chartGlowTps)"
                className="transition-all duration-300"
              />
            </>
          )}

          {/* Interactive Hover Crosshair & Tooltip Point */}
          {hoveredPoint && (
            <g>
              <line
                x1={hoveredPoint.x}
                y1={paddingTop}
                x2={hoveredPoint.x}
                y2={paddingTop + chartH}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeDasharray="2 2"
                strokeWidth="1"
              />

              {/* TPS Point */}
              {(activeView === 'both' || activeView === 'tps') && (
                <circle
                  cx={hoveredPoint.x}
                  cy={hoveredPoint.yTps}
                  r="4"
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  filter="url(#chartGlowTps)"
                />
              )}

              {/* MSPT Point */}
              {(activeView === 'both' || activeView === 'mspt') && (
                <circle
                  cx={hoveredPoint.x}
                  cy={hoveredPoint.yMspt}
                  r="4"
                  fill="#06b6d4"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  filter="url(#chartGlowMspt)"
                />
              )}
            </g>
          )}

          {/* X Axis Time Labels */}
          <text
            x={paddingLeft}
            y={height - 6}
            fill="rgba(255,255,255,0.3)"
            fontSize="8"
            fontFamily="monospace"
            textAnchor="start"
          >
            -60s
          </text>
          <text
            x={paddingLeft + chartW / 2}
            y={height - 6}
            fill="rgba(255,255,255,0.3)"
            fontSize="8"
            fontFamily="monospace"
            textAnchor="middle"
          >
            -30s
          </text>
          <text
            x={paddingLeft + chartW}
            y={height - 6}
            fill="rgba(255,255,255,0.5)"
            fontSize="8"
            fontFamily="monospace"
            textAnchor="end"
          >
            Now
          </text>
        </svg>

        {/* Hover Tooltip Card */}
        {hoveredPoint && (
          <div
            className="absolute top-2 pointer-events-none bg-black/90 border border-white/20 rounded-xl px-3 py-1.5 shadow-2xl backdrop-blur-md text-[11px] font-mono z-20 transition-all"
            style={{
              left: Math.min(hoveredPoint.x, width - 120),
              transform: 'translateX(-50%)'
            }}
          >
            <div className="text-[9px] text-slate-400 mb-0.5">{hoveredPoint.point.time}</div>
            <div className="flex items-center gap-3">
              <div className="text-emerald-400 font-bold">
                TPS: <span className="text-white">{hoveredPoint.point.tps.toFixed(1)}</span>
              </div>
              <div className="text-cyan-400 font-bold">
                MSPT: <span className="text-white">{hoveredPoint.point.mspt.toFixed(1)}ms</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
