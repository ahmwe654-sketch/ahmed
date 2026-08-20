import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Shield,
  Trash2,
  VolumeX,
  Clock,
  Sparkles,
  Megaphone
} from 'lucide-react';
import { ChatMessage, UserRole } from '../types';
import { sound } from '../utils/sound';

interface LiveChatViewProps {
  messages: ChatMessage[];
  userRole: UserRole;
  onSendMessage: (msg: string) => void;
}

export const LiveChatView: React.FC<LiveChatViewProps> = ({
  messages,
  userRole,
  onSendMessage
}) => {
  const [inputText, setInputText] = useState('');
  const [slowMode, setSlowMode] = useState(false);
  const [chatMuted, setChatMuted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const canBroadcast = userRole === 'owner' || userRole === 'admin' || userRole === 'moderator';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sound.playClick();
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Top Header & Moderation Controls */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">In-Game Live Chat Stream</h2>
            <div className="text-[11px] text-slate-400">Two-way communication with active Minecraft players</div>
          </div>
        </div>

        {/* Moderation Actions */}
        {canBroadcast && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setSlowMode(!slowMode);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                slowMode
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Slow Mode: {slowMode ? '5s' : 'Off'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playWarning();
                setChatMuted(!chatMuted);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                chatMuted
                  ? 'bg-red-500/20 border-red-500/40 text-red-300'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>{chatMuted ? 'Chat Muted' : 'Mute Chat'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Chat Messages Box */}
      <div className="glass-panel rounded-2xl p-4 h-[420px] overflow-y-auto custom-scrollbar space-y-3">
        {messages.length === 0 ? (
          <div className="text-slate-400 text-center py-20 text-xs">
            No in-game messages yet. Send a broadcast below!
          </div>
        ) : (
          messages.map((msg) => {
            const isSystem = msg.isSystem || msg.sender === 'Server';
            const isOp = msg.isOp || msg.sender === 'Admin';

            return (
              <div
                key={msg.id}
                className={`p-3 rounded-2xl flex items-start gap-3 transition-all ${
                  isSystem
                    ? 'bg-gradient-to-r from-emerald-500/10 to-violet-500/10 border border-emerald-500/20'
                    : 'bg-white/[0.02] border border-white/5 hover:border-white/10'
                }`}
              >
                {/* Avatar */}
                <img
                  src={`https://mc-heads.net/avatar/${msg.sender === 'Server' ? 'MHF_Chest' : msg.sender}/36`}
                  alt={msg.sender}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-lg border border-white/10 shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://mc-heads.net/avatar/Steve/36';
                  }}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={`text-xs font-bold ${
                        isSystem ? 'text-emerald-400 font-mono' : isOp ? 'text-amber-300' : 'text-slate-200'
                      }`}
                    >
                      {msg.sender}
                    </span>

                    {isOp && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                        OP
                      </span>
                    )}

                    <span className="text-[10px] text-slate-400 font-mono">[{msg.timestamp}]</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed break-words font-medium">
                    {msg.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Broadcast Input Box */}
      <div className="glass-panel rounded-2xl p-2.5 flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold shrink-0">
          <Megaphone className="w-3.5 h-3.5 text-emerald-400" />
          <span>[Server]</span>
        </div>

        <input
          type="text"
          placeholder={canBroadcast ? 'Type a broadcast message to all in-game players...' : 'Viewing chat only'}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={!canBroadcast}
          className="flex-1 bg-transparent border-none text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
        />

        <button
          type="button"
          disabled={!canBroadcast || !inputText.trim()}
          onClick={handleSend}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
        >
          <span>Broadcast</span>
          <Send className="w-3.5 h-3.5 fill-black" />
        </button>
      </div>
    </div>
  );
};
