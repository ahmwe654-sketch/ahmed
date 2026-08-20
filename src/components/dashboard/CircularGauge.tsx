import React from 'react';

export type GaugeTheme = 'emerald' | 'violet' | 'cyan' | 'amber' | 'red';

interface CircularGaugeProps {
  id?: string;
  percentage: number;
  valueDisplay: string | number;
  unit?: string;
  label?: string;
  subtitle?: string;
  statusText?: string;
  theme?: GaugeTheme;
  size?: number;
  strokeWidth?: number;
  isSimulated?: boolean;
}

const themeStyles: Record<
  GaugeTheme,
  {
    gradientStart: string;
    gradientEnd: string;
    glowColor: string;
    textColor: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    trackColor: string;
  }
> = {
  emerald: {
    gradientStart: '#34d399',
    gradientEnd: '#059669',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    textColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10',
    badgeBorder: 'border-emerald-500/30',
    badgeText: 'text-emerald-300',
    trackColor: 'rgba(16, 185, 129, 0.08)'
  },
  violet: {
    gradientStart: '#c084fc',
    gradientEnd: '#7c3aed',
    glowColor: 'rgba(139, 92, 246, 0.45)',
    textColor: 'text-violet-400',
    badgeBg: 'bg-violet-500/10',
    badgeBorder: 'border-violet-500/30',
    badgeText: 'text-violet-300',
    trackColor: 'rgba(139, 92, 246, 0.08)'
  },
  cyan: {
    gradientStart: '#38bdf8',
    gradientEnd: '#0284c7',
    glowColor: 'rgba(6, 182, 212, 0.45)',
    textColor: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/10',
    badgeBorder: 'border-cyan-500/30',
    badgeText: 'text-cyan-300',
    trackColor: 'rgba(6, 182, 212, 0.08)'
  },
  amber: {
    gradientStart: '#fbbf24',
    gradientEnd: '#d97706',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    textColor: 'text-amber-400',
    badgeBg: 'bg-amber-500/10',
    badgeBorder: 'border-amber-500/30',
    badgeText: 'text-amber-300',
    trackColor: 'rgba(245, 158, 11, 0.08)'
  },
  red: {
    gradientStart: '#f87171',
    gradientEnd: '#dc2626',
    glowColor: 'rgba(239, 68, 68, 0.5)',
    textColor: 'text-red-400',
    badgeBg: 'bg-red-500/10',
    badgeBorder: 'border-red-500/30',
    badgeText: 'text-red-300',
    trackColor: 'rgba(239, 68, 68, 0.08)'
  }
};

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  id,
  percentage,
  valueDisplay,
  unit,
  label,
  subtitle,
  statusText,
  theme = 'emerald',
  size = 148,
  strokeWidth = 10,
  isSimulated = false
}) => {
  const t = themeStyles[theme] || themeStyles.emerald;
  const clampedPct = Math.max(0, Math.min(100, isNaN(percentage) ? 0 : percentage));

  const center = size / 2;
  const radius = center - strokeWidth - 4;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedPct / 100) * circumference;

  const gradId = `gauge-grad-${theme}-${id || Math.random().toString(36).substring(2, 7)}`;
  const glowFilterId = `gauge-glow-${theme}-${id || Math.random().toString(36).substring(2, 7)}`;

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Ambient Backlight Glow */}
        <div
          className="absolute inset-2 rounded-full blur-xl pointer-events-none opacity-40 transition-opacity duration-700"
          style={{ backgroundColor: t.glowColor }}
        />

        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={t.gradientStart} />
              <stop offset="100%" stopColor={t.gradientEnd} />
            </linearGradient>

            <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={t.glowColor} floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Background Track Circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth={strokeWidth}
          />

          {/* Outer Accent Ring Track */}
          <circle
            cx={center}
            cy={center}
            r={radius + strokeWidth / 2 + 3}
            fill="none"
            stroke="rgba(255, 255, 255, 0.03)"
            strokeWidth={1}
            strokeDasharray="2, 6"
          />

          {/* Inner Accent Ring Track */}
          <circle
            cx={center}
            cy={center}
            r={Math.max(0, radius - strokeWidth / 2 - 3)}
            fill="none"
            stroke="rgba(255, 255, 255, 0.03)"
            strokeWidth={1}
          />

          {/* Animated Gradient Progress Stroke */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            filter={`url(#${glowFilterId})`}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Content Info */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
          {label && (
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-0.5">
              {label}
            </span>
          )}

          <div className="flex items-baseline justify-center gap-0.5">
            <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              {valueDisplay}
            </span>
            {unit && <span className="text-[11px] font-mono text-slate-400 font-medium">{unit}</span>}
          </div>

          {statusText && (
            <span className={`text-[10px] font-mono font-bold mt-0.5 ${t.textColor}`}>{statusText}</span>
          )}
        </div>
      </div>

      {/* Optional Subtitle / Detail */}
      {subtitle && (
        <span className="text-[11px] font-mono text-slate-400 text-center mt-2.5 max-w-[160px] truncate">
          {subtitle}
        </span>
      )}
    </div>
  );
};
