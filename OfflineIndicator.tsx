import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, CheckCircle2, X } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [showReconnectedToast, setShowReconnectedToast] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnectedToast(true);
      setDismissed(false);
      const timer = setTimeout(() => {
        setShowReconnectedToast(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnectedToast(false);
      setDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // When reconnected
  if (showReconnectedToast) {
    return (
      <div className="fixed bottom-24 left-4 z-40 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs font-medium shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
        <Wifi className="w-4 h-4 text-emerald-400" />
        <span>Conexão restabelecida! Sincronização online ativa.</span>
      </div>
    );
  }

  // When offline
  if (!isOnline && !dismissed) {
    return (
      <div className="fixed bottom-24 left-4 z-40 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#1b122c]/95 border border-purple-500/40 text-purple-200 text-xs font-medium shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <WifiOff className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <span>Modo Offline PWA — Tocando suas faixas locais e cache</span>
        <button
          onClick={() => setDismissed(true)}
          className="ml-1 p-0.5 text-slate-400 hover:text-white rounded transition-colors"
          title="Fechar aviso"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return null;
};
