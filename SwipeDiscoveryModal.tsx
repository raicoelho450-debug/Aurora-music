import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Heart, 
  Flame, 
  RotateCcw, 
  Play, 
  Pause, 
  Volume2, 
  Sparkles, 
  Check, 
  Music,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { Track } from '../types/music';

interface SwipeDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const IGNORED_TRACKS_KEY = 'aurora_ignored_discovery_tracks_v1';

export const SwipeDiscoveryModal: React.FC<SwipeDiscoveryModalProps> = ({ isOpen, onClose }) => {
  const { 
    tracks, 
    toggleFavorite, 
    isFavorite, 
    playTrack, 
    currentTrack, 
    isPlaying, 
    togglePlayPause,
    openCreatorPage 
  } = useAudioPlayer();

  const [cards, setCards] = useState<Track[]>([]);
  const [historySwipes, setHistorySwipes] = useState<{ track: Track; action: 'like' | 'skip' }[]>([]);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeFeedback, setSwipeFeedback] = useState<'like' | 'skip' | null>(null);

  const startXRef = useRef(0);

  // Load cards filtering out already ignored tracks
  useEffect(() => {
    if (!isOpen) return;

    let ignored: string[] = [];
    try {
      const saved = localStorage.getItem(IGNORED_TRACKS_KEY);
      if (saved) ignored = JSON.parse(saved);
    } catch {}

    const candidates = tracks.filter(t => !ignored.includes(t.id));
    setCards(candidates.length > 0 ? candidates : tracks);
  }, [isOpen, tracks]);

  if (!isOpen) return null;

  const currentCard = cards[0];

  const handleSwipeAction = (action: 'like' | 'skip') => {
    if (!currentCard) return;

    setSwipeFeedback(action);

    if (action === 'like') {
      if (!isFavorite(currentCard.id)) {
        toggleFavorite(currentCard.id);
      }
    } else {
      // Register ignored track
      try {
        const saved = localStorage.getItem(IGNORED_TRACKS_KEY);
        const list: string[] = saved ? JSON.parse(saved) : [];
        if (!list.includes(currentCard.id)) {
          list.push(currentCard.id);
          localStorage.setItem(IGNORED_TRACKS_KEY, JSON.stringify(list));
        }
      } catch {}
    }

    setHistorySwipes(prev => [{ track: currentCard, action }, ...prev]);

    setTimeout(() => {
      setCards(prev => prev.slice(1));
      setDragOffset(0);
      setSwipeFeedback(null);
    }, 280);
  };

  const handleUndo = () => {
    if (historySwipes.length === 0) return;
    const last = historySwipes[0];
    if (last.action === 'like' && isFavorite(last.track.id)) {
      toggleFavorite(last.track.id);
    }
    setCards(prev => [last.track, ...prev]);
    setHistorySwipes(prev => prev.slice(1));
  };

  // Touch & Mouse Drag Handlers
  const handleTouchStart = (clientX: number) => {
    startXRef.current = clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (clientX: number) => {
    if (!isDragging) return;
    const diff = clientX - startXRef.current;
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset > 90) {
      handleSwipeAction('like');
    } else if (dragOffset < -90) {
      handleSwipeAction('skip');
    } else {
      setDragOffset(0);
    }
  };

  const isCurrentCardPlaying = currentTrack?.id === currentCard?.id && isPlaying;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-in fade-in select-none">
      <div className="relative w-full max-w-md bg-[#0c081d] border border-purple-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl overflow-hidden flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-300 flex items-center justify-center border border-purple-500/30">
              <Flame className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Descoberta Musical</span>
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              </h2>
              <p className="text-[11px] text-slate-400">
                Deslize para a direita para curtir, esquerda para ignorar.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Arena */}
        <div className="relative w-full aspect-[4/5] max-w-sm flex items-center justify-center my-2">
          {currentCard ? (
            <div
              onMouseDown={(e) => handleTouchStart(e.clientX)}
              onMouseMove={(e) => handleTouchMove(e.clientX)}
              onMouseUp={handleTouchEnd}
              onTouchStart={(e) => handleTouchStart(e.touches[0].clientX)}
              onTouchMove={(e) => handleTouchMove(e.touches[0].clientX)}
              onTouchEnd={handleTouchEnd}
              style={{
                transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.08}deg)`,
                transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              className={`absolute inset-0 rounded-3xl overflow-hidden border cursor-grab active:cursor-grabbing bg-gradient-to-b from-[#180a36] to-[#0a0518] shadow-2xl flex flex-col justify-between p-5 ${
                dragOffset > 40 || swipeFeedback === 'like'
                  ? 'border-emerald-500/60 ring-2 ring-emerald-500/40'
                  : dragOffset < -40 || swipeFeedback === 'skip'
                  ? 'border-rose-500/60 ring-2 ring-rose-500/40'
                  : 'border-purple-500/30'
              }`}
            >
              {/* Swipe Visual Feedback Stamps */}
              {(dragOffset > 40 || swipeFeedback === 'like') && (
                <div className="absolute top-6 left-6 z-20 px-3.5 py-1 rounded-xl bg-emerald-500/90 text-white font-extrabold text-sm uppercase tracking-wider rotate-[-12deg] shadow-lg animate-in zoom-in-75">
                  ❤️ CURTIR
                </div>
              )}
              {(dragOffset < -40 || swipeFeedback === 'skip') && (
                <div className="absolute top-6 right-6 z-20 px-3.5 py-1 rounded-xl bg-rose-600/90 text-white font-extrabold text-sm uppercase tracking-wider rotate-[12deg] shadow-lg animate-in zoom-in-75">
                  ✕ IGNORAR
                </div>
              )}

              {/* Cover Artwork */}
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-purple-950 shadow-xl ring-1 ring-white/10 group">
                <img
                  src={currentCard.coverUrl}
                  alt={currentCard.title}
                  className="w-full h-full object-cover pointer-events-none"
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isCurrentCardPlaying) {
                      togglePlayPause();
                    } else {
                      playTrack(currentCard, cards);
                    }
                  }}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:!opacity-100 transition-opacity"
                >
                  <div className="w-14 h-14 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-xl shadow-purple-950/80 active:scale-95 transition-transform">
                    {isCurrentCardPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
                  </div>
                </button>
              </div>

              {/* Info Details */}
              <div className="pt-3 space-y-1 text-center">
                <h3 className="text-lg font-extrabold text-white truncate max-w-xs mx-auto">
                  {currentCard.title}
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openCreatorPage(currentCard.artist);
                  }}
                  className="text-xs text-purple-300 hover:underline hover:text-white transition-colors cursor-pointer block mx-auto truncate max-w-xs"
                >
                  {currentCard.artist}
                </button>
                <div className="flex items-center justify-center gap-2 pt-1 text-[11px] font-mono text-slate-400">
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 uppercase">
                    {currentCard.genre || 'Música'}
                  </span>
                  <span>·</span>
                  <span>{Math.round(currentCard.duration)}s</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-purple-950/40 border border-purple-500/30 text-purple-300 flex items-center justify-center mx-auto shadow-xl">
                <Music className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">Todas as Descobertas Exploradas!</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Você explorou todas as músicas disponíveis nesta rodada.
              </p>
              <button
                onClick={() => setCards(tracks)}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-md hover:bg-purple-500"
              >
                Recarregar Catálogo
              </button>
            </div>
          )}
        </div>

        {/* Accessible Navigation Action Buttons */}
        <div className="w-full flex items-center justify-center gap-4 pt-2">
          {/* Skip Button */}
          <button
            onClick={() => handleSwipeAction('skip')}
            disabled={!currentCard}
            className="w-14 h-14 rounded-full bg-white/[0.05] hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 text-rose-400 flex items-center justify-center shadow-lg active:scale-95 transition-all disabled:opacity-40"
            title="Ignorar recomendação (Deslizar para a esquerda)"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Undo Button */}
          <button
            onClick={handleUndo}
            disabled={historySwipes.length === 0}
            className="w-10 h-10 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-400 hover:text-white flex items-center justify-center active:scale-95 transition-all disabled:opacity-30"
            title="Desfazer última ação"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Audio Preview Trigger */}
          {currentCard && (
            <button
              onClick={() => {
                if (isCurrentCardPlaying) {
                  togglePlayPause();
                } else {
                  playTrack(currentCard, cards);
                }
              }}
              className="w-12 h-12 rounded-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 flex items-center justify-center active:scale-95 transition-all"
              title="Prévia do Áudio"
            >
              {isCurrentCardPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
          )}

          {/* Like Favorite Button */}
          <button
            onClick={() => handleSwipeAction('like')}
            disabled={!currentCard}
            className="w-14 h-14 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shadow-lg active:scale-95 transition-all disabled:opacity-40"
            title="Curtir e Salvar nos Favoritos (Deslizar para a direita)"
          >
            <Heart className="w-6 h-6 fill-emerald-500/20" />
          </button>
        </div>
      </div>
    </div>
  );
};
