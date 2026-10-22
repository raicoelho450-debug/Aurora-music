import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Scale, 
  AlertTriangle, 
  Clock, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  PlusCircle, 
  RefreshCw, 
  RotateCcw, 
  UserX, 
  FileText, 
  MessageSquare, 
  Flag, 
  Lock, 
  Unlock, 
  ChevronRight, 
  Send, 
  AlertOctagon,
  Users,
  Shield,
  Layers,
  History,
  Check,
  X
} from 'lucide-react';
import { 
  PunishmentRecord, 
  PunishmentType, 
  CommunityReport, 
  ModerationAuditLog,
  UserProfile
} from '../types/music';
import { 
  COMMUNITY_GUIDELINES_CATEGORIES, 
  PRESET_PUNISHMENT_REASONS,
  fetchModerationUsers,
  applyPunishment,
  revokePunishment,
  fetchReportsQueue,
  decideReport,
  decidePunishmentAppeal,
  fetchModerationAuditLog
} from '../services/moderationService';

interface MasterAdminModerationPanelProps {
  adminPin: string;
}

export const MasterAdminModerationPanel: React.FC<MasterAdminModerationPanelProps> = ({ adminPin }) => {
  // Navigation tabs within Master Admin Moderation
  const [activeTab, setActiveTab] = useState<'punishments' | 'reports' | 'appeals' | 'audit'>('punishments');

  // Server data
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<ModerationAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'warned' | 'suspended' | 'banned'>('all');
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'investigating' | 'action_taken' | 'dismissed'>('all');

  // Selected User for History Modal
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // Apply Punishment Modal State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<any | null>(null);
  const [punishmentType, setPunishmentType] = useState<PunishmentType>('temporary_suspension');
  const [reasonCategory, setReasonCategory] = useState<string>(COMMUNITY_GUIDELINES_CATEGORIES[0].label);
  const [selectedPresetReason, setSelectedPresetReason] = useState<string>(PRESET_PUNISHMENT_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [suspensionDuration, setSuspensionDuration] = useState<number>(7);
  const [internalNotes, setInternalNotes] = useState('');
  const [isSubmittingPunishment, setIsSubmittingPunishment] = useState(false);

  // Revocation Modal State
  const [punishmentToRevoke, setPunishmentToRevoke] = useState<{ punishment: PunishmentRecord; user: any } | null>(null);
  const [revocationReason, setRevocationReason] = useState('');
  const [isSubmittingRevocation, setIsSubmittingRevocation] = useState(false);

  // Report Decision Modal State
  const [reportToDecide, setReportToDecide] = useState<CommunityReport | null>(null);
  const [reportNotes, setReportNotes] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  // Appeal Decision Modal State
  const [appealToDecide, setAppealToDecide] = useState<{ appeal: any; punishment: PunishmentRecord; user: any } | null>(null);
  const [appealDecisionNote, setAppealDecisionNote] = useState('');
  const [isSubmittingAppealDecision, setIsSubmittingAppealDecision] = useState(false);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4500);
  };

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, reportsRes, auditRes] = await Promise.all([
        fetchModerationUsers(adminPin),
        fetchReportsQueue(adminPin),
        fetchModerationAuditLog(adminPin)
      ]);

      if (usersRes.success) setUsers(usersRes.users);
      if (reportsRes.success) setReports(reportsRes.reports);
      if (auditRes.success) setAuditLogs(auditRes.logs);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();

    const handleUpdate = () => {
      loadAllData();
    };

    window.addEventListener('aurora-moderation-updated', handleUpdate);
    return () => window.removeEventListener('aurora-moderation-updated', handleUpdate);
  }, [adminPin]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [users, searchQuery, statusFilter]);

  // Filtered Reports
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      if (reportFilter === 'all') return true;
      return r.status === reportFilter;
    });
  }, [reports, reportFilter]);

  // Pending Appeals Extraction
  const pendingAppeals = useMemo(() => {
    const list: Array<{ appeal: any; punishment: PunishmentRecord; user: any }> = [];
    users.forEach(u => {
      (u.punishmentHistory || []).forEach((p: PunishmentRecord) => {
        if (p.appeal) {
          list.push({ appeal: p.appeal, punishment: p, user: u });
        }
      });
    });
    return list;
  }, [users]);

  // Stats
  const stats = useMemo(() => {
    const activeBans = users.filter(u => u.status === 'banned').length;
    const activeSuspensions = users.filter(u => u.status === 'suspended').length;
    const pendingReportsCount = reports.filter(r => r.status === 'pending').length;
    const pendingAppealsCount = pendingAppeals.filter(a => a.appeal.status === 'pending').length;
    return { activeBans, activeSuspensions, pendingReportsCount, pendingAppealsCount };
  }, [users, reports, pendingAppeals]);

  // Handler: Open Apply Punishment
  const handleOpenApplyModal = (user: any) => {
    setTargetUser(user);
    setPunishmentType('temporary_suspension');
    setReasonCategory(COMMUNITY_GUIDELINES_CATEGORIES[0].label);
    setSelectedPresetReason(PRESET_PUNISHMENT_REASONS[0]);
    setCustomReason('');
    setSuspensionDuration(7);
    setInternalNotes('');
    setIsApplyModalOpen(true);
  };

  // Handler: Submit Apply Punishment
  const handleSubmitPunishment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;

    const finalReason = customReason.trim() ? customReason.trim() : selectedPresetReason;
    if (!finalReason) {
      showNotification('error', 'O motivo da punição é obrigatório.');
      return;
    }

    setIsSubmittingPunishment(true);
    const res = await applyPunishment({
      adminPin,
      userId: targetUser.id,
      type: punishmentType,
      reasonCategory,
      reason: finalReason,
      durationDays: punishmentType === 'temporary_suspension' ? suspensionDuration : undefined,
      notes: internalNotes.trim() || undefined
    });

    setIsSubmittingPunishment(false);
    if (res.success) {
      showNotification('success', res.message);
      setIsApplyModalOpen(false);
      loadAllData();
    } else {
      showNotification('error', res.message);
    }
  };

  // Handler: Submit Revocation (Unban / Remove Punishment)
  const handleSubmitRevocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!punishmentToRevoke) return;

    if (!revocationReason.trim() || revocationReason.trim().length < 5) {
      showNotification('error', 'A justificativa de revogação deve conter no mínimo 5 caracteres.');
      return;
    }

    setIsSubmittingRevocation(true);
    const res = await revokePunishment({
      adminPin,
      punishmentId: punishmentToRevoke.punishment.id,
      userId: punishmentToRevoke.user.id,
      reason: revocationReason.trim()
    });

    setIsSubmittingRevocation(false);
    if (res.success) {
      showNotification('success', res.message);
      setPunishmentToRevoke(null);
      setRevocationReason('');
      loadAllData();
    } else {
      showNotification('error', res.message);
    }
  };

  // Handler: Decide Report
  const handleDecideReportSubmit = async (decision: 'action_taken' | 'dismissed' | 'investigating') => {
    if (!reportToDecide) return;

    setIsSubmittingDecision(true);
    const res = await decideReport({
      adminPin,
      reportId: reportToDecide.id,
      decision,
      moderatorNotes: reportNotes.trim() || undefined
    });

    setIsSubmittingDecision(false);
    if (res.success) {
      showNotification('success', res.message);
      setReportToDecide(null);
      setReportNotes('');
      loadAllData();
    } else {
      showNotification('error', res.message);
    }
  };

  // Handler: Decide Appeal
  const handleDecideAppealSubmit = async (decision: 'accepted' | 'rejected') => {
    if (!appealToDecide) return;

    setIsSubmittingAppealDecision(true);
    const res = await decidePunishmentAppeal({
      adminPin,
      appealId: appealToDecide.appeal.id,
      decision,
      decisionNote: appealDecisionNote.trim() || undefined
    });

    setIsSubmittingAppealDecision(false);
    if (res.success) {
      showNotification('success', res.message);
      setAppealToDecide(null);
      setAppealDecisionNote('');
      loadAllData();
    } else {
      showNotification('error', res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Alert / Feedback */}
      {feedback && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 shadow-lg ${
          feedback.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />}
            <span className="font-medium">{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#0f0a21] border border-red-500/20 shadow-md">
          <div className="flex items-center justify-between text-xs text-red-400 font-semibold mb-1">
            <span>Banimentos Ativos</span>
            <UserX className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats.activeBans}</div>
          <div className="text-[10px] text-slate-500 mt-1">Exclusivo Master Admin</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0f0a21] border border-amber-500/20 shadow-md">
          <div className="flex items-center justify-between text-xs text-amber-400 font-semibold mb-1">
            <span>Suspensões Ativas</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats.activeSuspensions}</div>
          <div className="text-[10px] text-slate-500 mt-1">Expiração automática</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0f0a21] border border-blue-500/20 shadow-md">
          <div className="flex items-center justify-between text-xs text-blue-400 font-semibold mb-1">
            <span>Fila de Denúncias</span>
            <Flag className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats.pendingReportsCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Aguardando decisão</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0f0a21] border border-purple-500/20 shadow-md">
          <div className="flex items-center justify-between text-xs text-purple-400 font-semibold mb-1">
            <span>Recursos Pendentes</span>
            <Scale className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats.pendingAppealsCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Pedidos de revisão</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 bg-[#0e091e] p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('punishments')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'punishments'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Gerenciar Usuários & Punições</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 relative ${
              activeTab === 'reports'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Fila de Denúncias</span>
            {stats.pendingReportsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('appeals')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 relative ${
              activeTab === 'appeals'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Recursos & Revisões</span>
            {stats.pendingAppealsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[9px] font-bold">
                {stats.pendingAppealsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Trilha de Auditoria</span>
          </button>
        </div>

        <button
          onClick={loadAllData}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 font-medium transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
          <span>Atualizar Servidor</span>
        </button>
      </div>

      {/* TAB 1: USERS & PUNISHMENT MANAGEMENT */}
      {activeTab === 'punishments' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar usuário por nome, e-mail ou User ID..."
                className="w-full bg-[#0d081f] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(['all', 'active', 'warned', 'suspended', 'banned'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                    statusFilter === st
                      ? 'bg-purple-600 text-white font-bold'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {st === 'all' ? 'Todos' : st === 'active' ? 'Ativos' : st === 'warned' ? 'Advertidos' : st === 'suspended' ? 'Suspensos' : 'Banidos'}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table / List */}
          <div className="rounded-2xl bg-[#0c081c] border border-white/5 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.02] border-b border-white/5 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Usuário</th>
                    <th className="py-3 px-4">E-mail</th>
                    <th className="py-3 px-4">Cargo</th>
                    <th className="py-3 px-4">Status da Conta</th>
                    <th className="py-3 px-4">Punição Atual</th>
                    <th className="py-3 px-4 text-right">Ações de Moderação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((u) => {
                    const isBanned = u.status === 'banned';
                    const isSuspended = u.status === 'suspended';
                    const isWarned = u.status === 'warned';
                    const isMaster = u.role === 'master_admin';

                    return (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center font-bold text-white text-xs">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {isMaster && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold text-[9px] uppercase border border-amber-500/30">
                                    Master Admin
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono">{u.id}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-300">
                          {u.email}
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            isMaster ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-slate-300'
                          }`}>
                            {u.role}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                            isBanned
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : isSuspended
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : isWarned
                              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {isBanned && <UserX className="w-3 h-3" />}
                            {isSuspended && <Clock className="w-3 h-3" />}
                            {isWarned && <AlertTriangle className="w-3 h-3" />}
                            {u.status === 'active' && <CheckCircle2 className="w-3 h-3" />}
                            <span>{u.status}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {u.activePunishment ? (
                            <div className="max-w-xs space-y-0.5">
                              <span className="text-[10px] text-rose-300 font-semibold block truncate">
                                "{u.activePunishment.reason}"
                              </span>
                              <span className="text-[9px] text-slate-400">
                                {u.activePunishment.type === 'temporary_suspension' && u.activePunishment.expiresAt
                                  ? `Expira em: ${new Date(u.activePunishment.expiresAt).toLocaleDateString('pt-BR')}`
                                  : u.activePunishment.type}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Nenhuma</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View History Button */}
                            <button
                              onClick={() => setSelectedUser(u)}
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-slate-300 font-medium transition-colors"
                              title="Consultar Histórico Completo"
                            >
                              Histórico ({u.punishmentHistory?.length || 0})
                            </button>

                            {/* Revoke Button if active punishment */}
                            {u.activePunishment && (
                              <button
                                onClick={() => setPunishmentToRevoke({ punishment: u.activePunishment, user: u })}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-[11px] text-emerald-300 font-bold border border-emerald-500/40 transition-colors flex items-center gap-1"
                                title="Revogar Punição / Desbanir"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Revogar</span>
                              </button>
                            )}

                            {/* Apply Punishment Button */}
                            {!isMaster && (
                              <button
                                onClick={() => handleOpenApplyModal(u)}
                                className="px-3 py-1 rounded-lg bg-red-600/80 hover:bg-red-500 text-[11px] text-white font-bold transition-all shadow-md flex items-center gap-1"
                              >
                                <ShieldAlert className="w-3 h-3" />
                                <span>Punir</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        Nenhum usuário encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REPORTS QUEUE */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Flag className="w-4 h-4 text-red-400" />
              <span>Fila de Denúncias da Comunidade</span>
            </h3>

            <div className="flex items-center gap-1.5">
              {(['all', 'pending', 'investigating', 'action_taken', 'dismissed'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setReportFilter(f)}
                  className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                    reportFilter === f ? 'bg-purple-600 text-white font-bold' : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendentes' : f === 'investigating' ? 'Em Análise' : f === 'action_taken' ? 'Punido' : 'Descartadas'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredReports.map(report => (
              <div 
                key={report.id}
                className="p-5 rounded-2xl bg-[#0d091e] border border-white/5 hover:border-white/10 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      report.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : report.status === 'investigating'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : report.status === 'action_taken'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-slate-700 text-slate-400'
                    }`}>
                      {report.status}
                    </span>
                    <span className="text-xs font-bold text-white">{report.targetName}</span>
                    <span className="text-[10px] text-purple-400 font-semibold uppercase px-2 py-0.2 rounded bg-purple-500/10">
                      {report.targetType}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500">
                    Denunciado em {new Date(report.createdAt).toLocaleDateString('pt-BR')} às {new Date(report.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Categoria da Violação</span>
                    <span className="text-rose-300 font-semibold">{report.reasonCategory}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Denunciante</span>
                    <span className="text-slate-200">{report.reporterName}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Autor do Conteúdo</span>
                    <span className="text-slate-200">{report.targetOwnerName || 'Não especificado'}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-300">
                  <strong className="text-white">Relato do Usuário:</strong> "{report.details}"
                </div>

                {report.moderatorNotes && (
                  <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-purple-200">
                    <strong className="text-purple-300">Parecer do Master Admin ({report.decidedBy}):</strong> {report.moderatorNotes}
                  </div>
                )}

                {/* Actions on Report */}
                {report.status === 'pending' || report.status === 'investigating' ? (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => {
                        setReportToDecide(report);
                        setReportNotes('');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Registrar Decisão & Ação</span>
                    </button>
                  </div>
                ) : null}
              </div>
            ))}

            {filteredReports.length === 0 && (
              <div className="p-8 text-center text-slate-500 bg-white/[0.01] rounded-2xl border border-white/5">
                Nenhuma denúncia na fila com o filtro selecionado.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: APPEALS QUEUE */}
      {activeTab === 'appeals' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-purple-400" />
            <span>Fila de Recursos e Pedidos de Revisão</span>
          </h3>

          <div className="space-y-3">
            {pendingAppeals.map(({ appeal, punishment, user }) => (
              <div 
                key={appeal.id}
                className="p-5 rounded-2xl bg-[#0d091e] border border-white/5 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      appeal.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : appeal.status === 'accepted'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {appeal.status === 'pending' ? 'Pendente de Julgamento' : appeal.status}
                    </span>
                    <span className="text-xs font-bold text-white">{user.name} ({user.email})</span>
                  </div>

                  <span className="text-[11px] text-slate-500">
                    Enviado em {new Date(appeal.submittedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/20">
                    <span className="text-red-300 font-bold block mb-1">Punição Original Contestada:</span>
                    <p className="text-slate-300 font-medium">"{punishment.reason}"</p>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Tipo: {punishment.type} · Categoria: {punishment.reasonCategory}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/20">
                    <span className="text-blue-300 font-bold block mb-1">Justificativa do Recurso do Usuário:</span>
                    <p className="text-slate-300 italic font-medium">"{appeal.reason}"</p>
                  </div>
                </div>

                {appeal.decisionNote && (
                  <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-purple-200">
                    <strong>Decisão Final Registrada ({appeal.decidedBy}):</strong> {appeal.decisionNote}
                  </div>
                )}

                {appeal.status === 'pending' && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => {
                        setAppealToDecide({ appeal, punishment, user });
                        setAppealDecisionNote('');
                      }}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors shadow-md"
                    >
                      Julgar Recurso do Usuário
                    </button>
                  </div>
                )}
              </div>
            ))}

            {pendingAppeals.length === 0 && (
              <div className="p-8 text-center text-slate-500 bg-white/[0.01] rounded-2xl border border-white/5">
                Nenhum recurso pendente de julgamento no momento.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-purple-400" />
              <span>Trilha de Auditoria e Segurança (Imutável no Servidor)</span>
            </h3>
            <span className="text-[11px] text-slate-500">
              {auditLogs.length} registros auditados
            </span>
          </div>

          <div className="rounded-2xl bg-[#0c081c] border border-white/5 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.02] border-b border-white/5 text-slate-400 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Data/Hora</th>
                    <th className="py-3 px-4">Autoridade / Ator</th>
                    <th className="py-3 px-4">Tipo de Ação</th>
                    <th className="py-3 px-4">Alvo</th>
                    <th className="py-3 px-4">Detalhes do Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleDateString('pt-BR')} {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                      </td>
                      <td className="py-2.5 px-4 text-purple-300 font-bold whitespace-nowrap">
                        {log.actor} ({log.actorRole})
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300 text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-200">
                        {log.targetUserName || log.targetUserId || '-'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-300 font-sans">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: APPLY PUNISHMENT MODAL */}
      {isApplyModalOpen && targetUser && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg bg-[#0e081e] border border-red-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Aplicar Punição Disciplinar</h3>
                  <p className="text-xs text-slate-400">Alvo: <strong className="text-white">{targetUser.name}</strong> ({targetUser.email})</p>
                </div>
              </div>
              <button onClick={() => setIsApplyModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPunishment} className="space-y-4 text-xs">
              {/* Type Selection */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Tipo de Punição:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPunishmentType('warning')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold transition-all ${
                      punishmentType === 'warning'
                        ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    Advertência
                  </button>

                  <button
                    type="button"
                    onClick={() => setPunishmentType('temporary_suspension')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold transition-all ${
                      punishmentType === 'temporary_suspension'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    Suspensão
                  </button>

                  <button
                    type="button"
                    onClick={() => setPunishmentType('permanent_ban')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold transition-all ${
                      punishmentType === 'permanent_ban'
                        ? 'bg-red-600/30 border-red-500 text-red-400 shadow-lg shadow-red-950/50'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    Banimento
                  </button>
                </div>
              </div>

              {/* Suspension Duration selector */}
              {punishmentType === 'temporary_suspension' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Duração da Suspensão:
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 3, 7, 14, 30].map(days => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setSuspensionDuration(days)}
                        className={`py-1.5 rounded-lg border text-center font-semibold transition-all ${
                          suspensionDuration === days
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-white/5 border-white/10 text-slate-400'
                        }`}
                      >
                        {days} {days === 1 ? 'dia' : 'dias'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Warning about Permanent Ban */}
              {punishmentType === 'permanent_ban' && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 flex items-start gap-2">
                  <AlertOctagon className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <span>
                    Atenção: O banimento permanente desativa irreversivelmente o acesso desta conta ao Aurora Music. Esta prerrogativa pertence exclusivamente ao Master Admin.
                  </span>
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Categoria da Violação:</label>
                <select
                  value={reasonCategory}
                  onChange={(e) => setReasonCategory(e.target.value)}
                  className="w-full bg-[#140c2b] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                >
                  {COMMUNITY_GUIDELINES_CATEGORIES.map(c => (
                    <option key={c.id} value={c.label} className="bg-[#140c2b] text-white">
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reason Selector */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Motivo Pré-definido:</label>
                <select
                  value={selectedPresetReason}
                  onChange={(e) => {
                    setSelectedPresetReason(e.target.value);
                    setCustomReason('');
                  }}
                  className="w-full bg-[#140c2b] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                >
                  {PRESET_PUNISHMENT_REASONS.map((r, i) => (
                    <option key={i} value={r} className="bg-[#140c2b] text-white">
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Reason Text */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Ou digite um Motivo Personalizado:
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  rows={2}
                  placeholder="Se preenchido, este texto substituirá o motivo pré-definido acima..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 resize-none"
                />
              </div>

              {/* Internal Notes */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Observações Internas (Opcional):</label>
                <input
                  type="text"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Ex: Análise baseada na denúncia #rep_102 e reincidência prévia"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPunishment}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-lg shadow-red-950/60"
                >
                  {isSubmittingPunishment ? 'Aplicando no Servidor...' : 'Confirmar e Aplicar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: USER FULL HISTORY MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-xl bg-[#0e081e] border border-purple-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-100 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Histórico de Moderação</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    selectedUser.status === 'banned' ? 'bg-red-500/20 text-red-300' : selectedUser.status === 'suspended' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {selectedUser.status}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Usuário: {selectedUser.name} · {selectedUser.email}
                </p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {(selectedUser.punishmentHistory || []).map((p: PunishmentRecord) => (
                <div key={p.id} className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-300 uppercase text-[10px] tracking-wider">
                      {p.type} · Status: {p.status}
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      {new Date(p.appliedAt).toLocaleDateString('pt-BR')} às {new Date(p.appliedAt).toLocaleTimeString('pt-BR')}
                    </span>
                  </div>

                  <p className="text-slate-200 font-semibold">"{p.reason}"</p>
                  
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
                    <span>Aplicado por: {p.appliedBy}</span>
                    <span>{p.durationDays ? `Duração: ${p.durationDays} dias` : 'Sem prazo'}</span>
                  </div>

                  {p.revocation && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-[11px]">
                      <strong>Revogação em {new Date(p.revocation.revokedAt).toLocaleDateString('pt-BR')}:</strong> {p.revocation.reason} (por {p.revocation.revokedBy})
                    </div>
                  )}

                  {p.appeal && (
                    <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200 text-[11px]">
                      <strong>Recurso do Usuário:</strong> "{p.appeal.reason}" ({p.appeal.status})
                    </div>
                  )}
                </div>
              ))}

              {(!selectedUser.punishmentHistory || selectedUser.punishmentHistory.length === 0) && (
                <div className="p-6 text-center text-slate-500 bg-white/[0.01] rounded-2xl">
                  Este usuário possui ficha limpa. Nenhuma punição aplicada.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REVOCATION (UNBAN / REMOVE PUNISHMENT) */}
      {punishmentToRevoke && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-[#0e081e] border border-emerald-500/40 rounded-3xl p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-emerald-400" />
                <span>Revogar Punição / Desbanir</span>
              </h3>
              <button onClick={() => setPunishmentToRevoke(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-xs space-y-1">
              <span className="text-slate-400">Usuário: <strong className="text-white">{punishmentToRevoke.user.name}</strong></span>
              <p className="text-rose-300 font-semibold truncate">
                Punição: {punishmentToRevoke.punishment.reason}
              </p>
            </div>

            <form onSubmit={handleSubmitRevocation} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Justificativa Obrigatória da Revogação:
                </label>
                <textarea
                  value={revocationReason}
                  onChange={(e) => setRevocationReason(e.target.value)}
                  rows={3}
                  placeholder="Ex: Usuário apresentou recurso aceito pelo Master Admin e assumiu compromisso de não reincidência..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setPunishmentToRevoke(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRevocation || revocationReason.trim().length < 5}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold transition-all shadow-lg shadow-emerald-950/60"
                >
                  {isSubmittingRevocation ? 'Revogando no Servidor...' : 'Confirmar Revogação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: DECIDE REPORT */}
      {reportToDecide && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg bg-[#0e081e] border border-purple-500/40 rounded-3xl p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Flag className="w-5 h-5 text-purple-400" />
                <span>Julgar Denúncia</span>
              </h3>
              <button onClick={() => setReportToDecide(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs space-y-1">
              <div>Alvo: <strong className="text-white">{reportToDecide.targetName}</strong> ({reportToDecide.targetType})</div>
              <div>Motivo alegado: <span className="text-rose-300 font-semibold">{reportToDecide.reasonCategory}</span></div>
              <p className="text-slate-300 italic pt-1">"{reportToDecide.details}"</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Parecer do Master Admin / Observações:
                </label>
                <textarea
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  rows={2}
                  placeholder="Registre a justificativa da decisão tomada sobre a denúncia..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setReportToDecide(null)}
                  className="px-3 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => handleDecideReportSubmit('dismissed')}
                  disabled={isSubmittingDecision}
                  className="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-all"
                >
                  Descartar (Improcedente)
                </button>

                <button
                  type="button"
                  onClick={() => handleDecideReportSubmit('action_taken')}
                  disabled={isSubmittingDecision}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-md"
                >
                  Confirmar Violação (Ação Tomada)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: DECIDE APPEAL */}
      {appealToDecide && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg bg-[#0e081e] border border-purple-500/40 rounded-3xl p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-purple-400" />
                <span>Julgamento de Recurso do Usuário</span>
              </h3>
              <button onClick={() => setAppealToDecide(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/20">
                <strong className="text-red-300 block">Punição Aplicada:</strong>
                <p className="text-slate-200">"{appealToDecide.punishment.reason}"</p>
              </div>

              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/20">
                <strong className="text-blue-300 block">Justificativa do Usuário ({appealToDecide.user.name}):</strong>
                <p className="text-slate-200 italic">"{appealToDecide.appeal.reason}"</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Parecer do Julgamento do Recurso:
                </label>
                <textarea
                  value={appealDecisionNote}
                  onChange={(e) => setAppealDecisionNote(e.target.value)}
                  rows={2}
                  placeholder="Explique o fundamento da aceitação ou rejeição do recurso..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setAppealToDecide(null)}
                  className="px-3 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => handleDecideAppealSubmit('rejected')}
                  disabled={isSubmittingAppealDecision}
                  className="px-3.5 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold transition-all"
                >
                  Rejeitar Recurso (Manter Punição)
                </button>

                <button
                  type="button"
                  onClick={() => handleDecideAppealSubmit('accepted')}
                  disabled={isSubmittingAppealDecision}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md shadow-emerald-950/50"
                >
                  Aceitar Recurso (Revogar Punição)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
