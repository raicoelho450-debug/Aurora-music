import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  ChevronDown, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Repeat1, 
  Heart, 
  Volume2, 
  VolumeX, 
  ListMusic, 
  Radio, 
  FileText, 
  Clock, 
  Trash2,
  Share2,
  Sparkles,
  Info,
  Youtube,
  ExternalLink,
  Download,
  CheckCircle2,
  Loader2,
  Maximize2,
  Sliders,
  ArrowUp,
  ArrowDown,
  ListPlus,
  Save,
  Check,
  Mic,
  Disc,
  Wand2,
  ArrowLeftRight,
  MessageSquare,
  Flag
} from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { AudioVisualizer } from './AudioVisualizer';
import { EqualizerView } from './EqualizerView';
import { SongCommentsSection } from './SongCommentsSection';
import { formatTime, formatFileSize } from '../utils/format';
import { getTrackCommentCount } from '../services/storage';

export const ExpandedPlayerModal: React.FC = () => {
  const {
    currentTrack,
    queue,
    queueIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffled,
    analyserNode,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleMute,
    cycleRepeat,
    toggleShuffle,
    removeFromQueue,
    clearQueue,
    reorderQueue,
    addToQueueNext,
    saveQueueAsPlaylist,
    shuffleUpcomingQueue,
    toggleFavorite,
    isFavorite,
    isExpandedPlayerOpen,
    setIsExpandedPlayerOpen,
    preferences,
    updatePreferences,
    isYouTubeTrack,
    expandedTab,
    setExpandedTab,
    openCreatorPage,
    downloadTrackOffline,
    removeTrackOffline,
    isTrackOffline,
    isDownloadingTrack,
    setIsFullScreenArtOpen,
    sleepTimerMinutes,
    sleepTimerRemainingSec,
    sleepTimerMode,
    setSleepTimer,
    setSleepTimerEndOfTrack,
    cancelSleepTimer,
    tracks,
    addToQueue
  } = useAudioPlayer();

  const isYt = isYouTubeTrack(currentTrack);
  const [savePlaylistName, setSavePlaylistName] = useState('');
  const [isSavingPlaylist, setIsSavingPlaylist] = useState(false);
  const [isSyncLyricsMode, setIsSyncLyricsMode] = useState(true);
  const [autoSequenceMsg, setAutoSequenceMsg] = useState<string | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [commentCount, setCommentCount] = useState<number>(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState<number>(0);

  useEffect(() => {
    if (currentTrack?.id) {
      setCommentCount(getTrackCommentCount(currentTrack.id));
    }
    const handleCommentsUpdate = (e: any) => {
      if (currentTrack?.id && (!e?.detail?.trackId || e.detail.trackId === currentTrack.id)) {
        setCommentCount(getTrackCommentCount(currentTrack.id));
      }
    };
    window.addEventListener('aurora-comments-updated', handleCommentsUpdate);
    return () => window.removeEventListener('aurora-comments-updated', handleCommentsUpdate);
  }, [currentTrack?.id]);

  const activeLyricRef = useRef<HTMLDivElement | null>(null);
  const lyricsListRef = useRef<HTMLDivElement | null>(null);

  // Synchronized Lyrics Parser & Formatter
  const parsedLyrics = useMemo(() => {
    if (!currentTrack) return [];

    // 1. Check for dedicated lyricsTimed in track
    if (currentTrack.lyricsTimed && currentTrack.lyricsTimed.length > 0) {
      return currentTrack.lyricsTimed;
    }

    // 2. Check for LRC timestamps [mm:ss.xx] in text lyrics
    if (currentTrack.lyrics && currentTrack.lyrics.length > 0) {
      const lrcRegex = /^\[(\d{2}):(\d{2}(?:\.\d+)?)\](.*)/;
      const hasLrc = currentTrack.lyrics.some(l => lrcRegex.test(l.trim()));
      if (hasLrc) {
        const parsed: { time: number; text: string }[] = [];
        currentTrack.lyrics.forEach(line => {
          const match = line.trim().match(lrcRegex);
          if (match) {
            const mins = parseInt(match[1], 10);
            const secs = parseFloat(match[2]);
            const text = match[3].trim();
            if (text) {
              parsed.push({ time: mins * 60 + secs, text });
            }
          }
        });
        if (parsed.length > 0) return parsed.sort((a, b) => a.time - b.time);
      }

      // 3. Fallback: Distribute plain lyrics evenly across song duration for sing-along
      const totalDur = duration || currentTrack.duration || 180;
      const totalLines = currentTrack.lyrics.length;
      const step = Math.max(3, (totalDur - 6) / totalLines);
      return currentTrack.lyrics.map((text, idx) => ({
        time: Math.round((3 + idx * step) * 10) / 10,
        text
      }));
    }

    return [];
  }, [currentTrack, duration]);

  // Active Line Index calculation
  const activeLyricIndex = useMemo(() => {
    if (parsedLyrics.length === 0) return -1;
    for (let i = parsedLyrics.length - 1; i >= 0; i--) {
      if (currentTime >= parsedLyrics[i].time) {
        return i;
      }
    }
    return -1;
  }, [parsedLyrics, currentTime]);

  // Smooth scroll active lyric into view
  useEffect(() => {
    if (expandedTab === 'lyrics' && isSyncLyricsMode && activeLyricRef.current) {
      activeLyricRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeLyricIndex, expandedTab, isSyncLyricsMode]);

  // Gestures on Cover Artwork (Swipe to change track, Double-tap to favorite)
  const handleArtworkTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleArtworkTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || !currentTrack) return;
    const endX = e.changedTouches[0].clientX;
    const delta = endX - touchStartX;
    setTouchStartX(null);

    if (preferences.gesturesEnabled !== false) {
      if (delta < -50) {
        // Swiped Left -> Next Track
        nextTrack();
      } else if (delta > 50) {
        // Swiped Right -> Prev Track
        prevTrack();
      }
    }
  };

  const handleArtworkDoubleClick = () => {
    if (!currentTrack) return;
    if (preferences.gesturesEnabled !== false) {
      toggleFavorite(currentTrack.id);
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 900);
    }
  };

  // Smart Queue Auto-Sequence by Genre / Style
  const handleAutoSequenceQueue = () => {
    if (!currentTrack) return;
    const currentGenre = (currentTrack.genre || '').toLowerCase();

    // Look for matching tracks from library to recommend or reorder
    const matchingTracks = tracks.filter(t => 
      t.id !== currentTrack.id && 
      !queue.some(q => q.id === t.id) &&
      ((t.genre && t.genre.toLowerCase().includes(currentGenre)) || t.artist === currentTrack.artist)
    );

    if (matchingTracks.length > 0) {
      matchingTracks.slice(0, 3).forEach(t => addToQueue(t));
      setAutoSequenceMsg(`Adicionadas ${Math.min(3, matchingTracks.length)} faixas do mesmo estilo à fila inteligente!`);
    } else {
      shuffleUpcomingQueue();
      setAutoSequenceMsg('Sequência inteligente reordenada para harmonia musical contínua.');
    }
    setTimeout(() => setAutoSequenceMsg(null), 3500);
  };

  if (!isExpandedPlayerOpen || !currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const favorited = isFavorite(currentTrack.id);
  const isOffline = currentTrack ? isTrackOffline(currentTrack.id) : false;
  const isDownloading = currentTrack ? isDownloadingTrack(currentTrack.id) : false;

  const handleSleepTimer = (mins: number | null) => {
    if (mins === null) {
      cancelSleepTimer();
    } else if (mins === -1) {
      setSleepTimerEndOfTrack();
    } else {
      setSleepTimer(mins);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-2xl animate-in fade-in duration-200 select-none overflow-hidden">
      {/* Background Ambient Colored Glow */}
      <div 
        className="absolute inset-0 opacity-25 filter blur-3xl pointer-events-none scale-125 transition-all duration-1000"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 35%, #9333ea 0%, #3b82f6 35%, #07050d 75%)`
        }}
      />

      {/* Main Container */}
      <div className="relative w-full h-full max-w-4xl max-h-[92vh] md:rounded-3xl bg-[#0b0818]/90 border border-purple-500/20 shadow-2xl flex flex-col overflow-hidden">
        {/* Top App Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <button
            onClick={() => setIsExpandedPlayerOpen(false)}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/[0.06] transition-colors"
            title="Recolher"
          >
            <ChevronDown className="w-6 h-6" />
          </button>

          <div className="text-center">
            <span className="text-xs uppercase font-semibold tracking-wider text-purple-400">
              Reproduzindo Agora
            </span>
            <div className="text-[11px] text-slate-400 truncate max-w-xs">
              {currentTrack.album}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Full-Screen Album Art Button */}
            <button
              onClick={() => {
                setIsExpandedPlayerOpen(false);
                setIsFullScreenArtOpen(true);
              }}
              className="p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/[0.06]"
              title="Capa em Tela Cheia"
            >
              <Maximize2 className="w-5 h-5" />
            </button>

            {/* Sleep Timer */}
            <div className="relative group">
              <button 
                className={`p-2 rounded-full transition-colors ${
                  sleepTimerMinutes || sleepTimerMode === 'end_of_track' ? 'text-purple-400 bg-purple-500/10' : 'text-slate-400 hover:text-white'
                }`}
                title="Temporizador de Sono"
              >
                <Clock className="w-5 h-5" />
              </button>
              <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col bg-[#140e2b] border border-purple-500/30 rounded-xl p-1.5 shadow-xl min-w-[150px] z-20">
                <div className="text-[10px] text-slate-400 px-2 py-1 font-semibold uppercase">Temporizador</div>
                {[15, 30, 45, 60, 90].map((m) => (
                  <button
                    key={m}
                    onClick={() => setSleepTimer(m)}
                    className="text-left px-2 py-1.5 text-xs text-slate-300 hover:bg-purple-600/30 rounded-lg"
                  >
                    {m} minutos
                  </button>
                ))}
                <button
                  onClick={() => setSleepTimerEndOfTrack()}
                  className="text-left px-2 py-1.5 text-xs text-purple-300 hover:bg-purple-600/30 rounded-lg border-t border-white/5 mt-1"
                >
                  Fim da música atual
                </button>
                {(sleepTimerMinutes || sleepTimerMode === 'end_of_track') && (
                  <button
                    onClick={() => cancelSleepTimer()}
                    className="text-left px-2 py-1.5 text-xs text-rose-400 hover:bg-rose-500/20 rounded-lg mt-1 border-t border-white/5"
                  >
                    Desativar ({sleepTimerRemainingSec ? `${Math.ceil(sleepTimerRemainingSec / 60)}m` : 'Ativo'})
                  </button>
                )}
              </div>
            </div>

            {/* Download Offline Button */}
            <button
              onClick={() => {
                if (isOffline) {
                  removeTrackOffline(currentTrack.id);
                } else {
                  downloadTrackOffline(currentTrack);
                }
              }}
              disabled={isDownloading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isOffline
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-white/[0.06] text-slate-200 border border-white/10 hover:bg-purple-600/30 hover:text-white'
              }`}
              title={isOffline ? 'Salvo na pasta Offline do app (Clique para remover)' : 'Baixar música para permanecer offline dentro do app'}
            >
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
              ) : isOffline ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Download className="w-3.5 h-3.5 text-purple-400" />
              )}
              <span>{isOffline ? 'Baixado' : 'Baixar'}</span>
            </button>

            <button
              onClick={() => toggleFavorite(currentTrack.id)}
              className="p-2 text-slate-400 hover:text-purple-400 transition-colors"
              title="Favoritar"
            >
              <Heart className={`w-5 h-5 ${favorited ? 'fill-purple-500 text-purple-500' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('aurora_open_report', {
                    detail: {
                      targetType: 'track',
                      targetId: currentTrack.id,
                      targetName: `Faixa "${currentTrack.title}" por ${currentTrack.artist}`,
                      targetOwnerId: currentTrack.artist,
                      targetOwnerName: currentTrack.artist
                    }
                  }));
                }
              }}
              className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
              title="Denunciar faixa para moderação"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-center gap-2 p-2 bg-[#080512] border-b border-white/[0.04] shrink-0 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setExpandedTab('visualizer')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              expandedTab === 'visualizer'
                ? 'bg-purple-600/30 text-white border border-purple-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Visualizador</span>
          </button>
          <button
            onClick={() => setExpandedTab('equalizer')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              expandedTab === 'equalizer'
                ? 'bg-purple-600/30 text-white border border-purple-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span>Equalizador</span>
          </button>
          {isYt && (
            <button
              onClick={() => setExpandedTab('video')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                expandedTab === 'video'
                  ? 'bg-red-600/30 text-white border border-red-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Youtube className="w-3.5 h-3.5 text-red-400" />
              <span>Vídeo Oficial</span>
            </button>
          )}
          <button
            onClick={() => setExpandedTab('queue')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              expandedTab === 'queue'
                ? 'bg-purple-600/30 text-white border border-purple-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>Fila ({queue.length})</span>
          </button>
          <button
            onClick={() => setExpandedTab('lyrics')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              expandedTab === 'lyrics'
                ? 'bg-purple-600/30 text-white border border-purple-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Detalhes & Letras</span>
          </button>
          <button
            onClick={() => setExpandedTab('comments')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              expandedTab === 'comments'
                ? 'bg-purple-600/30 text-white border border-purple-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
            <span>Comentários ({commentCount})</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col justify-between">
          {expandedTab === 'visualizer' && (
            <div className="flex flex-col items-center justify-center flex-1 max-w-md mx-auto w-full my-auto">
              {isYt && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-300 text-[11px] font-semibold mb-3">
                  <Youtube className="w-3.5 h-3.5 text-red-400" />
                  <span>Áudio Original Transmitido do YouTube</span>
                </div>
              )}

              {/* Artwork Container with Custom Cover Styles & Gestures */}
              <div 
                onTouchStart={handleArtworkTouchStart}
                onTouchEnd={handleArtworkTouchEnd}
                onDoubleClick={handleArtworkDoubleClick}
                className="relative flex items-center justify-center mb-6 cursor-pointer select-none group"
                title="Toque duplo para favoritar · Deslize para trocar de música"
              >
                {/* Vinyl 3D Disc Extension */}
                {preferences.coverStyle === 'vinyl3d' && (
                  <div className={`absolute -right-6 sm:-right-8 w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-gradient-to-tr from-neutral-950 via-neutral-900 to-neutral-800 border-4 border-neutral-700/60 shadow-2xl flex items-center justify-center pointer-events-none transition-transform duration-700 ${
                    isPlaying ? 'animate-[spin_4s_linear_infinite]' : 'translate-x-0'
                  }`}>
                    {/* Vinyl Grooves */}
                    <div className="w-36 h-36 rounded-full border border-neutral-700/40 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full border border-neutral-700/50 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-purple-600/60 border border-white/20 flex items-center justify-center">
                          <Disc className="w-5 h-5 text-purple-200" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Primary Cover Image Container */}
                <div className={`relative w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 overflow-hidden shadow-2xl transition-all duration-500 group-hover:scale-[1.02] ${
                  preferences.coverStyle === 'circle'
                    ? 'rounded-full aspect-square ring-4 ring-purple-500/40 shadow-purple-900/60'
                    : preferences.coverStyle === 'hologram'
                      ? 'rounded-2xl ring-2 ring-cyan-400 shadow-[0_0_40px_rgba(34,211,238,0.35)]'
                      : 'rounded-2xl ring-1 ring-purple-500/30 shadow-purple-900/40'
                }`}>
                  <img
                    src={currentTrack.coverUrl}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  
                  <div className="absolute bottom-3 left-3 text-[10px] font-mono uppercase bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-purple-300 pointer-events-none">
                    {isYt ? 'YOUTUBE OFICIAL' : currentTrack.format || 'ÁUDIO'}
                  </div>

                  {isYt && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedTab('video');
                      }}
                      className="absolute top-3 right-3 p-2 bg-black/70 backdrop-blur-md rounded-xl text-white hover:text-red-400 hover:bg-black/90 transition-all flex items-center gap-1 text-[11px] font-semibold shadow-lg"
                      title="Assistir clipe de vídeo"
                    >
                      <Youtube className="w-3.5 h-3.5 text-red-500" />
                      <span>Ver Clipe</span>
                    </button>
                  )}

                  {/* Double-tap Floating Heart Feedback */}
                  {showHeartBurst && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] animate-in zoom-in-50 duration-200 pointer-events-none">
                      <div className="w-20 h-20 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center animate-bounce">
                        <Heart className="w-12 h-12 text-rose-500 fill-current drop-shadow-xl" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Gesture Hint */}
              <div className="flex items-center gap-2 text-[10px] text-slate-400 -mt-2 mb-3">
                <ArrowLeftRight className="w-3 h-3 text-purple-400" />
                <span>Deslize a capa para trocar de faixa · Toque duplo para favoritar</span>
              </div>

              {/* Real-time Visualizer */}
              <div className="w-full mb-4">
                <AudioVisualizer
                  analyserNode={analyserNode}
                  isPlaying={isPlaying}
                  theme={preferences.visualizerTheme}
                  className="w-full h-16"
                />
              </div>

              {/* Title & Artist */}
              <div className="text-center w-full mb-2">
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight truncate">
                  {currentTrack.title}
                </h2>
                <button
                  type="button"
                  onClick={() => openCreatorPage(currentTrack.artist)}
                  className="inline-flex items-center justify-center gap-1.5 text-sm text-purple-300 hover:text-white hover:underline font-medium truncate mt-1 transition-colors cursor-pointer group max-w-full"
                  title={`Ver todas as músicas de ${currentTrack.artist}`}
                >
                  <span className="truncate">{currentTrack.artist}</span>
                  <span className="text-[10px] text-purple-400 px-1.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 group-hover:border-purple-400 group-hover:text-purple-300 transition-all shrink-0">
                    Ver Criador
                  </span>
                </button>

                {/* Prominent Offline Download Action */}
                <div className="flex flex-col items-center justify-center gap-1.5 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (isOffline) {
                        removeTrackOffline(currentTrack.id);
                      } else {
                        downloadTrackOffline(currentTrack);
                      }
                    }}
                    disabled={isDownloading}
                    className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold tracking-wide transition-all shadow-md active:scale-95 ${
                      isOffline
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border border-purple-400/30 hover:brightness-110 shadow-purple-900/30'
                    }`}
                    title={isOffline ? 'Salvo na playlist Offline do app (Clique para remover)' : 'Baixar música para a pasta Offline dentro do app'}
                  >
                    {isDownloading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : isOffline ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Download className="w-4 h-4 text-white" />
                    )}
                    <span>{isDownloading ? 'Baixando...' : isOffline ? 'Baixado na pasta Offline' : 'Baixar Música'}</span>
                  </button>
                  <p className="text-[11px] text-slate-400 text-center">
                    {isOffline
                      ? '✓ Salva na playlist Offline dentro do app (funciona sem internet)'
                      : 'Salva na playlist Offline dentro do app (não vai para o celular)'}
                  </p>

                  <button
                    type="button"
                    onClick={() => setExpandedTab('comments')}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-purple-200 bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 hover:border-purple-400/50 transition-all cursor-pointer shadow-sm group mt-1"
                    title="Ver e fazer comentários nesta música"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                    <span>{commentCount > 0 ? `${commentCount} comentários da comunidade` : 'Comentar nesta música'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {expandedTab === 'video' && isYt && (
            <div className="flex flex-col items-center justify-center flex-1 w-full max-w-2xl mx-auto my-auto space-y-4">
              {/* Aspect ratio placeholder space reserved for the fixed persistent YouTube player */}
              <div className="w-full aspect-video rounded-2xl border border-red-500/20 bg-black/40 flex items-center justify-center">
                <span className="text-xs text-slate-500">
                  Vídeo Oficial Reproduzindo em Alta Definição
                </span>
              </div>
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-300 text-xs font-semibold">
                  <Youtube className="w-4 h-4 text-red-500" />
                  <span>Áudio e Vídeo Oficiais do YouTube</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white truncate max-w-lg mx-auto">
                  {currentTrack.title}
                </h3>
                <button
                  type="button"
                  onClick={() => openCreatorPage(currentTrack.artist)}
                  className="text-xs text-slate-400 hover:text-purple-300 hover:underline transition-colors cursor-pointer"
                  title={`Ver todas as músicas de ${currentTrack.artist}`}
                >
                  {currentTrack.artist}
                </button>

                {/* Baixar Button in Video Tab */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isOffline) {
                        removeTrackOffline(currentTrack.id);
                      } else {
                        downloadTrackOffline(currentTrack);
                      }
                    }}
                    disabled={isDownloading}
                    className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      isOffline
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-purple-600 text-white border border-purple-500/40 hover:bg-purple-500 shadow-md'
                    }`}
                    title={isOffline ? 'Salvo na playlist Offline do app (Clique para remover)' : 'Baixar música para a pasta Offline dentro do app'}
                  >
                    {isDownloading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : isOffline ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-white" />
                    )}
                    <span>{isDownloading ? 'Baixando...' : isOffline ? 'Baixado no App' : 'Baixar'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {expandedTab === 'equalizer' && (
            <div className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full">
              <EqualizerView />
            </div>
          )}

          {expandedTab === 'queue' && (
            <div className="flex-1 overflow-y-auto max-w-xl mx-auto w-full space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">
                    Fila Inteligente ({queue.length} faixas)
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={handleAutoSequenceQueue}
                    className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 border border-purple-500/40 text-purple-200 text-xs font-semibold flex items-center gap-1 transition-all"
                    title="Organizar sequência automática baseada no estilo musical"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Sequência por Estilo</span>
                  </button>

                  <button
                    onClick={() => shuffleUpcomingQueue()}
                    className="px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-purple-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Embaralhar próximas músicas"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Embaralhar Próximas</span>
                  </button>

                  <button
                    onClick={() => setIsSavingPlaylist(true)}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Salvar fila atual como uma playlist"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Salvar Fila</span>
                  </button>

                  <button
                    onClick={clearQueue}
                    className="p-1.5 rounded-xl text-rose-400 hover:bg-rose-500/20 text-xs transition-colors"
                    title="Limpar Fila"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Auto Sequence Feedback Banner */}
              {autoSequenceMsg && (
                <div className="p-3 rounded-xl bg-purple-950/70 border border-purple-500/40 text-xs text-purple-200 flex items-center gap-2 animate-in fade-in">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{autoSequenceMsg}</span>
                </div>
              )}

              {/* Save Queue Dialog */}
              {isSavingPlaylist && (
                <div className="p-4 rounded-2xl bg-[#150e2b] border border-purple-500/40 space-y-3 shadow-xl animate-in fade-in">
                  <div className="text-xs font-bold text-white">Nome da Nova Playlist</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={savePlaylistName}
                      onChange={(e) => setSavePlaylistName(e.target.value)}
                      placeholder="Ex: Minha Seleção de Hoje..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400"
                    />
                    <button
                      onClick={() => {
                        if (savePlaylistName.trim()) {
                          saveQueueAsPlaylist(savePlaylistName.trim());
                          setSavePlaylistName('');
                          setIsSavingPlaylist(false);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shrink-0"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => setIsSavingPlaylist(false)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 text-slate-400 text-xs hover:text-white"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Queue Items */}
              <div className="space-y-2">
                {queue.map((track, idx) => {
                  const isCurrent = idx === queueIndex;
                  return (
                    <div
                      key={`${track.id}-${idx}`}
                      className={`flex items-center justify-between p-3 rounded-2xl transition-all ${
                        isCurrent
                          ? 'bg-purple-600/25 border border-purple-400/50 shadow-md ring-1 ring-purple-500/30 text-white'
                          : 'bg-white/[0.03] hover:bg-white/[0.06] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Reorder Arrows */}
                        <div className="flex flex-col items-center gap-0.5 text-slate-500">
                          <button
                            disabled={idx === 0}
                            onClick={() => reorderQueue(idx, idx - 1)}
                            className="hover:text-purple-300 disabled:opacity-20 p-0.5"
                            title="Mover para cima"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            disabled={idx === queue.length - 1}
                            onClick={() => reorderQueue(idx, idx + 1)}
                            className="hover:text-purple-300 disabled:opacity-20 p-0.5"
                            title="Mover para baixo"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-purple-950 shrink-0">
                          <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className={`text-xs font-bold truncate ${isCurrent ? 'text-purple-300' : 'text-white'}`}>
                            {track.title}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {track.artist}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono tabular-nums text-slate-400">
                          {formatTime(track.duration)}
                        </span>

                        {!isCurrent && (
                          <button
                            onClick={() => addToQueueNext(track)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-white/5 transition-colors"
                            title="Tocar em seguida"
                          >
                            <ListPlus className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {queue.length > 1 && (
                          <button
                            onClick={() => removeFromQueue(idx)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Remover da fila"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {expandedTab === 'lyrics' && (
            <div className="flex-1 overflow-y-auto max-w-lg mx-auto w-full space-y-6">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>Metadados da Faixa</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Álbum</span>
                    <span className="text-slate-200 font-medium">{currentTrack.album}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Gênero</span>
                    <span className="text-slate-200 font-medium">{currentTrack.genre || 'Ambiente'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Origem</span>
                    <span className="text-slate-200 font-medium">{currentTrack.isLocal ? 'Arquivo Local' : 'Catálogo Aurora'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Formato</span>
                    <span className="text-slate-200 font-medium uppercase font-mono">{currentTrack.format || 'Áudio'}</span>
                  </div>
                  {currentTrack.fileSize && (
                    <div>
                      <span className="text-slate-500 block">Tamanho</span>
                      <span className="text-slate-200 font-medium">{formatFileSize(currentTrack.fileSize)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Synchronized Lyrics Container */}
              <div className="p-6 rounded-3xl bg-purple-950/20 border border-purple-500/25 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-purple-400" />
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Letras em Tempo Real
                      </h3>
                      <span className="text-[10px] text-purple-300">
                        {isSyncLyricsMode ? 'Modo Sincronizado (Karaokê)' : 'Modo Leitura Completa'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setIsSyncLyricsMode(!isSyncLyricsMode)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                        isSyncLyricsMode
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40'
                          : 'bg-white/[0.05] text-slate-300 hover:text-white'
                      }`}
                    >
                      {isSyncLyricsMode ? 'Karaokê Ativo' : 'Texto Simples'}
                    </button>
                  </div>
                </div>

                {parsedLyrics.length > 0 ? (
                  isSyncLyricsMode ? (
                    <div 
                      ref={lyricsListRef}
                      className="space-y-2 max-h-72 overflow-y-auto px-2 py-3 scrollbar-none scroll-smooth select-none text-left"
                    >
                      {parsedLyrics.map((line, idx) => {
                        const isActive = idx === activeLyricIndex;
                        const isPast = idx < activeLyricIndex;
                        return (
                          <div
                            key={idx}
                            ref={isActive ? activeLyricRef : null}
                            onClick={() => seek(line.time)}
                            className={`group flex items-start gap-3 transition-all duration-300 cursor-pointer rounded-xl px-3 py-2 ${
                              isActive
                                ? 'bg-gradient-to-r from-purple-600/30 via-indigo-600/20 to-transparent border-l-4 border-purple-400 text-purple-200 font-bold scale-[1.02] shadow-lg shadow-purple-950/30'
                                : isPast
                                  ? 'text-slate-400/80 hover:text-slate-200 hover:bg-white/[0.03]'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                            }`}
                            title="Clique para ir a este trecho"
                          >
                            <span className={`text-[10px] font-mono tabular-nums shrink-0 pt-0.5 ${
                              isActive ? 'text-purple-300 font-bold' : 'text-slate-500'
                            }`}>
                              {formatTime(line.time)}
                            </span>
                            <p className={`text-sm leading-relaxed ${
                              isActive ? 'text-white text-base font-semibold' : ''
                            }`}>
                              {line.text}
                            </p>
                          </div>
                        );
                      })}
                      <div className="pt-2 text-center">
                        <span className="text-[10px] text-purple-400 font-mono">
                          ✓ Dica: Clique em qualquer verso para avançar a música até ele
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-sm text-slate-200 leading-relaxed font-light text-center">
                      {parsedLyrics.map((line, idx) => (
                        <p key={idx} className="hover:text-purple-300 transition-colors">
                          {line.text}
                        </p>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="py-8 text-center space-y-2">
                    <p className="text-xs text-slate-400 italic">
                      Faixa instrumental sem letras cadastradas.
                    </p>
                    <p className="text-[11px] text-purple-400/80">
                      Aproveite a pureza das frequências e instrumentos.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {expandedTab === 'comments' && (
            <div className="flex-1 overflow-hidden max-w-2xl mx-auto w-full h-full min-h-[380px]">
              <SongCommentsSection track={currentTrack} />
            </div>
          )}

          {/* Bottom Interactive Seeker & Controls Area */}
          <div className="w-full max-w-xl mx-auto pt-4 shrink-0">
            {/* Seek Bar with Drag-scrubbing protection & fluid feedback */}
            {(() => {
              const effectiveDuration = duration > 0 ? duration : (currentTrack.duration || 100);
              const displayTime = isScrubbing ? scrubValue : Math.min(effectiveDuration, Math.max(0, currentTime));
              const remainingTime = Math.max(0, effectiveDuration - displayTime);

              return (
                <div className="space-y-1 mb-4">
                  <div className="relative flex items-center group py-1">
                    <input
                      type="range"
                      min="0"
                      max={effectiveDuration}
                      step="0.1"
                      value={displayTime}
                      onPointerDown={(e) => {
                        setIsScrubbing(true);
                        setScrubValue(parseFloat(e.currentTarget.value));
                      }}
                      onChange={(e) => {
                        setScrubValue(parseFloat(e.target.value));
                      }}
                      onPointerUp={(e) => {
                        const targetTime = parseFloat(e.currentTarget.value);
                        setIsScrubbing(false);
                        seek(targetTime);
                      }}
                      className="w-full h-2 accent-purple-500 cursor-pointer rounded-lg bg-white/10 hover:bg-white/20 transition-all z-10"
                      aria-label="Posição da música"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono tabular-nums text-slate-400">
                    <span className="text-purple-300 font-semibold">{formatTime(displayTime)}</span>
                    <span>-{formatTime(remainingTime)}</span>
                  </div>
                </div>
              );
            })()}

            {/* Playback Button Controls */}
            <div className="flex items-center justify-between mb-4 px-4">
              <button
                onClick={toggleShuffle}
                className={`p-2.5 rounded-full transition-colors ${
                  isShuffled ? 'text-purple-400 bg-purple-500/20' : 'text-slate-400 hover:text-white'
                }`}
                title={isShuffled ? 'Aleatório ativado' : 'Ativar aleatório'}
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button
                onClick={prevTrack}
                className="p-3 text-slate-300 hover:text-white transition-colors"
                title="Faixa anterior"
              >
                <SkipBack className="w-6 h-6" />
              </button>

              <button
                onClick={togglePlayPause}
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-xl shadow-purple-900/50 hover:scale-105 active:scale-95 transition-all"
                title={isPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 fill-current" />
                ) : (
                  <Play className="w-7 h-7 fill-current ml-1" />
                )}
              </button>

              <button
                onClick={nextTrack}
                className="p-3 text-slate-300 hover:text-white transition-colors"
                title="Próxima faixa"
              >
                <SkipForward className="w-6 h-6" />
              </button>

              <button
                onClick={cycleRepeat}
                className={`p-2.5 rounded-full transition-colors ${
                  repeatMode !== 'off' ? 'text-purple-400 bg-purple-500/20' : 'text-slate-400 hover:text-white'
                }`}
                title={`Modo de repetição: ${repeatMode}`}
              >
                {repeatMode === 'one' ? (
                  <Repeat1 className="w-5 h-5" />
                ) : (
                  <Repeat className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Volume Control Bar */}
            <div className="flex items-center justify-center gap-3 max-w-xs mx-auto">
              <button
                onClick={toggleMute}
                className="text-slate-400 hover:text-white transition-colors"
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
                className="w-full h-1 accent-purple-500"
                aria-label="Volume do player expandido"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
