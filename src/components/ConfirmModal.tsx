import React from 'react';
import { AlertTriangle, AlertOctagon, CheckCircle2, Loader2, X } from 'lucide-react';
import { ConfirmationModalConfig } from '../types';

interface ConfirmModalProps {
  config: ConfirmationModalConfig | null;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ config, onClose }) => {
  if (!config || !config.isOpen) return null;

  const variant = config.confirmVariant || 'primary';
  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={() => !config.isLoading && onClose()}
      />

      {/* Glass Dialog */}
      <div
        id="confirm-modal-dialog"
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-md bg-[#0d0f14]/95 border border-white/12 rounded-2xl p-6 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                isDanger
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : isWarning
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}
            >
              {isDanger ? (
                <AlertOctagon className="w-6 h-6 text-red-400" />
              ) : isWarning ? (
                <AlertTriangle className="w-6 h-6 text-amber-300" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              )}
            </div>

            <div>
              <h3 className="text-base font-bold text-white tracking-tight">{config.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Please review before confirming</p>
            </div>
          </div>

          <button
            id="close-confirm-modal"
            type="button"
            disabled={config.isLoading}
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="my-5 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-slate-300 leading-relaxed">
          {config.description}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            id="cancel-confirm-action"
            type="button"
            disabled={config.isLoading}
            onClick={() => {
              if (config.onCancel) config.onCancel();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 transition-colors disabled:opacity-40 cursor-pointer"
          >
            Cancel
          </button>

          <button
            id="execute-confirm-action"
            type="button"
            disabled={config.isLoading}
            onClick={config.onConfirm}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-40 cursor-pointer ${
              isDanger
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]'
                : isWarning
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]'
            }`}
          >
            {config.isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{config.confirmLabel || 'Confirm Action'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
