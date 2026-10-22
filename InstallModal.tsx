import React, { useState } from 'react';
import { 
  Smartphone, 
  Download, 
  Check, 
  X, 
  Terminal, 
  FileArchive, 
  Sparkles, 
  ExternalLink,
  Copy,
  Layers,
  CheckCircle2,
  Package
} from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen) return null;

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-g6abstmw7iw2czi2u5oe2p-474292327046.us-east5.run.app';

  const handleCopyUrl = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(appUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in select-none">
      <div className="w-full max-w-2xl rounded-3xl bg-[#0f0b21] border border-purple-500/30 p-6 md:p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 border border-purple-400/40 flex items-center justify-center text-white shadow-lg shadow-purple-950/60">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-white">Download do Projeto & APK Android</h2>
              <p className="text-xs text-slate-400">Baixe o arquivo ZIP completo ou gere o APK para seu celular</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Highlight Section: Download ZIP */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 via-[#181135] to-[#0f0a24] border border-purple-500/40 space-y-3 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                <FileArchive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Arquivo ZIP Completo do Aplicativo</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase">
                    aurora-music.zip
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Contém todo o código-fonte (React, TypeScript, Tailwind, Server Express, vídeo de abertura e configurações).
                </p>
              </div>
            </div>

            <a
              href="/aurora-music.zip"
              download="aurora-music.zip"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-900/50 flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Baixar ZIP Agora</span>
            </a>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1 border-t border-white/5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Arquivo compactado pronto para ser extraído e executado localmente com <code>npm run dev</code>.</span>
          </div>
        </div>

        {/* APK Generation Methods */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-purple-400" />
            <span>Como Gerar o Arquivo APK para Celular Android</span>
          </h3>

          {/* Method A: Online Automatic APK (PWABuilder) */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Método 1: Gerar APK Online em 2 Minutos (Sem Instalar Nada)</span>
              </div>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-semibold">
                Recomendado
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              O Aurora Music já possui o <code className="text-purple-300 bg-black/40 px-1 py-0.5 rounded">manifest.json</code> e <code className="text-purple-300 bg-black/40 px-1 py-0.5 rounded">Service Worker</code> configurados para Android:
            </p>

            <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1.5 pl-1">
              <li>
                Copie a URL da aplicação: 
                <button 
                  onClick={handleCopyUrl}
                  className="inline-flex items-center gap-1 ml-1 px-2 py-0.5 rounded bg-black/40 text-purple-300 hover:text-white border border-white/10 text-[11px] font-mono"
                >
                  {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedUrl ? 'URL Copiada!' : 'Copiar URL do App'}</span>
                </button>
              </li>
              <li>
                Acesse o gerador oficial gratuito da Microsoft:{' '}
                <a 
                  href="https://www.pwabuilder.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline font-semibold inline-flex items-center gap-0.5"
                >
                  pwabuilder.com <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Cole a URL e clique em <strong>&ldquo;Start&rdquo;</strong>.</li>
              <li>Na aba Android, clique em <strong>&ldquo;Package for Android&rdquo;</strong> para baixar o arquivo <strong>.apk</strong> assinado diretamente!</li>
            </ol>
          </div>

          {/* Method B: Native Capacitor Build from ZIP */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
              <Terminal className="w-4 h-4 text-purple-400" />
              <span>Método 2: Compilar APK Nativo com Capacitor & Android Studio</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Usando o arquivo ZIP baixado acima no seu computador:
            </p>

            <div className="p-3 rounded-xl bg-black/60 font-mono text-[11px] text-purple-200 space-y-1 overflow-x-auto border border-white/5">
              <div># 1. Extraia o aurora-music.zip e abra o terminal na pasta:</div>
              <div className="text-emerald-400 font-bold">npm install</div>
              <div className="pt-1"># 2. Gere o build estático de produção:</div>
              <div className="text-emerald-400 font-bold">npm run build</div>
              <div className="pt-1"># 3. Adicione a plataforma Android:</div>
              <div className="text-emerald-400 font-bold">npx cap add android</div>
              <div className="pt-1"># 4. Sincronize e abra o projeto no Android Studio:</div>
              <div className="text-emerald-400 font-bold">npx cap sync && npx cap open android</div>
            </div>

            <p className="text-[11px] text-slate-400">
              No Android Studio aberto, vá no menu superior em <strong className="text-slate-200">&ldquo;Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)&rdquo;</strong> para gerar o arquivo APK instalável no seu celular Android.
            </p>
          </div>

          {/* Method C: Direct PWA Install in Chrome */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Smartphone className="w-4 h-4 text-purple-400" />
              <span>Método 3: Instalação Instantânea no Celular (Sem Baixar Arquivos)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              No navegador do seu smartphone (Google Chrome, Brave ou Samsung Internet), toque no menu de três pontos no canto superior direito e selecione <strong className="text-white">&ldquo;Adicionar à tela inicial&rdquo;</strong> ou <strong className="text-white">&ldquo;Instalar aplicativo&rdquo;</strong>. Ele funcionará com ícone próprio na sua gaveta de aplicativos.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
          <a
            href="/aurora-music.zip"
            download="aurora-music.zip"
            className="text-xs text-purple-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar aurora-music.zip</span>
          </a>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-900/40 cursor-pointer transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
