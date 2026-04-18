'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Heart, Pause, Play, SkipBack, SkipForward,
  Volume2, VolumeX, Volume1, Shuffle, Repeat, Repeat1,
  Loader2, Maximize2, ListMusic, Gauge,
} from 'lucide-react';
import { usePlayback } from '@/app/playback-context';
import { getValidImageUrl, cn } from '@/lib/utils';
import { toggleFavoriteAction } from './actions';
import Link from 'next/link';

function formatTime(t: number) {
  if (isNaN(t) || t < 0) return '0:00';
  return `${Math.floor(t / 60)}:${Math.floor(t % 60).toString().padStart(2, '0')}`;
}

export function TrackInfo({ onExpand }: { onExpand?: () => void }) {
  const { currentTrack, isPlaying, setActivePanel, updateTrackInPlaylist } = usePlayback();
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (currentTrack) setIsLiked(Boolean((currentTrack as any).favorite));
  }, [currentTrack]);

  const toggleFavorite = async () => {
    if (!currentTrack) return;
    const next = !isLiked;
    setIsLiked(next);
    updateTrackInPlaylist(currentTrack.id, { favorite: next });
    const result = await toggleFavoriteAction(currentTrack.id, next);
    if (!result.success) {
      setIsLiked(!next);
      updateTrackInPlaylist(currentTrack.id, { favorite: !next });
    }
  };

  return (
    <div className="flex items-center gap-3 w-[30%] min-w-0">
      {currentTrack ? (
        <>
          <div
            className={cn(
              'relative size-14 flex-shrink-0 rounded-md overflow-hidden shadow-lg cursor-pointer group transition-all duration-300',
              isPlaying && 'animate-glow-pulse'
            )}
            onClick={() => setActivePanel('now-playing')}
          >
            <img
              src={getValidImageUrl(currentTrack.imageUrl)}
              alt="Now playing"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Maximize2 className="size-4 text-white" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate text-white hover:underline cursor-pointer">
              {currentTrack.name}
            </div>
            <Link
              href={`/artist/${encodeURIComponent(currentTrack.artist)}`}
              className="text-xs text-[#b3b3b3] truncate hover:text-white cursor-pointer transition-colors hover:underline block"
              onClick={e => e.stopPropagation()}
            >
              {currentTrack.artist}
            </Link>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 hidden sm:flex hover:bg-transparent"
            onClick={toggleFavorite}
          >
            <Heart className={cn('w-4 h-4 transition-all', isLiked ? 'text-[#1db954] fill-[#1db954] scale-110' : 'text-[#b3b3b3] hover:text-white')} />
          </Button>
        </>
      ) : (
        <div className="flex items-center gap-3 opacity-30">
          <div className="size-14 rounded-md bg-white/10 flex-shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3 w-28 bg-white/10 rounded" />
            <div className="h-2.5 w-20 bg-white/10 rounded" />
          </div>
        </div>
      )}
    </div>
  );
}

