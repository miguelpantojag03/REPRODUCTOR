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

export function TrackInfo() {
  let { currentTrack } = usePlayback();
  let [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (currentTrack) {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      setIsLiked(favorites.includes(currentTrack.id));
    }
  }, [currentTrack]);

  const toggleFavorite = () => {
    if (!currentTrack) return;
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    let newFavorites;
    if (favorites.includes(currentTrack.id)) {
      newFavorites = favorites.filter((id: string) => id !== currentTrack.id);
      setIsLiked(false);
    } else {
      newFavorites = [...favorites, currentTrack.id];
      setIsLiked(true);
    }
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  return (
    <div className="flex items-center space-x-3 w-1/3">
      {currentTrack && (
        <>
          <img
            src={getValidImageUrl(currentTrack.imageUrl)}
            alt="Now playing"
            className="w-10 h-10 object-cover"
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
          <Loader2 className="w-5 h-5 animate-spin" />
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
  let { currentTime, duration, audioRef, setCurrentTime } = usePlayback();
  let progressBarRef = useRef<HTMLDivElement>(null);

  let formatTime = (time: number) => {
    let minutes = Math.floor(time / 60);
    let seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  let handleProgressChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressBarRef.current && audioRef.current) {
      let rect = progressBarRef.current.getBoundingClientRect();
      let x = e.clientX - rect.left;
      let percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      let newTime = (percentage / 100) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  return (
    <div className="flex items-center w-full mt-1 max-w-[600px]">
      <span className="text-[11px] tabular-nums text-[#a7a7a7] min-w-[40px] text-right">
        {formatTime(currentTime)}
      </span>
      <div
        ref={progressBarRef}
        className="flex-grow mx-2 h-1 bg-[#4d4d4d] rounded-full cursor-pointer relative group flex items-center"
        onClick={handleProgressChange}
      >
        <div
          className="absolute top-0 left-0 h-full bg-white group-hover:bg-[#1db954] rounded-full transition-colors"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        ></div>
        <div 
          className="absolute h-3 w-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow disabled shadow-black transition-opacity"
          style={{ left: `calc(${(currentTime / duration) * 100}% - 6px)` }}
        ></div>
      </div>
      <span className="text-[11px] tabular-nums text-[#a7a7a7] min-w-[40px] text-left">
        {formatTime(duration)}
      </span>
    </div>
  );
}

export function Volume() {
  let { audioRef, currentTrack } = usePlayback();
  let [volume, setVolume] = useState(100);
  let [isMuted, setIsMuted] = useState(false);
  let volumeBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted, audioRef]);

  let handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (volumeBarRef.current) {
      let rect = volumeBarRef.current.getBoundingClientRect();
      let x = e.clientX - rect.left;
      let percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setVolume(percentage);
      if (audioRef.current) {
        audioRef.current.volume = percentage / 100;
      }
      setIsMuted(percentage === 0);
    }
  };

  let toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
    } else {
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
          style={{ width: `${isMuted ? 0 : volume}%` }}
        ></div>
        <div 
          className="absolute h-3 w-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow shadow-black transition-opacity"
          style={{ left: `calc(${isMuted ? 0 : volume}% - 6px)` }}
        ></div>
      </div>
    </div>
  );
}

export function PlaybackControls() {
  let {
    currentTrack,
    audioRef,
    setCurrentTime,
    setDuration,
    playPreviousTrack,
    playNextTrack,
    togglePlayPause,
  } = usePlayback();

  useEffect(() => {
    let audio = audioRef.current;
    if (audio) {
      let updateTime = () => setCurrentTime(audio.currentTime);
      let updateDuration = () => setDuration(audio.duration);

      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', updateDuration);

      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('loadedmetadata', updateDuration);
      };
    }
  }, [audioRef, setCurrentTime, setDuration]);

  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.name,
        artist: currentTrack.artist,
        album: currentTrack.album || undefined,
        artwork: [
          { src: getValidImageUrl(currentTrack.imageUrl), sizes: '512x512', type: 'image/jpeg' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => {
        audioRef.current?.play();
        togglePlayPause();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        audioRef.current?.pause();
        togglePlayPause();
      });

      navigator.mediaSession.setActionHandler(
        'previoustrack',
        playPreviousTrack
      );
      navigator.mediaSession.setActionHandler('nexttrack', playNextTrack);

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (audioRef.current && details.seekTime !== undefined) {
          audioRef.current.currentTime = details.seekTime;
          setCurrentTime(details.seekTime);
        }
      });

      const updatePositionState = () => {
        if (audioRef.current && !isNaN(audioRef.current.duration)) {
          try {
            navigator.mediaSession.setPositionState({
              duration: audioRef.current.duration,
              playbackRate: audioRef.current.playbackRate,
              position: audioRef.current.currentTime,
            });
          } catch (error) {
            console.error('Error updating position state:', error);
          }
        }
      };

      const handleLoadedMetadata = () => {
        updatePositionState();
      };

      audioRef.current?.addEventListener('timeupdate', updatePositionState);
      audioRef.current?.addEventListener(
        'loadedmetadata',
        handleLoadedMetadata
      );

      return () => {
        audioRef.current?.removeEventListener(
          'timeupdate',
          updatePositionState
        );
        audioRef.current?.removeEventListener(
          'loadedmetadata',
          handleLoadedMetadata
        );
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('seekto', null);
      };
    }
  }, [
    currentTrack,
    playPreviousTrack,
    playNextTrack,
    togglePlayPause,
    audioRef,
    setCurrentTime,
  ]);

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-[#000000] border-t border-transparent z-50">
      <audio ref={audioRef} />
      <TrackInfo />
      <div className="flex flex-col items-center w-1/3">
        <PlaybackButtons />
        <ProgressBar />
      </div>
      <div className="flex items-center justify-end space-x-2 w-1/3">
        <Volume />
      </div>
    </div>
  );
}
