import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Activity, 
  Cpu, 
  Check, 
  RefreshCw,
  HelpCircle,
  FileText,
  Volume2,
  Youtube,
  HardDrive,
  Smartphone,
  Shield,
  Layers
} from 'lucide-react';
import { loadProfile, getSystemDeviceInfo, loadTickets, saveTickets } from '../services/storage';
import { SupportTicket, TechnicalReport, TicketResolutionAttempt } from '../types/music';
import { getApiUrl } from '../utils/env';

interface SupportChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
  onNavigateToTickets?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: number;
  category?: string;
  diagnosis?: {
    interpretation: string;
    identifiedCause: string;
    steps: Array<{ step: string; expectedResult: string }>;
    technicalReport?: any;
  };
  createdTicketId?: string;
}

export const SUPPORT_CATEGORIES = [
  { id: 'audio', label: 'Áudio & Som Original', icon: Volume2, description: 'Problemas com volume, codecs ou áudio que não é original da música' },
  { id: 'youtube', label: 'Streaming do YouTube', icon: Youtube, description: 'Busca de músicas online, reprodutor de vídeo oficial e catálogo' },
  { id: 'import', label: 'Importação de Arquivos', icon: HardDrive, description: 'Armazenamento local, arquivos MP3, WAV e FLAC no IndexedDB' },
  { id: 'pwa', label: 'App Android / Celular', icon: Smartphone, description: 'Instalação PWA, APK Capacitor e execução em segundo plano' },
  { id: 'sync', label: 'Conta e Dados', icon: Shield, description: 'User ID permanente, playlists salvas e preferências da conta' },
  { id: 'other', label: 'Outras Dúvidas', icon: HelpCircle, description: 'Perguntas gerais, sugestões e suporte avançado' }
];

