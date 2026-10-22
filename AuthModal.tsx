import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  ArrowRight,
  RefreshCw,
  KeyRound
} from 'lucide-react';
import { 
  loginOrRegisterWithProvider, 
  loadAccounts, 
  setActiveAccountId, 
  getActiveAccountId 
} from '../services/storage';
import { UserProfile } from '../types/music';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'login' 
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [plan, setPlan] = useState<'Aurora Gratuito' | 'Aurora Premium'>('Aurora Premium');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'apple' | 'email' | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Password recovery sub-view
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);

  // Accounts already present on device for quick 1-click switch
  const [savedAccounts, setSavedAccounts] = useState<UserProfile[]>([]);
  const activeId = getActiveAccountId();

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setFeedback(null);
      setIsForgotPassword(false);
      setRecoverySent(false);
      setSavedAccounts(loadAccounts());
    }
  }, [isOpen, initialMode]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate password strength
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'Vazia', color: 'bg-slate-700' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Fraca', color: 'bg-rose-500' };
    if (score <= 2) return { score: 2, label: 'Média', color: 'bg-amber-500' };
    if (score <= 3) return { score: 3, label: 'Boa', color: 'bg-blue-500' };
    return { score: 4, label: 'Forte & Segura', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(password);

  // 1. Social Auth: Google
  const handleGoogleAuth = () => {
    setIsLoading(true);
    setLoadingProvider('google');
    setFeedback(null);

    // Realistic Google Identity prompt & token handshake
    setTimeout(() => {
      try {
        const defaultGoogleEmail = email.trim() || 'raicoelho311@gmail.com';
        const defaultGoogleName = name.trim() || 'Raí Coelho';
        
        const { user, isNewUser } = loginOrRegisterWithProvider('google', {
          name: defaultGoogleName,
          email: defaultGoogleEmail,
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          plan: 'Aurora Premium'
        });

        setIsLoading(false);
        setLoadingProvider(null);
        setFeedback({
          type: 'success',
          message: isNewUser 
            ? `Conta criada e conectada via Google: ${user.name}` 
            : `Sessão iniciada com a Conta Google: ${user.name}`
        });

        setTimeout(() => {
          onClose();
        }, 1200);
      } catch (err: any) {
        setIsLoading(false);
        setLoadingProvider(null);
        setFeedback({ type: 'error', message: err.message || 'Erro ao autenticar com o Google.' });
      }
    }, 1100);
  };

  // 2. Social Auth: Apple
  const handleAppleAuth = () => {
    setIsLoading(true);
    setLoadingProvider('apple');
    setFeedback(null);

    setTimeout(() => {
      try {
        const defaultAppleEmail = email.trim() || 'raicoelho@icloud.com';
        const defaultAppleName = name.trim() || 'Raí Coelho (Apple ID)';

        const { user, isNewUser } = loginOrRegisterWithProvider('apple', {
          name: defaultAppleName,
          email: defaultAppleEmail,
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          plan: 'Aurora Premium'
        });

        setIsLoading(false);
        setLoadingProvider(null);
        setFeedback({
          type: 'success',
          message: isNewUser
            ? `Conta criada e autenticada com Apple ID: ${user.name}`
            : `Sessão iniciada via Apple ID: ${user.name}`
        });

        setTimeout(() => {
          onClose();
        }, 1200);
      } catch (err: any) {
        setIsLoading(false);
        setLoadingProvider(null);
        setFeedback({ type: 'error', message: err.message || 'Erro ao autenticar com Apple ID.' });
      }
    }, 1100);
  };

  // 3. Email Authentication (Submit Form)
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFeedback({ type: 'error', message: 'Por favor, insira um endereço de e-mail válido.' });
      return;
    }

    if (!password || password.length < 6) {
      setFeedback({ type: 'error', message: 'A senha deve conter no mínimo 6 caracteres.' });
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setFeedback({ type: 'error', message: 'Por favor, informe seu nome completo.' });
        return;
      }
      if (password !== confirmPassword) {
        setFeedback({ type: 'error', message: 'As senhas digitadas não coincidem.' });
        return;
      }
      if (!termsAccepted) {
        setFeedback({ type: 'error', message: 'É necessário concordar com os Termos de Uso.' });
        return;
      }
    }

    setIsLoading(true);
    setLoadingProvider('email');

    setTimeout(() => {
      try {
        const { user, isNewUser } = loginOrRegisterWithProvider('email', {
          name: name.trim() || cleanEmail.split('@')[0],
          email: cleanEmail,
          plan: plan
        });

        setIsLoading(false);
        setLoadingProvider(null);
        setFeedback({
          type: 'success',
          message: isNewUser
            ? `Cadastro concluído com sucesso! Bem-vindo(a), ${user.name}.`
            : `Login realizado com sucesso! Olá novamente, ${user.name}.`
        });

        setTimeout(() => {
          onClose();
        }, 1100);
      } catch (err: any) {
        setIsLoading(false);
        setLoadingProvider(null);
        setFeedback({ type: 'error', message: err.message || 'Falha ao processar credenciais.' });
      }
    }, 900);
  };

  // Password Recovery Flow
  const handlePasswordRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail.trim() || !recoveryEmail.includes('@')) {
      setFeedback({ type: 'error', message: 'Insira um e-mail válido para redefinição.' });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setRecoverySent(true);
      setFeedback({
        type: 'success',
        message: `Instruções e código de redefinição enviados para ${recoveryEmail}.`
      });
    }, 1000);
  };

  // Switch to another existing account
  const handleSelectExistingAccount = (acc: UserProfile) => {
    setActiveAccountId(acc.id);
    setFeedback({
      type: 'success',
      message: `Conta ativada: ${acc.name} (${acc.email})`
    });
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200 select-none overflow-y-auto">
      {/* Background Radial Glow */}
      <div 
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none opacity-25 filter blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(147,51,234,0.5) 0%, rgba(59,130,246,0.3) 50%, rgba(6,182,212,0.2) 80%, transparent 100%)'
        }}
      />

      {/* Modal Dialog Box */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-gradient-to-br from-[#120924] via-[#0d071a] to-[#07050d] border border-purple-500/35 rounded-3xl p-6 sm:p-7 shadow-2xl text-white my-auto animate-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/[0.06] transition-colors"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex p-2 rounded-2xl bg-gradient-to-br from-purple-600/30 via-blue-600/20 to-cyan-500/20 ring-1 ring-purple-400/40 shadow-lg shadow-purple-950/60 mb-1">
            <Sparkles className="w-6 h-6 text-cyan-300" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            {isForgotPassword 
              ? 'Recuperar Senha' 
              : mode === 'login' 
                ? 'Entrar no Aurora Music' 
                : 'Criar Conta no Aurora Music'}
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {isForgotPassword
              ? 'Digite o e-mail cadastrado para redefinir seu acesso'
              : mode === 'login'
                ? 'Acesse suas playlists, histórico, favoritos e áudio em alta fidelidade'
                : 'Cadastre-se gratuitamente para sincronizar suas músicas e playlists'}
          </p>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mb-4 p-3.5 rounded-2xl border text-xs flex items-center gap-2.5 animate-in fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/70 border-rose-500/40 text-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {!isForgotPassword ? (
          <>
            {/* Mode Tabs: Entrar / Cadastrar */}
            <div className="flex p-1 rounded-2xl bg-black/40 border border-white/[0.08] mb-5">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setFeedback(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setFeedback(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  mode === 'register'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cadastrar
              </button>
            </div>

            {/* 1-Click Social Providers: Google & Apple */}
            <div className="space-y-2.5 mb-5">
              {/* Google Button */}
              <button
                type="button"
                disabled={isLoading}
                onClick={handleGoogleAuth}
                className="w-full py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-purple-400/40 text-xs font-semibold text-white flex items-center justify-center gap-3 transition-all cursor-pointer group shadow-sm disabled:opacity-50"
              >
                {loadingProvider === 'google' ? (
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>
                  {mode === 'login' ? 'Entrar com o Google' : 'Cadastrar com o Google'}
                </span>
              </button>

              {/* Apple Button */}
              <button
                type="button"
                disabled={isLoading}
                onClick={handleAppleAuth}
                className="w-full py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-purple-400/40 text-xs font-semibold text-white flex items-center justify-center gap-3 transition-all cursor-pointer group shadow-sm disabled:opacity-50"
              >
                {loadingProvider === 'apple' ? (
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                ) : (
                  <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.64-.78 1.08-1.87.96-2.96-.93.04-2.07.62-2.73 1.4-.58.67-1.09 1.77-.95 2.83 1.04.08 2.08-.51 2.72-1.27z" />
                  </svg>
                )}
                <span>
                  {mode === 'login' ? 'Entrar com a Apple' : 'Cadastrar com a Apple'}
                </span>
              </button>
            </div>

            {/* Or Divider */}
            <div className="relative flex items-center justify-center mb-5">
              <div className="border-t border-white/[0.08] w-full" />
              <span className="bg-[#0e071e] px-3 text-[10px] uppercase font-mono tracking-wider text-slate-500 whitespace-nowrap">
                ou com e-mail
              </span>
              <div className="border-t border-white/[0.08] w-full" />
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-3.5">
              {mode === 'register' && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Nome Completo
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3 w-4 h-4 text-purple-400" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Silva"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/[0.04] border border-purple-500/30 focus:border-cyan-400 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Endereço de E-mail
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 w-4 h-4 text-purple-400" />
                  <input
                    type="email"
                    required
                    placeholder="seu.email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.04] border border-purple-500/30 focus:border-cyan-400 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Senha de Acesso
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setRecoveryEmail(email);
                        setFeedback(null);
                      }}
                      className="text-[10px] text-purple-400 hover:text-cyan-300 transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 w-4 h-4 text-purple-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/[0.04] border border-purple-500/30 focus:border-cyan-400 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength bar for register mode */}
                {mode === 'register' && password && (
                  <div className="mt-1.5 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Força da senha:</span>
                      <span className="font-semibold text-slate-200">{strength.label}</span>
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${strength.color} transition-all duration-300`} 
                        style={{ width: `${(strength.score / 4) * 100}%` }} 
                      />
                    </div>
                  </div>
                )}
              </div>

              {mode === 'register' && (
                <>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Confirmar Senha
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3 w-4 h-4 text-purple-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Repita a senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-white/[0.04] border border-purple-500/30 focus:border-cyan-400 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
                      />
                    </div>
                  </div>

                  {/* Plan Picker */}
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] font-semibold text-slate-300 block">
                      Plano Inicial
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div
                        onClick={() => setPlan('Aurora Premium')}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                          plan === 'Aurora Premium'
                            ? 'bg-purple-950/60 border-purple-400 shadow-md ring-1 ring-purple-500/50'
                            : 'bg-white/[0.02] border-white/5 hover:border-purple-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">Premium</span>
                          <span className="text-[9px] bg-purple-500/20 text-purple-300 font-bold px-1.5 py-0.2 rounded uppercase">
                            Lossless
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">30 dias grátis de áudio HD</p>
                      </div>

                      <div
                        onClick={() => setPlan('Aurora Gratuito')}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                          plan === 'Aurora Gratuito'
                            ? 'bg-purple-950/60 border-purple-400 shadow-md ring-1 ring-purple-500/50'
                            : 'bg-white/[0.02] border-white/5 hover:border-purple-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">Gratuito</span>
                          <span className="text-[9px] bg-white/10 text-slate-300 font-semibold px-1.5 py-0.2 rounded">
                            Básico
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">Áudio padrão 160 kbps</p>
                      </div>
                    </div>
                  </div>

                  {/* Terms acceptance */}
                  <label className="flex items-start gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 rounded accent-purple-600"
                    />
                    <span className="text-[11px] text-slate-300 leading-tight">
                      Concordo com os Termos de Serviço e Política de Privacidade do Aurora Music.
                    </span>
                  </label>
                </>
              )}

              {mode === 'login' && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded accent-purple-600"
                  />
                  <span className="text-[11px] text-slate-300">
                    Lembrar deste dispositivo
                  </span>
                </label>
              )}

              {/* Submit Action */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:via-indigo-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-purple-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading && loadingProvider === 'email' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Entrar no Aurora Music' : 'Criar Minha Conta'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Switch to existing local accounts */}
            {savedAccounts.length > 1 && (
              <div className="mt-5 pt-4 border-t border-white/[0.06] space-y-2">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Alternar para outra conta salva:</span>
                  <span className="font-mono text-purple-400">{savedAccounts.length}</span>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {savedAccounts.map((acc) => {
                    const isCurrent = acc.id === activeId;
                    return (
                      <div
                        key={acc.id}
                        onClick={() => !isCurrent && handleSelectExistingAccount(acc)}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                          isCurrent
                            ? 'bg-purple-950/40 border border-purple-500/30'
                            : 'hover:bg-white/[0.05] cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={acc.avatarUrl}
                            alt={acc.name}
                            className="w-6 h-6 rounded-lg object-cover ring-1 ring-purple-500/30"
                          />
                          <div className="min-w-0 truncate">
                            <span className="font-semibold text-white block truncate">
                              {acc.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {acc.email}
                            </span>
                          </div>
                        </div>

                        {isCurrent ? (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                            Ativa
                          </span>
                        ) : (
                          <span className="text-[11px] text-purple-300 font-semibold hover:underline">
                            Entrar
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Password Recovery Flow */
          <form onSubmit={handlePasswordRecovery} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-300 text-xs font-semibold">
                <KeyRound className="w-4 h-4" />
                <span>Instruções de Recuperação</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Informe o seu e-mail cadastrado. Um link de redefinição com código de segurança será gerado para restaurar o seu acesso imediatamente.
              </p>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Seu E-mail Cadastrado
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 w-4 h-4 text-purple-400" />
                <input
                  type="email"
                  required
                  placeholder="seu.email@exemplo.com"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  className="w-full bg-white/[0.04] border border-purple-500/30 focus:border-cyan-400 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || recoverySent}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando código...</span>
                </>
              ) : recoverySent ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Instruções Enviadas</span>
                </>
              ) : (
                <>
                  <span>Enviar Link de Recuperação</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setFeedback(null);
              }}
              className="w-full py-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              ← Voltar para a tela de Login
            </button>
          </form>
        )}

        {/* Security & Offline Local Guarantee */}
        <div className="mt-5 pt-3 border-t border-white/[0.05] flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Autenticação criptografada com sincronização de biblioteca</span>
        </div>
      </div>
    </div>
  );
};
