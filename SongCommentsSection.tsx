import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Heart, 
  Clock, 
  CornerDownRight, 
  Trash2, 
  Pin, 
  Sparkles, 
  Crown, 
  CheckCircle2, 
  Flame, 
  ThumbsUp, 
  Smile, 
  Search,
  Filter,
  Volume2,
  Flag,
  ShieldAlert
} from 'lucide-react';
import { Track, SongComment, SongCommentReply, UserProfile } from '../types/music';
import { 
  getTrackComments, 
  addTrackComment, 
  toggleLikeComment, 
  addCommentReply, 
  deleteTrackComment, 
  loadProfile 
} from '../services/storage';
import { useAudioPlayer } from '../context/AudioPlayerContext';

interface SongCommentsSectionProps {
  track: Track;
  compact?: boolean;
}

export const SongCommentsSection: React.FC<SongCommentsSectionProps> = ({ track, compact = false }) => {
  const { currentTime, seek, isPlaying } = useAudioPlayer();
  const [comments, setComments] = useState<SongComment[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => loadProfile());
  const [newCommentText, setNewCommentText] = useState('');
  const [attachTimestamp, setAttachTimestamp] = useState(false);
  const [pinnedTime, setPinnedTime] = useState<number | null>(null);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sortBy, setSortBy] = useState<'top' | 'recent' | 'timed'>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Formata segundos em mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Carrega comentários da faixa
  const reloadComments = () => {
    if (!track?.id) return;
    const list = getTrackComments(track.id, track.title, track.artist);
    setComments(list);
  };

  useEffect(() => {
    reloadComments();
  }, [track?.id]);

  // Listener para sincronização em tempo real (multi-abas ou eventos internos)
  useEffect(() => {
    const handleCommentsUpdated = (e: any) => {
      if (!e?.detail?.trackId || e.detail.trackId === track?.id) {
        reloadComments();
      }
    };

    const handleAccountChanged = () => {
      setCurrentUser(loadProfile());
    };

    window.addEventListener('aurora-comments-updated', handleCommentsUpdated);
    window.addEventListener('aurora-account-changed', handleAccountChanged);
    return () => {
      window.removeEventListener('aurora-comments-updated', handleCommentsUpdated);
      window.removeEventListener('aurora-account-changed', handleAccountChanged);
    };
  }, [track?.id]);

  // Atualiza o timestamp fixado caso o toggle esteja ativo
  useEffect(() => {
    if (attachTimestamp) {
      setPinnedTime(Math.round(currentTime));
    } else {
      setPinnedTime(null);
    }
  }, [attachTimestamp, currentTime]);

  // Filtragem e ordenação dos comentários
  const filteredAndSortedComments = useMemo(() => {
    let result = [...comments];

    // Busca por texto ou autor
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        c => c.text.toLowerCase().includes(q) || c.userName.toLowerCase().includes(q)
      );
    }

    // Filtragem / Ordenação
    if (sortBy === 'timed') {
      result = result.filter(c => c.trackTime !== undefined);
      result.sort((a, b) => (a.trackTime || 0) - (b.trackTime || 0));
    } else if (sortBy === 'top') {
      result.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.likes - a.likes;
      });
    } else {
      // Recent
      result.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.timestamp - a.timestamp;
      });
    }

    return result;
  }, [comments, searchQuery, sortBy]);

  // Quick Emoji reactions
  const quickEmojis = ['🔥', '❤️', '🎧', '⚡', '🚀', '👏', '🌌', '💯'];

  const handleInsertEmoji = (emoji: string) => {
    setNewCommentText(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + emoji + ' ');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Enviar novo comentário
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !track?.id) return;

    const timeToAttach = attachTimestamp && pinnedTime !== null ? pinnedTime : undefined;
    const created = addTrackComment(track.id, newCommentText, timeToAttach);

    setNewCommentText('');
    setAttachTimestamp(false);
    setPinnedTime(null);
    reloadComments();

    setFeedbackToast('Comentário publicado na faixa!');
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  // Curtir comentário
  const handleLike = (commentId: string) => {
    if (!track?.id) return;
    toggleLikeComment(track.id, commentId);
    reloadComments();
  };

  // Responder a um comentário
  const handleSendReply = (commentId: string) => {
    if (!replyText.trim() || !track?.id) return;
    addCommentReply(track.id, commentId, replyText);
    setReplyText('');
    setActiveReplyId(null);
    reloadComments();

    setFeedbackToast('Resposta enviada com sucesso!');
    setTimeout(() => setFeedbackToast(null), 2500);
  };

  // Excluir comentário
  const handleDelete = (commentId: string) => {
    if (!track?.id) return;
    const ok = window.confirm('Deseja realmente remover seu comentário desta música?');
    if (!ok) return;

    deleteTrackComment(track.id, commentId);
    reloadComments();
    setFeedbackToast('Comentário removido.');
    setTimeout(() => setFeedbackToast(null), 2500);
  };

  // Formatação de data relativa amigável
  const formatRelativeTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora há pouco';
    if (mins < 60) return `há ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `há ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `há ${days}d`;
    return new Date(ts).toLocaleDateString('pt-BR');
  };

  const timedCommentsCount = useMemo(() => {
    return comments.filter(c => c.trackTime !== undefined).length;
  }, [comments]);

  return (
    <div className={`flex flex-col h-full overflow-hidden text-slate-100 ${compact ? 'p-3' : 'p-4 md:p-6'}`}>
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-purple-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-2xl border border-purple-400/40 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Header com Resumo e Filtros */}
      <div className="flex flex-col gap-3 pb-4 border-b border-white/[0.08] shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                <span>Comentários da Comunidade</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                  {comments.length}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Compartilhe o que achou de <span className="text-slate-200 font-medium">"{track.title}"</span>
              </p>
            </div>
          </div>

          {/* Seletor de Ordenação */}
          <div className="flex items-center gap-1 bg-[#120c24] p-1 rounded-xl border border-white/5 text-xs">
            <button
              onClick={() => setSortBy('recent')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                sortBy === 'recent'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Mais recentes primeiro"
            >
              Recentes
            </button>
            <button
              onClick={() => setSortBy('top')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                sortBy === 'top'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Mais curtidos primeiro"
            >
              Mais Curtidos
            </button>
            <button
              onClick={() => setSortBy('timed')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                sortBy === 'timed'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Filtrar comentários com marcação de tempo na música"
            >
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>Por Minuto ({timedCommentsCount})</span>
            </button>
          </div>
        </div>

        {/* Barra de Pesquisa rápida nos comentários */}
        {comments.length > 3 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar nos comentários..."
              className="w-full bg-[#120d26] border border-white/10 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Caixa de Entrada de Novo Comentário ou Aviso de Suspensão */}
      {currentUser.status === 'banned' || currentUser.status === 'suspended' ? (
        <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/30 flex items-center justify-between gap-3 text-xs mb-3 shrink-0">
          <div className="flex items-center gap-2.5 text-rose-300">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <span className="font-bold block text-white">
                {currentUser.status === 'banned' ? 'Conta Banida da Comunidade' : 'Conta Temporariamente Suspensa'}
              </span>
              <span className="text-[11px] text-slate-400">
                O envio de comentários e interação social estão bloqueados pela moderação.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('aurora_open_punishment_notice'));
              }
            }}
            className="px-3.5 py-1.5 rounded-xl bg-red-600/30 border border-red-500/40 text-red-200 hover:text-white hover:bg-red-600 text-[11px] font-bold shrink-0 transition-colors"
          >
            Ver Detalhes & Recorrer
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmitComment} className="pt-3 pb-4 border-b border-white/[0.06] shrink-0">
          <div className="flex gap-3">
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
              alt={currentUser.name}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-purple-500/30 shrink-0 self-start mt-0.5"
            />

            <div className="flex-1 flex flex-col gap-2">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="O que você achou dessa faixa? Escreva seu comentário..."
                  rows={2}
                  maxLength={400}
                  className="w-full bg-[#130d29] border border-white/10 focus:border-purple-500/80 rounded-xl p-3 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none transition-all resize-none shadow-inner"
                />
                <span className="absolute right-2.5 bottom-2 text-[10px] text-slate-500">
                  {newCommentText.length}/400
                </span>
              </div>

              {/* Ações: Marcador de Tempo + Reações Rápidas + Botão Enviar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Botão de Marcar Momento da Música */}
                  <button
                    type="button"
                    onClick={() => setAttachTimestamp(!attachTimestamp)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                      attachTimestamp
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                        : 'bg-white/[0.05] text-slate-400 border border-white/10 hover:text-white hover:bg-white/10'
                    }`}
                    title="Anexar o segundo atual da reprodução ao seu comentário"
                  >
                    <Clock className={`w-3.5 h-3.5 ${attachTimestamp ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
                    <span>
                      {attachTimestamp ? `Momento: ${formatTime(pinnedTime || currentTime)}` : 'Marcar Minuto Atual'}
                    </span>
                  </button>

                  {/* Emojis Rápidos */}
                  <div className="hidden sm:flex items-center gap-1 bg-[#100b22] px-2 py-0.5 rounded-full border border-white/5">
                    <Smile className="w-3 h-3 text-slate-400 mr-0.5" />
                    {quickEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleInsertEmoji(emoji)}
                        className="text-xs hover:scale-125 transition-transform p-0.5"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!newCommentText.trim()}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                    newCommentText.trim()
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:brightness-110 shadow-purple-900/40'
                      : 'bg-white/[0.05] text-slate-500 border border-white/5 cursor-not-allowed'
                  }`}
                >
                  <span>Comentar</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Lista de Comentários */}
      <div className="flex-1 overflow-y-auto space-y-3 pt-3 pr-1 scrollbar-thin scrollbar-thumb-purple-900/40">
        {filteredAndSortedComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3 animate-pulse">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-semibold text-white">Nenhum comentário encontrado</h4>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              {searchQuery ? 'Tente buscar por outras palavras.' : 'Seja o primeiro a compartilhar sua opinião ou marcar um momento épico desta música!'}
            </p>
          </div>
        ) : (
          filteredAndSortedComments.map((comment) => {
            const hasLiked = comment.likedBy?.includes(currentUser.id);
            const isAuthor = comment.userId === currentUser.id;
            const isReplying = activeReplyId === comment.id;

            return (
              <div
                key={comment.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  comment.isPinned
                    ? 'bg-purple-950/30 border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.12)]'
                    : 'bg-[#120c24]/80 border-white/[0.06] hover:border-white/10'
                }`}
              >
                {/* Pin Header se fixado */}
                {comment.isPinned && (
                  <div className="flex items-center gap-1.5 text-[10px] text-purple-300 font-semibold mb-2">
                    <Pin className="w-3 h-3 text-purple-400 fill-current" />
                    <span>Fixado pelo Criador Oficial</span>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <img
                    src={comment.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                    alt={comment.userName}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-purple-500/30 shrink-0 mt-0.5"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-white truncate">
                          {comment.userName}
                        </span>

                        {/* Badges */}
                        {comment.userBadge === 'VIP Aurora Plus' && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            <Crown className="w-2.5 h-2.5 text-amber-400 fill-current" />
                            <span>VIP</span>
                          </span>
                        )}
                        {comment.userBadge === 'Criador Verificado' && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            <CheckCircle2 className="w-2.5 h-2.5 text-cyan-400" />
                            <span>Criador</span>
                          </span>
                        )}

                        <span className="text-[10px] text-slate-500">
                          {formatRelativeTime(comment.timestamp)}
                        </span>
                      </div>

                      {/* Excluir comentário próprio */}
                      {isAuthor && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition-colors"
                          title="Excluir meu comentário"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Tag de Marcação no Minuto da Música */}
                    {comment.trackTime !== undefined && (
                      <button
                        type="button"
                        onClick={() => seek(comment.trackTime!)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 hover:bg-cyan-500/25 transition-all mb-2 shadow-sm group cursor-pointer"
                        title={`Clique para pular a reprodução para ${formatTime(comment.trackTime)}`}
                      >
                        <Volume2 className="w-3 h-3 text-cyan-400 group-hover:scale-110 transition-transform" />
                        <span>⏱️ {formatTime(comment.trackTime)}</span>
                        <span className="text-[9px] text-cyan-400/70 font-normal group-hover:text-cyan-300">
                          · Tocar neste trecho
                        </span>
                      </button>
                    )}

                    {/* Texto do Comentário */}
                    <p className="text-xs md:text-sm text-slate-200 leading-relaxed break-words whitespace-pre-wrap">
                      {comment.text}
                    </p>

                    {/* Barra de Ações: Curtir e Responder */}
                    <div className="flex items-center gap-3 mt-2.5">
                      <button
                        onClick={() => handleLike(comment.id)}
                        className={`flex items-center gap-1 text-xs font-semibold transition-all px-2 py-0.5 rounded-lg ${
                          hasLiked
                            ? 'text-rose-400 bg-rose-500/15 border border-rose-500/30'
                            : 'text-slate-400 hover:text-rose-400 hover:bg-white/5'
                        }`}
                        title={hasLiked ? 'Descurtir' : 'Curtir este comentário'}
                      >
                        <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-rose-500 text-rose-500 scale-110' : ''}`} />
                        <span>{comment.likes || 0}</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveReplyId(isReplying ? null : comment.id);
                          setReplyText('');
                        }}
                        className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-purple-300 transition-colors px-2 py-0.5 rounded-lg hover:bg-white/5"
                      >
                        <CornerDownRight className="w-3.5 h-3.5" />
                        <span>{comment.replies && comment.replies.length > 0 ? `Respostas (${comment.replies.length})` : 'Responder'}</span>
                      </button>

                      {/* Botão de Denunciar Comentário */}
                      {!isAuthor && (
                        <button
                          onClick={() => {
                            if (typeof window !== 'undefined') {
                              window.dispatchEvent(new CustomEvent('aurora_open_report', {
                                detail: {
                                  targetType: 'comment',
                                  targetId: comment.id,
                                  targetName: `Comentário de ${comment.userName} em "${track.title}"`,
                                  targetOwnerId: comment.userId,
                                  targetOwnerName: comment.userName
                                }
                              }));
                            }
                          }}
                          className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-red-400 transition-colors px-2 py-0.5 rounded-lg hover:bg-white/5 ml-auto"
                          title="Denunciar este comentário para a moderação"
                        >
                          <Flag className="w-3 h-3" />
                          <span>Denunciar</span>
                        </button>
                      )}
                    </div>

                    {/* Caixa de Resposta Inline */}
                    {isReplying && (
                      <div className="mt-3 p-2.5 rounded-xl bg-[#0e091d] border border-purple-500/30 flex flex-col gap-2 animate-in fade-in duration-150">
                        <div className="flex items-center gap-2 text-[11px] text-purple-300 font-medium">
                          <CornerDownRight className="w-3 h-3 text-purple-400" />
                          <span>Respondendo para {comment.userName}</span>
                        </div>
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Escreva sua resposta..."
                          className="w-full bg-[#160f2e] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSendReply(comment.id);
                            }
                          }}
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveReplyId(null)}
                            className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendReply(comment.id)}
                            disabled={!replyText.trim()}
                            className="px-3 py-1 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg disabled:opacity-40 transition-colors"
                          >
                            Responder
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Respostas Aninhadas */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-3 pl-3 border-l-2 border-purple-500/20 space-y-2">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="p-2 rounded-xl bg-[#0f0a20]/70 border border-white/[0.04]">
                            <div className="flex items-center gap-2 mb-1">
                              <img
                                src={reply.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                                alt={reply.userName}
                                className="w-5 h-5 rounded-full object-cover ring-1 ring-purple-500/20"
                              />
                              <span className="text-[11px] font-bold text-white truncate">
                                {reply.userName}
                              </span>
                              {reply.userBadge === 'VIP Aurora Plus' && (
                                <span className="text-[9px] font-bold text-amber-300">
                                  ★ VIP
                                </span>
                              )}
                              <span className="text-[9px] text-slate-500">
                                {formatRelativeTime(reply.timestamp)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 pl-7 leading-relaxed">
                              {reply.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
