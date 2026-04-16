'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Heart,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Loader2,
} from 'lucide-react';
import { usePlayback } from '@/app/playback-context';
import { getValidImageUrl, cn } from '@/lib/utils';
import { toggleFavoriteAction } from './actions';

export function TrackInfo() {
  let { currentTrack } = usePlayback();
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (currentTrack) {
      setIsLiked(Boolean((currentTrack as any).favorite));
    }
  }, [currentTrack]);

  const toggleFavorite = async () => {
    if (!currentTrack) return;
    const nextState = !isLiked;
    setIsLiked(nextState); // Optimistic UI
    const result = await toggleFavoriteAction(currentTrack.id, nextState);
    if (!result.success) {
      setIsLiked(!nextState); // Rollback
    }
  };

  return (
    <div className="flex items-center space-x-3 w-1/3">
      {currentTrack && (
        <>
          <img
            src={getValidImageUrl(currentTrack.imageUrl)}
            alt="Now playing"
            className="w-10 h-10 object-cover rounded shadow-lg"
          />
          <div className="flex-shrink min-w-0">
            <div className="text-sm font-medium truncate max-w-[120px] sm:max-w-[200px] text-gray-200">
              {currentTrack.name}
            </div>
            <div className="text-xs text-gray-400 truncate max-w-[120px] sm:max-w-[200px]">
              {currentTrack.artist}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 hidden sm:flex hover:bg-transparent"
            onClick={toggleFavorite}
          >
            <Heart className={cn("w-4 h-4 transition-colors", isLiked ? "text-green-500 fill-green-500" : "text-gray-400 hover:text-white")} />
          </Button>
        </>
      )}
    </div>
  );
}

export function PlaybackButtons() {
  const {
    isPlaying,
    togglePlayPause,
    playNextTrack,
    playPreviousTrack,
    currentTrack,
    isLoadingYouTube,
  } = usePlayback();

  return (
    <div className="flex items-center space-x-6 mb-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-[#b3b3b3] hover:text-white"
        disabled={!currentTrack}
      >
        <Shuffle className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-[#b3b3b3] hover:text-white"
        onClick={playPreviousTrack}
        disabled={!currentTrack}
      >
        <SkipBack className="w-5 h-5 fill-current" />
      </Button>
      <Button
        size="icon"
        className="h-8 w-8 bg-white text-black hover:scale-105 transition-transform rounded-full flex items-center justify-center p-0"
        onClick={togglePlayPause}
        disabled={!currentTrack || isLoadingYouTube}
      >
        {isLoadingYouTube ? (
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        ) : isPlaying ? (
          <Pause className="w-5 h-5 fill-current" />
        ) : (
          <Play className="w-5 h-5 fill-current ml-0.5" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-[#b3b3b3] hover:text-white"
        onClick={playNextTrack}
        disabled={!currentTrack}
      >
        <SkipForward className="w-5 h-5 fill-current" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-[#b3b3b3] hover:text-white"
        disabled={!currentTrack}
      >
        <Repeat className="w-4 h-4" />
      </Button>
    </div>
  );
}

export function ProgressBar() {
  let { currentTime, duration, setCurrentTime } = usePlayback();
  let progressBarRef = useRef<HTMLDivElement>(null);
  let [isDragging, setIsDragging] = useState(false);
  let [dragTime, setDragTime] = useState(0);

  let formatTime = (time: number) => {
    if (isNaN(time) || time < 0) return '0:00';
    let minutes = Math.floor(time / 60);
    let seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  let calcTimeFromEvent = (e: React.MouseEvent | MouseEvent) => {
    if (!progressBarRef.current || duration <= 0) return 0;
    let rect = progressBarRef.current.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let percentage = Math.max(0, Math.min(1, x / rect.width));
    return percentage * duration;
  };

  let handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    let time = calcTimeFromEvent(e);
    setDragTime(time);
  };

  useEffect(() => {
    if (!isDragging) return;
    
    let handleMouseMove = (e: MouseEvent) => {
      let time = calcTimeFromEvent(e);
      setDragTime(time);
    };

    let handleMouseUp = (e: MouseEvent) => {
      let time = calcTimeFromEvent(e);
      setCurrentTime(time);
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, duration, setCurrentTime]);

  let displayTime = isDragging ? dragTime : currentTime;
  let currentPercent = duration > 0 ? Math.min(100, (displayTime / duration) * 100) : 0;

  return (
    <div className="flex items-center w-full mt-1 max-w-[600px]">
      <span className="text-[11px] tabular-nums text-[#a7a7a7] min-w-[40px] text-right">
        {formatTime(displayTime)}
      </span>
      <div
        ref={progressBarRef}
        className="flex-grow mx-3 h-1 bg-[#4d4d4d] rounded-full cursor-pointer relative group flex items-center"
        onMouseDown={handleMouseDown}
      >
        <div
          className="absolute top-0 left-0 h-full bg-white group-hover:bg-[#1db954] rounded-full transition-colors"
          style={{ width: `${currentPercent}%` }}
        ></div>
        <div 
          className="absolute h-3 w-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow shadow-black transition-opacity"
          style={{ left: `calc(${currentPercent}% - 6px)`, top: '-4px' }}
        ></div>
      </div>
      <span className="text-[11px] tabular-nums text-[#a7a7a7] min-w-[40px] text-left">
        {formatTime(duration)}
      </span>
    </div>
  );
}

export function Volume() {
  let { currentTrack, volume, setVolume } = usePlayback();
  let [isMuted, setIsMuted] = useState(false);
  let [prevVolume, setPrevVolume] = useState(70);
  let volumeBarRef = useRef<HTMLDivElement>(null);

  let handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (volumeBarRef.current) {
      let rect = volumeBarRef.current.getBoundingClientRect();
      let x = e.clientX - rect.left;
      let percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setVolume(percentage);
      if (percentage > 0) setIsMuted(false);
    }
  };

  let toggleMute = () => {
    if (isMuted) {
      setVolume(prevVolume);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  return (
    <div className="flex items-center group/vol w-32 md:w-40 lg:w-48">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-[#b3b3b3] hover:text-white flex-shrink-0"
        onClick={toggleMute}
        disabled={!currentTrack}
      >
        {isMuted || volume === 0 ? (
          <VolumeX className="w-4 h-4" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
      </Button>
      
      <div
        ref={volumeBarRef}
        className="flex-grow h-1 bg-[#4d4d4d] rounded-full cursor-pointer relative flex items-center group"
        onClick={handleVolumeChange}
      >
        <div
          className="absolute top-0 left-0 h-full bg-white group-hover:bg-[#1db954] rounded-full transition-colors"
          style={{ width: `${volume}%` }}
        ></div>
        <div 
          className="absolute h-3 w-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow shadow-black transition-opacity"
          style={{ left: `calc(${volume}% - 6px)` }}
        ></div>
      </div>
    </div>
  );
}

export function PlaybackControls() {
  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-[#000000] border-t border-white/5 shadow-2xl z-50">
      <TrackInfo />
      <div className="flex flex-col items-center flex-grow max-w-[40%] md:max-w-[45%] lg:max-w-xl">
        <PlaybackButtons />
        <ProgressBar />
      </div>
      <div className="flex items-center justify-end space-x-2 w-1/3">
        <Volume />
      </div>
    </div>
  );
}
