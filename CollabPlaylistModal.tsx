import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  Plus, 
  ThumbsUp, 
  Share2, 
  Copy, 
  Check, 
  Play, 
  Trash2, 
  Lock, 
  Sparkles, 
  Loader2,
  Music,
  Flag
} from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { 
  CollabPlaylist, 
  CollabTrackItem, 
  createCollabPlaylist, 
  getCollabPlaylist, 
  joinCollabPlaylist, 
  addCollabTrack, 
  removeCollabTrack, 
  voteCollabTrack, 
  closeCollabPlaylist 
} from '../services/collabService';
import { loadProfile } from '../services/storage';

interface CollabPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CollabPlaylistModal: React.FC<CollabPlaylistModalProps> = ({ isOpen, onClose }) => {
  const { tracks, playTrack } = useAudioPlayer();
  const profile = loadProfile();

  const [mode, setMode] = useState<'list' | 'create' | 'join'>('list');
  const [activeCollab, setActiveCollab] = useState<CollabPlaylist | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Forms
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');

  // Search track to add to collab
  const [trackSearch, setTrackSearch] = useState('');

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await createCollabPlaylist(
        createName.trim(),
        createDesc.trim(),
        profile.id,
        profile.name,
        tracks.slice(0, 3)
      );
      if (res.success && res.playlist) {
        setActiveCollab(res.playlist);
        setMode('list');
      } else {
        setErrorMsg(res.message || 'Falha ao criar sala.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await joinCollabPlaylist(joinCode.trim().toUpperCase(), profile.id, profile.name);
      if (res.success && res.playlist) {
        setActiveCollab(res.playlist);
        setMode('list');
      } else {
        setErrorMsg(res.message || 'Código de convite não encontrado.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (trackItemId: string) => {
    if (!activeCollab) return;
    try {
      const res = await voteCollabTrack(activeCollab.id, trackItemId, profile.id);
      if (res.success) {
        // Refresh playlist
        const refreshed = await getCollabPlaylist(activeCollab.id);
        if (refreshed.success && refreshed.playlist) {
          setActiveCollab(refreshed.playlist);
        }
      }
    } catch {}
  };

  const handleAddTrack = async (trackToAdd: any) => {
    if (!activeCollab) return;
    setIsLoading(true);
    try {
      const res = await addCollabTrack(activeCollab.id, trackToAdd, profile.id, profile.name);
      if (res.success && res.playlist) {
        setActiveCollab(res.playlist);
        setTrackSearch('');
      } else {
        setErrorMsg(res.message || 'Erro ao adicionar música.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTrack = async (trackItemId: string) => {
    if (!activeCollab) return;
    try {
      const res = await removeCollabTrack(activeCollab.id, trackItemId, profile.id);
      if (res.success && res.playlist) {
        setActiveCollab(res.playlist);
      }
    } catch {}
  };

  const handleCloseCollab = async () => {
    if (!activeCollab) return;
    try {
      const res = await closeCollabPlaylist(activeCollab.id, profile.id);
      if (res.success) {
        setActiveCollab(null);
        setMode('list');
      }
    } catch {}
  };

  const handleCopyCode = () => {
    if (!activeCollab) return;
    navigator.clipboard.writeText(activeCollab.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const isOwner = activeCollab?.ownerId === profile.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-in fade-in select-none">
      <div className="relative w-full max-w-xl bg-[#0d091e] border border-purple-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-300 flex items-center justify-center border border-purple-500/30 shadow-md">
              <Users className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                  Colaboração em Tempo Real
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
                Playlists Colaborativas
              </h2>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200">
            {errorMsg}
          </div>
        )}

        {/* Mode: ACTIVE PLAYLIST VIEW */}
        {activeCollab ? (
          <div className="space-y-5">
            {/* Room Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white truncate max-w-xs">{activeCollab.name}</h3>
                <span className="text-[11px] font-mono text-purple-300 bg-purple-950/80 border border-purple-500/40 px-2.5 py-0.5 rounded-full">
                  {activeCollab.participants.length} participantes
                </span>
              </div>
              <p className="text-xs text-slate-300">{activeCollab.description || 'Playlist compartilhada ao vivo'}</p>

              {/* Invite Code Box */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="text-xs text-slate-400">
                  Código de Convite: <strong className="font-mono text-cyan-300 text-sm tracking-wider">{activeCollab.inviteCode}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-purple-300 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copiado!' : 'Copiar Código'}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('aurora_open_report', {
                          detail: {
                            targetType: 'playlist',
                            targetId: activeCollab.id,
                            targetName: `Playlist Colaborativa "${activeCollab.name}"`,
                            targetOwnerId: activeCollab.ownerId,
                            targetOwnerName: activeCollab.ownerName
                          }
                        }));
                      }
                    }}
                    className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 text-xs font-medium transition-colors flex items-center gap-1 border border-white/5 cursor-pointer"
                    title="Denunciar esta playlist para a moderação"
                  >
                    <Flag className="w-3.5 h-3.5 text-red-400" />
                    <span>Denunciar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Play All collaborative tracks */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Músicas Mais Votadas ({activeCollab.tracks.length})
              </span>
              {activeCollab.tracks.length > 0 && (
                <button
                  onClick={() => playTrack(activeCollab.tracks[0].track, activeCollab.tracks.map(t => t.track))}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Tocar Playlist</span>
                </button>
              )}
            </div>

            {/* Track list with real voting */}
            <div className="divide-y divide-white/[0.04] bg-white/[0.02] rounded-2xl border border-white/5 max-h-[35vh] overflow-y-auto">
              {activeCollab.tracks.map((item, idx) => {
                const hasVoted = item.votedUserIds.includes(profile.id);
                return (
                  <div key={item.id} className="p-3 flex items-center justify-between gap-3 hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-5 text-center text-xs font-mono font-bold text-purple-400">
                        #{idx + 1}
                      </span>
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-purple-950 shrink-0">
                        <img src={item.track.coverUrl} alt={item.track.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{item.track.title}</div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {item.track.artist} · <span className="text-purple-400">Por {item.addedByName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Voting Button */}
                      <button
                        onClick={() => handleVote(item.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          hasVoted
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-white/[0.04] hover:bg-purple-600/20 text-slate-300 hover:text-white'
                        }`}
                        title="Votar para subir esta música na fila"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{item.votes}</span>
                      </button>

                      {/* Remove if owner or creator */}
                      {(isOwner || item.addedBy === profile.id) && (
                        <button
                          onClick={() => handleRemoveTrack(item.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                          title="Remover da playlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Add Song input */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">Adicionar Música do Catálogo</span>
              <div className="flex gap-2">
                <select
                  value={trackSearch}
                  onChange={(e) => setTrackSearch(e.target.value)}
                  className="flex-1 bg-[#100a24] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="">Selecione uma faixa da biblioteca...</option>
                  {tracks.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.title} - {t.artist}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const found = tracks.find(t => t.id === trackSearch);
                    if (found) handleAddTrack(found);
                  }}
                  disabled={!trackSearch}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-bold"
                >
                  Adicionar
                </button>
              </div>
            </div>

            {/* Room Footer Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
              <button
                onClick={() => setActiveCollab(null)}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                ← Voltar às opções
              </button>

              {isOwner && (
                <button
                  onClick={handleCloseCollab}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600/20 text-rose-300 hover:bg-rose-600/40 border border-rose-500/30 text-xs font-semibold"
                >
                  Encerrar Compartilhamento
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Choice Mode: Create or Join */
          <div className="space-y-5">
            {mode === 'list' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setMode('create')}
                  className="p-5 rounded-3xl bg-gradient-to-br from-purple-900/30 to-purple-950/50 border border-purple-500/30 hover:border-purple-400 text-left space-y-2 group transition-all"
                >
                  <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Plus className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Criar Nova Playlist</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Inicie uma sala colaborativa com código de convite seguro e controle de votação.
                  </p>
                </button>

                <button
                  onClick={() => setMode('join')}
                  className="p-5 rounded-3xl bg-gradient-to-br from-indigo-900/30 to-indigo-950/50 border border-indigo-500/30 hover:border-indigo-400 text-left space-y-2 group transition-all"
                >
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Entrar com Código</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Participe de uma sessão criada por um amigo e vote nas próximas faixas.
                  </p>
                </button>
              </div>
            )}

            {mode === 'create' && (
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Nome da Playlist</label>
                  <input
                    type="text"
                    required
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="Ex: Sextou com a Galera"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Descrição (Opcional)</label>
                  <input
                    type="text"
                    value={createDesc}
                    onChange={(e) => setCreateDesc(e.target.value)}
                    placeholder="Votação aberta para a festa"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMode('list')}
                    className="px-4 py-2 rounded-xl bg-white/5 text-xs font-semibold text-slate-300 hover:text-white"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !createName.trim()}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md disabled:opacity-50"
                  >
                    {isLoading ? 'Criando Sala...' : 'Criar Playlist Colaborativa'}
                  </button>
                </div>
              </form>
            )}

            {mode === 'join' && (
              <form onSubmit={handleJoin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Código de 6 Caracteres</label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Ex: 8XF29A"
                    className="w-full font-mono text-center tracking-widest text-lg bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMode('list')}
                    className="px-4 py-2 rounded-xl bg-white/5 text-xs font-semibold text-slate-300 hover:text-white"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !joinCode.trim()}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md disabled:opacity-50"
                  >
                    {isLoading ? 'Conectando...' : 'Entrar na Sessão'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
