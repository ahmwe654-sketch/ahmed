import React from 'react';
import { Play, Square, RotateCw, Save, Check } from 'lucide-react';
import { sound } from '../../utils/sound';

export type GlassButtonVariant = 'start' | 'stop' | 'restart' | 'save' | 'default';

interface ControlGlassButtonProps {
  id?: string;
  variant: GlassButtonVariant;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  title?: string;
  className?: string;
}

export const ControlGlassButton: React.FC<ControlGlassButtonProps> = ({
  id,
  variant,
  label,
  onClick,
  disabled = false,
  isLoading = false,
  title,
  className = ''
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled || isLoading) return;
    sound.playClick();
    onClick();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'start':
        return 'glass-btn-emerald text-emerald-300 hover:text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.25)]';
      case 'stop':
        return 'glass-btn-red text-red-300 hover:text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.25)]';
      case 'restart':
        return 'glass-btn-amber text-amber-300 hover:text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.2)]';
      case 'save':
        return 'bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-emerald-500/40 text-slate-200 hover:text-emerald-300';
      default:
        return 'bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-200';
    }
  };

  const renderIcon = () => {
    if (isLoading) {
      return <RotateCw className="w-4 h-4 animate-spin text-current" />;
    }
    switch (variant) {
      case 'start':
        return <Play className="w-4 h-4 fill-current" />;
      case 'stop':
        return <Square className="w-4 h-4 fill-current" />;
      case 'restart':
        return <RotateCw className="w-4 h-4" />;
      case 'save':
        return <Save className="w-4 h-4 text-emerald-400" />;
      default:
        return null;
    }
  };

  return (
    <button
      id={id}
      type="button"
      title={title}
      disabled={disabled || isLoading}
      onClick={handleClick}
      className={`relative px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold font-mono tracking-wide transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${getVariantStyles()} ${className}`}
    >
      {renderIcon()}
      <span>{label}</span>
    </button>
  );
};
