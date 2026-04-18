'use client';

import { usePlayback } from './playback-context';
import { formatDuration, cn } from '@/lib/utils';
import { Music2, Clock, Users, Disc3, Heart } from 'lucide-react';

export function LibraryStats() {
  const { playlist } = usePlayback();
  if (playlist.length === 0) return null;

  const totalDuration = playlist.reduce((a, s) => a + s.duration, 0);
  const artists = new Set(playlist.map(s => s.artist)).size;
  const albums = new Set(playlist.map(s => s.album).filter(Boolean)).size;
  const favorites = playlist.filter(s => (s as any).favorite).length;

  const stats = [
    { icon: Music2, label: `${playlist.length} canciones`, color: 'text-[#1db954]' },
    { icon: Clock, label: formatDuration(totalDuration), color: 'text-blue-400' },
    { icon: Users, label: `${artists} artistas`, color: 'text-purple-400' },
    { icon: Disc3, label: `${albums} álbumes`, color: 'text-orange-400' },
    { icon: Heart, label: `${favorites} favoritas`, color: 'text-pink-400' },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {stats.map(({ icon: Icon, label, color }) => (
        <div key={label} className="flex items-center gap-1.5 bg-white/[0.05] rounded-full px-3 py-1.5 border border-white/[0.06]">
          <Icon className={cn('size-3', color)} />
          <span className="text-xs text-[#b3b3b3] font-medium">{label}</span>
        </div>
      ))}
    </div>
  );
}
