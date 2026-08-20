import React, { useState } from 'react';
import {
  Archive,
  Plus,
  Download,
  RotateCcw,
  Trash2,
  Clock,
  CheckCircle2,
  HardDrive,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { WorldBackup, UserRole } from '../types';
import { sound } from '../utils/sound';

interface BackupsViewProps {
  backups: WorldBackup[];
  userRole: UserRole;
  onCreateBackup: (data?: { name?: string; note?: string }) => void;
  onRestoreBackup: (id: string) => void;
  onDeleteBackup: (id: string) => void;
}

export const BackupsView: React.FC<BackupsViewProps> = ({
  backups,
  userRole,
  onCreateBackup,
  onRestoreBackup,
  onDeleteBackup
}) => {
  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotNote, setSnapshotNote] = useState('');
  const [autoFrequency, setAutoFrequency] = useState('6h');
  const [retentionLimit, setRetentionLimit] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const canManage = userRole === 'owner' || userRole === 'admin';

  const totalBackupSizeMB = backups.reduce((acc, b) => acc + (b.sizeMB || 0), 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playSuccess();
    onCreateBackup({
      name: snapshotName.trim() || undefined,
      note: snapshotNote.trim() || undefined
    });
    setSnapshotName('');
    setSnapshotNote('');
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">World Backups & Snapshots</h2>
            <p className="text-xs text-slate-400">
              Total Storage: <span className="text-emerald-300 font-semibold font-mono">{(totalBackupSizeMB / 1024).toFixed(2)} GB</span> across {backups.length} snapshots
            </p>
          </div>
        </div>

        {canManage && (
          <button
            id="create-backup-modal-btn"
            type="button"
            onClick={() => {
              sound.playClick();
              setShowCreateModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Snapshot Now</span>
          </button>
        )}
      </div>

      {/* Automated Backup Schedule Card */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/8 pb-3">
          <Clock className="w-4 h-4 text-violet-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Automated Cron Snapshot Schedule
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Snapshot Interval</label>
            <div className="grid grid-cols-4 gap-2">
              {['1h', '6h', '12h', '24h'].map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setAutoFrequency(freq)}
                  className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    autoFrequency === freq
                      ? 'bg-violet-500/20 border-violet-500/50 text-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.25)]'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  Every {freq}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Max Snapshots Retained</label>
            <select
              value={retentionLimit}
              onChange={(e) => setRetentionLimit(parseInt(e.target.value, 10))}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
            >
              <option value="5">Keep latest 5 backups</option>
              <option value="10">Keep latest 10 backups (Recommended)</option>
              <option value="20">Keep latest 20 backups</option>
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Backups are compressed into standard .tar.gz archives.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Backups List */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Available World Snapshots ({backups.length})
        </h3>

        {backups.length === 0 ? (
          <div className="text-slate-400 text-center py-12 text-xs">No backups available yet.</div>
        ) : (
          <div className="space-y-3">
            {backups.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/6 hover:border-white/12 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white">{b.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.automatic
                          ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {b.automatic ? 'AUTO' : 'MANUAL'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">[{b.createdAt}]</span>
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-3">
                    <span className="font-mono text-emerald-300">{b.sizeMB} MB</span>
                    <span>•</span>
                    <span className="font-mono text-slate-400">{b.fileName}</span>
                    <span>•</span>
                    <span>{b.note}</span>
                  </div>
                </div>

                {canManage && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playWarning();
                        onRestoreBackup(b.id);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        alert(`Downloading archive ${b.fileName}...`);
                      }}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 cursor-pointer"
                      title="Download Backup (.tar.gz)"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        onDeleteBackup(b.id);
                      }}
                      className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-slate-400 hover:text-red-300 cursor-pointer"
                      title="Delete Snapshot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Backup Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowCreateModal(false)} />
          <form
            onSubmit={handleCreate}
            className="relative z-10 w-full max-w-md bg-[#0d1017] border border-white/12 rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-base font-bold text-white">Create World Snapshot</h3>
            <p className="text-xs text-slate-400">Flush memory and package world folder to disk archive.</p>

            <div>
              <label className="block text-slate-400 text-xs mb-1 font-semibold">Snapshot Label</label>
              <input
                type="text"
                placeholder="e.g. Pre-EnderDragon Fight, Weekly Milestone"
                value={snapshotName}
                onChange={(e) => setSnapshotName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-xs mb-1 font-semibold">Optional Note</label>
              <input
                type="text"
                placeholder="Details or reason for snapshot"
                value={snapshotNote}
                onChange={(e) => setSnapshotNote(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold cursor-pointer flex items-center gap-1.5"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Create Archive</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
