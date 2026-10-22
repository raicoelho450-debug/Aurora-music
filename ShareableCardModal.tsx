import React, { useRef, useState } from 'react';
import { 
  X, 
  Share2, 
  Download, 
  Sparkles, 
  Check, 
  Copy, 
  Disc, 
  Flame, 
  Award, 
  Shield, 
  Music 
} from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { Track } from '../types/music';
import { loadProfile } from '../services/storage';

interface ShareableCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  track?: Track | null;
}

type CardTemplate = 'holographic' | 'vinyl' | 'cyberpunk' | 'minimal' | 'ticket';

export const ShareableCardModal: React.FC<ShareableCardModalProps> = ({ isOpen, onClose, track }) => {
  const { currentTrack, tracks, history } = useAudioPlayer();
  const activeTrack = track || currentTrack || tracks[0];

  const profile = loadProfile();
  const [template, setTemplate] = useState<CardTemplate>('holographic');
  const [accentColor, setAccentColor] = useState('#9333ea');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const cardPreviewRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen || !activeTrack) return null;

  const totalListenedMinutes = Math.round((history.length * 3.5) + (profile.xp || 100) * 0.1);
  const isPrivate = profile.isPrivate;

  // Real canvas download of the music card
  const handleDownloadImage = async () => {
    setIsGenerating(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Background gradient based on template
      const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1350);
      if (template === 'cyberpunk') {
        bgGrad.addColorStop(0, '#0a0518');
        bgGrad.addColorStop(0.5, '#190a3a');
        bgGrad.addColorStop(1, '#05020c');
      } else if (template === 'vinyl') {
        bgGrad.addColorStop(0, '#151515');
        bgGrad.addColorStop(0.5, '#222222');
        bgGrad.addColorStop(1, '#0d0d0d');
      } else if (template === 'ticket') {
        bgGrad.addColorStop(0, '#140c2e');
        bgGrad.addColorStop(0.6, '#0b061d');
        bgGrad.addColorStop(1, '#070412');
      } else {
        bgGrad.addColorStop(0, '#1a0933');
        bgGrad.addColorStop(0.4, '#0f0826');
        bgGrad.addColorStop(1, '#07050f');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 1350);

      // 2. Ambient glow circle
      const radGlow = ctx.createRadialGradient(540, 480, 50, 540, 480, 450);
      radGlow.addColorStop(0, 'rgba(147, 51, 234, 0.45)');
      radGlow.addColorStop(0.6, 'rgba(6, 182, 212, 0.15)');
      radGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radGlow;
      ctx.fillRect(0, 0, 1080, 1350);

      // 3. Header: Brand Wordmark
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('AURORA MUSIC', 100, 120);

      ctx.fillStyle = '#a855f7';
      ctx.font = '600 22px sans-serif';
      ctx.fillText('PASSE MUSICAL OFICIAL', 100, 155);

      if (profile.plan === 'Aurora Premium') {
        ctx.fillStyle = '#eab308';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('👑 AURORA PLUS VIP', 760, 135);
      }

      // 4. Album Cover
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = activeTrack.coverUrl;

      await new Promise((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(true);
      });

      const coverX = 240;
      const coverY = 240;
      const coverSize = 600;

      // Draw rounded cover box
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(coverX, coverY, coverSize, coverSize, 36);
      ctx.clip();
      ctx.drawImage(img, coverX, coverY, coverSize, coverSize);
      ctx.restore();

      // Border glow
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(coverX, coverY, coverSize, coverSize, 36);
      ctx.stroke();

      // 5. Track Title & Artist
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 46px sans-serif';
      ctx.textAlign = 'center';
      const maxTitle = activeTrack.title.length > 25 ? activeTrack.title.slice(0, 25) + '...' : activeTrack.title;
      ctx.fillText(maxTitle, 540, 930);

      ctx.fillStyle = '#c084fc';
      ctx.font = '600 32px sans-serif';
      ctx.fillText(activeTrack.artist, 540, 985);

      // 6. User Stats Card Strip
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.roundRect(100, 1050, 880, 180, 28);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(isPrivate ? 'Ouvinte Aurora Privado' : profile.name, 140, 1115);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '20px sans-serif';
      ctx.fillText(`Nível ${profile.level || 1} · ${profile.badges?.length || 0} Conquistas`, 140, 1150);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(`${totalListenedMinutes} min`, 940, 1120);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '20px sans-serif';
      ctx.fillText('Tempo de Escuta Imersiva', 940, 1155);

      // Trigger download
      const link = document.createElement('a');
      link.download = `aurora-card-${activeTrack.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Error generating card image:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ouvindo ${activeTrack.title} no Aurora Music`,
          text: `Confira "${activeTrack.title}" de ${activeTrack.artist} no Aurora Music!`,
          url: window.location.href
        });
      } catch {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(`${window.location.origin}?track=${encodeURIComponent(activeTrack.id)}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in select-none">
      <div className="relative w-full max-w-2xl bg-[#0c081d] border border-purple-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg">
              <Share2 className="w-5 h-5 text-cyan-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Cartão Musical Compartilhável</span>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Gere um cartão visual exclusivo da sua música e estatísticas de audição.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template Selector */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-300 block uppercase tracking-wider">
            Escolha o Estilo do Cartão
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'holographic', label: 'Holográfico VIP', icon: Sparkles },
              { id: 'vinyl', label: 'Vinil 3D Retrô', icon: Disc },
              { id: 'cyberpunk', label: 'Cyberpunk Neon', icon: Flame },
              { id: 'minimal', label: 'Minimal Clean', icon: Music },
              { id: 'ticket', label: 'Ticket Aurora', icon: Award }
            ].map((t) => {
              const Icon = t.icon;
              const isSelected = template === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id as CardTemplate)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-purple-600/30 border-purple-400 text-white shadow-lg ring-1 ring-purple-400'
                      : 'bg-white/[0.03] border-white/5 text-slate-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon className="w-4 h-4 text-purple-300" />
                  <span className="truncate">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card Live Preview */}
        <div 
          ref={cardPreviewRef}
          className={`relative p-6 rounded-3xl border transition-all overflow-hidden flex flex-col items-center justify-center text-center space-y-4 ${
            template === 'cyberpunk'
              ? 'bg-gradient-to-br from-[#0e0724] via-[#1a083d] to-[#060312] border-cyan-500/40 shadow-cyan-950/50'
              : template === 'vinyl'
              ? 'bg-gradient-to-br from-[#1c1c1c] via-[#121212] to-[#0a0a0a] border-white/20'
              : template === 'ticket'
              ? 'bg-gradient-to-br from-[#120a2e] to-[#070417] border-purple-500/40'
              : 'bg-gradient-to-br from-[#170a30] via-[#0e0724] to-[#070512] border-purple-500/30'
          } shadow-2xl`}
        >
          {/* Header watermark */}
          <div className="w-full flex items-center justify-between text-[11px] font-bold tracking-widest text-purple-400 uppercase">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>AURORA MUSIC PASS</span>
            </span>
            {profile.plan === 'Aurora Premium' && (
              <span className="text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px]">
                AURORA PLUS VIP
              </span>
            )}
          </div>

          {/* Cover */}
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-purple-500/40 group">
            <img src={activeTrack.coverUrl} alt={activeTrack.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-2 text-[10px] uppercase font-mono bg-black/60 px-2 py-0.5 rounded text-purple-300">
              {activeTrack.format || 'ÁUDIO'}
            </div>
          </div>

          {/* Title & Artist */}
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight truncate max-w-sm">
              {activeTrack.title}
            </h3>
            <p className="text-xs sm:text-sm text-purple-300 font-medium">
              {activeTrack.artist}
            </p>
          </div>

          {/* User Stats Card in preview */}
          <div className="w-full p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-xs">
            <div className="text-left">
              <span className="font-bold text-white block">
                {isPrivate ? 'Ouvinte Aurora Privado' : profile.name}
              </span>
              <span className="text-[11px] text-slate-400">
                Nível {profile.level || 1} · {profile.badges?.length || 0} Medalhas
              </span>
            </div>
            <div className="text-right">
              <span className="font-bold text-cyan-400 block text-sm">
                {totalListenedMinutes} min
              </span>
              <span className="text-[10px] text-slate-400">
                Tempo Total Ouvido
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            onClick={handleShare}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-purple-400" />}
            <span>{copied ? 'Link Copiado!' : 'Compartilhar Link'}</span>
          </button>

          <button
            onClick={handleDownloadImage}
            disabled={isGenerating}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-950/60 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-white" />
            <span>{isGenerating ? 'Renderizando Imagem...' : 'Baixar Imagem em Alta Resolução (PNG)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
