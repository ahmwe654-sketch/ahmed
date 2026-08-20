import React, { useState } from 'react';
import {
  LayoutDashboard,
  Server,
  Users,
  Globe,
  Boxes,
  Terminal,
  MessageSquare,
  Navigation,
  Activity,
  Archive,
  Clock,
  Flame,
  Skull,
  ShieldCheck,
  Ban,
  FolderTree,
  Settings,
  X,
  Power,
  Layers,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check
} from 'lucide-react';
import { NavigationTab, ServerStatusData, Language } from '../types';
import { getTranslation, isRTL } from '../utils/i18n';
import { sound } from '../utils/sound';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  serverStatus: ServerStatusData | null;
  lang: Language;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItemConfig {
  id: NavigationTab;
  labelKey: string;
  icon: React.ElementType;
  badge?: string | number;
  sectionKey?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
  serverStatus,
  lang,
  collapsed = false,
  onToggleCollapse
}) => {
  const [copiedIp, setCopiedIp] = useState(false);
  const isOnline = serverStatus?.status === 'ONLINE' || serverStatus?.online !== false;
  const rtl = isRTL(lang);

  const navItems: NavItemConfig[] = [
    // OVERVIEW
    { sectionKey: 'nav_overview', id: 'dashboard', labelKey: 'nav_dashboard', icon: LayoutDashboard },

    // SERVER
    { sectionKey: 'nav_server_section', id: 'server', labelKey: 'nav_server', icon: Server },
    { id: 'console', labelKey: 'nav_console', icon: Terminal },
    { id: 'performance', labelKey: 'nav_performance', icon: Activity },

    // PLAYERS
    { sectionKey: 'nav_players_section', id: 'players', labelKey: 'nav_players', icon: Users, badge: serverStatus?.playersOnline || undefined },
    { id: 'whitelist', labelKey: 'nav_whitelist', icon: ShieldCheck },
    { id: 'bans', labelKey: 'nav_bans', icon: Ban },

    // WORLD
    { sectionKey: 'nav_world_section', id: 'world', labelKey: 'nav_world', icon: Globe },
    { id: 'teleport', labelKey: 'nav_teleport', icon: Navigation },

    // CONTENT
    { sectionKey: 'nav_content_section', id: 'mods', labelKey: 'nav_mods', icon: Boxes, badge: '14' },
    { id: 'files', labelKey: 'nav_files', icon: FolderTree },
    { id: 'backups', labelKey: 'nav_backups', icon: Archive },

    // AUTOMATION
    { sectionKey: 'nav_automation_section', id: 'scheduler', labelKey: 'nav_scheduler', icon: Clock },

    // LOGS
    { sectionKey: 'nav_logs_section', id: 'chat', labelKey: 'nav_chat', icon: MessageSquare },
    { id: 'events', labelKey: 'nav_events', icon: Flame },
    { id: 'deaths', labelKey: 'nav_deaths', icon: Skull },

    // SYSTEM
    { sectionKey: 'nav_system_section', id: 'settings', labelKey: 'nav_settings', icon: Settings }
  ];

  const handleNavClick = (tab: NavigationTab) => {
    sound.playClick();
    onSelectTab(tab);
    onCloseMobile();
  };

  const handleCopyIp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const ip = serverStatus?.ip ? `${serverStatus.ip}:25565` : 'aegis-smp.ply.gg:25565';
    navigator.clipboard.writeText(ip);
    sound.playClick();
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2000);
  };

  const renderSidebarContent = (isMobileDrawer: boolean) => {
    const isCollapsedMode = !isMobileDrawer && collapsed;

    return (
      <div
        className={`flex flex-col h-full bg-[#08090d]/95 backdrop-blur-2xl select-none transition-all duration-300 ${
          isMobileDrawer
            ? (rtl ? 'border-l border-white/12' : 'border-r border-white/12')
            : (rtl ? 'border-l border-white/8' : 'border-r border-white/8')
        }`}
      >
        {/* Sidebar Header */}
        <div
          className={`p-3.5 border-b border-white/8 flex items-center ${
            isCollapsedMode ? 'justify-center' : 'justify-between'
          } h-16 shrink-0 bg-white/[0.01]`}
        >
          {!isCollapsedMode ? (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-violet-500/20 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.25)] shrink-0">
                  <Layers className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-xs font-black uppercase tracking-wider text-white truncate">
                      AEGIS CORE
                    </h2>
                    <span className="px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[9px] font-mono font-bold hidden sm:inline">
                      v1.20
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isOnline
                          ? 'bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]'
                          : 'bg-red-400'
                      }`}
                    />
                    <span className="truncate">
                      {isOnline
                        ? getTranslation(lang, 'state_online')
                        : getTranslation(lang, 'state_offline')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Desktop Collapse Button */}
              {!isMobileDrawer && onToggleCollapse && (
                <button
                  id="sidebar-collapse-btn"
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onToggleCollapse();
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors cursor-pointer hidden lg:flex items-center justify-center"
                  title="Collapse Sidebar (Icon Rail)"
                >
                  {rtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
              )}

              {/* Mobile Close Button (X) */}
              {isMobileDrawer && (
                <button
                  id="mobile-drawer-close-btn"
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onCloseMobile();
                  }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 hover:border-white/20 transition-all cursor-pointer shadow-sm group"
                  title="Close Navigation Drawer"
                >
                  <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
              )}
            </>
          ) : (
            /* Collapsed Icon Rail Header */
            <div className="flex flex-col items-center gap-1.5">
              <button
                id="sidebar-expand-btn"
                type="button"
                onClick={() => {
                  sound.playClick();
                  onToggleCollapse?.();
                }}
                className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/25 transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)] cursor-pointer group"
                title="Expand Navigation"
              >
                <Layers className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation List */}
        <div
          className={`flex-1 overflow-y-auto custom-scrollbar ${
            isCollapsedMode ? 'px-2 py-3 space-y-1.5' : 'p-3 space-y-1'
          }`}
        >
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const itemLabel = getTranslation(lang, item.labelKey);

            return (
              <React.Fragment key={item.id}>
                {/* Section Header or Divider */}
                {item.sectionKey && (
                  !isCollapsedMode ? (
                    <div
                      className={`px-3 pt-3 pb-1 text-[10px] font-bold text-slate-500 tracking-wider uppercase font-mono ${
                        idx > 0 ? 'mt-2 border-t border-white/5' : ''
                      }`}
                    >
                      {getTranslation(lang, item.sectionKey)}
                    </div>
                  ) : (
                    idx > 0 && <div className="h-px bg-white/5 my-2 mx-1" />
                  )
                )}

                {/* Nav Button */}
                <div className="relative group">
                  <button
                    id={`sidebar-tab-${item.id}`}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isCollapsedMode
                        ? 'justify-center p-2.5'
                        : 'justify-between px-3 py-2.5'
                    } ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500/15 to-violet-500/10 text-emerald-300 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)] font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
                    }`}
                  >
                    <div
                      className={`flex items-center ${
                        isCollapsedMode ? 'justify-center' : 'gap-3'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 transition-transform group-hover:scale-110 shrink-0 ${
                          isActive
                            ? 'text-emerald-400'
                            : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      />
                      {!isCollapsedMode && <span className="truncate">{itemLabel}</span>}
                    </div>

                    {!isCollapsedMode && item.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 ${
                          isActive
                            ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                            : 'bg-white/5 text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>

                  {/* Glassmorphism Tooltip for Collapsed Sidebar */}
                  {isCollapsedMode && (
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 ${
                        rtl ? 'right-full mr-3' : 'left-full ml-3'
                      } hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0c0e14]/95 border border-white/12 backdrop-blur-xl text-xs font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.8)] opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 pointer-events-none z-50 whitespace-nowrap`}
                    >
                      <span className="font-medium text-slate-200">{itemLabel}</span>
                      {item.badge !== undefined && (
                        <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Minimal Server Identity / Status Widget (Footer) */}
        <div
          className={`p-3 border-t border-white/6 bg-black/40 shrink-0 ${
            isCollapsedMode ? 'flex justify-center' : ''
          }`}
        >
          {!isCollapsedMode ? (
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/6 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isOnline
                        ? 'bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse'
                        : 'bg-red-400'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-200 truncate">
                      {serverStatus?.serverName || 'Aegis Survival'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                      <span>Fabric 1.20.4</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-bold">
                        {serverStatus?.playersOnline || 0}/{serverStatus?.maxPlayers || 20}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyIp}
                  title={copiedIp ? 'IP Copied!' : 'Copy Server Address'}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition-all cursor-pointer shrink-0"
                >
                  {copiedIp ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Collapsed Minimal Status Indicator */
            <div className="relative group">
              <button
                type="button"
                onClick={handleCopyIp}
                className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/8 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all cursor-pointer"
                title="Copy Server IP"
              >
                <Power className={`w-4 h-4 ${isOnline ? 'text-emerald-400' : 'text-red-400'}`} />
              </button>

              {/* Tooltip */}
              <div
                className={`absolute top-1/2 -translate-y-1/2 ${
                  rtl ? 'right-full mr-3' : 'left-full ml-3'
                } hidden lg:flex flex-col gap-0.5 px-3 py-2 rounded-xl bg-[#0c0e14]/95 border border-white/12 backdrop-blur-xl text-xs text-white shadow-2xl opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 pointer-events-none z-50 whitespace-nowrap`}
              >
                <div className="flex items-center gap-1.5 font-bold text-slate-200">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isOnline ? 'bg-emerald-400' : 'bg-red-400'
                    }`}
                  />
                  <span>{serverStatus?.serverName || 'Aegis Survival'}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Fabric 1.20.4 • {serverStatus?.playersOnline || 0}/{serverStatus?.maxPlayers || 20}{' '}
                  players
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Fixed Sidebar (Expanded w-64 OR Collapsed w-[72px]) */}
      <aside
        className={`hidden lg:block h-screen fixed top-0 z-40 transition-all duration-300 ${
          collapsed ? 'w-[72px]' : 'w-64'
        } ${rtl ? 'right-0' : 'left-0'}`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Floating Overlay Slide-in Drawer */}
      {mobileOpen && (
        <div
          className={`fixed inset-0 z-50 lg:hidden flex ${
            rtl ? 'justify-end' : 'justify-start'
          }`}
        >
          {/* Backdrop Blur Overlay with Smooth Fade */}
          <div
            id="mobile-drawer-backdrop"
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
            onClick={() => {
              sound.playClick();
              onCloseMobile();
            }}
          />

          {/* Floating Glassmorphic Slide-in Drawer */}
          <div
            className={`relative z-10 w-80 max-w-[85vw] h-full shadow-[0_0_60px_rgba(0,0,0,0.95)] animate-in duration-300 ease-out ${
              rtl ? 'slide-in-from-right' : 'slide-in-from-left'
            }`}
          >
            {renderSidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
