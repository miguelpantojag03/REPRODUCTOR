'use client';

import { useState, useEffect } from 'react';
import { getStoredFavoriteArtists } from './onboarding';
import { usePlayback } from './playback-context';
import { getValidImageUrl, formatDuration, cn } from '@/lib/utils';
import { Play, Pause, Sparkles, Music2, Loader2, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface OnlineTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  duration: number;
  imageUrl: string | null;
  audioUrl: string;
  genre: string | null;
}

async function fetchArtistTracks(artist: string): Promise<OnlineTrack[]> {
  try {
    const res = await fetch(
      `/api/artist-feed?artist=${encodeURIComponent(artist)}&limit=5`,
      { cache: 'no-store' }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function TrackCard({ track }: { track: OnlineTrack }) {
  const { playTrack, currentTrack, isPlaying, togglePlayPause } = usePlayback();
  const isCurrent = currentTrack?.id === track.id;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer group',
        isCurrent ? 'bg-white/[0.08]' : 'hover:bg-white/[0.06]'
      )}
      onClick={() => isCurrent ? togglePlayPause() : playTrack(track as any)}
    >
      <div className="relative size-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#282828]">
        {track.imageUrl ? (
          <Image src={track.imageUrl} alt={track.name} fill className="object-cover" sizes="40px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music2 className="size-4 text-[#727272]" />
          </div>
        )}
        <div className={cn(
          'absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity',
          isCurrent && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}>
          {isCurrent && isPlaying
            ? <Pause className="size-4 text-white fill-white" />
            : <Play className="size-4 text-white fill-white ml-0.5" />
          }
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', isCurrent ? 'text-[#1db954]' : 'text-white')}>
          {track.name}
        </p>
        <p className="text-xs text-[#727272] truncate">{track.album}</p>
      </div>
      <span className="text-xs text-[#727272] tabular-nums flex-shrink-0">
        {formatDuration(track.duration)}
      </span>
    </div>
  );
}

function ArtistSection({ artist }: { artist: string }) {
  const [tracks, setTracks] = useState<OnlineTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack, setPlaylist } = usePlayback();

  useEffect(() => {
    fetchArtistTracks(artist).then(t => {
      setTracks(t);
      setLoading(false);
    });
  }, [artist]);

  const playAll = () => {
    if (!tracks.length) return;
    setPlaylist(tracks as any);
    playTrack(tracks[0] as any);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-3">
          <div className="h-5 w-32 bg-white/[0.06] rounded shimmer" />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
            <div className="size-10 rounded-lg bg-white/[0.06] shimmer flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-white/[0.06] rounded shimmer w-3/4" />
              <div className="h-2.5 bg-white/[0.04] rounded shimmer w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!tracks.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-white">{artist}</h3>
          <span className="text-[10px] text-[#727272] bg-white/[0.06] px-2 py-0.5 rounded-full">
            {tracks.length} canciones
          </span>
        </div>
        <button
          onClick={playAll}
          className="flex items-center gap-1.5 text-xs text-[#1db954] hover:text-[#1ed760] transition-colors font-semibold"
        >
          <Play className="size-3 fill-current" />
          Reproducir
        </button>
      </div>
      <div className="space-y-0.5">
        {tracks.map(track => (
          <TrackCard key={track.id} track={track} />
        ))}
      </div>
    </div>
  );
}

export function PersonalizedFeed() {
  const [artists, setArtists] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setArtists(getStoredFavoriteArtists());
    setMounted(true);
  }, []);

  if (!mounted || artists.length === 0) return null;

  // Show max 3 artists in the feed
  const feedArtists = artists.slice(0, 3);

  return (
    <section className="animate-fade-up stagger-2">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="size-7 rounded-lg bg-[#1db954]/15 flex items-center justify-center">
          <Sparkles className="size-4 text-[#1db954]" />
        </div>
        <h2 className="text-lg font-bold text-white">Para ti</h2>
        <span className="text-xs text-[#727272]">Basado en tus artistas favoritos</span>
      </div>

      <div className="space-y-8">
        {feedArtists.map(artist => (
          <ArtistSection key={artist} artist={artist} />
        ))}
      </div>
    </section>
  );
}
