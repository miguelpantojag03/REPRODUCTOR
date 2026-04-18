'use client';

import { usePlayback } from './playback-context';
import { getValidImageUrl, formatDuration, cn } from '@/lib/utils';
import { TrendingUp, Play, Pause } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

/* ── Recent Song Card ───────────────────────────────────────── */
export function RecentSongCard({ song }: { song: any }) {
  const { playTrack, currentTrack, isPlaying, togglePlayPause } = usePlayback();
  const isCurrent = currentTrack?.id === song.id;

  const handleClick = () => {
    if (isCurrent) togglePlayPause();
    else playTrack(song);
  };

  return (
    <div className="flex-shrink-0 w-36 sm:w-40 group cursor-pointer" onClick={handleClick}>
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#282828] mb-2.5 shadow-lg">
        <Image
          src={getValidImageUrl(song.imageUrl)}
          alt={song.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Overlay */}
        <div className={cn(
          'absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-200',
          isCurrent && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}>
          <div className="size-12 bg-[#1db954] rounded-full flex items-center justify-center shadow-xl transform group-hover:scale-105 transition-transform">
            {isCurrent && isPlaying
              ? <Pause className="size-5 fill-black text-black" />
              : <Play className="size-5 fill-black text-black ml-0.5" />
            }
          </div>
        </div>
        {/* Equalizer when playing */}
        {isCurrent && isPlaying && (
          <div className="absolute bottom-2.5 left-2.5 flex items-end gap-[2px] h-4">
            <div className="w-[3px] bg-[#1db954] rounded-sm wave-bar-1" />
            <div className="w-[3px] bg-[#1db954] rounded-sm wave-bar-2" />
            <div className="w-[3px] bg-[#1db954] rounded-sm wave-bar-3" />
          </div>
        )}
      </div>
      <p className={cn('text-sm font-semibold truncate leading-tight', isCurrent ? 'text-[#1db954]' : 'text-white')}>{song.name}</p>
      <Link
        href={`/artist/${encodeURIComponent(song.artist)}`}
        className="text-xs text-[#6b7280] hover:text-white transition-colors truncate block mt-0.5"
        onClick={e => e.stopPropagation()}
      >
        {song.artist}
      </Link>
    </div>
  );
}

/* ── Most Played Row ────────────────────────────────────────── */
export function MostPlayedRow({ song, rank }: { song: any; rank: number }) {
  const { playTrack, currentTrack, isPlaying, togglePlayPause } = usePlayback();
  const isCurrent = currentTrack?.id === song.id;

  const rankColors: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };
  const rankColor = rankColors[rank] || '#6b7280';

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer group',
        isCurrent ? 'bg-white/[0.08]' : 'hover:bg-white/[0.06]'
      )}
      onClick={() => isCurrent ? togglePlayPause() : playTrack(song)}
    >
      {/* Rank */}
      <div className="w-6 flex items-center justify-center flex-shrink-0">
        <span className="group-hover:hidden text-sm font-bold tabular-nums" style={{ color: rankColor }}>{rank}</span>
        <Play className="size-4 text-white fill-white hidden group-hover:block" />
      </div>

      {/* Art */}
      <div className="relative size-10 rounded-lg overflow-hidden bg-[#282828] flex-shrink-0">
        <Image src={getValidImageUrl(song.imageUrl)} alt={song.name} fill className="object-cover" />
        {isCurrent && isPlaying && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="flex items-end gap-[2px] h-3">
              <div className="w-[2px] bg-[#1db954] rounded-sm wave-bar-1" />
              <div className="w-[2px] bg-[#1db954] rounded-sm wave-bar-2" />
              <div className="w-[2px] bg-[#1db954] rounded-sm wave-bar-3" />
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate leading-tight', isCurrent ? 'text-[#1db954]' : 'text-white')}>{song.name}</p>
        <Link
          href={`/artist/${encodeURIComponent(song.artist)}`}
          className="text-xs text-[#6b7280] hover:text-white transition-colors truncate block mt-0.5"
          onClick={e => e.stopPropagation()}
        >
          {song.artist}
        </Link>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="hidden sm:flex items-center gap-1 text-[11px] text-[#6b7280]">
          <TrendingUp className="size-3" />
          <span className="tabular-nums">{song.playCount}</span>
        </div>
        <span className="text-[11px] tabular-nums text-[#6b7280]">{formatDuration(song.duration)}</span>
      </div>
    </div>
  );
}
