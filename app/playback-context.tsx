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
import { getValidAudioUrl } from '@/lib/utils';
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
  const [currentTime, setCurrentTimeInternal] = useState(0);
  const [duration, setDurationInternal] = useState(0);
  const [volume, setVolumeInternal] = useState(70);
  const [playlist, setPlaylistInternal] = useState<Song[]>([]);
  const [isLoadingYouTube, setIsLoadingYouTube] = useState(false);
  const playlistDLL = useRef(new DoublyLinkedList<Song>());
  const audioRef = useRef<HTMLAudioElement>(null);
  const youtubePlayerRef = useRef<any>(null);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT) return;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    (window as any).onYouTubeIframeAPIReady = () => {
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
            const state = event.data;
            if (state === (window as any).YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else if (state === (window as any).YT.PlayerState.PAUSED || state === (window as any).YT.PlayerState.BUFFERING) {
               // Stay in play state if buffering to avoid UI flicker
               if (state === (window as any).YT.PlayerState.PAUSED) setIsPlaying(false);
            } else if (state === (window as any).YT.PlayerState.ENDED) {
              playNextTrack();
            }
          },
          onReady: (event: any) => {
            event.target.setVolume(volume);
          }
        }
      });
    };
  }, [volume]);

  // Update time for YouTube
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentTrack?.id.startsWith('itunes-') && youtubePlayerRef.current?.getCurrentTime) {
      interval = setInterval(() => {
        const time = youtubePlayerRef.current.getCurrentTime();
        if (typeof time === 'number') setCurrentTimeInternal(time);
        const dur = youtubePlayerRef.current.getDuration();
        if (typeof dur === 'number' && dur > 0) setDurationInternal(dur);
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack]);

  const setPlaylist = useCallback((songs: Song[]) => {
    playlistDLL.current = DoublyLinkedList.fromArray(songs);
    setPlaylistInternal(songs);
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
      setPlaylistInternal(playlistDLL.current.toArray());
    },
    []
  );

  const removeTrack = useCallback((trackId: string) => {
    playlistDLL.current.remove((s) => s.id === trackId);
    setPlaylistInternal(playlistDLL.current.toArray());
  }, []);

  const reorderTrack = useCallback((trackId: string, targetIndex: number) => {
    playlistDLL.current.move((s) => s.id === trackId, targetIndex);
    setPlaylistInternal(playlistDLL.current.toArray());
  }, []);

  const { activePanel, setActivePanel, registerPanelRef, handleKeyNavigation } =
    useKeyboardNavigation();

  const togglePlayPause = useCallback(() => {
    const isYouTube = currentTrack?.id.startsWith('itunes-');
    if (isYouTube) {
      if (isPlaying) {
        youtubePlayerRef.current?.pauseVideo();
      } else {
        youtubePlayerRef.current?.playVideo();
      }
    } else if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, currentTrack]);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeInternal(newVolume);
    if (audioRef.current) audioRef.current.volume = newVolume / 100;
    if (youtubePlayerRef.current?.setVolume) youtubePlayerRef.current.setVolume(newVolume);
  }, []);

  const setCurrentTime = useCallback((time: number) => {
    setCurrentTimeInternal(time);
    const isYouTube = currentTrack?.id.startsWith('itunes-');
    if (isYouTube && youtubePlayerRef.current?.seekTo) {
      youtubePlayerRef.current.seekTo(time, true);
    } else if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, [currentTrack]);

  const playTrack = useCallback(
    async (track: Song) => {
      setCurrentTrack(track);
      setCurrentTimeInternal(0);
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (youtubePlayerRef.current?.pauseVideo) {
        youtubePlayerRef.current.pauseVideo();
      }

      if (track.id.startsWith('itunes-')) {
        setIsLoadingYouTube(true);
        const result = await getYouTubeIdAction(track.name, track.artist);
        setIsLoadingYouTube(false);
        
        if (result.success && result.videoId) {
          youtubePlayerRef.current?.loadVideoById(result.videoId);
          youtubePlayerRef.current?.playVideo();
          setIsPlaying(true);
        } else if (audioRef.current) {
          audioRef.current.src = track.audioUrl || '';
          audioRef.current.play();
          setIsPlaying(true);
        }
      } else {
        setIsPlaying(true);
        if (audioRef.current) {
          const filename = (track.audioUrl || '').split('/').pop();
          audioRef.current.src = track.isLocal ? `/api/audio/${encodeURIComponent(filename || '')}` : track.audioUrl;
          audioRef.current.play();
        }
      }
      setActivePanel('tracklist');
    },
    [setActivePanel]
  );

  const playNextTrack = useCallback(() => {
    if (currentTrack) {
      const node = playlistDLL.current.find((t) => t.id === currentTrack.id);
      if (node && node.next) {
        playTrack(node.next.value);
      } else if (playlistDLL.current.head) {
        playTrack(playlistDLL.current.head.value);
      }
    }
  }, [currentTrack, playTrack]);

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
        setCurrentTime,
        setDuration: setDurationInternal,
        setPlaylist,
        addTrack,
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
      <div id="youtube-player" style={{ display: 'none' }}></div>
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => {
           // ONLY update internal state from the audio element
           setCurrentTimeInternal(e.currentTarget.currentTime);
        }}
        onDurationChange={(e) => setDurationInternal(e.currentTarget.duration)}
        onEnded={playNextTrack}
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
