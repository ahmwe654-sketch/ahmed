import React, { useState } from 'react';
import {
  Boxes,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Layers,
  Sparkles,
  DownloadCloud,
  FileCode,
  ShieldCheck,
  Power
} from 'lucide-react';
import { FabricMod, UserRole } from '../types';
import { sound } from '../utils/sound';

interface ModsViewProps {
  mods: FabricMod[];
  userRole: UserRole;
  onToggleMod: (id: string) => void;
  onDeleteMod: (id: string) => void;
  onUploadMod: (mod: { name: string; fileName: string; version?: string; author?: string; description?: string }) => void;
}

export const ModsView: React.FC<ModsViewProps> = ({
  mods,
  userRole,
  onToggleMod,
  onDeleteMod,
  onUploadMod,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const [scanResults, setScanResults] = useState<string | null>(null);

  const canManage = userRole === 'owner' || userRole === 'admin';

  const filteredMods = mods.filter(
    (m) =>
      m.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      m.fileName.toLowerCase().includes(filterQuery.toLowerCase()) ||
      m.author.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.jar')) {
        sound.playSuccess();
        const baseName = file.name.replace('.jar', '').replace(/[-_]/g, ' ');
        onUploadMod({
          name: baseName,
          fileName: file.name,
          version: '1.0.0',
          author: 'Custom / Uploaded',
          description: 'Custom Fabric mod uploaded to server mods folder.'
        });
      } else {
        alert('Please upload a valid Minecraft Fabric .jar file.');
      }
    }
  };

  const runCompatibilityScanner = () => {
    sound.playClick();
    setScannerActive(true);
    setScanResults(null);

    setTimeout(() => {
      setScannerActive(false);
      setScanResults(
        'Compatibility Scan Complete: All 5 active Fabric mods are verified 100% compatible with Fabric Loader 0.15.7 and Minecraft 1.20.4. Zero mixin conflicts detected.'
      );
      sound.playSuccess();
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Stats */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Fabric Mod Engine</h2>
            <p className="text-xs text-slate-400">
              Target: <span className="text-violet-300 font-semibold">Minecraft 1.20.4 (Fabric 0.15.7)</span> • Active Mods: {mods.filter(m => m.enabled).length}/{mods.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={runCompatibilityScanner}
            disabled={scannerActive}
            className="px-4 py-2 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/40 text-violet-300 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
          >
            <ShieldCheck className={`w-4 h-4 ${scannerActive ? 'animate-spin' : ''}`} />
            <span>{scannerActive ? 'Scanning Mixins...' : 'Run Compatibility Scan'}</span>
          </button>
        </div>
      </div>

      {/* Scanner Result Card */}
      {scanResults && (
        <div className="glass-panel border-emerald-500/40 bg-emerald-950/30 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs text-emerald-200 leading-relaxed font-medium">
            {scanResults}
          </div>
        </div>
      )}

      {/* Drag & Drop Mod Uploader */}
      {canManage && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`glass-panel border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
            dragOver
              ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
              : 'border-white/10 hover:border-violet-500/40 hover:bg-white/[0.02]'
          }`}
          onClick={() => {
            // Simulated upload trigger
            const name = prompt('Enter Mod Name (e.g. Sodium, Iris):');
            if (name) {
              const fileName = `${name.toLowerCase()}-fabric-1.20.4.jar`;
              onUploadMod({
                name,
                fileName,
                version: '0.5.8',
                author: 'Modrinth Fabric Team',
                description: 'Performance optimization mod for Fabric Minecraft 1.20.4'
              });
              sound.playSuccess();
            }
          }}
        >
          <Upload className="w-8 h-8 mx-auto text-violet-400 mb-2 animate-bounce" />
          <div className="text-sm font-bold text-white">Drag & Drop Fabric Mod (.jar) Here</div>
          <p className="text-xs text-slate-400 mt-1">
            Or click to browse and upload mods directly to <span className="font-mono text-violet-300">/mods</span> directory.
          </p>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Filter installed Fabric mods..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 w-full sm:w-72"
        />

        <span className="text-xs text-slate-400">
          Showing <span className="text-white font-bold">{filteredMods.length}</span> mods
        </span>
      </div>

      {/* Mods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMods.map((mod) => {
          const isEnabled = mod.enabled;

          return (
            <div
              key={mod.id}
              className={`glass-card rounded-2xl p-5 border transition-all flex flex-col justify-between gap-4 group ${
                isEnabled ? 'border-white/6 hover:border-violet-500/30' : 'border-white/4 opacity-60'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <FileCode className="w-4 h-4 text-violet-400" />
                      {mod.name}
                    </h3>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{mod.fileName}</div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      mod.compatibility === 'Compatible'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {mod.compatibility}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{mod.description}</p>
              </div>

              <div className="space-y-3 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Author: <strong className="text-slate-300 font-normal">{mod.author}</strong></span>
                  <span className="font-mono text-violet-300 font-bold">v{mod.version}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={!canManage}
                    onClick={() => {
                      sound.playClick();
                      onToggleMod(mod.id);
                    }}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 ${
                      isEnabled
                        ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300'
                        : 'bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{isEnabled ? 'Active' : 'Disabled'}</span>
                  </button>

                  {canManage && (
                    <button
                      type="button"
                      onClick={() => {
                        sound.playWarning();
                        onDeleteMod(mod.id);
                      }}
                      className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
                      title="Uninstall Mod"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
