'use client';

import { useEffect, useState, useRef } from 'react';
import { usePlayback } from './playback-context';
import { cn } from '@/lib/utils';
import { Mic2, Loader2, Music2 } from 'lucide-react';

interface LyricLine {
  time: number;
  text: string;
}

async function fetchLyrics(artist: string, title: string): Promise<string | null> {
  try {
    // Use lyrics.ovh free API
    const res = await fetch(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.lyrics || null;
  } catch {
    return null;
  }
}

function parseLyrics(raw: string): string[] {
  return raw
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('['));
}

export function LyricsPanel() {
  const { currentTrack, currentTime, isPlaying } = usePlayback();
  const [lyrics, setLyrics] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [activeLine, setActiveLine] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTrackId = useRef<string | null>(null);

  useEffect(() => {
    if (!currentTrack || currentTrack.id === lastTrackId.current) return;
    lastTrackId.current = currentTrack.id;
    setLyrics(null);
    setError(false);
    setActiveLine(0);
    setLoading(true);

    fetchLyrics(currentTrack.artist, currentTrack.name).then(raw => {
      setLoading(false);
      if (raw) {
        setLyrics(parseLyrics(raw));
      } else {
        setError(true);
      }
    });
  }, [currentTrack?.id]);

  // Simulate line progression based on time (no timestamps from API)
  useEffect(() => {
    if (!lyrics || !currentTrack) return;
    const totalDuration = currentTrack.duration || 180;
    const lineCount = lyrics.length;
    const lineIndex = Math.min(
      Math.floor((currentTime / totalDuration) * lineCount),
      lineCount - 1
    );
    setActiveLine(lineIndex);
  }, [currentTime, lyrics, currentTrack]);

  // Auto-scroll to active line
  useEffect(() => {
    if (!containerRef.current) return;
    const activeEl = containerRef.current.querySelector(`[data-line="${activeLine}"]`) as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLine]);

  if (!currentTrack) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <Mic2 className="size-4 text-[#1db954]" />
        <span className="text-xs font-bold uppercase tracking-widest text-[#a7a7a7]">Letra</span>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-hide">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
            <Loader2 className="size-6 animate-spin" />
            <p className="text-xs">Buscando letra...</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-600">
            <Music2 className="size-10" />
            <p className="text-sm font-medium text-gray-500">Letra no disponible</p>
            <p className="text-xs text-gray-600 text-center">
              No encontramos la letra de<br />
              <span className="text-gray-400">"{currentTrack.name}"</span>
            </p>
          </div>
        )}

        {lyrics && lyrics.map((line, i) => (
          <p
            key={i}
            data-line={i}
            className={cn(
              'text-center transition-all duration-500 leading-relaxed cursor-default select-none',
              i === activeLine
                ? 'text-white text-lg font-bold scale-105 origin-center'
                : Math.abs(i - activeLine) === 1
                ? 'text-gray-300 text-base'
                : Math.abs(i - activeLine) === 2
                ? 'text-gray-500 text-sm'
                : 'text-gray-700 text-sm'
            )}
          >
            {line || <span className="opacity-30">•</span>}
          </p>
        ))}
      </div>
    </div>
  );
}
