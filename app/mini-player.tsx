'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
    isShuffle, toggleShuffle, repeatMode, cycleRepeat, updateTrackInPlaylist,
  } = usePlayback();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVol, setPrevVol] = useState(70);
  const progressRef = useRef<HTMLDivElement>(null);

  // Swipe gesture state
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);

  useEffect(() => {
    if (currentTrack) setIsLiked(Boolean((currentTrack as any).favorite));
  }, [currentTrack?.id, (currentTrack as any)?.favorite]);

  useEffect(() => {
    document.body.style.overflow = isExpanded ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isExpanded]);

  const handleLike = async () => {
    if (!currentTrack) return;
    const next = !isLiked;
    setIsLiked(next);
    updateTrackInPlaylist(currentTrack.id, { favorite: next });
    const res = await toggleFavoriteAction(currentTrack.id, next);
    if (!res.success) { setIsLiked(!next); updateTrackInPlaylist(currentTrack.id, { favorite: !next }); }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || duration <= 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    setCurrentTime(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * duration);
  };

  const handleProgressTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!progressRef.current || duration <= 0) return;
    e.preventDefault();
    const rect = progressRef.current.getBoundingClientRect();
    const touch = e.touches[0] || e.changedTouches[0];
    setCurrentTime(Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width)) * duration);
  };

  const toggleMute = () => {
    if (isMuted) { setVolume(prevVol); setIsMuted(false); }
    else { setPrevVol(volume); setVolume(0); setIsMuted(true); }
  };

  const fmt = (t: number) => {
    if (isNaN(t) || t < 0) return '0:00';
    return `${Math.floor(t / 60)}:${Math.floor(t % 60).toString().padStart(2, '0')}`;
  };

  // Swipe handlers for mini bar
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      // Horizontal swipe
      if (dx < 0) playNextTrack();
      else playPreviousTrack();
    } else if (dy < -60 && Math.abs(dy) > Math.abs(dx)) {
      // Swipe up → expand
      setIsExpanded(true);
    }
  };

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* ── FULLSCREEN PLAYER ── */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-[200] md:hidden flex flex-col overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 60%, #0a0a0a 100%)' }}
        >
          <div className="pt-[env(safe-area-inset-top)]" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3">
            <button
              onClick={() => setIsExpanded(false)}
              className="size-10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              aria-label="Cerrar"
            >
              <ChevronDown className="size-6" />
            </button>
            <div className="text-center flex-1 px-4">
              <p className="text-xs text-white/50 uppercase tracking-widest font-semibold truncate">
                {currentTrack.album || 'Reproduciendo ahora'}
              </p>
            </div>
            <button className="size-10 flex items-center justify-center text-white/60 hover:text-white transition-colors">
              <ListMusic className="size-5" />
            </button>
          </div>

          {/* Album Art */}
          <div className="flex-1 flex items-center justify-center px-8 py-4 min-h-0">
            <div className={cn(
              'w-full max-w-[300px] aspect-square rounded-2xl overflow-hidden shadow-2xl transition-all duration-500',
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

          {/* Controls */}
          <div className="px-6 pb-[env(safe-area-inset-bottom)] space-y-5">
            {/* Track info + like */}
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1 mr-4">
                <h2 className="text-xl font-bold text-white truncate">{currentTrack.name}</h2>
                <Link
                  href={`/artist/${encodeURIComponent(currentTrack.artist)}`}
                  onClick={() => setIsExpanded(false)}
                  className="text-white/60 text-sm truncate block hover:text-white transition-colors mt-0.5"
                >
                  {currentTrack.artist}
                </Link>
              </div>
              <button onClick={handleLike} className="flex-shrink-0 p-2">
                <Heart className={cn('size-6 transition-all', isLiked ? 'text-[#1db954] fill-[#1db954]' : 'text-white/50')} />
              </button>
            </div>

            {/* Progress */}
            <div>
              <div
                ref={progressRef}
                className="h-1.5 bg-white/20 rounded-full cursor-pointer relative mb-2"
                onClick={handleProgressClick}
                onTouchMove={handleProgressTouch}
                onTouchEnd={handleProgressTouch}
              >
                <div className="h-full bg-white rounded-full transition-none" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between text-xs text-white/40 tabular-nums">
                <span>{fmt(currentTime)}</span>
                <span>{fmt(duration)}</span>
              </div>
            </div>

            {/* Playback controls */}
            <div className="flex items-center justify-between">
              <button
                onClick={toggleShuffle}
                className={cn('p-2 transition-colors', isShuffle ? 'text-[#1db954]' : 'text-white/50')}
              >
                <Shuffle className="size-5" />
              </button>
              <button onClick={playPreviousTrack} className="p-2 text-white active:scale-90 transition-transform">
                <SkipBack className="size-8 fill-white" />
              </button>
              <button
                onClick={togglePlayPause}
                className="size-16 bg-white rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform"
              >
                {isPlaying
                  ? <Pause className="size-7 fill-black text-black" />
                  : <Play className="size-7 fill-black text-black ml-1" />
                }
              </button>
              <button onClick={playNextTrack} className="p-2 text-white active:scale-90 transition-transform">
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
                onClick={e => {
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

      {/* ── MINI BAR ── */}
      <div
        className="fixed left-0 right-0 z-40 md:hidden"
        style={{ bottom: 'calc(64px + env(safe-area-inset-bottom))' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="mx-2 bg-[#1f1f1f] rounded-2xl overflow-hidden shadow-2xl border border-white/[0.08]"
          onClick={() => setIsExpanded(true)}
        >
          {/* Progress line */}
          <div className="h-0.5 bg-white/10">
            <div className="h-full bg-[#1db954] transition-none" style={{ width: `${progress}%` }} />
          </div>

          <div className="flex items-center gap-3 px-3 py-2.5">
            <img
              src={getValidImageUrl(currentTrack.imageUrl)}
              alt=""
              className="size-10 rounded-xl object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-semibold truncate leading-tight', isPlaying ? 'text-white' : 'text-white/80')}>
                {currentTrack.name}
              </p>
              <p className="text-xs text-[#727272] truncate leading-tight mt-0.5">{currentTrack.artist}</p>
            </div>

            {/* Controls */}
            <div className="flex items-center" onClick={e => e.stopPropagation()}>
              <button
                onClick={playPreviousTrack}
                className="size-10 flex items-center justify-center text-white/70 active:text-white transition-colors"
                aria-label="Anterior"
              >
                <SkipBack className="size-5 fill-current" />
              </button>
              <button
                onClick={togglePlayPause}
                className="size-10 flex items-center justify-center text-white active:scale-90 transition-transform"
                aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isPlaying
                  ? <Pause className="size-6 fill-current" />
                  : <Play className="size-6 fill-current" />
                }
              </button>
              <button
                onClick={playNextTrack}
                className="size-10 flex items-center justify-center text-white/70 active:text-white transition-colors"
                aria-label="Siguiente"
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
