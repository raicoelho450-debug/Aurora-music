import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  FolderPlus, 
  AlertCircle, 
  X, 
  Smartphone, 
  Search, 
  Play, 
  Pause, 
  Heart, 
  ListPlus, 
  Loader2, 
  HardDrive, 
  Youtube, 
  Sparkles,
  ArrowRight,
  Check,
  User,
  LogIn
} from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { NavTab } from './Sidebar';
import { loadProfile } from '../services/storage';
import { getTranslation } from '../services/i18n';
import { searchYouTubeMusicPaged } from '../services/youtubeApi';
import { Track } from '../types/music';
import { formatTime } from '../utils/format';

interface HeaderProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenInstallInfo: () => void;
}

type SearchFilterTab = 'all' | 'local' | 'youtube';

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab, onOpenInstallInfo }) => {
  const { 
    audioError, 
    clearAudioError, 
    importLocalFiles, 
    preferences,
    tracks,
    currentTrack,
    isPlaying,
    playTrack,
    togglePlayPause,
    addToQueue,
    toggleFavorite,
    isFavorite
  } = useAudioPlayer();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  const [profile, setProfile] = useState(loadProfile());
  const t = getTranslation(preferences.language || 'pt-BR');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<SearchFilterTab>('all');
  const [ytResults, setYtResults] = useState<Track[]>([]);
  const [isYtLoading, setIsYtLoading] = useState(false);
  const [addedQueueId, setAddedQueueId] = useState<string | null>(null);

  const latestQueryRef = useRef('');

  // Sync profile when account changes
  useEffect(() => {
    const handleAccountSync = () => {
      setProfile(loadProfile());
    };
    window.addEventListener('aurora-account-changed', handleAccountSync);
    return () => {
      window.removeEventListener('aurora-account-changed', handleAccountSync);
    };
  }, []);

  // Keyboard shortcut: Press "/" to focus search bar from anywhere
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
        if (searchQuery.trim().length > 0) {
          setIsDropdownOpen(true);
        }
      } else if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [searchQuery]);

  // Click outside to dismiss search results dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time local tracks filtering (Instant 0ms latency)
  const localResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    return tracks.filter((track) => {
      const matchTitle = track.title.toLowerCase().includes(q);
      const matchArtist = track.artist.toLowerCase().includes(q);
      const matchAlbum = track.album ? track.album.toLowerCase().includes(q) : false;
      const matchGenre = track.genre ? track.genre.toLowerCase().includes(q) : false;
      const matchFile = (track as any).fileName ? (track as any).fileName.toLowerCase().includes(q) : false;
      return matchTitle || matchArtist || matchAlbum || matchGenre || matchFile;
    });
  }, [searchQuery, tracks]);

  // Real-time YouTube search with debounce
  useEffect(() => {
    const trimmed = searchQuery.trim();
    latestQueryRef.current = trimmed;

    if (!trimmed) {
      setYtResults([]);
      setIsYtLoading(false);
      return;
    }

    setIsYtLoading(true);

    const debounceTimer = setTimeout(async () => {
      try {
        const response = await searchYouTubeMusicPaged(trimmed);
        if (latestQueryRef.current === trimmed) {
          setYtResults(response.tracks || []);
        }
      } catch (err) {
        console.warn('Real-time YouTube search failed:', err);
      } finally {
        if (latestQueryRef.current === trimmed) {
          setIsYtLoading(false);
        }
      }
    }, 280);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await importLocalFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleTrackClick = (track: Track) => {
    if (currentTrack?.id === track.id) {
      togglePlayPause();
    } else {
      playTrack(track);
    }
  };

  const handleAddToQueue = (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(track);
    setAddedQueueId(track.id);
    setTimeout(() => {
      setAddedQueueId((cur) => (cur === track.id ? null : cur));
    }, 1800);
  };

  const handleFavoriteClick = (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(trackId);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    // Navigate to explore and run full query
    onSelectTab('explore');
    window.dispatchEvent(
      new CustomEvent('aurora_set_search', {
        detail: { query: searchQuery.trim() }
      })
    );
    setIsDropdownOpen(false);
  };

  const totalResultsCount = localResults.length + ytResults.length;

  return (
    <header className="sticky top-0 z-30 bg-[#07050d]/90 backdrop-blur-xl border-b border-purple-950/30 px-3 sm:px-6 md:px-8 py-3 flex flex-col gap-2">
      {/* Top Bar Row */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Brand / Desktop Breadcrumb */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Mobile Logo Mark */}
          <div 
            onClick={() => onSelectTab('home')}
            className="flex md:hidden items-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden ring-1 ring-purple-500/40">
              <img 
                src="/src/assets/images/aurora_logo_mark_1791926356511.jpg" 
                alt="Aurora Music" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-sm font-bold text-white tracking-tight hidden xs:inline">
              Aurora
            </span>
          </div>

          {/* Desktop Breadcrumb/Tab Title */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs uppercase font-mono tracking-wider text-purple-400">
              {currentTab === 'home' && t.navHome}
              {currentTab === 'explore' && t.navExplore}
              {currentTab === 'aurora-ai' && 'Aurora AI'}
              {currentTab === 'library' && t.navLibrary}
              {currentTab === 'history' && t.navHistory}
              {currentTab === 'profile' && t.navProfile}
              {currentTab === 'settings' && t.navSettings}
              {currentTab === 'support' && t.navSupport}
              {currentTab === 'creator' && 'Página do Criador'}
            </span>
          </div>
        </div>

        {/* Center: Real-Time Universal Search Bar */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-xl mx-1 sm:mx-4">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
            <Search className="absolute left-3 w-4 h-4 text-purple-400/80 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!isDropdownOpen && e.target.value.trim().length > 0) {
                  setIsDropdownOpen(true);
                }
              }}
              onFocus={() => {
                if (searchQuery.trim().length > 0) {
                  setIsDropdownOpen(true);
                }
              }}
              placeholder="Buscar músicas locais ou no YouTube..."
              className="w-full bg-[#130b29]/80 hover:bg-[#180f33] focus:bg-[#0c071a] border border-purple-500/30 focus:border-cyan-400 text-xs sm:text-sm text-white placeholder-slate-400 rounded-xl pl-9 pr-14 sm:pr-18 py-2 transition-all shadow-inner focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />

            {/* Right indicators & clear button */}
            <div className="absolute right-2.5 flex items-center gap-1.5">
              {isYtLoading && (
                <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              )}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setIsDropdownOpen(false);
                    searchInputRef.current?.focus();
                  }}
                  className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
                  title="Limpar busca"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="hidden sm:inline-block text-[10px] font-mono text-purple-400/60 border border-purple-500/20 px-1 py-0.2 rounded bg-purple-950/40 select-none">
                /
              </span>
            </div>
          </form>

          {/* Interactive Floating Results Dropdown */}
          {isDropdownOpen && searchQuery.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#0d081f]/95 backdrop-blur-2xl border border-purple-500/30 rounded-2xl shadow-2xl ring-1 ring-purple-500/20 overflow-hidden flex flex-col max-h-[75vh] animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Category Filter Tabs Header */}
              <div className="p-2.5 bg-black/40 border-b border-white/[0.06] flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setFilterTab('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                      filterTab === 'all'
                        ? 'bg-purple-600 text-white shadow'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    Todos ({totalResultsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('local')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 ${
                      filterTab === 'local'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-400 hover:text-emerald-300 hover:bg-white/[0.04]'
                    }`}
                  >
                    <HardDrive className="w-3 h-3 text-emerald-400" />
                    <span>Locais ({localResults.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('youtube')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 ${
                      filterTab === 'youtube'
                        ? 'bg-rose-600 text-white shadow'
                        : 'text-slate-400 hover:text-rose-300 hover:bg-white/[0.04]'
                    }`}
                  >
                    <Youtube className="w-3 h-3 text-rose-400" />
                    <span>YouTube ({ytResults.length})</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Results Area */}
              <div className="overflow-y-auto p-2 space-y-3.5 divide-y divide-white/[0.04]">
                {/* 1. SEÇÃO DE ARQUIVOS LOCAIS */}
                {(filterTab === 'all' || filterTab === 'local') && (
                  <div className="space-y-1.5 pt-1.5 first:pt-0">
                    <div className="flex items-center justify-between px-2 text-[10px] font-bold tracking-wider uppercase text-emerald-400">
                      <div className="flex items-center gap-1.5">
                        <HardDrive className="w-3 h-3" />
                        <span>Arquivos Locais & Biblioteca ({localResults.length})</span>
                      </div>
                      <span className="font-mono lowercase text-slate-500">tempo real</span>
                    </div>

                    {localResults.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-slate-400 italic">
                        Nenhum arquivo local corresponde a &quot;{searchQuery}&quot;.
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {localResults.slice(0, 5).map((track) => {
                          const isCurrent = currentTrack?.id === track.id;
                          const favorited = isFavorite(track.id);
                          return (
                            <div
                              key={track.id}
                              onClick={() => handleTrackClick(track)}
                              className={`group flex items-center justify-between gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                                isCurrent
                                  ? 'bg-purple-900/40 border border-purple-500/40 shadow-sm'
                                  : 'hover:bg-white/[0.05] border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-purple-950/80 shrink-0 ring-1 ring-white/10">
                                  <img
                                    src={track.coverUrl}
                                    alt={track.title}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    {isCurrent && isPlaying ? (
                                      <Pause className="w-3.5 h-3.5 text-white" />
                                    ) : (
                                      <Play className="w-3.5 h-3.5 text-white fill-white" />
                                    )}
                                  </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className={`text-xs font-semibold truncate ${isCurrent ? 'text-cyan-300' : 'text-white'}`}>
                                    {track.title}
                                  </p>
                                  <p className="text-[11px] text-slate-400 truncate">
                                    {track.artist} {track.album ? `• ${track.album}` : ''}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  Local
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  {formatTime(track.duration)}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleAddToQueue(track, e)}
                                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                  title="Tocar em seguida"
                                >
                                  {addedQueueId === track.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <ListPlus className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleFavoriteClick(track.id, e)}
                                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                  title="Favoritar"
                                >
                                  <Heart
                                    className={`w-3.5 h-3.5 ${
                                      favorited ? 'text-rose-500 fill-rose-500' : 'text-slate-400 hover:text-white'
                                    }`}
                                  />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. SEÇÃO DE RESULTADOS YOUTUBE */}
                {(filterTab === 'all' || filterTab === 'youtube') && (
                  <div className="space-y-1.5 pt-2.5">
                    <div className="flex items-center justify-between px-2 text-[10px] font-bold tracking-wider uppercase text-rose-400">
                      <div className="flex items-center gap-1.5">
                        <Youtube className="w-3.5 h-3.5 text-rose-400" />
                        <span>Resultados do YouTube ({ytResults.length})</span>
                      </div>
                      {isYtLoading && (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 lowercase">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" /> buscando...
                        </span>
                      )}
                    </div>

                    {isYtLoading && ytResults.length === 0 ? (
                      <div className="p-4 text-center space-y-2">
                        <Loader2 className="w-5 h-5 text-cyan-400 animate-spin mx-auto" />
                        <p className="text-xs text-slate-400">Pesquisando no catálogo online do YouTube...</p>
                      </div>
                    ) : ytResults.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-slate-400 italic">
                        Nenhum resultado online encontrado para &quot;{searchQuery}&quot;.
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {ytResults.slice(0, 6).map((track) => {
                          const isCurrent = currentTrack?.id === track.id;
                          const favorited = isFavorite(track.id);
                          return (
                            <div
                              key={track.id}
                              onClick={() => handleTrackClick(track)}
                              className={`group flex items-center justify-between gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                                isCurrent
                                  ? 'bg-purple-900/40 border border-purple-500/40 shadow-sm'
                                  : 'hover:bg-white/[0.05] border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-purple-950/80 shrink-0 ring-1 ring-white/10">
                                  <img
                                    src={track.coverUrl}
                                    alt={track.title}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    {isCurrent && isPlaying ? (
                                      <Pause className="w-3.5 h-3.5 text-white" />
                                    ) : (
                                      <Play className="w-3.5 h-3.5 text-white fill-white" />
                                    )}
                                  </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className={`text-xs font-semibold truncate ${isCurrent ? 'text-cyan-300' : 'text-white'}`}>
                                    {track.title}
                                  </p>
                                  <p className="text-[11px] text-slate-400 truncate">
                                    {track.artist}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  YouTube
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  {formatTime(track.duration)}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleAddToQueue(track, e)}
                                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                  title="Tocar em seguida"
                                >
                                  {addedQueueId === track.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <ListPlus className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleFavoriteClick(track.id, e)}
                                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                  title="Favoritar"
                                >
                                  <Heart
                                    className={`w-3.5 h-3.5 ${
                                      favorited ? 'text-rose-500 fill-rose-500' : 'text-slate-400 hover:text-white'
                                    }`}
                                  />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Footer Actions */}
              <div className="p-2.5 bg-black/50 border-t border-white/[0.06] flex items-center justify-between text-xs shrink-0">
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Pressione <kbd className="font-mono text-purple-300 px-1 py-0.5 rounded bg-white/5 border border-white/10">Esc</kbd> para fechar
                </span>

                <button
                  type="button"
                  onClick={() => handleSearchSubmit()}
                  className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ml-auto"
                >
                  <span>Ver todos os resultados no Explorar</span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="audio/*,.mp3,.wav,.flac,.m4a,.ogg"
            className="hidden"
          />

          <button
            onClick={onOpenInstallInfo}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/40 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all"
            title="Instalar no Android"
          >
            <Smartphone className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="hidden md:inline">Instalar App</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-medium text-slate-200 border border-white/10 flex items-center gap-1.5 transition-colors"
            title="Importar áudio local"
          >
            <FolderPlus className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="hidden md:inline">Importar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('aurora_open_auth', { detail: { mode: 'login' } }));
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 text-purple-200 border border-purple-500/40 text-xs font-semibold transition-all cursor-pointer shadow-sm"
            title="Entrar ou Cadastrar com Google, Apple ou E-mail"
          >
            <LogIn className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="hidden sm:inline">Entrar / Cadastrar</span>
          </button>

          <button
            onClick={() => onSelectTab('profile')}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/[0.05] transition-colors"
            title={`Perfil Ativo: ${profile.name} (${profile.email})`}
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-purple-950 ring-1 ring-purple-500/30">
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </button>
        </div>
      </div>

      {/* Audio Error Alert Toast */}
      {audioError && (
        <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-xs text-rose-200 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{audioError}</span>
          </div>
          <button
            onClick={clearAudioError}
            className="text-rose-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </header>
  );
};
