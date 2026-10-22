import React, { useState, useEffect } from 'react';
import { 
  X, 
  Flag, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2,
  FileText
} from 'lucide-react';
import { COMMUNITY_GUIDELINES_CATEGORIES, submitCommunityReport } from '../services/moderationService';
import { loadProfile } from '../services/storage';
import { ReportTargetType } from '../types/music';

export interface ReportModalData {
  targetType: ReportTargetType;
  targetId: string;
  targetName: string;
  targetOwnerId?: string;
  targetOwnerName?: string;
}

interface CommunityReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ReportModalData | null;
}

export const CommunityReportModal: React.FC<CommunityReportModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  const profile = loadProfile();

  const [selectedCategory, setSelectedCategory] = useState<string>(COMMUNITY_GUIDELINES_CATEGORIES[0].label);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedCategory(COMMUNITY_GUIDELINES_CATEGORIES[0].label);
      setDetails('');
      setFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen || !data) return null;

  const targetLabel = {
    user_profile: 'Perfil de Usuário',
    playlist: 'Playlist',
    comment: 'Comentário',
    track: 'Música'
  }[data.targetType];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim() || details.trim().length < 10) {
      setFeedback({
        type: 'error',
        message: 'Por favor, detalhe o motivo da denúncia com no mínimo 10 caracteres.'
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const res = await submitCommunityReport({
      reporterId: profile.id,
      reporterName: profile.name,
      reporterEmail: profile.email,
      targetType: data.targetType,
      targetId: data.targetId,
      targetName: data.targetName,
      targetOwnerId: data.targetOwnerId,
      targetOwnerName: data.targetOwnerName,
      reasonCategory: selectedCategory,
      details: details.trim()
    });

    setIsSubmitting(false);

    if (res.success) {
      setFeedback({
        type: 'success',
        message: 'Denúncia encaminhada com sucesso ao Master Admin para averiguação prioritária.'
      });
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      setFeedback({
        type: 'error',
        message: res.message || 'Falha ao registrar a denúncia.'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-[#0d091e] border border-red-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-red-950/40 text-slate-100 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Denunciar Violação
              </h2>
              <p className="text-xs text-slate-400">
                Diretrizes da Comunidade Aurora Music
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Info Pill */}
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Alvo da Denúncia:</span>
            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-semibold text-[10px] uppercase">
              {targetLabel}
            </span>
          </div>
          <p className="text-sm font-semibold text-white truncate">
            {data.targetName}
          </p>
          {data.targetOwnerName && (
            <p className="text-xs text-slate-400">
              Publicado por: <span className="text-slate-300 font-medium">{data.targetOwnerName}</span>
            </p>
          )}
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`p-4 rounded-2xl border text-xs flex items-start gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            )}
            <p className="leading-relaxed">{feedback.message}</p>
          </div>
        )}

        {/* Form */}
        {!feedback || feedback.type !== 'success' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Categoria da Infração:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-[#130d29] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-400"
              >
                {COMMUNITY_GUIDELINES_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.label} className="bg-[#130d29] text-white">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300">
                  Descreva o Ocorrido:
                </label>
                <span className="text-[10px] text-slate-500">
                  {details.length}/500 caracteres
                </span>
              </div>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value.slice(0, 500))}
                rows={4}
                placeholder="Explique com clareza o que aconteceu ou forneça detalhes que auxiliem a moderação a analisar o caso..."
                className="w-full bg-[#130d29] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-400 resize-none"
              />
            </div>

            <div className="text-[11px] text-slate-400 flex items-start gap-2 bg-red-950/20 p-3 rounded-xl border border-red-500/20">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>
                Denúncias fraudulentas ou em massa contra usuários inocentes também violam os termos e estão sujeitas a sanções disciplinares.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || details.trim().length < 10}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-red-950/50 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Enviando Denúncia...</span>
                  </>
                ) : (
                  <>
                    <Flag className="w-3.5 h-3.5" />
                    <span>Submeter Denúncia</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
};
