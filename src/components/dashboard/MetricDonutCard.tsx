import React from 'react';
import { LucideIcon, ArrowUpRight, Info } from 'lucide-react';
import { CircularGauge, GaugeTheme } from './CircularGauge';
import { sound } from '../../utils/sound';

interface MetricDonutCardProps {
  id?: string;
  title: string;
  icon: LucideIcon;
  theme: GaugeTheme;
  percentage: number;
  valueDisplay: string | number;
  unit?: string;
  subtitle?: string;
  statusText?: string;
  onClick?: () => void;
  isSimulated?: boolean;
  actionHint?: string;
}

export const MetricDonutCard: React.FC<MetricDonutCardProps> = ({
  id,
  title,
  icon: Icon,
  theme,
  percentage,
  valueDisplay,
  unit,
  subtitle,
  statusText,
  onClick,
  isSimulated = true,
  actionHint = 'View Performance'
}) => {
  const handleClick = () => {
    if (onClick) {
      sound.playClick();
      onClick();
    }
  };

  const getHoverBorder = () => {
    switch (theme) {
      case 'emerald':
        return 'hover:border-emerald-500/40 hover:shadow-[0_15px_35px_rgba(16,185,129,0.15)]';
      case 'violet':
        return 'hover:border-violet-500/40 hover:shadow-[0_15px_35px_rgba(139,92,246,0.15)]';
      case 'cyan':
        return 'hover:border-cyan-500/40 hover:shadow-[0_15px_35px_rgba(6,182,212,0.15)]';
      case 'amber':
        return 'hover:border-amber-500/40 hover:shadow-[0_15px_35px_rgba(245,158,11,0.15)]';
      case 'red':
        return 'hover:border-red-500/40 hover:shadow-[0_15px_35px_rgba(239,68,68,0.15)]';
      default:
        return 'hover:border-white/20';
    }
  };

  return (
    <div
      id={id}
      onClick={handleClick}
      className={`glass-panel-high rounded-3xl p-5 flex flex-col justify-between border border-white/10 transition-all duration-300 cursor-pointer group relative overflow-hidden ${getHoverBorder()}`}
    >
      {/* Ambient background highlight */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 group-hover:text-white transition-colors">
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isSimulated && (
            <span
              title="Metric value is simulated in dev environment."
              className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] font-mono text-slate-400 border border-white/5"
            >
              SIM
            </span>
          )}
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </div>
      </div>

      {/* Circular Gauge Center */}
      <div className="my-1 flex items-center justify-center">
        <CircularGauge
          percentage={percentage}
          valueDisplay={valueDisplay}
          unit={unit}
          statusText={statusText}
          theme={theme}
          size={142}
          strokeWidth={9}
          isSimulated={isSimulated}
        />
      </div>

      {/* Bottom Subtitle / Info */}
      <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span className="truncate">{subtitle || 'Live Probe'}</span>
        <span className="text-[10px] text-slate-500 group-hover:text-slate-300 transition-colors shrink-0">
          {actionHint}
        </span>
      </div>
    </div>
  );
};
