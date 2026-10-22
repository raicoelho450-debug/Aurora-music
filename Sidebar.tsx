import React, { useRef } from 'react';
import { 
  Home, 
  Compass, 
  Library, 
  History, 
  User, 
  Settings,
  LifeBuoy, 
  FolderPlus, 
  Smartphone,
  Sparkles,
  Download,
  Crown
} from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { getTranslation } from '../services/i18n';
import { NavTab } from '../types/music';

export type { NavTab };

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenInstallInfo: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, onOpenInstallInfo }) => {
  const { importLocalFiles, playlists, preferences } = useAudioPlayer();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const t = getTranslation(preferences.language || 'pt-BR');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await importLocalFiles(e.target.files);
      e.target.value = '';
    }
  };

  const navItems = [
    { id: 'home' as NavTab, label: t.navHome, icon: Home },
    { id: 'explore' as NavTab, label: t.navExplore, icon: Compass },
    { id: 'aurora-ai' as NavTab, label: 'Aurora AI DJ', icon: Sparkles },
    { id: 'aurora-plus' as NavTab, label: 'Aurora Plus VIP', icon: Crown, isSpecial: true },
    { id: 'library' as NavTab, label: t.navLibrary, icon: Library },
    { id: 'history' as NavTab, label: t.navHistory, icon: History },
    { id: 'profile' as NavTab, label: t.navProfile, icon: User },
    { id: 'settings' as NavTab, label: t.navSettings, icon: Settings },
    { id: 'support' as NavTab, label: t.navSupport, icon: LifeBuoy }
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 h-screen bg-[#090714] border-r border-purple-950/40 p-5 shrink-0 select-none overflow-y-auto">
      {/* Brand Logo & Wordmark */}
      <div 
        onClick={() => onSelectTab('home')}
        className="flex items-center gap-3.5 mb-8 cursor-pointer group"
      >
        <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-purple-900/30 ring-1 ring-purple-500/30 group-hover:scale-105 transition-transform">
          <img 
            src="/src/assets/images/aurora_logo_mark_1791926356511.jpg" 
            alt="Aurora Music Logo"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight text-white block">
            Aurora Music
          </span>
          <span className="text-[11px] text-purple-400 font-medium tracking-wide">
            Áudio em Alta Fidelidade
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="space-y-1 mb-8">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
          Menu Principal
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const isSpecial = (item as any).isSpecial;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                isActive
                  ? isSpecial 
                    ? 'bg-gradient-to-r from-amber-500/25 to-purple-600/20 text-white font-semibold shadow-sm ring-1 ring-amber-500/40'
                    : 'bg-gradient-to-r from-purple-600/25 to-blue-600/10 text-white font-semibold shadow-sm ring-1 ring-purple-500/30'
                  : isSpecial
                    ? 'text-amber-300/90 hover:text-amber-200 hover:bg-amber-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <Icon className={`w-5 h-5 shrink-0 ${
                  isActive 
                    ? isSpecial ? 'text-amber-400' : 'text-purple-400' 
                    : isSpecial ? 'text-amber-400' : 'text-slate-400'
                }`} />
                <span className="truncate">{item.label}</span>
              </div>
              {isSpecial && (
                <span className="text-[9px] font-black tracking-wider uppercase bg-gradient-to-r from-amber-500 to-orange-500 text-black px-1.5 py-0.5 rounded-md shadow-sm shrink-0">
                  VIP
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Local Audio Import Button */}
      <div className="mb-6">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          multiple 
          accept="audio/*,.mp3,.wav,.flac,.m4a,.ogg" 
          className="hidden" 
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-purple-900/30 active:scale-[0.98] transition-all"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Importar Músicas Locais</span>
        </button>
      </div>

      {/* Playlists Quick List */}
      <div className="flex-1 overflow-y-auto space-y-1 mb-6 pr-1">
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Playlists
          </span>
          <button 
            onClick={() => onSelectTab('library')}
            className="text-[11px] text-purple-400 hover:text-purple-300 font-medium"
          >
            Ver todas
          </button>
        </div>
        {playlists.slice(0, 5).map((pl) => {
          const isOffline = pl.id === 'playlist-offline' || pl.name.toLowerCase() === 'offline';
          return (
            <button
              key={pl.id}
              onClick={() => onSelectTab('library')}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs transition-colors text-left truncate ${
                isOffline 
                  ? 'bg-emerald-950/20 text-emerald-300 hover:bg-emerald-950/40 border border-emerald-500/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-md overflow-hidden bg-purple-950 shrink-0">
                  <img src={pl.coverUrl} alt={pl.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <span className="truncate font-medium">{pl.name}</span>
              </div>
              {isOffline && (
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                  <Download className="w-2.5 h-2.5" />
                  Offline
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Login / Register Trigger */}
      <div className="mt-auto pt-3 pb-2 border-t border-white/[0.06]">
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('aurora_open_auth', { detail: { mode: 'login' } }));
          }}
          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 border border-purple-500/30 text-purple-200 text-xs font-semibold flex items-center justify-between transition-all group shadow-sm cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span>Entrar / Cadastrar</span>
          </div>
          <span className="text-[10px] text-purple-300 font-mono group-hover:translate-x-0.5 transition-transform">
            →
          </span>
        </button>
      </div>

      {/* Android & PWA App Card */}
      <div className="pt-2">
        <button
          onClick={onOpenInstallInfo}
          className="w-full p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 hover:border-purple-500/40 text-left transition-all group"
        >
          <div className="flex items-center gap-2 text-xs font-medium text-purple-300 mb-1">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Versão Celular & APK</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Instale como PWA ou empacote via Capacitor no Android.
          </p>
        </button>
      </div>
    </aside>
  );
};
