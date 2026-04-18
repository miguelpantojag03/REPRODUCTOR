'use client';

import { usePlayback } from './playback-context';
import { getValidImageUrl, formatDuration } from '@/lib/utils';
import { TrendingUp, Play } from 'lucide-react';
import Image from 'next/image';

export function RecentSongCard({ song }: { song: any }) {
  const { playTrack, currentTrack, isPlaying } = usePlayback();
  const isCurrent = currentTrack?.id === song.id;

  return (
    <div
      className="flex-shrink-0 w-40 group cursor-pointer"
      onClick={() => playTrack(song)}
    >
      <div className="relative w-40 h-40 rounded-lg overflow-hidden bg-[#282828] mb-2 shadow-lg">
        <Image
          src={getValidImageUrl(song.imageUrl)}
          alt={song.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-[#1db954] rounded-full p-3 shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Play className="size-5 ml-0.5 text-black fill-black" />
          </div>
        </div>
        {isCurrent && isPlaying && (
          <div className="absolute bottom-2 left-2 flex items-end gap-0.5 h-4">
            <div className="w-1 bg-[#1db954] rounded-sm wave-bar-1" />
            <div className="w-1 bg-[#1db954] rounded-sm wave-bar-2" />
            <div className="w-1 bg-[#1db954] rounded-sm wave-bar-3" />
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-white truncate">{song.name}</p>
      <p className="text-xs text-gray-400 truncate">{song.artist}</p>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="text-sm font-bold tabular-nums w-5 text-center" style={{ color: '#FFD700' }}>
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="text-sm font-bold tabular-nums w-5 text-center" style={{ color: '#C0C0C0' }}>
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="text-sm font-bold tabular-nums w-5 text-center" style={{ color: '#CD7F32' }}>
        3
      </span>
    );
  }
  return (
    <span className="text-gray-500 tabular-nums w-5 text-center text-sm font-bold">
      {rank}
    </span>
  );
}

export function MostPlayedRow({ song, rank }: { song: any; rank: number }) {
  const { playTrack, currentTrack, isPlaying } = usePlayback();
  const isCurrent = currentTrack?.id === song.id;

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 transition-colors group cursor-pointer"
      onClick={() => playTrack(song)}
    >
      <div className="w-5 flex items-center justify-center flex-shrink-0">
        <span className="group-hover:hidden">
          <RankBadge rank={rank} />
        </span>
        <Play className="size-4 text-white fill-white hidden group-hover:block flex-shrink-0" />
      </div>
      <div className="relative size-10 rounded overflow-hidden bg-[#282828] flex-shrink-0">
        <Image src={getValidImageUrl(song.imageUrl)} alt={song.name} fill className="object-cover" />
        {isCurrent && isPlaying && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="flex items-end gap-0.5 h-3">
              <div className="w-0.5 bg-[#1db954] wave-bar-1" />
              <div className="w-0.5 bg-[#1db954] wave-bar-2" />
              <div className="w-0.5 bg-[#1db954] wave-bar-3" />
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isCurrent ? 'text-[#1db954]' : 'text-white'}`}>{song.name}</p>
        <p className="text-xs text-gray-400 truncate">{song.artist}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
        <TrendingUp className="size-3" />
        <span className="tabular-nums">{song.playCount}</span>
      </div>
      <span className="text-xs tabular-nums text-gray-500 flex-shrink-0">{formatDuration(song.duration)}</span>
    </div>
  );
}
