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
import { getYouTubeIdAction, incrementPlayCountAction } from './actions';

type Panel = 'sidebar' | 'tracklist' | 'now-playing';
export type RepeatMode = 'off' | 'all' | 'one';

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
  registerPanelRef: (panel: Panel, ref: React.RefObject<HTMLElement | null>) => void;
  handleKeyNavigation: (e: React.KeyboardEvent, panel: Panel) => void;
  isLoadingYouTube: boolean;
  // New features
  isShuffle: boolean;
  toggleShuffle: () => void;
  repeatMode: RepeatMode;
  cycleRepeat: () => void;
  shuffledPlaylist: Song[];
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  updateTrackInPlaylist: (trackId: string, updates: Partial<Song>) => void;
};

const PlaybackContext = createContext<PlaybackContextType | undefined>(undefined);

function useKeyboardNavigation() {
  const [activePanel, setActivePanel] = useState<Panel>('sidebar');
  const panelRefs = useRef<Record<Panel, React.RefObject<HTMLElement | null> | null>>({
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

      const items = Array.from(currentRef.current.querySelectorAll('[tabindex="0"]'));
      const currentIndex = items.indexOf(document.activeElement as HTMLElement);

      switch (e.key) {
        case 'ArrowDown':
        case 'j':
          e.preventDefault();
          (items[(currentIndex + 1) % items.length] as HTMLElement)?.focus();
          break;
        case 'ArrowUp':
        case 'k':
          e.preventDefault();
          (items[(currentIndex - 1 + items.length) % items.length] as HTMLElement)?.focus();
          break;
        case 'h':
          if (panel === 'tracklist') {
            e.preventDefault();
            setActivePanel('sidebar');
            (panelRefs.current.sidebar?.current?.querySelector('[tabindex="0"]') as HTMLElement | null)?.focus();
          }
          break;
        case 'l':
          if (panel === 'sidebar') {
            e.preventDefault();
            setActivePanel('tracklist');
            (panelRefs.current.tracklist?.current?.querySelector('[tabindex="0"]') as HTMLElement | null)?.focus();
          }
          break;
      }
    },
    []
  );

  return { activePanel, setActivePanel, registerPanelRef, handleKeyNavigation };
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Song | null>(null);
  const [currentTime, setCurrentTimeState] = useState(0);
  const [duration, setDurationState] = useState(0);
  const [playlist, setPlaylistState] = useState<Song[]>([]);
  const [isLoadingYouTube, setIsLoadingYouTube] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [shuffledPlaylist, setShuffledPlaylist] = useState<Song[]>([]);
  const [playbackSpeed, setPlaybackSpeedState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('player-speed');
      return saved ? Number(saved) : 1;
    }
    return 1;
  });

  // Crossfade duration in seconds (0 = disabled)
  const [crossfadeDuration] = useState(() => {
    if (typeof window !== 'undefined') {
      return Number(localStorage.getItem('player-crossfade') ?? 0);
    }
    return 0;
  });

  // Persist volume in localStorage
  const [volume, setVolumeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('player-volume');
      return saved ? Number(saved) : 70;
    }
    return 70;
  });

  const playlistDLL = useRef(new DoublyLinkedList<Song>());
  const shuffledDLL = useRef(new DoublyLinkedList<Song>());
  const audioRef = useRef<HTMLAudioElement>(null);
  const youtubePlayerRef = useRef<any>(null);
  const ytReadyRef = useRef(false);
  const currentTrackRef = useRef<Song | null>(null);
  const isShuffleRef = useRef(isShuffle);
  const repeatModeRef = useRef(repeatMode);

  useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);
  useEffect(() => { isShuffleRef.current = isShuffle; }, [isShuffle]);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);

  // Persist volume
  useEffect(() => {
    localStorage.setItem('player-volume', String(volume));
  }, [volume]);

  // Persist shuffle/repeat
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedShuffle = localStorage.getItem('player-shuffle');
      const savedRepeat = localStorage.getItem('player-repeat') as RepeatMode | null;
      if (savedShuffle) setIsShuffle(savedShuffle === 'true');
      if (savedRepeat) setRepeatMode(savedRepeat);
    }
  }, []);

  useEffect(() => { localStorage.setItem('player-shuffle', String(isShuffle)); }, [isShuffle]);
  useEffect(() => { localStorage.setItem('player-repeat', repeatMode); }, [repeatMode]);

  // Load YouTube IFrame API
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).YT && (window as any).YT.Player) {
      initYTPlayer();
      return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.getElementsByTagName('script')[0]?.parentNode?.insertBefore(tag, document.getElementsByTagName('script')[0]);

    (window as any).onYouTubeIframeAPIReady = initYTPlayer;

    function initYTPlayer() {
      if (ytReadyRef.current) return;
      ytReadyRef.current = true;
      youtubePlayerRef.current = new (window as any).YT.Player('youtube-player', {
        height: '0',
        width: '0',
        videoId: '',
        playerVars: { autoplay: 0, controls: 0, showinfo: 0, modestbranding: 1 },
        events: {
          onStateChange: (event: any) => {
            const YT = (window as any).YT;
            if (event.data === YT.PlayerState.ENDED) {
              playNextTrackRef.current?.();
            }
          },
        },
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
        } catch { /* ignore */ }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack]);

  const setPlaylist = useCallback((songs: Song[]) => {
    playlistDLL.current = DoublyLinkedList.fromArray(songs);
    setPlaylistState(songs);
    const shuffled = shuffleArray(songs);
    shuffledDLL.current = DoublyLinkedList.fromArray(shuffled);
    setShuffledPlaylist(shuffled);
  }, []);

  const addTrack = useCallback((track: Song, position: 'start' | 'end' | number) => {
    if (position === 'start') {
      playlistDLL.current.addFirst(track);
      shuffledDLL.current.addFirst(track);
    } else if (position === 'end') {
      playlistDLL.current.addLast(track);
      shuffledDLL.current.addLast(track);
    } else {
      playlistDLL.current.addAt(position, track);
      shuffledDLL.current.addAt(position, track);
    }
    setPlaylistState(playlistDLL.current.toArray());
    setShuffledPlaylist(shuffledDLL.current.toArray());
  }, []);

  const addToQueue = useCallback((track: Song) => {
    // Check if track already exists in playlist to avoid duplicates in queue display
    const exists = playlistDLL.current.find((s) => s.id === track.id);
    if (!exists) {
      playlistDLL.current.addLast(track);
      shuffledDLL.current.addLast(track);
    } else {
      // Still add to end for queue purposes (user explicitly wants it next)
      playlistDLL.current.addLast(track);
      shuffledDLL.current.addLast(track);
    }
    setPlaylistState(playlistDLL.current.toArray());
    setShuffledPlaylist(shuffledDLL.current.toArray());
  }, []);

  const removeTrack = useCallback((trackId: string) => {
    playlistDLL.current.remove((s) => s.id === trackId);
    shuffledDLL.current.remove((s) => s.id === trackId);
    setPlaylistState(playlistDLL.current.toArray());
    setShuffledPlaylist(shuffledDLL.current.toArray());
  }, []);

  // Update a track's properties in the playlist (e.g. favorite status)
  const updateTrackInPlaylist = useCallback((trackId: string, updates: Partial<Song>) => {
    const updateDLL = (dll: DoublyLinkedList<Song>) => {
      const node = dll.find((s) => s.id === trackId);
      if (node) node.value = { ...node.value, ...updates };
    };
    updateDLL(playlistDLL.current);
    updateDLL(shuffledDLL.current);
    setPlaylistState(playlistDLL.current.toArray());
    setShuffledPlaylist(shuffledDLL.current.toArray());
    // Also update currentTrack if it's the same
    setCurrentTrack(prev => prev?.id === trackId ? { ...prev, ...updates } : prev);
  }, []);

  const reorderTrack = useCallback((trackId: string, targetIndex: number) => {
    playlistDLL.current.move((s) => s.id === trackId, targetIndex);
    setPlaylistState(playlistDLL.current.toArray());
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => {
      const next = !prev;
      if (next) {
        // Re-shuffle keeping current track first
        const current = currentTrackRef.current;
        const arr = playlistDLL.current.toArray();
        const others = arr.filter((s) => s.id !== current?.id);
        const shuffled = current ? [current, ...shuffleArray(others)] : shuffleArray(arr);
        shuffledDLL.current = DoublyLinkedList.fromArray(shuffled);
        setShuffledPlaylist(shuffled);
      }
      return next;
    });
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const { activePanel, setActivePanel, registerPanelRef, handleKeyNavigation } = useKeyboardNavigation();

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
    if (audioRef.current) audioRef.current.volume = newVolume / 100;
    try {
      if (youtubePlayerRef.current?.setVolume) youtubePlayerRef.current.setVolume(newVolume);
    } catch { /* ignore */ }
  }, []);

  const setPlaybackSpeed = useCallback((speed: number) => {
    setPlaybackSpeedState(speed);
    if (audioRef.current) audioRef.current.playbackRate = speed;
    localStorage.setItem('player-speed', String(speed));
  }, []);

  const seekTo = useCallback((time: number) => {
    setCurrentTimeState(time);
    const isYT = currentTrack?.id.startsWith('itunes-');
    if (isYT && youtubePlayerRef.current?.seekTo) {
      youtubePlayerRef.current.seekTo(time, true);
    } else if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, [currentTrack]);

  const playTrack = useCallback(async (track: Song) => {
    setCurrentTrack(track);
    setCurrentTimeState(0);
    setDurationState(0);

    // If track is not in the playlist, add it so next/prev navigation works
    const existsInDLL = playlistDLL.current.find((s) => s.id === track.id);
    if (!existsInDLL) {
      playlistDLL.current.addLast(track);
      shuffledDLL.current.addLast(track);
      setPlaylistState(playlistDLL.current.toArray());
      setShuffledPlaylist(shuffledDLL.current.toArray());
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
    }
    try {
      if (youtubePlayerRef.current?.stopVideo) youtubePlayerRef.current.stopVideo();
    } catch { /* ignore */ }

    // Track play count (fire and forget, only for DB songs)
    if (!track.id.startsWith('itunes-')) {
      incrementPlayCountAction(track.id).catch(() => {});
    }

    if (track.id.startsWith('itunes-')) {
      setIsLoadingYouTube(true);
      try {
        const result = await getYouTubeIdAction(track.name, track.artist);
        setIsLoadingYouTube(false);
        if (result.success && result.videoId && youtubePlayerRef.current) {
          youtubePlayerRef.current.loadVideoById(result.videoId);
          youtubePlayerRef.current.setVolume(volume);
          setIsPlaying(true);
        } else if (audioRef.current && track.audioUrl) {
          audioRef.current.src = track.audioUrl;
          audioRef.current.volume = volume / 100;
          await audioRef.current.play();
          setIsPlaying(true);
        }
      } catch {
        setIsLoadingYouTube(false);
        if (audioRef.current && track.audioUrl) {
          audioRef.current.src = track.audioUrl;
          audioRef.current.volume = volume / 100;
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
    } else {
      if (audioRef.current) {
        let src = track.audioUrl || '';
        if (track.isLocal && src) {
          const filename = src.split('/').pop() || '';
          src = `/api/audio/${encodeURIComponent(filename)}`;
        }
        audioRef.current.src = src;
        audioRef.current.volume = volume / 100;
        audioRef.current.playbackRate = playbackSpeed;
        try {
          await audioRef.current.play();
        } catch { /* autoplay blocked */ }
        setIsPlaying(true);
      }
    }
    setActivePanel('tracklist');
  }, [setActivePanel, volume, playbackSpeed]);

  const playNextTrack = useCallback(() => {
    const track = currentTrackRef.current;
    const repeat = repeatModeRef.current;
    const shuffle = isShuffleRef.current;

    // Repeat one: just seek to beginning and keep playing
    if (repeat === 'one' && track) {
      if (audioRef.current && !track.id.startsWith('itunes-')) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
        setCurrentTimeState(0);
      } else {
        playTrack(track);
      }
      return;
    }

    const dll = shuffle ? shuffledDLL.current : playlistDLL.current;
    if (track) {
      const node = dll.find((t) => t.id === track.id);
      if (node?.next) {
        playTrack(node.next.value);
      } else if (repeat === 'all' && dll.head) {
        playTrack(dll.head.value);
      } else {
        setIsPlaying(false);
      }
    }
  }, [playTrack]);

  const playNextTrackRef = useRef(playNextTrack);
  useEffect(() => { playNextTrackRef.current = playNextTrack; }, [playNextTrack]);

  const playPreviousTrack = useCallback(() => {
    const track = currentTrackRef.current;
    const shuffle = isShuffleRef.current;
    const dll = shuffle ? shuffledDLL.current : playlistDLL.current;

    // If more than 3 seconds in, restart current track
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTimeState(0);
      return;
    }

    if (track) {
      const node = dll.find((t) => t.id === track.id);
      if (node?.prev) {
        playTrack(node.prev.value);
      } else if (dll.tail) {
        playTrack(dll.tail.value);
      }
    }
  }, [playTrack]);

  const togglePlayPause = useCallback(() => {
    const isYT = currentTrack?.id.startsWith('itunes-');
    if (isYT && youtubePlayerRef.current) {
      if (isPlaying) youtubePlayerRef.current.pauseVideo();
      else youtubePlayerRef.current.playVideo();
    } else if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
    }
    setIsPlaying((prev) => !prev);
  }, [isPlaying, currentTrack]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowRight':
          if (e.altKey) { e.preventDefault(); playNextTrackRef.current?.(); }
          break;
        case 'ArrowLeft':
          if (e.altKey) { e.preventDefault(); playPreviousTrack(); }
          break;
        case 'ArrowUp':
          if (e.altKey) {
            e.preventDefault();
            setVolumeState((v) => {
              const next = Math.min(100, v + 5);
              if (audioRef.current) audioRef.current.volume = next / 100;
              try { youtubePlayerRef.current?.setVolume?.(next); } catch {}
              localStorage.setItem('player-volume', String(next));
              return next;
            });
          }
          break;
        case 'ArrowDown':
          if (e.altKey) {
            e.preventDefault();
            setVolumeState((v) => {
              const next = Math.max(0, v - 5);
              if (audioRef.current) audioRef.current.volume = next / 100;
              try { youtubePlayerRef.current?.setVolume?.(next); } catch {}
              localStorage.setItem('player-volume', String(next));
              return next;
            });
          }
          break;
        case 's':
        case 'S':
          toggleShuffle();
          break;
        case 'r':
        case 'R':
          cycleRepeat();
          break;
        case 'm':
        case 'M':
          setVolumeState((v) => {
            if (v > 0) {
              if (audioRef.current) audioRef.current.volume = 0;
              try { youtubePlayerRef.current?.setVolume?.(0); } catch {}
              localStorage.setItem('player-volume', '0');
              return 0;
            } else {
              const restored = 70;
              if (audioRef.current) audioRef.current.volume = restored / 100;
              try { youtubePlayerRef.current?.setVolume?.(restored); } catch {}
              localStorage.setItem('player-volume', String(restored));
              return restored;
            }
          });
          break;
        case 'f':
        case 'F':
          // Toggle favorite for current track
          if (currentTrackRef.current) {
            const track = currentTrackRef.current;
            const newFav = !(track as any).favorite;
            // Dispatch a custom event that TrackInfo can listen to
            window.dispatchEvent(new CustomEvent('toggle-favorite', { detail: { trackId: track.id, favorite: newFav } }));
          }
          break;
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [togglePlayPause, toggleShuffle, cycleRepeat, playPreviousTrack]);

  // MediaSession API — full implementation for lock screen controls
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;

    // Set metadata (shows on lock screen / notification)
    const artwork = currentTrack.imageUrl
      ? [
          { src: currentTrack.imageUrl, sizes: '96x96',   type: 'image/jpeg' },
          { src: currentTrack.imageUrl, sizes: '128x128', type: 'image/jpeg' },
          { src: currentTrack.imageUrl, sizes: '256x256', type: 'image/jpeg' },
          { src: currentTrack.imageUrl, sizes: '512x512', type: 'image/jpeg' },
        ]
      : [];

    navigator.mediaSession.metadata = new MediaMetadata({
      title:  currentTrack.name,
      artist: currentTrack.artist,
      album:  currentTrack.album || '',
      artwork,
    });

    // Playback state
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    // Action handlers
    navigator.mediaSession.setActionHandler('play', () => {
      audioRef.current?.play();
      setIsPlaying(true);
      navigator.mediaSession.playbackState = 'playing';
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      audioRef.current?.pause();
      setIsPlaying(false);
      navigator.mediaSession.playbackState = 'paused';
    });
    navigator.mediaSession.setActionHandler('stop', () => {
      audioRef.current?.pause();
      setIsPlaying(false);
      navigator.mediaSession.playbackState = 'none';
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => playNextTrackRef.current?.());
    navigator.mediaSession.setActionHandler('previoustrack', playPreviousTrack);

    // Seek support
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined && audioRef.current) {
        audioRef.current.currentTime = details.seekTime;
        setCurrentTimeState(details.seekTime);
      }
    });
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      if (audioRef.current) {
        const skip = details.seekOffset ?? 10;
        audioRef.current.currentTime = Math.min(audioRef.current.currentTime + skip, audioRef.current.duration);
      }
    });
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      if (audioRef.current) {
        const skip = details.seekOffset ?? 10;
        audioRef.current.currentTime = Math.max(audioRef.current.currentTime - skip, 0);
      }
    });
  }, [currentTrack, isPlaying, playPreviousTrack]);

  // Update MediaSession position state as audio plays
  useEffect(() => {
    if (!('mediaSession' in navigator) || !audioRef.current) return;
    if (!currentTrack || currentTrack.id.startsWith('itunes-')) return;
    if (duration <= 0) return;

    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: audioRef.current.playbackRate,
        position: Math.min(currentTime, duration),
      });
    } catch { /* ignore */ }
  }, [currentTime, duration, currentTrack]);

  // Service Worker registration for background audio
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  }, []);

  // Wake Lock — keep screen/audio active while playing
  const wakeLockRef = useRef<any>(null);
  useEffect(() => {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) return;

    const acquire = async () => {
      try {
        if (isPlaying && !wakeLockRef.current) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          wakeLockRef.current.addEventListener('release', () => { wakeLockRef.current = null; });
        } else if (!isPlaying && wakeLockRef.current) {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        }
      } catch { /* Wake Lock not available */ }
    };

    acquire();

    // Re-acquire when tab becomes visible again
    const onVisible = () => { if (isPlaying) acquire(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current && !currentTrack?.id.startsWith('itunes-')) {
      const t = audioRef.current.currentTime;
      const d = audioRef.current.duration;
      setCurrentTimeState(t);

      // Crossfade: fade out in the last N seconds
      if (crossfadeDuration > 0 && d > 0 && !isNaN(d)) {
        const remaining = d - t;
        if (remaining <= crossfadeDuration && remaining > 0) {
          const fadeVol = (remaining / crossfadeDuration) * (volume / 100);
          audioRef.current.volume = Math.max(0, Math.min(1, fadeVol));
        }
      }
    }
  }, [currentTrack, crossfadeDuration, volume]);

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
        isShuffle,
        toggleShuffle,
        repeatMode,
        cycleRepeat,
        shuffledPlaylist,
        playbackSpeed,
        setPlaybackSpeed,
        updateTrackInPlaylist,
      }}
    >
      {children}
      <div id="youtube-player" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} />
      {/* 
        playsInline: required for iOS to play audio without fullscreen
        x-webkit-airplay: enables AirPlay on iOS
        The audio element must be in the DOM for background playback to work
      */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onEnded={handleEnded}
        preload="auto"
        playsInline
        {...{ 'x-webkit-airplay': 'allow', 'webkit-playsinline': 'true' } as any}
      />
    </PlaybackContext.Provider>
  );
}

export function usePlayback() {
  const context = useContext(PlaybackContext);
  if (context === undefined) throw new Error('usePlayback must be used within a PlaybackProvider');
  return context;
}
