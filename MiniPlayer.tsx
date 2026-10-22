import React from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Heart, 
  Volume2, 
  VolumeX, 
  Maximize2,
  Loader2,
  ListMusic,
  Download,
  CheckCircle2,
  MessageSquare
} from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { formatTime } from '../utils/format';

export const MiniPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleMute,
    toggleFavorite,
    isFavorite,
    setIsExpandedPlayerOpen,
    isLoadingAudio,
    openCreatorPage,
    downloadTrackOffline,
    removeTrackOffline,
    isTrackOffline,
    isDownloadingTrack,
    openCommentsTab
  } = useAudioPlayer();

  if (!currentTrack) return null;

  const effectiveDuration = duration > 0 ? duration : (currentTrack.duration || 1);
  const progressPercent = Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100));
  const favorited = isFavorite(currentTrack.id);
  const isOffline = isTrackOffline(currentTrack.id);
  const isDownloading = isDownloadingTrack(currentTrack.id);

  return (
    <div className="fixed md:left-64 lg:left-72 left-0 right-0 bottom-16 md:bottom-0 z-30 bg-[#0e0a1c]/95 backdrop-blur-xl border-t border-purple-950/40 select-none shadow-2xl transition-all">
      {/* Top Scrub Progress Bar */}
      <div 
        className="relative w-full h-1 bg-white/10 cursor-pointer group"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          if (rect.width <= 0) return;
          const clickPos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          if (effectiveDuration > 0) {
            seek(clickPos * effectiveDuration);
          }
        }}
      >
        <div 
          className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 group-hover:brightness-125 transition-all"
          style={{ width: `${progressPercent}%` }}
        />
        <div 
          className="absolute top-1/2 -translate-y-1/2 -ml-1.5 w-3 h-3 bg-white rounded-full shadow-md shadow-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between px-3 md:px-6 py-2.5 max-w-7xl mx-auto gap-2 md:gap-6">
        {/* Track Info (Opens Full Player on Click) */}
        <div 
          onClick={() => setIsExpandedPlayerOpen(true)}
          className="flex items-center gap-3 cursor-pointer group min-w-0 max-w-[220px] sm:max-w-xs md:max-w-sm"
        >
          <div className="relative w-11 h-11 md:w-12 md:h-12 rounded-xl overflow-hidden shrink-0 shadow-md shadow-purple-950/50 ring-1 ring-purple-500/20 group-hover:ring-purple-400 transition-all">
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className={`w-full h-full object-cover transition-transform ${isPlaying ? 'scale-105' : ''}`}
              referrerPolicy="no-referrer"
            />
            {isLoadingAudio && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                {currentTrack.title}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openCreatorPage(currentTrack.artist);
              }}
              className="text-[11px] text-slate-400 hover:text-purple-300 hover:underline truncate block text-left transition-colors cursor-pointer"
              title={`Ver página do criador: ${currentTrack.artist}`}
            >
              {currentTrack.artist}
            </button>
          </div>
        </div>

        {/* Center Controls */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1 sm:gap-3">
            <button
              onClick={() => toggleFavorite(currentTrack.id)}
              className="p-2 text-slate-400 hover:text-purple-400 transition-colors"
              aria-label={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Heart className={`w-4 h-4 ${favorited ? 'fill-purple-500 text-purple-500' : ''}`} />
            </button>

            <button
              onClick={() => openCommentsTab(currentTrack)}
              className="p-2 text-slate-400 hover:text-purple-300 transition-colors"
              title="Comentários da música"
              aria-label="Ver comentários da música"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            <button
              onClick={prevTrack}
              className="p-2 text-slate-300 hover:text-white transition-colors"
              aria-label="Faixa anterior"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlayPause}
              disabled={isLoadingAudio}
              className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-purple-900/40 hover:scale-105 active:scale-95 transition-all"
              aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
            >
              {isLoadingAudio ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={nextTrack}
              className="p-2 text-slate-300 hover:text-white transition-colors"
              aria-label="Próxima faixa"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono tabular-nums text-slate-500">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Volume & Fullscreen / Queue Trigger */}
        <div className="flex items-center gap-3">
          {/* Desktop Volume Slider */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-slate-400 hover:text-white transition-colors"
              aria-label={isMuted ? 'Desmutar' : 'Mutar'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 h-1 accent-purple-500"
              aria-label="Controle de volume"
            />
          </div>

          {/* Download Offline Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isOffline) {
                removeTrackOffline(currentTrack.id);
              } else {
                downloadTrackOffline(currentTrack);
              }
            }}
            disabled={isDownloading}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border shrink-0 ${
              isOffline
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                : 'bg-purple-600/20 border-purple-500/40 text-white hover:bg-purple-600/35 hover:border-purple-400/50 shadow-sm shadow-purple-950/50'
            }`}
            title={isOffline ? 'Salvo na playlist Offline do app (Clique para remover)' : 'Baixar música para a pasta Offline dentro do app'}
          >
            {isDownloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-300" />
            ) : isOffline ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Download className="w-3.5 h-3.5 text-purple-300" />
            )}
            <span className="font-semibold tracking-wide">
              {isDownloading ? 'Baixando...' : isOffline ? 'Baixado' : 'Baixar'}
            </span>
          </button>

          <button
            onClick={() => setIsExpandedPlayerOpen(true)}
            className="p-2 text-slate-400 hover:text-purple-300 transition-colors"
            title="Expandir reprodutor"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
