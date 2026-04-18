'use client';

import { useState, useRef, useEffect } from 'react';
import { usePlayback } from './playback-context';
import { getValidImageUrl, cn } from '@/lib/utils';
import {
  Play, Pause, SkipForward, SkipBack,
  ChevronDown, Heart, ListMusic,
  Shuffle, Repeat, Repeat1, Volume2, VolumeX,
} from 'lucide-react';
import { toggleFavoriteAction } from './actions';
import Link from 'next/link';

export function MiniPlayer() {
  const {
    currentTrack, isPlaying, togglePlayPause, playNextTrack, playPreviousTrack,
    currentTime, duration, setCurrentTime, volume, setVolume,
    isShuffle, toggleShuffle, repeatMode, cycleRepeat,
  } = usePlayback();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVol, setPrevVol] = useState(70);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentTrack) setIsLiked(Boolean((currentTrack as any).favorite));
  }, [currentTrack?.id]);

  // Lock body scroll when expanded
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isExpanded]);

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || duration <= 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    setCurrentTime(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * duration);
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
      {/* ── FULLSCREEN PLAYER (mobile only) ── */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-[200] md:hidden flex flex-col overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f0f 100%)' }}
        >
          {/* Safe area top */}
          <div className="pt-[env(safe-area-inset-top)]" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3">
            <button
              onClick={() => setIsExpanded(false)}
              className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white"
            >
              <ChevronDown className="size-6" />
            </button>
            <div className="text-center flex-1 px-4">
              <p className="text-xs text-white/50 uppercase tracking-widest font-semibold truncate">
                {currentTrack.album || 'Reproduciendo ahora'}
              </p>
            </div>
            <button className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white">
              <ListMusic className="size-5" />
            </button>
          </div>

          {/* Album Art */}
          <div className="flex-1 flex items-center justify-center px-8 py-4 min-h-0">
            <div className={cn(
              'w-full max-w-[280px] aspect-square rounded-2xl overflow-hidden shadow-2xl transition-all duration-500',
              isPlaying
                ? 'scale-100 shadow-[0_24px_80px_rgba(0,0,0,0.9)]'
                : 'scale-[0.88] shadow-lg opacity-90'
            )}>
              <img
                src={getValidImageUrl(currentTrack.imageUrl)}
                alt={currentTrack.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Bottom controls */}
          <div className="px-6 pb-[env(safe-area-inset-bottom)] space-y-5">
            {/* Track info + like */}
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1 mr-4">
                <h2 className="text-xl font-bold text-white truncate">{currentTrack.name}</h2>
                <Link
                  href={`/artist/${encodeURIComponent(currentTrack.artist)}`}
                  onClick={() => setIsExpanded(false)}
                  className="text-white/60 text-sm truncate block hover:text-white transition-colors"
                >
                  {currentTrack.artist}
                </Link>
              </div>
              <button
                onClick={async () => {
                  const next = !isLiked;
                  setIsLiked(next);
                  await toggleFavoriteAction(currentTrack.id, next);
                }}
                className="flex-shrink-0 p-2"
              >
                <Heart className={cn('size-6 transition-all', isLiked ? 'text-[#1db954] fill-[#1db954]' : 'text-white/50')} />
              </button>
            </div>

            {/* Progress bar */}
            <div>
              <div
                ref={progressRef}
                className="h-1 bg-white/20 rounded-full cursor-pointer relative mb-1.5 active:h-2 transition-all"
                onClick={handleProgressClick}
              >
                <div className="h-full bg-white rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between text-xs text-white/40 tabular-nums">
                <span>{fmt(currentTime)}</span>
                <span>{fmt(duration)}</span>
              </div>
            </div>

            {/* Main controls */}
            <div className="flex items-center justify-between">
              <button
                onClick={toggleShuffle}
                className={cn('p-2 transition-colors', isShuffle ? 'text-[#1db954]' : 'text-white/50')}
              >
                <Shuffle className="size-5" />
              </button>
              <button
                onClick={playPreviousTrack}
                className="p-2 text-white active:scale-90 transition-transform"
              >
                <SkipBack className="size-8 fill-white" />
              </button>
              <button
                onClick={togglePlayPause}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform"
              >
                {isPlaying
                  ? <Pause className="size-7 fill-black text-black" />
                  : <Play className="size-7 fill-black text-black ml-1" />
                }
              </button>
              <button
                onClick={playNextTrack}
                className="p-2 text-white active:scale-90 transition-transform"
              >
                <SkipForward className="size-8 fill-white" />
              </button>
              <button
                onClick={cycleRepeat}
                className={cn('p-2 transition-colors', repeatMode !== 'off' ? 'text-[#1db954]' : 'text-white/50')}
              >
                {repeatMode === 'one' ? <Repeat1 className="size-5" /> : <Repeat className="size-5" />}
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3 pb-2">
              <button onClick={toggleMute} className="text-white/50 hover:text-white transition-colors">
                {isMuted || volume === 0 ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
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
                <div className="h-full bg-white/70 rounded-full" style={{ width: `${isMuted ? 0 : volume}%` }} />
              </div>
              <Volume2 className="size-4 text-white/50" />
            </div>
          </div>
        </div>
      )}

      {/* ── MINI BAR (mobile only, above bottom nav) ── */}
      <div className="fixed left-0 right-0 z-40 md:hidden" style={{ bottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
        <div
          className="mx-2 bg-[#282828] rounded-xl overflow-hidden shadow-2xl border border-white/5"
          onClick={() => setIsExpanded(true)}
        >
          {/* Progress line */}
          <div className="h-0.5 bg-white/10">
            <div className="h-full bg-[#1db954] transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5">
            <img
              src={getValidImageUrl(currentTrack.imageUrl)}
              alt=""
              className="size-10 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-tight">{currentTrack.name}</p>
              <p className="text-xs text-gray-400 truncate leading-tight">{currentTrack.artist}</p>
            </div>
            {/* Controls — stop propagation so they don't open fullscreen */}
            <div className="flex items-center" onClick={e => e.stopPropagation()}>
              <button
                onClick={playPreviousTrack}
                className="w-10 h-10 flex items-center justify-center text-white/70 active:text-white"
              >
                <SkipBack className="size-5 fill-current" />
              </button>
              <button
                onClick={togglePlayPause}
                className="w-10 h-10 flex items-center justify-center text-white active:scale-90 transition-transform"
              >
                {isPlaying
                  ? <Pause className="size-6 fill-current" />
                  : <Play className="size-6 fill-current" />
                }
              </button>
              <button
                onClick={playNextTrack}
                className="w-10 h-10 flex items-center justify-center text-white/70 active:text-white"
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
