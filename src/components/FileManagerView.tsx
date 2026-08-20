import React, { useState } from 'react';
import {
  FolderTree,
  FileCode,
  Save,
  CheckCircle2,
  FileText,
  Lock,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { ServerConfigFile, UserRole } from '../types';
import { sound } from '../utils/sound';

interface FileManagerViewProps {
  files: ServerConfigFile[];
  userRole: UserRole;
  onReadFile: (name: string) => Promise<string>;
  onSaveFile: (name: string, content: string) => void;
}

export const FileManagerView: React.FC<FileManagerViewProps> = ({
  files,
  userRole,
  onReadFile,
  onSaveFile
}) => {
  const [selectedFileName, setSelectedFileName] = useState<string>(files[0]?.name || 'server.properties');
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const canEdit = userRole === 'owner' || userRole === 'admin';

  const handleSelectFile = async (name: string) => {
    sound.playClick();
    setSelectedFileName(name);
    setIsLoading(true);
    try {
      const content = await onReadFile(name);
      setFileContent(content);
      setSaveStatus(null);
    } catch {
      setFileContent('# Error reading file content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    sound.playSuccess();
    onSaveFile(selectedFileName, fileContent);
    setSaveStatus('File successfully saved to disk!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Configuration File Browser</h2>
            <p className="text-xs text-slate-400">Inspect and edit core Fabric & Minecraft configuration files</p>
          </div>
        </div>

        {canEdit && (
          <button
            type="button"
            disabled={isLoading}
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer disabled:opacity-40"
          >
            <Save className="w-4 h-4 fill-black" />
            <span>Save Changes</span>
          </button>
        )}
      </div>

      {saveStatus && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Editor Grid: Sidebar File list + Main Textarea */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Left: Files List */}
        <div className="glass-panel rounded-2xl p-4 space-y-2 md:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Server Configs ({files.length})
          </span>

          <div className="space-y-1">
            {files.map((f) => {
              const isSelected = selectedFileName === f.name;

              return (
                <button
                  key={f.name}
                  type="button"
                  onClick={() => handleSelectFile(f.name)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-mono transition-all flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{f.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Code Editor */}
        <div className="glass-panel rounded-2xl p-4 md:col-span-3 flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/8">
            <span className="font-mono text-xs text-slate-300 font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              /{selectedFileName}
            </span>

            <span className="text-[10px] text-slate-400 font-mono">
              {canEdit ? 'Read & Write' : 'Read-Only Mode'}
            </span>
          </div>

          <textarea
            value={fileContent}
            onChange={(e) => setFileContent(e.target.value)}
            disabled={!canEdit || isLoading}
            rows={18}
            className="w-full bg-[#050608]/90 border border-white/10 rounded-xl p-4 font-mono text-xs text-emerald-300 leading-relaxed focus:outline-none focus:border-emerald-500/50 custom-scrollbar resize-y"
            placeholder="Loading configuration file..."
          />
        </div>
      </div>
    </div>
  );
};
