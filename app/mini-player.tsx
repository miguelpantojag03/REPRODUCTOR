'use client';

import { useState, useRef, useEffect } from 'react';
import { usePlayback } from './playback-context';
import { getValidImageUrl, formatDuration, cn } from '@/lib/utils';
import { Play, Pause, SkipForward, SkipBack, X, ChevronDown, Heart, ListMusic, Shuffle, Repeat, Repeat1, Volume2, VolumeX } from 'lucide-react';
import { toggleFavoriteAction } from './actions';

export function MiniPlayer() {
  const {
    currentTrack, isPlaying, togglePlayPause, playNextTrack, playPreviousTrack,
    currentTime, duration, setCurrentTime, volume, setVolume,
    isShuffle, toggleShuffle, repeatMode, cycleRepeat, playlist,
    isLoadingYouTube,
  } = usePlayback();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVol, setPrevVol] = useState(70);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentTrack) setIsLiked(Boolean((currentTrack as any).favorite));
  }, [currentTrack]);

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || duration <= 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setCurrentTime(pct * duration);
  };

  const toggleMute = () => {
    if (isMuted) { setVolume(prevVol); setIsMuted(false); }
    else { setPrevVol(volume); setVolume(0); setIsMuted(true); }
  };

  const fmt = (t: number) => {
    if (isNaN(t) || t < 0) return '0:00';
    return `${Math.floor(t / 60)}:${Math.floor(t % 60).toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Fullscreen expanded player — mobile only */}
      {isExpanded && (
        <div className="fixed inset-0 z-[200] bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex flex-col md:hidden animate-in slide-in-from-bottom duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-12 pb-4">
            <button onClick={() => setIsExpanded(false)} className="text-white/70 hover:text-white transition-colors">
              <ChevronDown className="size-7" />
            </button>
            <div className="text-center">
              <p className="text-xs text-white/60 uppercase tracking-widest font-bold">Reproduciendo ahora</p>
            </div>
            <button className="text-white/70 hover:text-white transition-colors">
              <ListMusic className="size-5" />
            </button>
          </div>

          {/* Album Art */}
          <div className="flex-1 flex items-center justify-center px-10">
            <div className={cn(
              "w-full max-w-xs aspect-square rounded-2xl overflow-hidden shadow-2xl transition-all duration-500",
              isPlaying ? "scale-100 shadow-[0_20px_60px_rgba(0,0,0,0.8)]" : "scale-90 shadow-lg"
            )}>
              <img
                src={getValidImageUrl(currentTrack.imageUrl)}
                alt={currentTrack.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Track Info + Like */}
          <div className="px-8 pb-4">
            <div className="flex items-center justify-between mb-6">
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-bold text-white truncate">{currentTrack.name}</h2>
                <p className="text-white/60 text-base truncate">{currentTrack.artist}</p>
              </div>
              <button
                onClick={async () => {
                  const next = !isLiked;
                  setIsLiked(next);
                  await toggleFavoriteAction(currentTrack.id, next);
                }}
                className="ml-4 flex-shrink-0"
              >
                <Heart className={cn("size-7 transition-all", isLiked ? "text-[#1db954] fill-[#1db954] scale-110" : "text-white/60")} />
              </button>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div
                ref={progressRef}
                className="h-1.5 bg-white/20 rounded-full cursor-pointer relative group mb-2"
                onClick={handleProgressClick}
              >
                <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `calc(${progress}% - 8px)` }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/50 tabular-nums">
                <span>{fmt(currentTime)}</span>
                <span>{fmt(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={toggleShuffle}
                className={cn("p-2 transition-colors", isShuffle ? "text-[#1db954]" : "text-white/60 hover:text-white")}
              >
                <Shuffle className="size-5" />
              </button>
              <button onClick={playPreviousTrack} className="text-white hover:scale-110 transition-transform p-2">
                <SkipBack className="size-8 fill-white" />
              </button>
              <button
                onClick={togglePlayPause}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-transform active:scale-95"
              >
                {isPlaying
                  ? <Pause className="size-7 fill-black text-black" />
                  : <Play className="size-7 fill-black text-black ml-1" />
                }
              </button>
              <button onClick={playNextTrack} className="text-white hover:scale-110 transition-transform p-2">
                <SkipForward className="size-8 fill-white" />
              </button>
              <button
                onClick={cycleRepeat}
                className={cn("p-2 transition-colors", repeatMode !== 'off' ? "text-[#1db954]" : "text-white/60 hover:text-white")}
              >
                {repeatMode === 'one' ? <Repeat1 className="size-5" /> : <Repeat className="size-5" />}
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3 pb-8">
              <button onClick={toggleMute} className="text-white/60 hover:text-white transition-colors">
                {isMuted || volume === 0 ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
              </button>
              <div
                className="flex-1 h-1 bg-white/20 rounded-full cursor-pointer relative"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                  setVolume(pct);
                  if (pct > 0) setIsMuted(false);
                }}
              >
                <div className="h-full bg-white rounded-full" style={{ width: `${volume}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mini bar tap area — mobile only, sits above the bottom nav */}
      <div
        className="fixed bottom-16 left-0 right-0 z-40 md:hidden cursor-pointer"
        onClick={() => setIsExpanded(true)}
      >
        <div className="mx-2 mb-1 bg-[#282828] rounded-xl overflow-hidden shadow-2xl border border-white/5">
          {/* Progress line */}
          <div className="h-0.5 bg-white/10">
            <div className="h-full bg-[#1db954] transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center gap-3 px-3 py-2">
            <img
              src={getValidImageUrl(currentTrack.imageUrl)}
              alt=""
              className="size-10 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{currentTrack.name}</p>
              <p className="text-xs text-gray-400 truncate">{currentTrack.artist}</p>
            </div>
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={playPreviousTrack}
                className="p-2 text-white/70 hover:text-white transition-colors"
              >
                <SkipBack className="size-5 fill-current" />
              </button>
              <button
                onClick={togglePlayPause}
                className="p-2 text-white hover:scale-110 transition-transform"
              >
                {isPlaying
                  ? <Pause className="size-6 fill-current" />
                  : <Play className="size-6 fill-current" />
                }
              </button>
              <button
                onClick={playNextTrack}
                className="p-2 text-white/70 hover:text-white transition-colors"
              >
                <SkipForward className="size-5 fill-current" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
