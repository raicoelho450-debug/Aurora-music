import React from 'react';
import { Sliders, RotateCcw, Volume2, Sparkles, Check, Activity, Zap, Radio } from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { EQUALIZER_PRESETS, EqualizerPresetInfo } from '../services/equalizerService';
import { EqualizerPreset } from '../types/music';

interface EqualizerViewProps {
  compact?: boolean;
}

export const EqualizerView: React.FC<EqualizerViewProps> = ({ compact = false }) => {
  const {
    preferences,
    updatePreferences,
    autoQualityInfo
  } = useAudioPlayer();

  const eq = preferences.equalizer || {
    enabled: true,
    preset: 'flat',
    bass: 0,
    mid: 0,
    treble: 0
  };

  const handleToggleEnabled = () => {
    updatePreferences({
      equalizer: {
        ...eq,
        enabled: !eq.enabled
      }
    });
  };

  const handleSelectPreset = (presetId: EqualizerPreset) => {
    const info = EQUALIZER_PRESETS[presetId];
    if (!info) return;

    updatePreferences({
      equalizer: {
        enabled: true,
        preset: presetId,
        bass: info.bass,
        mid: info.mid,
        treble: info.treble
      }
    });
  };

  const handleBandChange = (band: 'bass' | 'mid' | 'treble', value: number) => {
    updatePreferences({
      equalizer: {
        ...eq,
        enabled: true,
        preset: 'custom',
        [band]: value
      }
    });
  };

  const handleReset = () => {
    handleSelectPreset('flat');
  };

  // SVG Curve Coordinates based on bass, mid, and treble gains (-12 to +12 dB)
  // Maps -12..+12 dB to Y 90..10 (center = 50)
  const mapDbToY = (db: number) => {
    const clamped = Math.max(-12, Math.min(12, db));
    return 50 - (clamped / 12) * 35;
  };

  const yBass = eq.enabled ? mapDbToY(eq.bass) : 50;
  const yMid = eq.enabled ? mapDbToY(eq.mid) : 50;
  const yTreble = eq.enabled ? mapDbToY(eq.treble) : 50;

  const curvePath = `M 20 ${yBass} Q 90 ${yBass}, 160 ${yMid} T 300 ${yTreble}`;

  const presetList = Object.values(EQUALIZER_PRESETS);

  return (
    <div className={`space-y-6 ${compact ? 'p-2' : 'p-4 sm:p-6'} select-none`}>
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] border border-purple-500/20">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            eq.enabled
              ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950/60'
              : 'bg-white/5 text-slate-400'
          }`}>
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">Equalizador Profissional</h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                eq.enabled
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-white/5 text-slate-400 border-white/10'
              }`}>
                {eq.enabled ? 'ATIVO' : 'BYPASS'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Filtros IIR em tempo real (Graves, Médios e Agudos) via Web Audio API.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Redefinir para Plano"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Resetar</span>
          </button>

          <button
            onClick={handleToggleEnabled}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
              eq.enabled
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-950/50'
                : 'bg-white/10 hover:bg-white/20 text-slate-300'
            }`}
          >
            <span>{eq.enabled ? 'Ligado' : 'Desligado'}</span>
          </button>
        </div>
      </div>

      {/* Real-time Frequency Response Curve */}
      <div className="relative p-5 rounded-2xl bg-gradient-to-b from-[#130b2b]/90 via-[#0e0720]/80 to-[#07050d] border border-purple-500/25 overflow-hidden shadow-xl">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-purple-400" />
            <span>Curva de Resposta em Frequência</span>
          </span>
          <span className="text-[11px] font-mono text-purple-300">
            {EQUALIZER_PRESETS[eq.preset]?.name || 'Personalizado'}
          </span>
        </div>

        <div className="relative h-28 w-full flex items-center justify-center">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between opacity-15 pointer-events-none">
            <div className="border-b border-purple-400 w-full" />
            <div className="border-b border-purple-400/50 w-full" />
            <div className="border-b border-purple-400/30 w-full" />
          </div>

          <svg className="w-full h-full overflow-visible" viewBox="0 0 320 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="curveGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Shaded Area under curve */}
            <path
              d={`${curvePath} L 300 100 L 20 100 Z`}
              fill="url(#areaGradient)"
            />

            {/* Main response curve */}
            <path
              d={curvePath}
              fill="none"
              stroke="url(#curveGradient)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Nodes */}
            <circle cx="20" cy={yBass} r="5" fill="#ec4899" className="shadow-lg" />
            <circle cx="160" cy={yMid} r="5" fill="#a855f7" className="shadow-lg" />
            <circle cx="300" cy={yTreble} r="5" fill="#06b6d4" className="shadow-lg" />
          </svg>

          {/* Frequency labels */}
          <div className="absolute bottom-1 inset-x-2 flex justify-between text-[10px] font-mono text-slate-500">
            <span>Graves (120 Hz)</span>
            <span>Médios (1 kHz)</span>
            <span>Agudos (3.5 kHz)</span>
          </div>
        </div>
      </div>

      {/* Presets Grid */}
      <div className="space-y-2.5">
        <label className="text-xs font-semibold text-slate-300 block flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Presets Oficiais Aurora</span>
          </span>
          <span className="text-[11px] text-slate-400">
            Funk, Phonk, Pop, Rock, Eletrônica
          </span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {presetList.filter(p => p.id !== 'custom').map((preset) => {
            const isSelected = eq.preset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                  isSelected
                    ? 'bg-purple-950/60 border-purple-400/80 shadow-lg shadow-purple-950/40 ring-1 ring-purple-500/50'
                    : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/5 hover:border-purple-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xl">{preset.icon}</span>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                <div className="font-bold text-xs text-white truncate">
                  {preset.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {preset.tagline}
                </div>
                <div className="mt-2 text-[9px] font-mono text-purple-300 flex items-center gap-1">
                  <span>G:{preset.bass > 0 ? `+${preset.bass}` : preset.bass}</span>
                  <span>M:{preset.mid > 0 ? `+${preset.mid}` : preset.mid}</span>
                  <span>A:{preset.treble > 0 ? `+${preset.treble}` : preset.treble}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3 Frequency Sliders: Graves, Médios, Agudos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {/* Graves (Bass) */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-[#180d2c]/60 to-[#0e071e]/40 border border-purple-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-pink-400" />
              <span>Graves (Bass)</span>
            </span>
            <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
              eq.bass > 0 ? 'bg-pink-500/20 text-pink-300' : eq.bass < 0 ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/10 text-slate-300'
            }`}>
              {eq.bass > 0 ? `+${eq.bass}` : eq.bass} dB
            </span>
          </div>

          <input
            type="range"
            min="-12"
            max="12"
            step="1"
            disabled={!eq.enabled}
            value={eq.bass}
            onChange={(e) => handleBandChange('bass', Number(e.target.value))}
            className="w-full accent-pink-500 cursor-pointer disabled:opacity-40"
          />

          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>-12 dB</span>
            <span className="text-slate-500">120 Hz</span>
            <span>+12 dB</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Impacto de bumbos, 808 de Phonk e peso de graves de Baile Funk.
          </p>
        </div>

        {/* Médios (Mid) */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-[#150d2e]/60 to-[#0e071e]/40 border border-purple-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-purple-400" />
              <span>Médios (Mids)</span>
            </span>
            <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
              eq.mid > 0 ? 'bg-purple-500/20 text-purple-300' : eq.mid < 0 ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/10 text-slate-300'
            }`}>
              {eq.mid > 0 ? `+${eq.mid}` : eq.mid} dB
            </span>
          </div>

          <input
            type="range"
            min="-12"
            max="12"
            step="1"
            disabled={!eq.enabled}
            value={eq.mid}
            onChange={(e) => handleBandChange('mid', Number(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer disabled:opacity-40"
          />

          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>-12 dB</span>
            <span className="text-slate-500">1 kHz</span>
            <span>+12 dB</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Presença e calor dos vocais e distorção de guitarras do Rock.
          </p>
        </div>

        {/* Agudos (Treble) */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-[#101235]/60 to-[#0e071e]/40 border border-purple-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Agudos (Treble)</span>
            </span>
            <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
              eq.treble > 0 ? 'bg-cyan-500/20 text-cyan-300' : eq.treble < 0 ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/10 text-slate-300'
            }`}>
              {eq.treble > 0 ? `+${eq.treble}` : eq.treble} dB
            </span>
          </div>

          <input
            type="range"
            min="-12"
            max="12"
            step="1"
            disabled={!eq.enabled}
            value={eq.treble}
            onChange={(e) => handleBandChange('treble', Number(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer disabled:opacity-40"
          />

          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>-12 dB</span>
            <span className="text-slate-500">3.5 kHz</span>
            <span>+12 dB</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Brilho de pratos de bateria, cowbell de Phonk e clareza acústica.
          </p>
        </div>
      </div>

      {/* Automatic Audio Quality Indicator */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-300 flex items-center justify-center shrink-0">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Qualidade de Áudio Automática</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {autoQualityInfo.effectiveBitrate}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {autoQualityInfo.description}
            </p>
          </div>
        </div>

        <span className="text-[10px] text-slate-500 font-mono self-end sm:self-auto">
          {autoQualityInfo.networkType}
        </span>
      </div>
    </div>
  );
};
