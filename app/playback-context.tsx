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

type Panel = 'sidebar' | 'tracklist' | 'now-playing';

type PlaybackContextType = {
  isPlaying: boolean;
  currentTrack: Song | null;
  currentTime: number;
  duration: number;
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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playlist, setPlaylistInternal] = useState<Song[]>([]);
  const playlistDLL = useRef(new DoublyLinkedList<Song>());
  const audioRef = useRef<HTMLAudioElement>(null);

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
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const playTrack = useCallback(
    (track: Song) => {
      setCurrentTrack(track);
      setIsPlaying(true);
      setCurrentTime(0);
      if (audioRef.current) {
        audioRef.current.src = getAudioSrc(getValidAudioUrl(track.audioUrl as string));
        audioRef.current.play();
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
        // Loop back to start
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
        // Loop back to end
        playTrack(playlistDLL.current.tail.value);
      }
    }
  }, [currentTrack, playTrack]);

  const getAudioSrc = (url: string) => {
    if (url.startsWith('file://')) {
      const filename = url.split('/').pop();
      return `/api/audio/${encodeURIComponent(filename || '')}`;
    }
    return url;
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector(
          'input[type="search"]'
        ) as HTMLInputElement | null;
        searchInput?.focus();
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
        togglePlayPause,
        playTrack,
        playNextTrack,
        playPreviousTrack,
        setCurrentTime,
        setDuration,
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
      }}
    >
      {children}
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
