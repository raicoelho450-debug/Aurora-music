import React from 'react';
import { Home, Compass, Library, Sparkles, User } from 'lucide-react';
import { NavTab } from './Sidebar';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { getTranslation } from '../services/i18n';

interface BottomNavBarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentTab, onSelectTab }) => {
  const { preferences, offlineTracks } = useAudioPlayer();
  const t = getTranslation(preferences.language || 'pt-BR');

  const tabs = [
    { id: 'home' as NavTab, label: t.navHome, icon: Home },
    { id: 'explore' as NavTab, label: t.navExplore, icon: Compass },
    { id: 'aurora-ai' as NavTab, label: 'Aurora AI', icon: Sparkles },
    { id: 'library' as NavTab, label: t.navLibrary, icon: Library },
    { id: 'profile' as NavTab, label: t.navProfile, icon: User }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090714]/95 backdrop-blur-xl border-t border-purple-950/50 pb-safe">
      <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          const hasOffline = tab.id === 'library' && offlineTracks.length > 0;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className="flex flex-col items-center justify-center min-h-[48px] min-w-[48px] py-1 text-center transition-colors group relative"
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'text-purple-400 scale-110' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {hasOffline && (
                  <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-[#090714]" />
                )}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-400 rounded-full" />
                )}
              </div>
              <span
                className={`text-[10px] font-medium tracking-tight mt-1 truncate ${
                  isActive ? 'text-white font-semibold' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
