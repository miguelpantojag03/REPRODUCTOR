'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
  useCallback,
} from 'react';
import { Song } from '@/lib/db/types';
import { DoublyLinkedList } from '@/lib/dll';
import { getYouTubeIdAction } from './actions';

type Panel = 'sidebar' | 'tracklist' | 'now-playing';

type PlaybackContextType = {
  isPlaying: boolean;
  currentTrack: Song | null;
  currentTime: number;
  duration: number;
  volume: number;
  setVolume: (volume: number) => void;
  togglePlayPause: () => void;
  playTrack: (track: Song) => void;
  playNextTrack: () => void;
  playPreviousTrack: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setPlaylist: (songs: Song[]) => void;
  addTrack: (track: Song, position: 'start' | 'end' | number) => void;
  addToQueue: (track: Song) => void;
  removeTrack: (trackId: string) => void;
  reorderTrack: (trackId: string, targetIndex: number) => void;
  playlist: Song[];
  audioRef: React.RefObject<HTMLAudioElement | null>;
  activePanel: Panel;
  setActivePanel: (panel: Panel) => void;
  registerPanelRef: (
    panel: Panel,
    ref: React.RefObject<HTMLElement | null>
  ) => void;
  handleKeyNavigation: (e: React.KeyboardEvent, panel: Panel) => void;
  isLoadingYouTube: boolean;
};

const PlaybackContext = createContext<PlaybackContextType | undefined>(
  undefined
);

