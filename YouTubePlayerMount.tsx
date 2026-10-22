import React from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { Youtube, ExternalLink } from 'lucide-react';

export const YouTubePlayerMount: React.FC = () => {
  const { currentTrack, isExpandedPlayerOpen, expandedTab, isYouTubeTrack } = useAudioPlayer();

  const isYtTrack = isYouTubeTrack(currentTrack);

  // Determine display mode:
  // 1. 'modal-video': Shown prominently in Expanded Modal when 'video' tab is active
  // 2. 'hidden': Silently active off-screen so YouTube audio continues playing without any visible floating widget
  const isModalVideo = isYtTrack && isExpandedPlayerOpen && expandedTab === 'video';

  return (
    <div
      className={`fixed transition-all duration-300 ${
        isModalVideo
          ? 'z-[60] top-28 md:top-32 left-1/2 -translate-x-1/2 w-[92vw] max-w-2xl aspect-video rounded-2xl bg-black border border-red-500/50 shadow-2xl shadow-red-950/80 overflow-hidden flex flex-col'
          : 'z-0 pointer-events-none opacity-0 -left-[9999px] top-0 w-1 h-1 overflow-hidden'
      }`}
    >
      {/* Modal Video Header Bar (only shown when user explicitly opens video tab inside the expanded player) */}
      {isModalVideo && (
        <div className="flex items-center justify-between px-4 py-2 bg-[#12091c] border-b border-red-500/30 text-xs text-slate-300 shrink-0">
          <div className="flex items-center gap-2 truncate">
            <Youtube className="w-4 h-4 text-red-500 shrink-0" />
            <span className="font-bold text-white truncate">
              {currentTrack?.title}
            </span>
            <span className="text-slate-400 text-[11px] truncate hidden sm:inline">
              · {currentTrack?.artist}
            </span>
          </div>
          {currentTrack?.youtubeId && (
            <a
              href={`https://www.youtube.com/watch?v=${currentTrack.youtubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-300 text-[11px] font-semibold transition-colors"
              title="Abrir no YouTube oficial"
            >
              <span>Abrir</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Persistent YouTube Host - NEVER UNMOUNTED FROM DOM TO PRESERVE AUDIO */}
      <div className="relative flex-1 w-full bg-black">
        <div id="aurora-yt-player-host" className="w-full h-full" />
      </div>
    </div>
  );
};