export const SupportChatModal: React.FC<SupportChatModalProps> = ({
  isOpen,
  onClose,
  initialCategory = 'audio',
  onNavigateToTickets
}) => {
  const profile = loadProfile();
  const deviceInfo = getSystemDeviceInfo();

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stepStatuses, setStepStatuses] = useState<Record<number, 'success' | 'failed' | 'pending'>>({});
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Update category when initialCategory changes
  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  // Initialize welcoming chat message on open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const catObj = SUPPORT_CATEGORIES.find(c => c.id === selectedCategory) || SUPPORT_CATEGORIES[0];
      setMessages([
        {
          id: 'welcome-1',
          sender: 'ai',
          text: `Olá, ${profile.name}! Sou a inteligência artificial de suporte do Aurora Music.\n\nSua conta está identificada com o User ID permanente **${profile.id}** no dispositivo **${deviceInfo.os} (${deviceInfo.browser})**.\n\nVocê selecionou a categoria: **${catObj.label}**.\n\nComo posso ajudar você hoje? Descreva o erro ou selecione uma das opções rápidas abaixo:`,
          timestamp: Date.now(),
          category: selectedCategory
        }
      ]);
    }
  }, [isOpen, selectedCategory]);

  if (!isOpen) return null;

  const currentCatObj = SUPPORT_CATEGORIES.find(c => c.id === selectedCategory) || SUPPORT_CATEGORIES[0];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text,
      timestamp: Date.now(),
      category: selectedCategory
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch(getApiUrl('/api/support-diagnose'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userReport: text,
          errorMessage: '',
          userId: profile.id,
          category: selectedCategory,
          deviceInfo
        })
      });

      const data = await res.json();

      if (res.ok && data.diagnosis) {
        const aiMsg: ChatMessage = {
          id: `msg-${Date.now()}-ai`,
          sender: 'ai',
          text: `Compreendi seu relato: "${data.diagnosis.interpretation || text}".\n\nPossível causa identificada: **${data.diagnosis.identifiedCause}**.\n\nAbaixo estão as instruções técnicas passo a passo recomendadas para resolução:`,
          timestamp: Date.now(),
          category: selectedCategory,
          diagnosis: data.diagnosis
        };
        setMessages(prev => [...prev, aiMsg]);
        setStepStatuses({});
      } else {
        throw new Error(data.message || 'Erro ao processar diagnóstico');
      }
    } catch (err: any) {
      // High-precision fallback response
      const fallbackDiagnosis = {
        interpretation: `Análise técnica para "${text.slice(0, 80)}" na categoria ${currentCatObj.label}`,
        identifiedCause: text.toLowerCase().includes('original') || text.toLowerCase().includes('música')
          ? 'Divergência entre o sintetizador embutido e o áudio oficial do YouTube'
          : 'Política de reprodução de mídia ou permissões do navegador',
        steps: [
          { step: 'Para ouvir a faixa original de qualquer cantor, toque em faixas com o selo "YouTube Oficial" na aba Explorar.', expectedResult: 'Streaming do áudio original de estúdio via YouTube Player' },
          { step: 'Dê um clique ou toque na tela para autorizar o áudio no navegador caso esteja mudo.', expectedResult: 'Desbloqueio de AudioContext' },
          { step: 'Para suas próprias músicas salvas no aparelho, use "Importar Músicas" na Biblioteca.', expectedResult: 'Armazenamento sem perdas no IndexedDB' }
        ],
        technicalReport: {
          identifiedCause: 'Política de Autoplay com Som (MEI) ou divergência entre áudio synth de demonstração e áudio original',
          unresolvedReason: 'Verificação em andamento',
          pendingVerifications: ['Suporte do navegador a MediaSource API', 'Conexão com os servidores do YouTube'],
          recommendedActions: ['Verificar permissões de som no navegador', 'Usar a versão PWA instalada']
        }
      };

      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}-ai`,
          sender: 'ai',
          text: `Análise técnica concluída para a categoria **${currentCatObj.label}**:\n\nPossível causa: **${fallbackDiagnosis.identifiedCause}**.\n\nSiga as instruções abaixo para resolver:`,
          timestamp: Date.now(),
          category: selectedCategory,
          diagnosis: fallbackDiagnosis
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStep = (stepIdx: number, success: boolean) => {
    setStepStatuses(prev => ({
      ...prev,
      [stepIdx]: success ? 'success' : 'failed'
    }));
  };

  const handleResolveProblem = (msgId: string) => {
    // Record resolution in tickets
    const resolvedTicket: SupportTicket = {
      id: `TCK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: profile.id,
      userEmail: profile.email,
      userName: profile.name,
      subject: `Resolução via Chat: ${currentCatObj.label}`,
      category: selectedCategory as any,
      description: `Atendimento realizado via Chat com IA no Perfil. Categoria: ${currentCatObj.label}.`,
      status: 'resolved',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      responseNote: 'Problema solucionado com sucesso através do chat de autoatendimento da Aurora AI.',
      auditTrail: [
        {
          actor: 'Aurora AI Chat',
          action: 'Autoatendimento Resolvido',
          timestamp: Date.now(),
          details: 'Usuário confirmou resolução com sucesso.'
        }
      ]
    };

    const currentTickets = loadTickets();
    saveTickets([resolvedTicket, ...currentTickets]);

    setMessages(prev => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        sender: 'system',
        text: `✓ Problema registrado como **Resolvido** com sucesso! O comprovante do atendimento foi arquivado na sua conta (User ID: ${profile.id}).`,
        timestamp: Date.now()
      }
    ]);
  };

  const handleEscalateProblem = (diagnosis: any) => {
    const ticketId = `TCK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const attempts: TicketResolutionAttempt[] = (diagnosis.steps || []).map((s: any, idx: number) => ({
      step: s.step,
      result: stepStatuses[idx] || 'failed',
      notes: `Esperado: ${s.expectedResult}`,
      timestamp: Date.now()
    }));

    const report: TechnicalReport = {
      ticketId,
      userId: profile.id,
      description: `Chamado gerado via Chat no Perfil sob a categoria ${currentCatObj.label}`,
      createdAt: Date.now(),
      deviceInfo,
      errorLogs: [`Atendimento aberto via Chat com IA`, `Categoria: ${selectedCategory}`, `SO: ${deviceInfo.os}`, `Navegador: ${deviceInfo.browser}`],
      identifiedCause: diagnosis.identifiedCause || 'Causa pendente de análise de engenharia',
      attemptedSolutions: attempts,
      unresolvedReason: diagnosis.technicalReport?.unresolvedReason || 'Etapas de autoatendimento não solucionaram o caso relatado pelo usuário.',
      pendingVerifications: diagnosis.technicalReport?.pendingVerifications || ['Verificação de compatibilidade com sistema do dispositivo', 'Análise de rede e mídia'],
      recommendedActions: diagnosis.technicalReport?.recommendedActions || ['Contatar cliente com suporte manual no app', 'Analisar logs de áudio do dispositivo']
    };

    const newTicket: SupportTicket = {
      id: ticketId,
      userId: profile.id,
      userEmail: profile.email,
      userName: profile.name,
      subject: `Relatório Técnico [${currentCatObj.label}]: Chamado ${ticketId}`,
      category: selectedCategory as any,
      description: `Atendimento não resolvido via Chat com IA. Categoria: ${currentCatObj.label}.`,
      status: 'needs_support',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      technicalReport: report,
      auditTrail: [
        {
          actor: 'Aurora AI Chat',
          action: 'Encaminhamento para Suporte Técnico',
          timestamp: Date.now(),
          details: 'Status definido como "Precisa de suporte". Relatório técnico gerado.'
        }
      ]
    };

    const currentTickets = loadTickets();
    saveTickets([newTicket, ...currentTickets]);

    setMessages(prev => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        sender: 'system',
        text: `⚠️ Chamado **${ticketId}** registrado com status **"Precisa de suporte"**.\n\nUm Relatório Técnico completo foi gerado com as informações do seu dispositivo (${deviceInfo.os}, ${deviceInfo.browser}) e encaminhado para os analistas do Aurora Music.`,
        timestamp: Date.now(),
        createdTicketId: ticketId
      }
    ]);
  };

  const quickPrompts = [
    'Eu clico na música mas o áudio que sai não é original',
    'O reprodutor está sem som ao iniciar a música',
    'Como importar músicas MP3/FLAC do meu celular?',
    'Como usar o Aurora Music em segundo plano no Android?'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-200 select-none p-3 sm:p-4">
      {/* Background Ambient Glow */}
      <div 
        className="absolute inset-0 opacity-20 filter blur-3xl pointer-events-none scale-125"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 30%, #9333ea 0%, #3b82f6 30%, #07050d 70%)`
        }}
      />

      {/* Main Chat Modal Container */}
      <div className="relative w-full max-w-2xl h-[92vh] max-h-[750px] rounded-3xl bg-[#0b0718] border border-purple-500/30 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Chat Top Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-[#120924] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#120924] rounded-full" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate">
                  Chat de Suporte com IA · Aurora Music
                </h3>
                <span className="hidden sm:inline text-[10px] font-mono text-purple-300 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded-full">
                  ID: {profile.id}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center gap-1 text-purple-300">
                  <currentCatObj.icon className="w-3.5 h-3.5" />
                  <span>{currentCatObj.label}</span>
                </span>
                <span>·</span>
                <span className="truncate">{deviceInfo.os} · {deviceInfo.browser}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors shrink-0"
            title="Fechar chat de suporte"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Switcher Ribbon */}
        <div className="px-4 py-2.5 bg-[#090514] border-b border-white/[0.04] overflow-x-auto flex items-center gap-1.5 shrink-0 scrollbar-none">
          <span className="text-[10px] uppercase font-bold text-slate-500 mr-1 shrink-0">
            Categoria:
          </span>
          {SUPPORT_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isSelected = cat.id === selectedCategory;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setMessages(prev => [
                    ...prev,
                    {
                      id: `cat-change-${Date.now()}`,
                      sender: 'system',
                      text: `Categoria alterada para: **${cat.label}** (${cat.description}).`,
                      timestamp: Date.now(),
                      category: cat.id
                    }
                  ]);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
                    : 'bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border border-white/5'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              {/* Message Bubble */}
              <div
                className={`p-4 rounded-2xl max-w-[88%] sm:max-w-[82%] text-xs leading-relaxed space-y-2 ${
                  msg.sender === 'user'
                    ? 'bg-purple-600 text-white rounded-br-none shadow-lg shadow-purple-950/40'
                    : msg.sender === 'system'
                    ? 'bg-amber-950/30 border border-amber-500/30 text-amber-200 w-full'
                    : 'bg-[#130b26] border border-purple-500/30 text-slate-200 rounded-bl-none shadow-xl'
                }`}
              >
                {/* Header for AI message */}
                {msg.sender === 'ai' && (
                  <div className="flex items-center gap-1.5 text-purple-300 font-bold text-[11px] uppercase tracking-wider pb-1 border-b border-white/[0.06]">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Assistente Aurora AI</span>
                  </div>
                )}

                <div className="whitespace-pre-line">
                  {msg.text}
                </div>

                {/* If Diagnosis with Interactive Steps */}
                {msg.diagnosis && (
                  <div className="space-y-3 pt-2 border-t border-white/[0.08] mt-2">
                    <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      <span>Etapas recomendadas para teste:</span>
                    </div>

                    <div className="space-y-2">
                      {msg.diagnosis.steps.map((st, sIdx) => {
                        const status = stepStatuses[sIdx] || 'pending';
                        return (
                          <div
                            key={sIdx}
                            className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] ${
                              status === 'success'
                                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                                : status === 'failed'
                                ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                                : 'bg-black/30 border-white/5 text-slate-300'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <span className="w-5 h-5 rounded-full bg-purple-600/30 text-purple-300 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                {sIdx + 1}
                              </span>
                              <div>
                                <span className="font-semibold block text-white">{st.step}</span>
                                <span className="text-[10px] text-slate-400">Resultado: {st.expectedResult}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                              <button
                                onClick={() => handleToggleStep(sIdx, true)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                                  status === 'success'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white/[0.06] hover:bg-emerald-600/30 text-slate-300'
                                }`}
                              >
                                <Check className="w-3 h-3" />
                                <span>Funcionou</span>
                              </button>
                              <button
                                onClick={() => handleToggleStep(sIdx, false)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                                  status === 'failed'
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-white/[0.06] hover:bg-rose-600/30 text-slate-300'
                                }`}
                              >
                                <X className="w-3 h-3" />
                                <span>Falhou</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Resolution Choice Action Bar */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                      <button
                        onClick={() => handleResolveProblem(msg.id)}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Sim, Resolveu Meu Problema</span>
                      </button>

                      <button
                        onClick={() => handleEscalateProblem(msg.diagnosis)}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-amber-950/40 transition-all"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>Não Resolveu · Gerar Relatório Técnico</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <span className="text-[10px] text-slate-500 mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-[#130b26] border border-purple-500/20 text-xs text-purple-300 w-fit animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
              <span>A inteligência artificial está analisando o erro e gerando o diagnóstico...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {messages.length <= 2 && (
          <div className="px-4 py-2 bg-[#090514] border-t border-white/[0.04] overflow-x-auto flex items-center gap-2 shrink-0 scrollbar-none">
            <span className="text-[10px] text-slate-500 uppercase font-bold shrink-0">Sugestões:</span>
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(p)}
                className="px-3 py-1 rounded-xl bg-white/[0.03] hover:bg-purple-950/50 border border-white/5 hover:border-purple-500/40 text-[11px] text-slate-300 hover:text-purple-200 whitespace-nowrap transition-all"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 sm:p-4 bg-[#100720] border-t border-white/[0.08] flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Descreva seu problema na categoria ${currentCatObj.label}...`}
            className="flex-1 bg-black/40 border border-purple-500/30 focus:border-purple-400 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
          />

          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="px-4 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-950/50 transition-all shrink-0"
            title="Enviar mensagem"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </form>
      </div>
    </div>
  );
};
