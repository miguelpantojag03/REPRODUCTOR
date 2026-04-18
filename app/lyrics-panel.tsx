'use client';

import { useEffect, useState, useRef } from 'react';
import { usePlayback } from './playback-context';
import { cn } from '@/lib/utils';
import { Mic2, Loader2, Music2, RefreshCw } from 'lucide-react';

// Cache lyrics in memory to avoid re-fetching
const lyricsCache = new Map<string, string[] | null>();

async function fetchLyrics(artist: string, title: string): Promise<string[] | null> {
  const key = `${artist}::${title}`.toLowerCase();
  if (lyricsCache.has(key)) return lyricsCache.get(key)!;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

  try {
    const res = await fetch(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!res.ok) { lyricsCache.set(key, null); return null; }
    const data = await res.json();
    if (!data.lyrics) { lyricsCache.set(key, null); return null; }

    const lines = data.lyrics
      .split('\n')
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 0 && !l.startsWith('['));

    lyricsCache.set(key, lines);
    return lines;
  } catch {
    clearTimeout(timeout);
    lyricsCache.set(key, null);
    return null;
  }
}

export function LyricsPanel() {
  const { currentTrack, currentTime } = usePlayback();
  const [lyrics, setLyrics] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [activeLine, setActiveLine] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTrackId = useRef<string | null>(null);

  useEffect(() => {
    if (!currentTrack) return;
    const trackKey = `${currentTrack.id}-${retryCount}`;
    if (trackKey === lastTrackId.current && retryCount === 0) return;
    lastTrackId.current = trackKey;

    setLyrics(null);
    setError(false);
    setActiveLine(0);
    setLoading(true);

    // Clear cache on retry
    if (retryCount > 0) {
      const key = `${currentTrack.artist}::${currentTrack.name}`.toLowerCase();
      lyricsCache.delete(key);
    }

    fetchLyrics(currentTrack.artist, currentTrack.name).then(lines => {
      setLoading(false);
      if (lines && lines.length > 0) {
        setLyrics(lines);
      } else {
        setError(true);
      }
    });
  }, [currentTrack?.id, retryCount]);

  // Simulate line progression
  useEffect(() => {
    if (!lyrics || !currentTrack) return;
    const totalDuration = currentTrack.duration || 180;
    const lineIndex = Math.min(
      Math.floor((currentTime / totalDuration) * lyrics.length),
      lyrics.length - 1
    );
    setActiveLine(Math.max(0, lineIndex));
  }, [currentTime, lyrics, currentTrack]);

  // Auto-scroll
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current.querySelector(`[data-line="${activeLine}"]`) as HTMLElement;
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeLine]);

  if (!currentTrack) return null;

  return (
    <div className="flex flex-col h-full min-h-[300px]">
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12">
          <Loader2 className="size-6 text-[#1db954] animate-spin" />
          <p className="text-xs text-[#6b7280]">Buscando letra...</p>
        </div>
      )}

      {error && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12 px-4">
          <Music2 className="size-10 text-[#6b7280]" />
          <p className="text-sm font-medium text-[#b3b3b3]">Letra no disponible</p>
          <p className="text-xs text-[#6b7280] text-center">
            No encontramos la letra de<br />
            <span className="text-[#b3b3b3] font-medium">"{currentTrack.name}"</span>
          </p>
          <button
            onClick={() => setRetryCount(c => c + 1)}
            className="flex items-center gap-1.5 text-xs text-[#6b7280] hover:text-white transition-colors mt-1 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.10]"
          >
            <RefreshCw className="size-3" /> Reintentar
          </button>
        </div>
      )}

      {lyrics && (
        <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-8 space-y-5 scrollbar-hide">
          {lyrics.map((line, i) => (
            <p
              key={i}
              data-line={i}
              className={cn(
                'text-center leading-relaxed cursor-default select-none transition-all duration-500',
                i === activeLine
                  ? 'text-white text-lg font-bold'
                  : Math.abs(i - activeLine) === 1
                  ? 'text-[#b3b3b3] text-base'
                  : Math.abs(i - activeLine) === 2
                  ? 'text-[#6b7280] text-sm'
                  : 'text-[#6b7280]/50 text-sm'
              )}
            >
              {line || <span className="opacity-20">·</span>}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
