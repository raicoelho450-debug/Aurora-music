import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  Send, 
  CheckCircle2, 
  FileText, 
  X, 
  LogOut, 
  ArrowRight,
  Loader2,
  Lock,
  Scale,
  RefreshCw
} from 'lucide-react';
import { PunishmentRecord, UserProfile } from '../types/music';
import { submitPunishmentAppeal, verifyUserStatusOnServer } from '../services/moderationService';
import { loadAccounts, setActiveAccountId } from '../services/storage';

interface PunishmentNoticeModalProps {
  user: UserProfile;
  punishment: PunishmentRecord | null;
  isOpen: boolean;
  onClose?: () => void;
}

export const PunishmentNoticeModal: React.FC<PunishmentNoticeModalProps> = ({
  user,
  punishment,
  isOpen,
  onClose
}) => {
  const [appealReason, setAppealReason] = useState('');
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);
  const [appealFeedback, setAppealFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Accounts list for switching if banned
  const [accounts, setAccounts] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (isOpen) {
      setAccounts(loadAccounts().filter(a => a.id !== user.id));
      setShowAppealForm(false);
      setAppealFeedback(null);
      setAppealReason('');
    }
  }, [isOpen, user.id]);

  if (!isOpen || !punishment) return null;

  const isBanned = punishment.type === 'permanent_ban' || user.status === 'banned';
  const isSuspended = punishment.type === 'temporary_suspension' || user.status === 'suspended';
  const isWarning = punishment.type === 'warning' || user.status === 'warned';

  const formatExpiry = (timestamp?: number | null) => {
    if (!timestamp) return 'Permanente';
    const date = new Date(timestamp);
    const now = Date.now();
    const diffHours = Math.max(0, Math.round((timestamp - now) / 3600000));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} (restam ~${diffDays} dias)`;
    }
    return `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} (restam ~${diffHours} horas)`;
  };

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    try {
      const res = await verifyUserStatusOnServer(user);
      if (res.status === 'active') {
        if (onClose) onClose();
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealReason.trim() || appealReason.trim().length < 10) {
      setAppealFeedback({
        type: 'error',
        message: 'A justificativa do recurso deve conter pelo menos 10 caracteres explicativos.'
      });
      return;
    }

    setIsSubmittingAppeal(true);
    setAppealFeedback(null);

    const res = await submitPunishmentAppeal({
      punishmentId: punishment.id,
      userId: user.id,
      reason: appealReason.trim()
    });

    setIsSubmittingAppeal(false);

    if (res.success) {
      setAppealFeedback({
        type: 'success',
        message: 'Seu recurso foi registrado com sucesso! O Master Admin revisará seu caso com prioridade.'
      });
      setShowAppealForm(false);
      handleRefreshStatus();
    } else {
      setAppealFeedback({
        type: 'error',
        message: res.message || 'Falha ao registrar recurso.'
      });
    }
  };

  const handleSwitchAccount = (accountId: string) => {
    setActiveAccountId(accountId);
    if (onClose) onClose();
  };

  return (
    <div className={`fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300 ${isBanned ? 'pointer-events-auto' : ''}`}>
      <div 
        className="relative w-full max-w-xl bg-gradient-to-b from-[#160c29] via-[#0e081c] to-[#07040f] border border-red-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-red-950/60 text-slate-100 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Badge */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isBanned 
                ? 'bg-red-600/25 border border-red-500/40 text-red-400' 
                : isSuspended 
                ? 'bg-amber-600/25 border border-amber-500/40 text-amber-400' 
                : 'bg-yellow-600/25 border border-yellow-500/40 text-yellow-400'
            }`}>
              {isBanned ? <ShieldAlert className="w-6 h-6" /> : isSuspended ? <Lock className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isBanned
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : isSuspended
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                }`}>
                  {isBanned ? 'Banimento Permanente' : isSuspended ? 'Suspensão Temporária' : 'Advertência Formal'}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {punishment.id}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-1">
                {isBanned 
                  ? 'Acesso Bloqueado por Violação' 
                  : isSuspended 
                  ? 'Acesso Temporariamente Restrito' 
                  : 'Aviso Disciplinar da Comunidade'}
              </h2>
            </div>
          </div>

          {!isBanned && onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Fechar aviso"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Detailed Punishment Info Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3.5 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px] font-medium">Motivo Registrado:</span>
            <p className="text-sm font-semibold text-rose-200 mt-0.5 leading-snug">
              "{punishment.reason}"
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Categoria</span>
              <span className="text-slate-200 font-medium">{punishment.reasonCategory}</span>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Autoridade</span>
              <span className="text-slate-200 font-medium">{punishment.appliedBy}</span>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Data de Aplicação</span>
              <span className="text-slate-200 font-medium">
                {new Date(punishment.appliedAt).toLocaleDateString('pt-BR')} às {new Date(punishment.appliedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Duração / Expiração</span>
              <span className={`font-semibold ${isBanned ? 'text-rose-400' : 'text-amber-300'}`}>
                {isBanned ? 'Permanente' : formatExpiry(punishment.expiresAt)}
              </span>
            </div>
          </div>

          {punishment.notes && (
            <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/20 text-purple-200 text-[11px]">
              <span className="font-semibold text-purple-300">Observação da Moderação:</span> {punishment.notes}
            </div>
          )}
        </div>

        {/* Appeal Section (Recurso) */}
        <div className="space-y-3">
          {punishment.appeal ? (
            <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
              punishment.appeal.status === 'accepted'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : punishment.appeal.status === 'rejected'
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                : 'bg-blue-500/15 border-blue-500/30 text-blue-300'
            }`}>
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <Scale className="w-4 h-4" />
                  Status do Recurso:
                </span>
                <span className="uppercase text-[10px] px-2 py-0.5 rounded-full bg-black/40">
                  {punishment.appeal.status === 'accepted'
                    ? 'Aceito (Punição Revogada)'
                    : punishment.appeal.status === 'rejected'
                    ? 'Indeferido (Punição Mantida)'
                    : 'Em Análise pelo Master Admin'}
                </span>
              </div>
              <p className="text-slate-300 text-[11px]">
                <strong className="text-white">Sua Justificativa:</strong> "{punishment.appeal.reason}"
              </p>
              {punishment.appeal.decisionNote && (
                <div className="pt-1 border-t border-white/10 text-white font-medium">
                  <strong>Parecer Final da Moderação:</strong> {punishment.appeal.decisionNote}
                </div>
              )}
            </div>
          ) : (
            !showAppealForm && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="text-xs text-slate-300">
                  <span className="font-bold text-white block">Acredita que houve um engano?</span>
                  Você tem o direito de solicitar uma revisão formal diretamente ao Master Admin.
                </div>
                <button
                  onClick={() => setShowAppealForm(true)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shrink-0 transition-colors flex items-center gap-1.5 shadow-lg shadow-purple-950/40"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Apresentar Recurso</span>
                </button>
              </div>
            )
          )}

          {/* Form to submit appeal */}
          {showAppealForm && !punishment.appeal && (
            <form onSubmit={handleSubmitAppeal} className="p-4 rounded-2xl bg-[#120a26] border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-purple-400" />
                  Apresentar Recurso contra Decisão
                </span>
                <button
                  type="button"
                  onClick={() => setShowAppealForm(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Cancelar
                </button>
              </div>

              <textarea
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                rows={3}
                placeholder="Explique os fatos, contexto ou justificativa pela qual a punição deve ser revista ou cancelada..."
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 resize-none"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-500">
                  Mínimo 10 caracteres ({appealReason.length} digitados)
                </span>
                <button
                  type="submit"
                  disabled={isSubmittingAppeal || appealReason.trim().length < 10}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all"
                >
                  {isSubmittingAppeal ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Enviando Recurso...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      <span>Submeter ao Master Admin</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {appealFeedback && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              appealFeedback.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}>
              {appealFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{appealFeedback.message}</span>
            </div>
          )}
        </div>

        {/* Footer Actions: Switch Account / Refresh Status */}
        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleRefreshStatus}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-purple-400' : ''}`} />
            <span>Verificar Status no Servidor</span>
          </button>

          {accounts.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Trocar de Conta:</span>
              <div className="flex flex-wrap gap-1.5">
                {accounts.map(acc => (
                  <button
                    key={acc.id}
                    onClick={() => handleSwitchAccount(acc.id)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-slate-200 transition-colors"
                  >
                    {acc.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isBanned && onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors"
            >
              Compreendi as Diretrizes
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