export function PlaybackButtons() {
  const {
    isPlaying, togglePlayPause, playNextTrack, playPreviousTrack,
    currentTrack, isLoadingYouTube, isShuffle, toggleShuffle,
    repeatMode, cycleRepeat, playbackSpeed, setPlaybackSpeed,
  } = usePlayback();

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const [showSpeed, setShowSpeed] = useState(false);

  return (
    <div className="flex flex-col items-center gap-1 flex-1 max-w-[45%]">
      <div className="flex items-center gap-3">
        {/* Shuffle */}
        <button
          onClick={toggleShuffle}
          disabled={!currentTrack}
          className={cn(
            'relative p-1.5 rounded-full transition-all hover:scale-110 disabled:opacity-30',
            isShuffle ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'
          )}
          title="Aleatorio (S)"
        >
          <Shuffle className="size-4" />
          {isShuffle && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#1db954]" />}
        </button>

        {/* Previous */}
        <button
          onClick={playPreviousTrack}
          disabled={!currentTrack}
          className="text-[#b3b3b3] hover:text-white transition-all hover:scale-110 disabled:opacity-30 p-1"
        >
          <SkipBack className="size-5 fill-current" />
        </button>

        {/* Play/Pause */}
        <button
          onClick={togglePlayPause}
          disabled={!currentTrack || isLoadingYouTube}
          className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform active:scale-95 disabled:opacity-50 shadow-lg"
        >
          {isLoadingYouTube ? (
            <Loader2 className="size-4 animate-spin text-gray-500" />
          ) : isPlaying ? (
            <Pause className="size-4 fill-black" />
          ) : (
            <Play className="size-4 fill-black ml-0.5" />
          )}
        </button>

        {/* Next */}
        <button
          onClick={playNextTrack}
          disabled={!currentTrack}
          className="text-[#b3b3b3] hover:text-white transition-all hover:scale-110 disabled:opacity-30 p-1"
        >
          <SkipForward className="size-5 fill-current" />
        </button>

        {/* Repeat */}
        <button
          onClick={cycleRepeat}
          disabled={!currentTrack}
          className={cn(
            'relative p-1.5 rounded-full transition-all hover:scale-110 disabled:opacity-30',
            repeatMode !== 'off' ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'
          )}
          title={repeatMode === 'off' ? 'Repetir (R)' : repeatMode === 'all' ? 'Repetir todo' : 'Repetir una'}
        >
          {repeatMode === 'one' ? <Repeat1 className="size-4" /> : <Repeat className="size-4" />}
          {repeatMode !== 'off' && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#1db954]" />}
        </button>
      </div>

      {/* Progress bar */}
      <ProgressBar />
    </div>
  );
}

export function ProgressBar() {
  const { currentTime, duration, setCurrentTime } = usePlayback();
  const [isDragging, setIsDragging] = useState(false);
  const [dragVal, setDragVal] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);

  const calcTime = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!barRef.current || duration <= 0) return 0;
    const rect = barRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * duration;
  }, [duration]);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => setDragVal(calcTime(e));
    const onUp = (e: MouseEvent) => { setCurrentTime(calcTime(e)); setIsDragging(false); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [isDragging, calcTime, setCurrentTime]);

  const display = isDragging ? dragVal : currentTime;
  const pct = duration > 0 ? Math.min(100, (display / duration) * 100) : 0;

  return (
    <div className="flex items-center gap-2 w-full max-w-[600px]">
      <span className="text-[11px] tabular-nums text-[#a7a7a7] w-10 text-right shrink-0">{formatTime(display)}</span>
      <div
        ref={barRef}
        className="flex-1 h-1 bg-[#4d4d4d] rounded-full cursor-pointer relative group flex items-center hover:h-1.5 transition-all duration-150"
        onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); setDragVal(calcTime(e)); }}
      >
        <div className="absolute inset-y-0 left-0 bg-white group-hover:bg-[#1db954] rounded-full transition-colors" style={{ width: `${pct}%` }} />
        <div className="absolute w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity -translate-y-0" style={{ left: `calc(${pct}% - 6px)`, top: '-4px' }} />
      </div>
      <span className="text-[11px] tabular-nums text-[#a7a7a7] w-10 shrink-0">{formatTime(duration)}</span>
    </div>
  );
}

export function RightControls() {
  const { currentTrack, volume, setVolume, setActivePanel, playbackSpeed, setPlaybackSpeed } = usePlayback();
  const [isMuted, setIsMuted] = useState(false);
  const [prevVol, setPrevVol] = useState(70);
  const [showSpeed, setShowSpeed] = useState(false);
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  const toggleMute = () => {
    if (isMuted) { setVolume(prevVol); setIsMuted(false); }
    else { setPrevVol(volume); setVolume(0); setIsMuted(true); }
  };

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

  return (
    <div className="flex items-center justify-end gap-2 w-[30%]">
      {/* Queue button */}
      <button
        onClick={() => setActivePanel('now-playing')}
        className="hidden md:flex p-1.5 text-[#b3b3b3] hover:text-white transition-colors rounded"
        title="Cola de reproducción"
      >
        <ListMusic className="size-4" />
      </button>

      {/* Speed control */}
      <div className="relative hidden lg:block">
        <button
          onClick={() => setShowSpeed(p => !p)}
          className={cn(
            'px-2 py-0.5 rounded text-xs font-bold transition-colors',
            playbackSpeed !== 1 ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'
          )}
          title="Velocidad de reproducción"
        >
          {playbackSpeed}x
        </button>
        {showSpeed && (
          <div className="absolute bottom-8 right-0 bg-[#282828] border border-white/10 rounded-lg shadow-2xl p-2 z-50 min-w-[80px]">
            {speeds.map(s => (
              <button
                key={s}
                onClick={() => { setPlaybackSpeed(s); setShowSpeed(false); }}
                className={cn(
                  'w-full text-left px-3 py-1.5 text-xs rounded hover:bg-white/10 transition-colors',
                  playbackSpeed === s ? 'text-[#1db954] font-bold' : 'text-white'
                )}
              >
                {s}x {s === 1 && '(normal)'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Volume */}
      <div className="flex items-center gap-1.5 group/vol w-28 md:w-32">
        <button
          onClick={toggleMute}
          disabled={!currentTrack}
          className="text-[#b3b3b3] hover:text-white transition-colors disabled:opacity-30 flex-shrink-0"
        >
          <VolumeIcon className="size-4" />
        </button>
        <div className="flex-1">
          <Slider
            value={[isMuted ? 0 : volume]}
            min={0}
            max={100}
            step={1}
            onValueChange={([v]) => { setVolume(v); if (v > 0) setIsMuted(false); }}
            disabled={!currentTrack}
            className="cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}

export function PlaybackControls() {
  return (
    // Solo visible en desktop (md+). En móvil se usa MiniPlayer
    <div className="hidden md:block fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black via-black/95 to-black/90 border-t border-white/5 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] h-[72px]">
        <TrackInfo />
        <PlaybackButtons />
        <RightControls />
      </div>
    </div>
  );
}
