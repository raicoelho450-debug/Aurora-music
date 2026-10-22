import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Sparkles, ChevronRight, Volume2, VolumeX, SkipForward } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hasFinishedRef = useRef(false);

  const introVideoSrc = '/assets/aistudio/aurora_music_intro_giro_mais_longo_73acbd72.mp4';

  const completeSplash = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    try {
      sessionStorage.setItem('aurora_splash_shown', 'true');
    } catch {
      // Safe fallback
    }
    onFinish();
  }, [onFinish]);

  const handleSkip = useCallback(() => {
    if (isFadingOut || hasFinishedRef.current) return;
    setIsFadingOut(true);
    setTimeout(completeSplash, 350);
  }, [completeSplash, isFadingOut]);

  // Handle keyboard shortcut (Escape, Enter, Space) to skip intro
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSkip]);

  // Video playback initialization
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Try autoplay
    video.muted = isMuted;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setHasStarted(true);
        })
        .catch(() => {
          // Fallback if browser requires user interaction for autoplay
          video.muted = true;
          setIsMuted(true);
          video.play().then(() => setHasStarted(true)).catch(() => {
            setVideoError(true);
          });
        });
    }

    // Safety fallback timeout: if video takes too long or fails, advance automatically
    const safetyTimer = setTimeout(() => {
      if (!hasFinishedRef.current) {
        handleSkip();
      }
    }, 9500);

    return () => {
      clearTimeout(safetyTimer);
    };
  }, [handleSkip, isMuted]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video && video.duration > 0) {
      setVideoProgress((video.currentTime / video.duration) * 100);
    }
  };

  const handleVideoEnded = () => {
    setIsFadingOut(true);
    setTimeout(completeSplash, 400);
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#07050d] select-none cursor-pointer overflow-hidden transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Dynamic Ambient Background Cosmic Glow */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40 filter blur-3xl scale-125 transition-all duration-1000"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(147,51,234,0.45) 0%, rgba(59,130,246,0.25) 45%, #07050d 80%)'
        }}
      />

      {/* Decorative Aurora Starlight Particles */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:32px_32px] opacity-20" />

      {/* Video Intro Presentation Card */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 max-w-lg w-full">
        {/* Glow Frame */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-3xl overflow-hidden p-1 bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 shadow-[0_0_60px_rgba(168,85,247,0.45)] group">
          <div className="w-full h-full rounded-[22px] overflow-hidden bg-black relative flex items-center justify-center">
            {/* The Video Intro */}
            <video
              ref={videoRef}
              src={introVideoSrc}
              autoPlay
              playsInline
              webkit-playsinline="true"
              muted={isMuted}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleVideoEnded}
              onError={() => setVideoError(true)}
              className="w-full h-full object-cover object-center"
            />

            {/* Subtle Gradient vignette on edges */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

            {/* Sound Toggle Button (Bottom-Right of Video) */}
            <button
              type="button"
              onClick={toggleSound}
              className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white transition-transform active:scale-90"
              title={isMuted ? 'Ativar som' : 'Silenciar'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-slate-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Brand Tagline below intro */}
        <div className="mt-6 flex items-center gap-2 text-xs sm:text-sm font-semibold tracking-widest text-slate-300 uppercase">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Áudio em Alta Fidelidade · Experiência Sonora</span>
        </div>

        {/* Video Playback Progress Bar */}
        <div className="mt-4 w-48 h-1 rounded-full bg-white/10 overflow-hidden relative">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-indigo-400 to-cyan-300 rounded-full transition-all duration-150"
            style={{ width: `${videoProgress}%` }}
          />
        </div>
      </div>

      {/* Skip Intro Button */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          handleSkip();
        }}
        className="absolute bottom-6 sm:bottom-8 px-4 py-1.5 rounded-full bg-white/[0.08] hover:bg-purple-600/30 border border-white/10 hover:border-purple-500/40 text-xs font-mono text-slate-300 hover:text-white tracking-wider uppercase transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 group"
      >
        <span>Pular Intro</span>
        <SkipForward className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  );
};
