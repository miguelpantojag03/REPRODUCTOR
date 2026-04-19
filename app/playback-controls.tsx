'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import {
  Heart, Pause, Play, SkipBack, SkipForward,
  Volume2, VolumeX, Volume1, Shuffle, Repeat, Repeat1,
  Loader2, ListMusic,
} from 'lucide-react';
import { usePlayback } from '@/app/playback-context';
import { getValidImageUrl, formatDuration, cn } from '@/lib/utils';
import { toggleFavoriteAction } from './actions';
import Link from 'next/link';

function fmt(t: number) {
  if (isNaN(t) || t < 0) return '0:00';
  return `${Math.floor(t / 60)}:${Math.floor(t % 60).toString().padStart(2, '0')}`;
}

/* ── Track Info ─────────────────────────────────────────────── */
function TrackInfo() {
  const { currentTrack, isPlaying, setActivePanel, updateTrackInPlaylist } = usePlayback();
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    setIsLiked(Boolean((currentTrack as any)?.favorite));
  }, [currentTrack?.id, (currentTrack as any)?.favorite]);

  // Listen for F keyboard shortcut
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.trackId === currentTrack?.id) {
        const next = detail.favorite;
        setIsLiked(next);
        updateTrackInPlaylist(detail.trackId, { favorite: next });
        toggleFavoriteAction(detail.trackId, next).then(res => {
          if (!res.success) {
            setIsLiked(!next);
            updateTrackInPlaylist(detail.trackId, { favorite: !next });
          }
        });
      }
    };
    window.addEventListener('toggle-favorite', handler);
    return () => window.removeEventListener('toggle-favorite', handler);
  }, [currentTrack?.id, updateTrackInPlaylist]);

  const toggleFavorite = async () => {
    if (!currentTrack) return;
    const next = !isLiked;
    setIsLiked(next);
    updateTrackInPlaylist(currentTrack.id, { favorite: next });
    const res = await toggleFavoriteAction(currentTrack.id, next);
    if (!res.success) { setIsLiked(!next); updateTrackInPlaylist(currentTrack.id, { favorite: !next }); }
  };

  if (!currentTrack) {
    return (
      <div className="flex items-center gap-3 w-[28%] min-w-0">
        <div className="size-12 rounded-lg bg-white/5 flex-shrink-0 shimmer" />
        <div className="space-y-2 flex-1 min-w-0">
          <div className="h-3 w-32 bg-white/5 rounded shimmer" />
          <div className="h-2.5 w-20 bg-white/5 rounded shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 w-[28%] min-w-0">
      <button
        onClick={() => setActivePanel('now-playing')}
        className={cn(
          'relative size-12 flex-shrink-0 rounded-lg overflow-hidden shadow-lg group transition-all duration-300',
          isPlaying && 'ring-2 ring-[#1db954]/50 ring-offset-1 ring-offset-black'
        )}
      >
        <img
          src={getValidImageUrl(currentTrack.imageUrl)}
          alt=""
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        {isPlaying && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="flex items-end gap-[2px] h-3">
              <div className="w-[2px] bg-[#1db954] rounded-sm wave-bar-1" />
              <div className="w-[2px] bg-[#1db954] rounded-sm wave-bar-2" />
              <div className="w-[2px] bg-[#1db954] rounded-sm wave-bar-3" />
            </div>
          </div>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white truncate leading-tight">{currentTrack.name}</p>
        <Link
          href={`/artist/${encodeURIComponent(currentTrack.artist)}`}
          className="text-xs text-[#b3b3b3] hover:text-white hover:underline transition-colors truncate block leading-tight mt-0.5"
          onClick={e => e.stopPropagation()}
        >
          {currentTrack.artist}
        </Link>
      </div>

      <button
        onClick={toggleFavorite}
        className="hidden sm:flex size-8 items-center justify-center flex-shrink-0 rounded-full hover:bg-white/10 transition-colors"
      >
        <Heart className={cn('size-4 transition-all duration-200', isLiked ? 'text-[#1db954] fill-[#1db954] scale-110' : 'text-[#b3b3b3] hover:text-white')} />
      </button>
    </div>
  );
}

/* ── Progress Bar ───────────────────────────────────────────── */
function ProgressBar() {
  const { currentTime, duration, setCurrentTime } = usePlayback();
  const [isDragging, setIsDragging] = useState(false);
  const [dragVal, setDragVal] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);

  const calcTimeFromX = useCallback((clientX: number) => {
    if (!barRef.current || duration <= 0) return 0;
    const r = barRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * duration;
  }, [duration]);

  const calcTime = useCallback((e: MouseEvent | React.MouseEvent) => calcTimeFromX(e.clientX), [calcTimeFromX]);

  useEffect(() => {
    if (!isDragging) return;
    const mv = (e: MouseEvent) => setDragVal(calcTime(e));
    const up = (e: MouseEvent) => { setCurrentTime(calcTime(e)); setIsDragging(false); };
    window.addEventListener('mousemove', mv);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
  }, [isDragging, calcTime, setCurrentTime]);

  const display = isDragging ? dragVal : currentTime;
  const pct = duration > 0 ? Math.min(100, (display / duration) * 100) : 0;

  return (
    <div className="flex items-center gap-2 w-full">
      <span className="text-[10px] tabular-nums text-[#6b7280] w-8 text-right shrink-0">{fmt(display)}</span>
      <div
        ref={barRef}
        className="flex-1 h-1 bg-white/10 rounded-full cursor-pointer relative group flex items-center"
        onMouseDown={e => { e.preventDefault(); setIsDragging(true); setDragVal(calcTime(e)); }}
        onTouchStart={e => {
          const touch = e.touches[0];
          setDragVal(calcTimeFromX(touch.clientX));
        }}
        onTouchMove={e => {
          e.preventDefault();
          const touch = e.touches[0];
          setDragVal(calcTimeFromX(touch.clientX));
        }}
        onTouchEnd={e => {
          const touch = e.changedTouches[0];
          setCurrentTime(calcTimeFromX(touch.clientX));
        }}
      >
        <div
          className="absolute inset-y-0 left-0 bg-[#b3b3b3] group-hover:bg-[#1db954] rounded-full transition-colors duration-150"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute size-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${pct}% - 6px)`, top: '-4px' }}
        />
      </div>
      <span className="text-[10px] tabular-nums text-[#6b7280] w-8 shrink-0">{fmt(duration)}</span>
    </div>
  );
}

/* ── Center Controls ────────────────────────────────────────── */
function CenterControls() {
  const {
    isPlaying, togglePlayPause, playNextTrack, playPreviousTrack,
    currentTrack, isLoadingYouTube, isShuffle, toggleShuffle,
    repeatMode, cycleRepeat, playbackSpeed, setPlaybackSpeed,
  } = usePlayback();
  const [showSpeed, setShowSpeed] = useState(false);
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div className="flex flex-col items-center gap-2 flex-1 max-w-[44%]">
      {/* Buttons row */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleShuffle}
          disabled={!currentTrack}
          className={cn('relative p-1 rounded transition-all hover:scale-110 disabled:opacity-30', isShuffle ? 'text-[#1db954]' : 'text-[#6b7280] hover:text-white')}
          title="Aleatorio (S)"
        >
          <Shuffle className="size-4" />
          {isShuffle && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 size-1 rounded-full bg-[#1db954]" />}
        </button>

        <button
          onClick={playPreviousTrack}
          disabled={!currentTrack}
          className="text-[#b3b3b3] hover:text-white transition-all hover:scale-110 disabled:opacity-30"
        >
          <SkipBack className="size-5 fill-current" />
        </button>

        <button
          onClick={togglePlayPause}
          disabled={!currentTrack || isLoadingYouTube}
          className="size-9 bg-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-40 shadow-lg shadow-black/30"
        >
          {isLoadingYouTube
            ? <Loader2 className="size-4 animate-spin text-black" />
            : isPlaying
            ? <Pause className="size-4 fill-black text-black" />
            : <Play className="size-4 fill-black text-black ml-0.5" />
          }
        </button>

        <button
          onClick={playNextTrack}
          disabled={!currentTrack}
          className="text-[#b3b3b3] hover:text-white transition-all hover:scale-110 disabled:opacity-30"
        >
          <SkipForward className="size-5 fill-current" />
        </button>

        <button
          onClick={cycleRepeat}
          disabled={!currentTrack}
          className={cn('relative p-1 rounded transition-all hover:scale-110 disabled:opacity-30', repeatMode !== 'off' ? 'text-[#1db954]' : 'text-[#6b7280] hover:text-white')}
          title={repeatMode === 'off' ? 'Repetir (R)' : repeatMode === 'all' ? 'Repetir todo' : 'Repetir una'}
        >
          {repeatMode === 'one' ? <Repeat1 className="size-4" /> : <Repeat className="size-4" />}
          {repeatMode !== 'off' && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 size-1 rounded-full bg-[#1db954]" />}
        </button>
      </div>

      {/* Progress */}
      <ProgressBar />
    </div>
  );
}

/* ── Right Controls ─────────────────────────────────────────── */
function RightControls() {
  const { currentTrack, volume, setVolume, setActivePanel, playbackSpeed, setPlaybackSpeed } = usePlayback();
  const [isMuted, setIsMuted] = useState(false);
  const [prevVol, setPrevVol] = useState(70);
  const [showSpeed, setShowSpeed] = useState(false);
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  const toggleMute = () => {
    if (isMuted) { setVolume(prevVol); setIsMuted(false); }
    else { setPrevVol(volume); setVolume(0); setIsMuted(true); }
  };

  const VolumeIcon = (isMuted || volume === 0) ? VolumeX : volume < 50 ? Volume1 : Volume2;

  return (
    <div className="flex items-center justify-end gap-3 w-[28%]">
      {/* Queue */}
      <button
        onClick={() => setActivePanel('now-playing')}
        className="hidden md:flex p-1.5 text-[#6b7280] hover:text-white transition-colors rounded"
        title="Cola"
      >
        <ListMusic className="size-4" />
      </button>

      {/* Speed */}
      <div className="relative hidden lg:block">
        <button
          onClick={() => setShowSpeed(p => !p)}
          className={cn('px-2 py-0.5 rounded text-[11px] font-bold tabular-nums transition-colors', playbackSpeed !== 1 ? 'text-[#1db954]' : 'text-[#6b7280] hover:text-white')}
        >
          {playbackSpeed}x
        </button>
        {showSpeed && (
          <div className="absolute bottom-9 right-0 bg-[#282828] border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 min-w-[90px]">
            {speeds.map(s => (
              <button
                key={s}
                onClick={() => { setPlaybackSpeed(s); setShowSpeed(false); }}
                className={cn('w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-white/10 transition-colors', playbackSpeed === s ? 'text-[#1db954] font-bold' : 'text-white')}
              >
                {s === 1 ? '1x (normal)' : `${s}x`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 w-24 md:w-28">
        <button onClick={toggleMute} disabled={!currentTrack} className="text-[#6b7280] hover:text-white transition-colors disabled:opacity-30 flex-shrink-0">
          <VolumeIcon className="size-4" />
        </button>
        <Slider
          value={[isMuted ? 0 : volume]}
          min={0} max={100} step={1}
          onValueChange={([v]) => { setVolume(v); if (v > 0) setIsMuted(false); }}
          disabled={!currentTrack}
          className="flex-1 cursor-pointer"
        />
      </div>
    </div>
  );
}

/* ── Main Bar ───────────────────────────────────────────────── */
export function PlaybackControls() {
  const { isPlaying } = usePlayback();

  return (
    <div
      className="hidden md:flex fixed bottom-0 left-0 right-0 z-50 items-center justify-between px-4 h-[72px] border-t border-white/[0.06]"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: 'linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(10,10,10,0.95) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <TrackInfo />
      <CenterControls />
      <RightControls />
    </div>
  );
}

// Re-export for backward compat
export { TrackInfo, ProgressBar, RightControls };
