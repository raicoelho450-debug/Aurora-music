import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  X, 
  Mic2, 
  Maximize2, 
  Minimize2, 
  Type, 
  Sparkles, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Music,
  Heart
} from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { formatTime } from '../utils/format';
import { TimedLyricLine } from '../types/music';

interface KaraokeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KaraokeModal: React.FC<KaraokeModalProps> = ({ isOpen, onClose }) => {
  const { 
    currentTrack, 
    currentTime, 
    duration, 
    isPlaying, 
    togglePlayPause, 
    nextTrack, 
    prevTrack, 
    seek, 
    toggleFavorite, 
    isFavorite,
    isYouTubeTrack,
    volume,
    setVolume,
    isMuted,
    toggleMute
  } = useAudioPlayer();

  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('lg');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Compute active lyric index based on currentTime
  const lyricsTimed: TimedLyricLine[] = useMemo(() => {
    if (!currentTrack) return [];
    if (currentTrack.lyricsTimed && currentTrack.lyricsTimed.length > 0) {
      return currentTrack.lyricsTimed;
    }
    // If only untimed strings exist, distribute them evenly across the track
    if (currentTrack.lyrics && currentTrack.lyrics.length > 0) {
      const step = (currentTrack.duration || 180) / (currentTrack.lyrics.length + 1);
      return currentTrack.lyrics.map((text, idx) => ({
        time: Math.round(step * (idx + 0.5)),
        text
      }));
    }
    return [];
  }, [currentTrack]);

  const activeIndex = useMemo(() => {
    if (lyricsTimed.length === 0) return -1;
    let idx = -1;
    for (let i = 0; i < lyricsTimed.length; i++) {
      if (currentTime >= lyricsTimed[i].time) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [currentTime, lyricsTimed]);

  // Smooth auto-scroll to active lyric line
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeIndex]);

  if (!isOpen || !currentTrack) return null;

  const fontClasses = {
    sm: 'text-base md:text-lg leading-relaxed',
    md: 'text-xl md:text-2xl leading-relaxed',
    lg: 'text-2xl md:text-4xl leading-loose font-bold',
    xl: 'text-3xl md:text-5xl leading-tight font-extrabold'
  };

  const isFav = isFavorite(currentTrack.id);

  return (
    <div className={`fixed inset-0 z-50 flex flex-col bg-[#080512]/95 backdrop-blur-3xl animate-in fade-in duration-300 select-none overflow-hidden ${
      isFullscreen ? 'p-0' : 'p-3 md:p-6'
    }`}>
      {/* Background Ambient Colored Glow from album art */}
      <div 
        className="absolute inset-0 opacity-20 filter blur-3xl pointer-events-none scale-150 transition-all duration-1000"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 40%, #9333ea 0%, #3b82f6 40%, #07050d 80%)`
        }}
      />

      {/* Top Header Bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.08] shrink-0 bg-black/20 backdrop-blur-md rounded-t-3xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-950/50">
            <Mic2 className="w-5 h-5 text-cyan-200 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                Modo Karaokê & Letras Sincronizadas
              </span>
            </div>
            <h2 className="text-sm md:text-base font-bold text-white truncate max-w-sm md:max-w-md mt-0.5">
              {currentTrack.title} <span className="text-slate-400 font-normal">· {currentTrack.artist}</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Font Size Adjuster */}
          <div className="flex items-center bg-white/[0.05] border border-white/10 rounded-xl p-1 gap-1">
            <Type className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <button
              onClick={() => setFontSize('sm')}
              className={`px-2 py-1 rounded-lg text-xs font-semibold ${fontSize === 'sm' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Fonte Pequena"
            >
              A-
            </button>
            <button
              onClick={() => setFontSize('md')}
              className={`px-2 py-1 rounded-lg text-xs font-semibold ${fontSize === 'md' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Fonte Normal"
            >
              A
            </button>
            <button
              onClick={() => setFontSize('lg')}
              className={`px-2 py-1 rounded-lg text-xs font-semibold ${fontSize === 'lg' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Fonte Grande"
            >
              A+
            </button>
            <button
              onClick={() => setFontSize('xl')}
              className={`px-2 py-1 rounded-lg text-xs font-semibold ${fontSize === 'xl' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Fonte Extra Grande"
            >
              A++
            </button>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-colors"
            title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 transition-colors"
            title="Fechar Karaokê"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Synchronized Lyrics Scroll Container */}
      <div 
        ref={containerRef}
        className="relative z-10 flex-1 overflow-y-auto px-6 md:px-16 py-12 scroll-smooth text-center"
      >
        {lyricsTimed.length > 0 ? (
          <div className="space-y-8 max-w-3xl mx-auto py-24">
            {lyricsTimed.map((line, idx) => {
              const isActive = idx === activeIndex;
              const isPast = idx < activeIndex;

              return (
                <div
                  key={idx}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => seek(line.time)}
                  className={`cursor-pointer transition-all duration-300 py-3 px-4 rounded-2xl group ${
                    isActive 
                      ? `${fontClasses[fontSize]} text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-300 font-extrabold scale-105 drop-shadow-[0_0_25px_rgba(6,182,212,0.6)]` 
                      : isPast
                      ? `${fontClasses[fontSize]} text-slate-500 hover:text-slate-300 opacity-60 font-medium`
                      : `${fontClasses[fontSize]} text-slate-400 hover:text-slate-200 opacity-80 font-medium`
                  }`}
                  title={`Clique para pular para ${formatTime(line.time)}`}
                >
                  <p className="inline-block relative">
                    {line.text}
                    {isActive && (
                      <span className="inline-block ml-3 text-cyan-400 text-sm align-middle animate-bounce">
                        🎤
                      </span>
                    )}
                  </p>
                  <span className="block text-[11px] font-mono text-purple-400/60 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                    {formatTime(line.time)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center space-y-4 py-20">
            <div className="w-20 h-20 rounded-3xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-xl">
              <Music className="w-10 h-10 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-white">Letra Não Disponível</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Esta faixa é instrumental ou ainda não possui letras cadastradas e sincronizadas. Você ainda pode desfrutar do som e do visualizador imersivo.
            </p>
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-xs text-purple-300">
              💡 Dica: Músicas originais do catálogo Aurora com timestamps sincronizam automaticamente aqui.
            </div>
          </div>
        )}
      </div>

      {/* Bottom Interactive Controls */}
      <div className="relative z-10 px-6 py-4 border-t border-white/[0.08] bg-black/40 backdrop-blur-xl shrink-0 rounded-b-3xl max-w-4xl mx-auto w-full">
        {/* Seeker */}
        <div className="space-y-1 mb-3">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.5"
            value={currentTime}
            onChange={(e) => seek(parseFloat(e.target.value))}
            className="w-full h-1.5 accent-cyan-400"
          />
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-purple-950 shadow-md ring-1 ring-purple-500/30 shrink-0">
              <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="hidden sm:block min-w-0">
              <div className="text-xs font-bold text-white truncate max-w-[180px]">{currentTrack.title}</div>
              <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{currentTrack.artist}</div>
            </div>
            <button
              onClick={() => toggleFavorite(currentTrack.id)}
              className="p-2 text-slate-400 hover:text-purple-400 transition-colors"
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-purple-500 text-purple-500' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={prevTrack} className="p-2 text-slate-300 hover:text-white transition-colors">
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={togglePlayPause}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-cyan-900/40 active:scale-95 transition-all"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
            <button onClick={nextTrack} className="p-2 text-slate-300 hover:text-white transition-colors">
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button onClick={toggleMute} className="text-slate-400 hover:text-white">
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 h-1 accent-purple-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
