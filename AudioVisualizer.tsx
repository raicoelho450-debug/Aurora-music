import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BarChart3, Waves, Sparkles, Flame, Eye, Disc } from 'lucide-react';

export type VisualizerMode = 'bars' | 'wave' | 'particles' | 'aurora' | 'circles';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  life: number;
  maxLife: number;
}

interface AudioVisualizerProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
  theme?: VisualizerMode;
  onThemeChange?: (theme: VisualizerMode) => void;
  className?: string;
  interactive?: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  analyserNode,
  isPlaying,
  theme = 'aurora',
  onThemeChange,
  className = 'w-full h-32',
  interactive = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const peakCapsRef = useRef<number[]>([]);
  const beatHistoryRef = useRef<number[]>([]);
  const shockwavesRef = useRef<{ x: number; y: number; radius: number; maxRadius: number; alpha: number }[]>([]);
  const pointerPosRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });

  const [activeMode, setActiveMode] = useState<VisualizerMode>(theme);
  const [beatIntensity, setBeatIntensity] = useState<number>(0);

  useEffect(() => {
    setActiveMode(theme);
  }, [theme]);

  const handleModeChange = (mode: VisualizerMode) => {
    setActiveMode(mode);
    if (onThemeChange) {
      onThemeChange(mode);
    }
  };

  // Interactive Click / Touch Shockwave Trigger
  const handleCanvasInteraction = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    // Add shockwave
    shockwavesRef.current.push({
      x,
      y,
      radius: 4,
      maxRadius: 80,
      alpha: 0.9
    });

    // Spawn 18 burst particles from tap
    const colors = ['#ec4899', '#a855f7', '#3b82f6', '#06b6d4', '#10b981'];
    for (let i = 0; i < 18; i++) {
      const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.2;
      const speed = 2 + Math.random() * 4;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 3,
        alpha: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: 40 + Math.random() * 30
      });
    }
  }, [interactive]);

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    pointerPosRef.current = {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
      active: true
    };
  };

  const handlePointerLeave = () => {
    pointerPosRef.current.active = false;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserNode ? analyserNode.frequencyBinCount : 64;
    const dataArray = new Uint8Array(bufferLength);
    const timeDomainArray = new Uint8Array(bufferLength);

    const colors = ['#ec4899', '#9333ea', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b'];

    let lastBeatTime = 0;
    let lastStateUpdateTime = 0;

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);

      const width = canvas.width;
      const height = canvas.height;

      // Subtle persistence trail for fluid motion
      ctx.fillStyle = 'rgba(7, 5, 13, 0.28)';
      ctx.fillRect(0, 0, width, height);

      let currentBassEnergy = 0;

      if (analyserNode && isPlaying) {
        analyserNode.getByteFrequencyData(dataArray);
        if (analyserNode.getByteTimeDomainData) {
          analyserNode.getByteTimeDomainData(timeDomainArray);
        }

        // Calculate bass punch (bins 0 to 5, ~20Hz to ~160Hz)
        let bassSum = 0;
        for (let i = 0; i < 6; i++) {
          bassSum += dataArray[i] || 0;
        }
        currentBassEnergy = bassSum / 6;
      } else {
        // Organic idle oscillation
        const time = Date.now() * 0.002;
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = isPlaying ? Math.sin(time + i * 0.2) * 45 + 55 : Math.sin(time + i * 0.1) * 12 + 16;
          timeDomainArray[i] = 128 + Math.sin(time + i * 0.1) * 20;
        }
        currentBassEnergy = isPlaying ? 65 : 12;
      }

      // Beat detection threshold
      const now = Date.now();
      const isBeat = currentBassEnergy > 165 && (now - lastBeatTime > 220);
      if (isBeat) {
        lastBeatTime = now;
        if (now - lastStateUpdateTime > 350) {
          lastStateUpdateTime = now;
          setBeatIntensity(Math.min(100, Math.round((currentBassEnergy / 255) * 100)));
        }

        // Spawn pulse particles on beat
        const spawnCount = activeMode === 'particles' ? 12 : 5;
        for (let i = 0; i < spawnCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = (currentBassEnergy / 255) * 4.5 + Math.random() * 2;
          particlesRef.current.push({
            x: width * 0.5 + (Math.random() - 0.5) * 60,
            y: height * 0.5 + (Math.random() - 0.5) * 30,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 2 + Math.random() * 3.5,
            alpha: 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 0,
            maxLife: 35 + Math.random() * 25
          });
        }
      }

      // Keep particle pool bounded
      if (particlesRef.current.length > 120) {
        particlesRef.current = particlesRef.current.slice(-120);
      }

      // Update and draw Shockwaves
      for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
        const sw = shockwavesRef.current[i];
        sw.radius += 2.5;
        sw.alpha *= 0.93;

        ctx.save();
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(168, 85, 247, ${sw.alpha})`;
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#a855f7';
        ctx.stroke();
        ctx.restore();

        if (sw.radius >= sw.maxRadius || sw.alpha < 0.05) {
          shockwavesRef.current.splice(i, 1);
        }
      }

      // 1. PARTICLES MODE / PARTICLES LAYER
      if (activeMode === 'particles' || activeMode === 'aurora') {
        const pointer = pointerPosRef.current;

        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.life++;
          p.x += p.vx;
          p.y += p.vy;
          p.alpha = 1 - p.life / p.maxLife;

          // Mouse gravity interaction
          if (pointer.active) {
            const dx = pointer.x - p.x;
            const dy = pointer.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 90 && dist > 2) {
              p.vx += (dx / dist) * 0.12;
              p.vy += (dy / dist) * 0.12;
            }
          }

          // Friction
          p.vx *= 0.98;
          p.vy *= 0.98;

          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 + (currentBassEnergy / 255) * 0.8), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.shadowBlur = activeMode === 'particles' ? 14 : 6;
          ctx.shadowColor = p.color;
          ctx.fill();
          ctx.restore();

          if (p.life >= p.maxLife || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
            particlesRef.current.splice(i, 1);
          }
        }
      }

      // 2. BARS MODE
      if (activeMode === 'bars' || activeMode === 'aurora') {
        const barCount = 42;
        const totalGap = width * 0.25;
        const barWidth = (width - totalGap) / barCount;
        const gap = totalGap / (barCount - 1);

        if (peakCapsRef.current.length !== barCount) {
          peakCapsRef.current = new Array(barCount).fill(0);
        }

        for (let i = 0; i < barCount; i++) {
          const dataIndex = Math.floor((i / barCount) * (dataArray.length * 0.75));
          const val = dataArray[dataIndex] || 0;
          const energyFactor = currentBassEnergy / 255;
          const barHeight = Math.max(4, (val / 255) * (height - 18) * (1 + energyFactor * 0.15));

          const x = i * (barWidth + gap);
          const y = height - barHeight;

          // Falling Peak Cap
          if (barHeight > peakCapsRef.current[i]) {
            peakCapsRef.current[i] = barHeight;
          } else {
            peakCapsRef.current[i] = Math.max(0, peakCapsRef.current[i] - 1.2);
          }

          // Gradient
          const gradient = ctx.createLinearGradient(0, height, 0, y);
          if (activeMode === 'aurora') {
            gradient.addColorStop(0, 'rgba(147, 51, 234, 0.45)');
            gradient.addColorStop(0.6, 'rgba(59, 130, 246, 0.6)');
            gradient.addColorStop(1, 'rgba(6, 182, 212, 0.85)');
          } else {
            gradient.addColorStop(0, '#ec4899');
            gradient.addColorStop(0.5, '#a855f7');
            gradient.addColorStop(1, '#06b6d4');
          }

          ctx.fillStyle = gradient;
          ctx.beginPath();
          const radius = Math.min(barWidth / 2, 4);
          ctx.roundRect(x, y, barWidth, barHeight, [radius, radius, 1, 1]);
          ctx.fill();

          // Cap Indicator
          const capY = height - peakCapsRef.current[i] - 2;
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 6;
          ctx.shadowColor = '#06b6d4';
          ctx.fillRect(x, Math.max(2, capY), barWidth, 2);
          ctx.shadowBlur = 0;
        }
      }

      // 3. WAVE MODE
      if (activeMode === 'wave' || activeMode === 'aurora') {
        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = activeMode === 'wave' ? 3.5 : 2;

        const waveGradient = ctx.createLinearGradient(0, 0, width, 0);
        waveGradient.addColorStop(0, '#ec4899');
        waveGradient.addColorStop(0.35, '#a855f7');
        waveGradient.addColorStop(0.7, '#3b82f6');
        waveGradient.addColorStop(1, '#06b6d4');
        ctx.strokeStyle = waveGradient;

        const sliceWidth = width / (dataArray.length - 1);
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
          const v = dataArray[i] / 255.0;
          // Pulse scale based on current bass hit
          const beatBoost = (currentBassEnergy / 255) * 12;
          const y = height * 0.5 - ((v - 0.5) * (height * 0.75) + beatBoost);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            const prevX = x - sliceWidth;
            const midX = (prevX + x) / 2;
            ctx.quadraticCurveTo(prevX, y, midX, y);
          }
          x += sliceWidth;
        }

        ctx.shadowBlur = activeMode === 'wave' ? 16 : 8;
        ctx.shadowColor = 'rgba(168, 85, 247, 0.7)';
        ctx.stroke();
        ctx.restore();
      }

      // 4. CIRCLES MODE (Concentric pulsating frequency rings)
      if (activeMode === 'circles') {
        ctx.save();
        const centerX = width / 2;
        const centerY = height / 2;
        const maxR = Math.min(width, height) * 0.45;
        const ringCount = 8;

        for (let r = 1; r <= ringCount; r++) {
          const sampleIndex = Math.floor((r / ringCount) * (dataArray.length * 0.6));
          const freqVal = dataArray[sampleIndex] || 0;
          const boost = (freqVal / 255) * 18;
          const currentRadius = (r / ringCount) * maxR + boost;

          ctx.beginPath();
          ctx.arc(centerX, centerY, Math.max(2, currentRadius), 0, Math.PI * 2);

          const ringAlpha = Math.min(1, 0.25 + (freqVal / 255) * 0.75);
          ctx.strokeStyle = r % 2 === 0 ? `rgba(6, 182, 212, ${ringAlpha})` : `rgba(168, 85, 247, ${ringAlpha})`;
          ctx.lineWidth = 1.5 + (freqVal / 255) * 3;
          ctx.shadowBlur = 10;
          ctx.shadowColor = r % 2 === 0 ? '#06b6d4' : '#a855f7';
          ctx.stroke();
        }

        // Inner glowing core
        ctx.beginPath();
        const coreR = Math.max(4, 10 + (currentBassEnergy / 255) * 14);
        ctx.arc(centerX, centerY, coreR, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ec4899';
        ctx.fill();

        ctx.restore();
      }
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [analyserNode, isPlaying, activeMode]);

  return (
    <div className={`relative flex flex-col items-center justify-center rounded-2xl overflow-hidden group select-none border border-purple-500/20 bg-[#090614]/80 backdrop-blur-md ${className}`}>
      {/* Top Visualizer Mode Switcher Toolbar */}
      <div className="absolute top-2 inset-x-3 z-10 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-1 rounded-xl border border-white/10">
          <button
            onClick={() => handleModeChange('bars')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
              activeMode === 'bars'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Visualizador de Barras de Frequência"
          >
            <BarChart3 className="w-3 h-3" />
            <span className="hidden sm:inline">Barras</span>
          </button>

          <button
            onClick={() => handleModeChange('wave')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
              activeMode === 'wave'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Visualizador de Ondas Senoidais"
          >
            <Waves className="w-3 h-3" />
            <span className="hidden sm:inline">Ondas</span>
          </button>

          <button
            onClick={() => handleModeChange('circles')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
              activeMode === 'circles'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Visualizador de Círculos Concêntricos"
          >
            <Disc className="w-3 h-3" />
            <span className="hidden sm:inline">Círculos</span>
          </button>

          <button
            onClick={() => handleModeChange('particles')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
              activeMode === 'particles'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Visualizador de Partículas Reativas à Batida"
          >
            <Sparkles className="w-3 h-3" />
            <span className="hidden sm:inline">Partículas</span>
          </button>

          <button
            onClick={() => handleModeChange('aurora')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
              activeMode === 'aurora'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Visualizador Aurora Híbrido Cósmico"
          >
            <Flame className="w-3 h-3" />
            <span className="hidden sm:inline">Aurora</span>
          </button>
        </div>

        {/* Live Beat Intensity Monitor */}
        <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 text-[10px] font-mono">
          <span className="w-2 h-2 rounded-full animate-ping" style={{
            backgroundColor: beatIntensity > 70 ? '#ec4899' : '#06b6d4',
            animationDuration: '1.2s'
          }} />
          <span className="text-slate-300">Batida:</span>
          <span className="font-bold text-purple-300">{beatIntensity}%</span>
        </div>
      </div>

      {/* Main Interactive Canvas */}
      <canvas
        ref={canvasRef}
        width={600}
        height={160}
        onClick={handleCanvasInteraction}
        onTouchStart={handleCanvasInteraction}
        onMouseMove={handlePointerMove}
        onMouseLeave={handlePointerLeave}
        className="w-full h-full block cursor-crosshair active:scale-[0.99] transition-transform"
      />

      {/* Interaction Hint */}
      <div className="absolute bottom-1 right-2 text-[9px] font-mono text-slate-500 opacity-60 pointer-events-none group-hover:opacity-100 transition-opacity">
        ✦ Toque na tela para disparar ondas sonoras
      </div>
    </div>
  );
};
