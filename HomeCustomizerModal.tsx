import React, { useState } from 'react';
import { 
  X, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Check, 
  Sliders, 
  Layout, 
  Sparkles 
} from 'lucide-react';

export interface HomeSectionConfig {
  id: string;
  label: string;
  description: string;
  visible: boolean;
}

export const DEFAULT_HOME_SECTIONS: HomeSectionConfig[] = [
  { id: 'hero', label: 'Música em Reprodução & Player Central', description: 'Última música ou faixa atual com controles completos', visible: true },
  { id: 'moments', label: 'Música por Momento & Clima', description: 'Categorias rápidas: Treinar, Estudar, Jogar, Relaxar, Dormir', visible: true },
  { id: 'highlights', label: 'Destaques Tecnológicos', description: 'Indicadores de áudio real, IndexedDB e visualizador', visible: true },
  { id: 'recent', label: 'Faixas Recomendadas & Recentes', description: 'Grade com músicas recentes prontas para reproduzir', visible: true },
  { id: 'playlists', label: 'Playlists em Destaque', description: 'Coleções e seleções musicais da sua biblioteca', visible: true }
];

export const HOME_LAYOUT_KEY = 'aurora_home_sections_layout_v2';

export function loadHomeSections(): HomeSectionConfig[] {
  try {
    const saved = localStorage.getItem(HOME_LAYOUT_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with defaults in case new sections were added
        const ids = new Set(parsed.map(p => p.id));
        const missing = DEFAULT_HOME_SECTIONS.filter(d => !ids.has(d.id));
        return [...parsed, ...missing];
      }
    }
  } catch {}
  return [...DEFAULT_HOME_SECTIONS];
}

export function saveHomeSections(sections: HomeSectionConfig[]): void {
  localStorage.setItem(HOME_LAYOUT_KEY, JSON.stringify(sections));
}

interface HomeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: HomeSectionConfig[];
  onSave: (sections: HomeSectionConfig[]) => void;
}

export const HomeCustomizerModal: React.FC<HomeCustomizerModalProps> = ({
  isOpen,
  onClose,
  sections,
  onSave
}) => {
  const [localSections, setLocalSections] = useState<HomeSectionConfig[]>(sections);
  const [savedMessage, setSavedMessage] = useState(false);

  if (!isOpen) return null;

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= localSections.length) return;

    const copy = [...localSections];
    const item = copy.splice(index, 1)[0];
    copy.splice(targetIdx, 0, item);
    setLocalSections(copy);
  };

  const handleToggleVisible = (id: string) => {
    setLocalSections(prev =>
      prev.map(sec => (sec.id === id ? { ...sec, visible: !sec.visible } : sec))
    );
  };

  const handleRestoreDefaults = () => {
    setLocalSections([...DEFAULT_HOME_SECTIONS]);
    saveHomeSections([...DEFAULT_HOME_SECTIONS]);
    onSave([...DEFAULT_HOME_SECTIONS]);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  const handleApply = () => {
    saveHomeSections(localSections);
    onSave(localSections);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-in fade-in select-none">
      <div className="relative w-full max-w-lg bg-[#0d091e] border border-purple-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-300 flex items-center justify-center border border-purple-500/30 shadow-md">
              <Layout className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Personalizar Tela Inicial</span>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Altere a ordem e visibilidade das seções da tela principal.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section items list */}
        <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
          {localSections.map((sec, idx) => (
            <div
              key={sec.id}
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                sec.visible
                  ? 'bg-white/[0.03] border-white/10'
                  : 'bg-black/30 border-white/5 opacity-50'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">
                  {sec.label}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {sec.description}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Reorder Buttons */}
                <button
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, 'up')}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white disabled:opacity-20"
                  title="Mover para cima"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={idx === localSections.length - 1}
                  onClick={() => handleMove(idx, 'down')}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white disabled:opacity-20"
                  title="Mover para baixo"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>

                {/* Visibility Toggle */}
                <button
                  onClick={() => handleToggleVisible(sec.id)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    sec.visible
                      ? 'bg-purple-600/20 text-purple-300 hover:bg-purple-600/30'
                      : 'bg-white/5 text-slate-500 hover:text-slate-300'
                  }`}
                  title={sec.visible ? 'Ocultar Seção' : 'Exibir Seção'}
                >
                  {sec.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
          <button
            onClick={handleRestoreDefaults}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{savedMessage ? 'Padrão Restaurado!' : 'Restaurar Padrão'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-950/60"
            >
              Salvar Layout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
