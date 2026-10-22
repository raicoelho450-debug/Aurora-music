import React, { useEffect, useState } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Heart, 
  Volume2, 
  VolumeX, 
  Repeat, 
  Shuffle, 
  FileText, 
  Sliders, 
  Maximize2, 
  Minimize2,
  Clock,
  Sparkles,
  Download
} from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { EQUALIZER_PRESETS } from '../services/equalizerService';

interface FullScreenArtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEqualizer?: () => void;
}

export const FullScreenArtModal: React.FC<FullScreenArtModalProps> = ({
  isOpen,
  onClose,
  onOpenEqualizer
}) => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seek,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    repeatMode,
    cycleRepeat,
    isShuffled,
    toggleShuffle,
    isFavorite,
    toggleFavorite,
    preferences,
    sleepTimerMinutes,
    downloadTrackOffline,
    removeTrackOffline,
    isTrackOffline
  } = useAudioPlayer();

  const [showLyrics, setShowLyrics] = useState(false);
  const [isBrowserFullScreen, setIsBrowserFullScreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'ArrowRight') {
        seek(Math.min(duration, currentTime + 5));
      } else if (e.key === 'ArrowLeft') {
        seek(Math.max(0, currentTime - 5));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, togglePlayPause, seek, duration, currentTime]);

  if (!isOpen || !currentTrack) return null;

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsBrowserFullScreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsBrowserFullScreen(false);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isFav = isFavorite(currentTrack.id);
  const isOffline = isTrackOffline(currentTrack.id);
  const activePreset = EQUALIZER_PRESETS[preferences.equalizer?.preset || 'flat'];

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-300">
      {/* Blurred Ambient Backdrop */}
      <div 
        className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-35 scale-125 transition-all duration-1000 pointer-events-none"
        style={{ backgroundImage: `url(${currentTrack.coverUrl})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80 pointer-events-none" />

      {/* Top Header Controls */}
      <header className="relative z-10 flex items-center justify-between p-6 md:p-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all active:scale-95"
            title="Sair da Tela Cheia (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold block">
              AURORA MUSIC · IMERSÃO TOTAL
            </span>
            <span className="text-xs text-slate-300 font-medium truncate max-w-xs block">
              {currentTrack.album}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Equalizer Preset Pill */}
          {onOpenEqualizer && (
            <button
              onClick={() => {
                onClose();
                onOpenEqualizer();
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 transition-all"
              title="Abrir Equalizador"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>EQ: {activePreset?.name || 'Ativo'}</span>
            </button>
          )}

          {/* Toggle Lyrics */}
          <button
            onClick={() => setShowLyrics(!showLyrics)}
            className={`p-2.5 rounded-full backdrop-blur-md transition-all ${
              showLyrics
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50'
                : 'bg-white/10 hover:bg-white/20 text-slate-300'
            }`}
            title="Alternar Letras"
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* Native Fullscreen Toggle */}
          <button
            onClick={toggleBrowserFullscreen}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 backdrop-blur-md transition-all hidden sm:flex"
            title="Tela Cheia do Navegador"
          >
            {isBrowserFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Center Artwork / Lyrics Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-5xl mx-auto w-full">
        {!showLyrics ? (
          <div className="flex flex-col items-center justify-center text-center space-y-6">
            {/* Glowing High-Definition Artwork Container */}
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-3xl overflow-hidden shadow-2xl shadow-purple-950/80 ring-1 ring-purple-500/40 group">
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className={`w-full h-full object-cover transition-transform duration-700 ${
                  isPlaying ? 'scale-105' : 'scale-100'
                }`}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-purple-300 border border-purple-500/30">
                  {currentTrack.format === 'youtube' ? 'YOUTUBE OFICIAL' : 'FLAC / PCM 24-BIT'}
                </span>
                {isOffline && (
                  <span className="text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    OFFLINE
                  </span>
                )}
              </div>
            </div>

            {/* Title & Artist */}
            <div className="space-y-1.5 max-w-lg">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight line-clamp-1 drop-shadow-md">
                {currentTrack.title}
              </h1>
              <p className="text-base sm:text-lg text-purple-300/90 font-medium">
                {currentTrack.artist}
              </p>
              {currentTrack.genre && (
                <span className="inline-block text-[11px] font-medium text-slate-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10 mt-1">
                  {currentTrack.genre}
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Lyrics View Overlay */
          <div className="w-full max-w-xl h-96 overflow-y-auto p-6 rounded-3xl bg-black/60 backdrop-blur-xl border border-white/10 space-y-4 text-center">
            <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider block font-bold">
              Letras da Canção
            </span>
            {currentTrack.lyrics && currentTrack.lyrics.length > 0 ? (
              <div className="space-y-3">
                {currentTrack.lyrics.map((line, idx) => (
                  <p key={idx} className="text-base sm:text-lg text-slate-200 font-medium leading-relaxed">
                    {line}
                  </p>
                ))}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-2">
                <FileText className="w-8 h-8 text-purple-400/60" />
                <p className="text-sm">Letra sincronizada em processamento para esta faixa.</p>
                <p className="text-xs text-slate-500">Aproveite a experiência sonora pura em alta resolução.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Player Scrub Bar & Primary Controls */}
      <footer className="relative z-10 p-6 md:p-8 max-w-4xl mx-auto w-full space-y-4">
        {/* Scrub Bar */}
        <div className="space-y-1.5">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => seek(Number(e.target.value))}
            className="w-full accent-purple-500 h-2 bg-white/20 rounded-full cursor-pointer hover:bg-white/30 transition-all"
          />
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between">
          {/* Favorite & Offline Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFavorite(currentTrack.id)}
              className={`p-2.5 rounded-full transition-all ${
                isFav ? 'text-rose-400 bg-rose-500/20' : 'text-slate-400 hover:text-white bg-white/5'
              }`}
              title="Favoritar"
            >
              <Heart className={`w-5 h-5 ${isFav ? 'fill-rose-500' : ''}`} />
            </button>

            <button
              onClick={() => {
                if (isOffline) removeTrackOffline(currentTrack.id);
                else downloadTrackOffline(currentTrack);
              }}
              className={`p-2.5 rounded-full transition-all ${
                isOffline ? 'text-emerald-400 bg-emerald-500/20' : 'text-slate-400 hover:text-white bg-white/5'
              }`}
              title={isOffline ? 'Salvo no App' : 'Baixar para o App'}
            >
              <Download className="w-5 h-5" />
            </button>
          </div>

          {/* Core Playback Buttons */}
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={toggleShuffle}
              className={`p-2 rounded-full transition-colors ${
                isShuffled ? 'text-purple-400' : 'text-slate-400 hover:text-white'
              }`}
              title="Aleatório"
            >
              <Shuffle className="w-5 h-5" />
            </button>

            <button
              onClick={prevTrack}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
              title="Anterior"
            >
              <SkipBack className="w-6 h-6" />
            </button>

            <button
              onClick={togglePlayPause}
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-2xl shadow-purple-900/60 transition-all active:scale-95"
              title={isPlaying ? 'Pausar' : 'Reproduzir'}
            >
              {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
            </button>

            <button
              onClick={nextTrack}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
              title="Próxima"
            >
              <SkipForward className="w-6 h-6" />
            </button>

            <button
              onClick={cycleRepeat}
              className={`p-2 rounded-full transition-colors relative ${
                repeatMode !== 'off' ? 'text-purple-400' : 'text-slate-400 hover:text-white'
              }`}
              title="Repetir"
            >
              <Repeat className="w-5 h-5" />
              {repeatMode === 'one' && (
                <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-purple-600 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center">
                  1
                </span>
              )}
            </button>
          </div>

          {/* Volume Control */}
          <div className="hidden md:flex items-center gap-2">
            <button onClick={toggleMute} className="text-slate-400 hover:text-white">
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-24 accent-purple-500 cursor-pointer"
            />
          </div>
        </div>
      </footer>
    </div>
  );
};
