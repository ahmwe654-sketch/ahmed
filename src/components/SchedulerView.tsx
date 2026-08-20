import React, { useState } from 'react';
import {
  Clock,
  Plus,
  Trash2,
  Power,
  RotateCw,
  Archive,
  Megaphone,
  Terminal,
  Sparkles
} from 'lucide-react';
import { ScheduledTask, UserRole } from '../types';
import { sound } from '../utils/sound';

interface SchedulerViewProps {
  tasks: ScheduledTask[];
  userRole: UserRole;
  onCreateTask: (task: Partial<ScheduledTask>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export const SchedulerView: React.FC<SchedulerViewProps> = ({
  tasks,
  userRole,
  onCreateTask,
  onToggleTask,
  onDeleteTask
}) => {
  const [taskName, setTaskName] = useState('');
  const [taskType, setTaskType] = useState<'restart' | 'backup' | 'broadcast' | 'command'>('restart');
  const [taskTime, setTaskTime] = useState('04:00');
  const [taskInterval, setTaskInterval] = useState(6);
  const [taskMessage, setTaskMessage] = useState('Daily scheduled server maintenance restart');
  const [taskCommand, setTaskCommand] = useState('save-all');
  const [showModal, setShowModal] = useState(false);

  const canManage = userRole === 'owner' || userRole === 'admin';

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;
    sound.playSuccess();
    onCreateTask({
      name: taskName.trim(),
      type: taskType,
      timeOfDay: taskTime,
      intervalHours: taskInterval,
      broadcastMessage: taskType === 'broadcast' ? taskMessage : undefined,
      command: taskType === 'command' ? taskCommand : undefined,
      enabled: true,
      warnMinutesBefore: [15, 5, 1]
    });
    setTaskName('');
    setShowModal(false);
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'restart':
        return <RotateCw className="w-4 h-4 text-amber-400" />;
      case 'backup':
        return <Archive className="w-4 h-4 text-emerald-400" />;
      case 'broadcast':
        return <Megaphone className="w-4 h-4 text-sky-400" />;
      default:
        return <Terminal className="w-4 h-4 text-violet-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Task Scheduler & Auto-Cron</h2>
            <p className="text-xs text-slate-400">Automated daemon tasks with countdown broadcast warnings</p>
          </div>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setShowModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Scheduled Task</span>
          </button>
        )}
      </div>

      {/* Tasks List */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Configured Tasks ({tasks.length})
        </h3>

        <div className="space-y-3">
          {tasks.map((task) => {
            const isEnabled = task.enabled;

            return (
              <div
                key={task.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isEnabled
                    ? 'bg-white/[0.02] border-white/6 hover:border-white/12'
                    : 'bg-black/20 border-white/4 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 shrink-0 mt-0.5">
                    {getTaskIcon(task.type)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{task.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/5 border border-white/10 text-slate-300">
                        {task.type}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap font-mono">
                      {task.timeOfDay && <span>Time: {task.timeOfDay} UTC</span>}
                      {task.intervalHours && <span>Interval: Every {task.intervalHours} hours</span>}
                      {task.warnMinutesBefore && (
                        <span>Warnings: {task.warnMinutesBefore.join(', ')}m prior</span>
                      )}
                    </div>
                  </div>
                </div>

                {canManage && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        onToggleTask(task.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isEnabled
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-white/5 border-white/10 text-slate-400'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{isEnabled ? 'Enabled' : 'Disabled'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        onDeleteTask(task.id);
                      }}
                      className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-slate-400 hover:text-red-300 cursor-pointer"
                      title="Delete Scheduled Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <form
            onSubmit={handleCreate}
            className="relative z-10 w-full max-w-md bg-[#0d1017] border border-white/12 rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-base font-bold text-white">New Scheduled Automation</h3>

            <div>
              <label className="block text-slate-400 text-xs mb-1 font-semibold">Task Name</label>
              <input
                type="text"
                placeholder="e.g. Daily 4 AM Restart"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-xs mb-1 font-semibold">Task Type</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as any)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              >
                <option value="restart">Scheduled Server Restart</option>
                <option value="backup">Automated World Backup</option>
                <option value="broadcast">Announcement Broadcast</option>
                <option value="command">Custom Console Command</option>
              </select>
            </div>

            {taskType === 'restart' && (
              <div>
                <label className="block text-slate-400 text-xs mb-1 font-semibold">Time of Day (UTC)</label>
                <input
                  type="time"
                  value={taskTime}
                  onChange={(e) => setTaskTime(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            )}

            {taskType === 'backup' && (
              <div>
                <label className="block text-slate-400 text-xs mb-1 font-semibold">Interval (Hours)</label>
                <input
                  type="number"
                  min="1"
                  max="48"
                  value={taskInterval}
                  onChange={(e) => setTaskInterval(parseInt(e.target.value, 10))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            )}

            {taskType === 'broadcast' && (
              <div>
                <label className="block text-slate-400 text-xs mb-1 font-semibold">Broadcast Message</label>
                <input
                  type="text"
                  value={taskMessage}
                  onChange={(e) => setTaskMessage(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            )}

            {taskType === 'command' && (
              <div>
                <label className="block text-slate-400 text-xs mb-1 font-semibold">Console Command</label>
                <input
                  type="text"
                  value={taskCommand}
                  onChange={(e) => setTaskCommand(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none font-mono"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold cursor-pointer"
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