function useKeyboardNavigation() {
  const [activePanel, setActivePanel] = useState<Panel>('sidebar');
  const panelRefs = useRef<
    Record<Panel, React.RefObject<HTMLElement | null> | null>
  >({
    sidebar: null,
    tracklist: null,
    'now-playing': null,
  });

  const registerPanelRef = useCallback(
    (panel: Panel, ref: React.RefObject<HTMLElement | null>) => {
      panelRefs.current[panel] = ref;
    },
    []
  );

  const handleKeyNavigation = useCallback(
    (e: React.KeyboardEvent, panel: Panel) => {
      const currentRef = panelRefs.current[panel];
      if (!currentRef?.current) return;

      const items = Array.from(
        currentRef.current.querySelectorAll('[tabindex="0"]')
      );
      const currentIndex = items.indexOf(document.activeElement as HTMLElement);

      switch (e.key) {
        case 'ArrowDown':
        case 'j':
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % items.length;
          (items[nextIndex] as HTMLElement).focus();
          break;
        case 'ArrowUp':
        case 'k':
          e.preventDefault();
          const prevIndex = (currentIndex - 1 + items.length) % items.length;
          (items[prevIndex] as HTMLElement).focus();
          break;
        case 'h':
          if (panel === 'tracklist') {
            e.preventDefault();
            setActivePanel('sidebar');
            const sidebarFirstItem =
              panelRefs.current.sidebar?.current?.querySelector(
                '[tabindex="0"]'
              ) as HTMLElement | null;
            sidebarFirstItem?.focus();
          }
          break;
        case 'l':
          if (panel === 'sidebar') {
            e.preventDefault();
            setActivePanel('tracklist');
            const tracklistFirstItem =
              panelRefs.current.tracklist?.current?.querySelector(
                '[tabindex="0"]'
              ) as HTMLElement | null;
            tracklistFirstItem?.focus();
          }
          break;
      }
    },
    []
  );

  return { activePanel, setActivePanel, registerPanelRef, handleKeyNavigation };
}

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Song | null>(null);
  const [currentTime, setCurrentTimeState] = useState(0);
  const [duration, setDurationState] = useState(0);
  const [volume, setVolumeState] = useState(70);
  const [playlist, setPlaylistState] = useState<Song[]>([]);
  const [isLoadingYouTube, setIsLoadingYouTube] = useState(false);
  const playlistDLL = useRef(new DoublyLinkedList<Song>());
  const audioRef = useRef<HTMLAudioElement>(null);
  const youtubePlayerRef = useRef<any>(null);
  const ytReadyRef = useRef(false);
  // Use a ref to track the current track for YouTube state change callback
  const currentTrackRef = useRef<Song | null>(null);

  // Keep currentTrackRef in sync
  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  // Load YouTube IFrame API — only once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).YT && (window as any).YT.Player) {
      initYTPlayer();
      return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    (window as any).onYouTubeIframeAPIReady = initYTPlayer;

    function initYTPlayer() {
      if (ytReadyRef.current) return;
      ytReadyRef.current = true;
      youtubePlayerRef.current = new (window as any).YT.Player('youtube-player', {
        height: '0',
        width: '0',
        videoId: '',
        playerVars: {
          autoplay: 0,
          controls: 0,
          showinfo: 0,
          modestbranding: 1,
        },
        events: {
          onStateChange: (event: any) => {
            const YT = (window as any).YT;
            const state = event.data;
            if (state === YT.PlayerState.ENDED) {
              // Auto-advance handled by playNextTrack ref
              playNextTrackRef.current?.();
            }
            // Don't auto-set isPlaying from YT state changes—
            // we control it manually to avoid toggle conflicts
          },
          onReady: () => {
            // Player is initialized
          }
        }
      });
    }
  }, []);

  // Update time for YouTube tracks
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const isYT = currentTrack?.id.startsWith('itunes-');
    if (isPlaying && isYT && youtubePlayerRef.current?.getCurrentTime) {
      interval = setInterval(() => {
        try {
          const time = youtubePlayerRef.current.getCurrentTime();
          if (typeof time === 'number') setCurrentTimeState(time);
          const dur = youtubePlayerRef.current.getDuration();
          if (typeof dur === 'number' && dur > 0) setDurationState(dur);
        } catch {
          // Player might not be ready yet
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack]);

  const setPlaylist = useCallback((songs: Song[]) => {
    playlistDLL.current = DoublyLinkedList.fromArray(songs);
    setPlaylistState(songs);
  }, []);

  const addTrack = useCallback(
    (track: Song, position: 'start' | 'end' | number) => {
      if (position === 'start') {
        playlistDLL.current.addFirst(track);
      } else if (position === 'end') {
        playlistDLL.current.addLast(track);
      } else {
        playlistDLL.current.addAt(position, track);
      }
      setPlaylistState(playlistDLL.current.toArray());
    },
    []
  );

  const addToQueue = useCallback((track: Song) => {
    playlistDLL.current.addLast(track);
    setPlaylistState(playlistDLL.current.toArray());
  }, []);

  const removeTrack = useCallback((trackId: string) => {
    playlistDLL.current.remove((s) => s.id === trackId);
    setPlaylistState(playlistDLL.current.toArray());
  }, []);

  const reorderTrack = useCallback((trackId: string, targetIndex: number) => {
    playlistDLL.current.move((s) => s.id === trackId, targetIndex);
    setPlaylistState(playlistDLL.current.toArray());
  }, []);

  const { activePanel, setActivePanel, registerPanelRef, handleKeyNavigation } =
    useKeyboardNavigation();

  const togglePlayPause = useCallback(() => {
    const isYT = currentTrack?.id.startsWith('itunes-');
    if (isYT && youtubePlayerRef.current) {
      if (isPlaying) {
        youtubePlayerRef.current.pauseVideo();
      } else {
        youtubePlayerRef.current.playVideo();
      }
    } else if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
    setIsPlaying(prev => !prev);
  }, [isPlaying, currentTrack]);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
    if (audioRef.current) audioRef.current.volume = newVolume / 100;
    try {
      if (youtubePlayerRef.current?.setVolume) youtubePlayerRef.current.setVolume(newVolume);
    } catch { /* player not ready */ }
  }, []);

  // Seek function — used by the progress bar
  const seekTo = useCallback((time: number) => {
    setCurrentTimeState(time);
    const isYT = currentTrack?.id.startsWith('itunes-');
    if (isYT && youtubePlayerRef.current?.seekTo) {
      youtubePlayerRef.current.seekTo(time, true);
    } else if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, [currentTrack]);

  const playTrack = useCallback(
    async (track: Song) => {
      setCurrentTrack(track);
      setCurrentTimeState(0);
      setDurationState(0);
      
      // Stop all sources first
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
      }
      try {
        if (youtubePlayerRef.current?.stopVideo) {
          youtubePlayerRef.current.stopVideo();
        }
      } catch { /* ignore */ }

      if (track.id.startsWith('itunes-')) {
        // Online track — use YouTube
        setIsLoadingYouTube(true);
        try {
          const result = await getYouTubeIdAction(track.name, track.artist);
          setIsLoadingYouTube(false);
          
          if (result.success && result.videoId && youtubePlayerRef.current) {
            youtubePlayerRef.current.loadVideoById(result.videoId);
            youtubePlayerRef.current.setVolume(volume);
            setIsPlaying(true);
          } else if (audioRef.current && track.audioUrl) {
            // Fallback to preview URL
            audioRef.current.src = track.audioUrl;
            audioRef.current.volume = volume / 100;
            await audioRef.current.play();
            setIsPlaying(true);
          }
        } catch (err) {
          console.error('Error loading YouTube:', err);
          setIsLoadingYouTube(false);
          // Fallback
          if (audioRef.current && track.audioUrl) {
            audioRef.current.src = track.audioUrl;
            audioRef.current.volume = volume / 100;
            audioRef.current.play();
            setIsPlaying(true);
          }
        }
      } else {
        // Local/DB track — use HTML audio
        if (audioRef.current) {
          let src = track.audioUrl || '';
          if (track.isLocal && src) {
            const filename = src.split('/').pop() || '';
            src = `/api/audio/${encodeURIComponent(filename)}`;
          }
          audioRef.current.src = src;
          audioRef.current.volume = volume / 100;
          try {
            await audioRef.current.play();
          } catch { /* autoplay blocked */ }
          setIsPlaying(true);
        }
      }
      setActivePanel('tracklist');
    },
    [setActivePanel, volume]
  );

  const playNextTrack = useCallback(() => {
    const track = currentTrackRef.current;
    if (track) {
      const node = playlistDLL.current.find((t) => t.id === track.id);
      if (node && node.next) {
        playTrack(node.next.value);
      } else if (playlistDLL.current.head) {
        playTrack(playlistDLL.current.head.value);
      }
    }
  }, [playTrack]);

  // Keep a ref so YouTube callback can call it without stale closure
  const playNextTrackRef = useRef(playNextTrack);
  useEffect(() => {
    playNextTrackRef.current = playNextTrack;
  }, [playNextTrack]);

  const playPreviousTrack = useCallback(() => {
    if (currentTrack) {
      const node = playlistDLL.current.find((t) => t.id === currentTrack.id);
      if (node && node.prev) {
        playTrack(node.prev.value);
      } else if (playlistDLL.current.tail) {
        playTrack(playlistDLL.current.tail.value);
      }
    }
  }, [currentTrack, playTrack]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        togglePlayPause();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [togglePlayPause]);

  // Handle audio element events for local playback
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current && !currentTrack?.id.startsWith('itunes-')) {
      setCurrentTimeState(audioRef.current.currentTime);
    }
  }, [currentTrack]);

  const handleDurationChange = useCallback(() => {
    if (audioRef.current && !currentTrack?.id.startsWith('itunes-')) {
      setDurationState(audioRef.current.duration);
    }
  }, [currentTrack]);

  const handleEnded = useCallback(() => {
    playNextTrackRef.current?.();
  }, []);

  return (
    <PlaybackContext.Provider
      value={{
        isPlaying,
        currentTrack,
        currentTime,
        duration,
        volume,
        setVolume,
        togglePlayPause,
        playTrack,
        playNextTrack,
        playPreviousTrack,
        setCurrentTime: seekTo,
        setDuration: setDurationState,
        setPlaylist,
        addTrack,
        addToQueue,
        removeTrack,
        reorderTrack,
        playlist,
        audioRef,
        activePanel,
        setActivePanel,
        registerPanelRef,
        handleKeyNavigation,
        isLoadingYouTube,
      }}
    >
      {children}
      <div id="youtube-player" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}></div>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onEnded={handleEnded}
        preload="auto"
      />
    </PlaybackContext.Provider>
  );
}

export function usePlayback() {
  const context = useContext(PlaybackContext);
  if (context === undefined) {
    throw new Error('usePlayback must be used within a PlaybackProvider');
  }
  return context;
}
